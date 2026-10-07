import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { captureWarnings } from '../../../testing/console';
import {
  at,
  overlayBackdrops,
  overlayContainer,
  overlayPanes,
  OverlayTrigger,
  pressEscape,
  resetOverlayProbes,
  settle,
} from '../../../testing/overlay';
import { ArnConfigDirective } from '../config/config.directive';
import type { ArnDirection } from '../config/config.types';
import type { ArnOverlayRef } from './overlay-ref';
import { ArnOverlayService } from './overlay.service';

@Component({
  imports: [ArnConfigDirective, OverlayTrigger],
  template: '<div arnConfig [direction]="direction()"><arn-overlay-trigger /></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly direction = signal<ArnDirection | undefined>(undefined);
  readonly trigger = viewChild.required(OverlayTrigger);
}

/** What a dialog component would render: the role and the label are the component's job. */
@Component({
  selector: 'arn-dialog-probe',
  template: '<h2 id="arn-dialog-probe-title">Title</h2><button type="button">Close</button>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'arn-dialog-probe-title' },
})
class DialogProbe {}

@Component({
  selector: 'arn-static-probe',
  template: 'Nothing to focus here',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StaticProbe {}

describe('ArnOverlayService: presets', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let trigger: OverlayTrigger;
  let button: HTMLButtonElement;
  let tall: HTMLElement;

  const pane = (): HTMLElement => at(overlayPanes(), -1);
  const anchors = (): HTMLElement[] =>
    Array.from(overlayContainer().querySelectorAll<HTMLElement>('.cdk-focus-trap-anchor'));
  const round = (value: number): number => Math.round(value);

  /** Opens with the button focused, as a click or key press on it would leave it. */
  async function open(...args: Parameters<OverlayTrigger['open']>): Promise<ArnOverlayRef<string>> {
    button.focus();
    const ref = trigger.open(...args);
    await settle(fixture);
    return ref;
  }

  beforeEach(() => {
    resetOverlayProbes();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
    trigger = host.trigger();
    button = trigger.button().nativeElement;
    // Pinned to the top of the viewport: nothing fits above the button, everything fits below.
    // The inline padding keeps the button clear of CDK's viewport margin.
    (fixture.nativeElement as HTMLElement).style.cssText =
      'position: fixed; inset: 0 0 auto; padding-inline: 48px;';
    tall = document.createElement('div');
    tall.style.blockSize = '300vh';
    document.body.appendChild(tall);
  });

  afterEach(() => {
    fixture.destroy();
    tall.remove();
    expect(overlayContainer().childElementCount).toBe(0);
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
  });

  describe('modal', () => {
    it('has a backdrop and is centered in the viewport', async () => {
      await open('modal');

      const rect = pane().getBoundingClientRect();

      expect(overlayBackdrops().length).toBe(1);
      expect(
        Math.abs(rect.left + rect.width / 2 - document.documentElement.clientWidth / 2),
      ).toBeLessThan(1);
      expect(
        Math.abs(rect.top + rect.height / 2 - document.documentElement.clientHeight / 2),
      ).toBeLessThan(1);
      expect(pane().hasAttribute('data-side')).toBe(false);
    });

    it('moves focus to the first tabbable element', async () => {
      await open('modal');

      expect(document.activeElement).toBe(pane().querySelector('.first'));
    });

    it('focuses the panel when the content has nothing tabbable', async () => {
      await open('modal', {}, StaticProbe);

      expect(document.activeElement).toBe(pane());
    });

    it('traps focus: tabbing past either end wraps around', async () => {
      await open('modal');

      const [start, end] = anchors();

      expect(start?.getAttribute('tabindex')).toBe('0');
      end?.focus();

      expect(document.activeElement).toBe(pane().querySelector('.first'));
      start?.focus();

      expect(document.activeElement).toBe(pane().querySelector('.last'));
    });

    it('returns focus to the element that had it when it closes', async () => {
      const ref = await open('modal');

      ref.close();

      expect(document.activeElement).toBe(button);
    });

    it('does not pull focus back when it has already moved elsewhere', async () => {
      const ref = await open('modal');
      const other = document.createElement('button');

      document.body.appendChild(other);
      other.focus();
      ref.close();

      expect(document.activeElement).toBe(other);
      other.remove();
    });

    it('restoreFocus: false leaves focus alone', async () => {
      const ref = await open('modal', { restoreFocus: false });

      ref.close();

      expect(document.activeElement).not.toBe(button);
    });

    it('locks page scrolling while open', async () => {
      const ref = await open('modal');

      expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
      ref.close();

      expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
    });

    it('closes on Escape and on a backdrop click', async () => {
      const first = await open('modal');

      pressEscape();

      expect(first.state()).toBe('closed');

      const second = await open('modal');

      overlayBackdrops()[0]?.click();

      expect(second.state()).toBe('closed');
    });

    it('closeOnEscape and closeOnOutsideClick can be turned off', async () => {
      const ref = await open('modal', { closeOnEscape: false, closeOnOutsideClick: false });

      pressEscape();
      overlayBackdrops()[0]?.click();

      expect(ref.state()).toBe('open');
    });

    it('a dialog rendered in it has no axe violations', async () => {
      await open('modal', {}, DialogProbe);

      await expectNoA11yViolations(overlayContainer());
    });

    it('warns in dev mode about placement options, which it ignores', () => {
      const warnings = captureWarnings(() => {
        trigger.open('modal', { side: 'top' });
      });

      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('"side"');
    });
  });

  describe('popover', () => {
    it('opens below the origin, centered, with the default gap', async () => {
      await open('popover');

      const origin = button.getBoundingClientRect();
      const rect = pane().getBoundingClientRect();

      expect(overlayBackdrops().length).toBe(0);
      expect(round(rect.top)).toBe(round(origin.bottom + 4));
      expect(pane().getAttribute('data-side')).toBe('bottom');
      expect(pane().getAttribute('data-align')).toBe('center');
    });

    it('moves focus inside without trapping it, and returns it on close', async () => {
      const ref = await open('popover');

      expect(document.activeElement).toBe(pane().querySelector('.first'));
      expect(anchors().every((anchor) => !anchor.hasAttribute('tabindex'))).toBe(true);
      ref.close();

      expect(document.activeElement).toBe(button);
    });

    it('closes on a click outside, but not inside the panel or on the origin', async () => {
      const ref = await open('popover');

      pane().querySelector<HTMLElement>('.first')?.click();
      button.click();

      expect(ref.state()).toBe('open');
      document.body.click();

      expect(ref.state()).toBe('closed');
    });

    it('closes on Escape, one overlay at a time from the top', async () => {
      const lower = await open('popover');
      const upper = await open('dropdown');

      pressEscape();

      expect(upper.state()).toBe('closed');
      expect(lower.state()).toBe('open');
      pressEscape();

      expect(lower.state()).toBe('closed');
    });

    it('Escape with a modifier key is left alone', async () => {
      const ref = await open('popover');

      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', shiftKey: true, bubbles: true }),
      );

      expect(ref.state()).toBe('open');
    });

    it('does not lock page scrolling', async () => {
      await open('popover');

      expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
    });
  });

  describe('dropdown', () => {
    it('aligns its start edge with the origin and leaves focus on it', async () => {
      await open('dropdown');

      const origin = button.getBoundingClientRect();
      const rect = pane().getBoundingClientRect();

      expect(round(rect.left)).toBe(round(origin.left));
      expect(round(rect.top)).toBe(round(origin.bottom + 4));
      expect(pane().getAttribute('data-align')).toBe('start');
      expect(document.activeElement).toBe(button);
    });

    it('in RTL the start edge is the right edge', async () => {
      host.direction.set('rtl');
      fixture.detectChanges();
      await open('dropdown');

      const origin = button.getBoundingClientRect();
      const rect = pane().getBoundingClientRect();

      expect(round(rect.right)).toBe(round(origin.right));
      // The button really is on the right half: the section is RTL
      expect(origin.left).toBeGreaterThan(document.documentElement.clientWidth / 2);
    });

    it('side "end" is the right in LTR and the left in RTL, with the gap away from the origin', async () => {
      const ltr = await open('dropdown', { side: 'end', offset: 10 });

      expect(round(pane().getBoundingClientRect().left)).toBe(
        round(button.getBoundingClientRect().right + 10),
      );
      ltr.close();

      host.direction.set('rtl');
      fixture.detectChanges();
      await open('dropdown', { side: 'end', offset: 10 });

      expect(round(pane().getBoundingClientRect().right)).toBe(
        round(button.getBoundingClientRect().left - 10),
      );
      expect(pane().getAttribute('data-side')).toBe('end');
    });

    it('re-aligns when the direction changes while it is open', async () => {
      await open('dropdown');

      host.direction.set('rtl');
      await settle(fixture);

      expect(round(pane().getBoundingClientRect().right)).toBe(
        round(button.getBoundingClientRect().right),
      );
    });

    it('flips to the other side when there is no room, and says so on the panel', async () => {
      await open('dropdown', { side: 'top' });

      const origin = button.getBoundingClientRect();

      expect(pane().getAttribute('data-side')).toBe('bottom');
      expect(round(pane().getBoundingClientRect().top)).toBe(round(origin.bottom + 4));
    });

    it('closes on a click outside and on Escape', async () => {
      const first = await open('dropdown');

      document.body.click();

      expect(first.state()).toBe('closed');

      const second = await open('dropdown');

      pressEscape();

      expect(second.state()).toBe('closed');
    });
  });

  describe('tooltip', () => {
    it('has no backdrop, does not move focus and creates no focus trap', async () => {
      await open('tooltip');

      expect(overlayBackdrops().length).toBe(0);
      expect(document.activeElement).toBe(button);
      expect(anchors().length).toBe(0);
      expect(pane().hasAttribute('tabindex')).toBe(false);
    });

    it('prefers the top side', async () => {
      (fixture.nativeElement as HTMLElement).style.cssText =
        'position: fixed; inset: auto 0 0; padding-inline: 48px;';
      await open('tooltip');

      const origin = button.getBoundingClientRect();

      expect(pane().getAttribute('data-side')).toBe('top');
      expect(round(pane().getBoundingClientRect().bottom)).toBe(round(origin.top - 4));
    });

    it('ignores outside clicks and Escape, which still reach the overlay below', async () => {
      const popover = await open('popover');
      const tooltip = await open('tooltip');

      pressEscape();

      expect(tooltip.state()).toBe('open');
      expect(popover.state()).toBe('closed');

      const dropdown = await open('dropdown');

      document.body.click();

      expect(tooltip.state()).toBe('open');
      expect(dropdown.state()).toBe('closed');
    });

    it('keeps receiving pointer events so that it can be hovered', async () => {
      await open('tooltip');

      expect(getComputedStyle(pane()).pointerEvents).toBe('auto');
    });
  });

  describe('invalid use', () => {
    it('a connected preset without an origin throws', () => {
      expect(() => trigger.open('popover', { origin: undefined })).toThrowError(/needs "origin"/);
      expect(overlayContainer().childElementCount).toBe(0);
    });

    it('template content without a view container throws', () => {
      const overlay = TestBed.inject(ArnOverlayService);

      expect(() =>
        overlay.open(trigger.panel(), { preset: 'modal', injector: trigger.injector }),
      ).toThrowError(/needs "viewContainerRef"/);
    });
  });
});
