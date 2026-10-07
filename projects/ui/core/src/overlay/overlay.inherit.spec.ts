import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  at,
  NestedContent,
  type OverlayContent,
  overlayContainer,
  overlayHosts,
  overlayPanes,
  overlayProbes,
  OverlayTrigger,
  resetOverlayProbes,
  settle,
} from '../../../testing/overlay';
import { ArnConfigDirective } from '../config/config.directive';
import type { ArnColorScheme, ArnDensity, ArnDirection, ArnSize } from '../config/config.types';

@Component({
  imports: [ArnConfigDirective, OverlayTrigger],
  templateUrl: './overlay.inherit.spec.host.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly size = signal<ArnSize | undefined>('sm');
  readonly colorScheme = signal<ArnColorScheme | undefined>('dark');
  readonly density = signal<ArnDensity | undefined>('compact');
  readonly direction = signal<ArnDirection | undefined>('rtl');

  readonly outside = viewChild.required<OverlayTrigger>('outside');
  readonly inside = viewChild.required<OverlayTrigger>('inside');
  readonly manualDark = viewChild.required<OverlayTrigger>('manualDark');
  readonly manualLight = viewChild.required<OverlayTrigger>('manualLight');
}

describe('ArnOverlayService: inherited settings', () => {
  const root = document.documentElement;
  let fixture: ComponentFixture<Host>;
  let host: Host;

  const pane = (): HTMLElement => at(overlayPanes(), -1);
  const overlayHost = (): HTMLElement => at(overlayHosts(), -1);
  const content = (): OverlayContent => at(overlayProbes.contents, -1);

  beforeEach(() => {
    resetOverlayProbes();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    root.classList.remove('dark');
    root.removeAttribute('data-density');
    expect(overlayContainer().childElementCount).toBe(0);
  });

  describe('opened from inside an [arnConfig] section', () => {
    it('the panel gets the color scheme and density, the host the direction', () => {
      host.inside().open('popover');

      expect(pane().classList.contains('dark')).toBe(true);
      expect(pane().classList.contains('light')).toBe(false);
      expect(pane().getAttribute('data-density')).toBe('compact');
      expect(overlayHost().getAttribute('dir')).toBe('rtl');
    });

    it('theme.css applies the inherited values inside the panel', () => {
      host.inside().open('popover');

      const style = getComputedStyle(pane());

      expect(style.colorScheme).toBe('dark');
      expect(style.getPropertyValue('--arn-density').trim()).toBe('0.875');
      expect(style.direction).toBe('rtl');
    });

    it('a component in the content reads the section through injectArnConfig', async () => {
      host.inside().open('popover');
      await settle(fixture);

      expect(content().config.size()).toBe('sm');
      expect(content().config.density()).toBe('compact');
      expect(content().config.colorScheme()).toBe('dark');
      expect(content().config.direction()).toBe('rtl');
      expect(content().directionality.value).toBe('rtl');
    });

    it('template content reads the section too and can inject the ref', async () => {
      const ref = host.inside().openTemplate('popover');
      await settle(fixture);

      expect(content().config.size()).toBe('sm');
      expect(content().directionality.value).toBe('rtl');
      expect(content().ref).toBe(ref);
    });

    it('a modal without an origin reads the element of the component that opens it', () => {
      host.inside().open('modal', { origin: undefined });

      expect(pane().classList.contains('dark')).toBe(true);
      expect(pane().getAttribute('data-density')).toBe('compact');
      expect(overlayHost().getAttribute('dir')).toBe('rtl');
    });

    it('only the given fields are written', () => {
      host.colorScheme.set(undefined);
      host.density.set(undefined);
      host.direction.set(undefined);
      fixture.detectChanges();
      host.inside().open('popover');

      expect(pane().classList.contains('dark')).toBe(false);
      expect(pane().classList.contains('light')).toBe(false);
      expect(pane().hasAttribute('data-density')).toBe(false);
      expect(overlayHost().getAttribute('dir')).toBe('ltr');
    });

    it('colorScheme "system" writes no class', () => {
      host.colorScheme.set('system');
      fixture.detectChanges();
      host.inside().open('popover');

      expect(pane().classList.contains('dark')).toBe(false);
      expect(pane().classList.contains('light')).toBe(false);
    });
  });

  describe('opened from outside the section', () => {
    it('the panel gets nothing', async () => {
      host.outside().open('popover');
      await settle(fixture);

      expect(pane().classList.contains('dark')).toBe(false);
      expect(pane().classList.contains('light')).toBe(false);
      expect(pane().hasAttribute('data-density')).toBe(false);
      expect(overlayHost().getAttribute('dir')).toBe('ltr');
      expect(content().config.size()).toBe('md');
      expect(content().directionality.value).toBe('ltr');
    });

    it('a value on <html> is not copied; the panel inherits it and follows later changes', () => {
      root.classList.add('dark');
      root.setAttribute('data-density', 'compact');
      host.outside().open('popover');

      expect(pane().classList.contains('dark')).toBe(false);
      expect(pane().hasAttribute('data-density')).toBe(false);
      expect(getComputedStyle(pane()).colorScheme).toBe('dark');
      expect(getComputedStyle(pane()).getPropertyValue('--arn-density').trim()).toBe('0.875');

      root.classList.remove('dark');

      expect(getComputedStyle(pane()).colorScheme).not.toBe('dark');
    });
  });

  describe('hand-written markup', () => {
    it('a .dark ancestor without [arnConfig] is inherited', () => {
      host.manualDark().open('popover');

      expect(pane().classList.contains('dark')).toBe(true);
      expect(pane().hasAttribute('data-density')).toBe(false);
    });

    it('the nearest class wins: .light inside .dark', () => {
      host.manualLight().open('popover');

      expect(pane().classList.contains('light')).toBe(true);
      expect(pane().classList.contains('dark')).toBe(false);
      expect(pane().getAttribute('data-density')).toBe('compact');
    });
  });

  it('an overlay opened from inside an overlay inherits from the parent panel', async () => {
    host.inside().open('popover', {}, NestedContent);
    await settle(fixture);
    at(overlayProbes.triggers, -1).open('dropdown');
    await settle(fixture);

    expect(pane().classList.contains('dark')).toBe(true);
    expect(pane().getAttribute('data-density')).toBe('compact');
    expect(overlayHost().getAttribute('dir')).toBe('rtl');
    expect(content().config.size()).toBe('sm');
  });

  describe('changes while the overlay is open', () => {
    it('the direction is followed', async () => {
      host.inside().open('popover');
      await settle(fixture);

      host.direction.set('ltr');
      await settle(fixture);

      expect(overlayHost().getAttribute('dir')).toBe('ltr');
      expect(content().directionality.value).toBe('ltr');
    });

    it('values read through injectArnConfig are followed', async () => {
      host.inside().open('popover');
      await settle(fixture);

      host.size.set('xl');
      await settle(fixture);

      expect(content().config.size()).toBe('xl');
    });

    it('a section-level color scheme and density stay as they were at opening (known limit)', async () => {
      host.inside().open('popover');
      await settle(fixture);

      host.colorScheme.set('light');
      host.density.set('comfortable');
      await settle(fixture);

      expect(pane().classList.contains('dark')).toBe(true);
      expect(pane().getAttribute('data-density')).toBe('compact');
      // The value itself is live for components that read it
      expect(content().config.colorScheme()).toBe('light');
    });
  });
});
