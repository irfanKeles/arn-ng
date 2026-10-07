import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  overlayBackdrops,
  overlayContainer,
  overlayPanes,
  overlayProbes,
  OverlayTrigger,
  pressEscape,
  resetOverlayProbes,
  settle,
} from '../../../testing/overlay';
import { ArnOverlayRef } from './overlay-ref';
import { ARN_REDUCED_MOTION } from './overlay.motion';

@Component({
  imports: [OverlayTrigger],
  template: '@if (shown()) {<arn-overlay-trigger />}',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly shown = signal(true);
  readonly trigger = viewChild.required(OverlayTrigger);
}

/** Content with an animation that runs for as long as it is in the DOM. */
@Component({
  selector: 'arn-spinner-probe',
  template: '<span class="arn-test-spinner">Loading</span>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SpinnerProbe {
  readonly ref = inject(ArnOverlayRef);
}

// What a component will write in its own styles in Phase 4, keyed off the panel's data-state
const styles = `
  @keyframes arn-test-out { to { opacity: 0; } }
  @keyframes arn-test-spin { to { rotate: 1turn; } }
  .arn-test-animated[data-state='closed'] { animation: arn-test-out 120ms linear forwards; }
  .arn-test-transition { opacity: 1; transition: opacity 120ms linear; }
  .arn-test-transition[data-state='closed'] { opacity: 0; }
  .arn-test-child[data-state='closed'] .first { animation: arn-test-out 120ms linear; }
  .arn-test-endless[data-state='closed'] { animation: arn-test-spin 1s linear infinite; }
  .arn-test-spinner { display: inline-block; animation: arn-test-spin 1s linear infinite; }
`;

describe('ArnOverlayService: closing', () => {
  let fixture: ComponentFixture<Host>;
  let trigger: OverlayTrigger;
  let style: HTMLStyleElement;
  let reducedMotion: boolean;

  const pane = (): HTMLElement | undefined => overlayPanes().at(-1);

  beforeEach(() => {
    reducedMotion = false;
    TestBed.configureTestingModule({
      providers: [{ provide: ARN_REDUCED_MOTION, useValue: () => reducedMotion }],
    });
    resetOverlayProbes();
    style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    trigger = fixture.componentInstance.trigger();
  });

  afterEach(() => {
    fixture.destroy();
    style.remove();
    expect(overlayContainer().childElementCount).toBe(0);
  });

  describe('without an exit animation', () => {
    it('the panel carries data-state="open" while open', () => {
      const ref = trigger.open('modal');

      expect(ref.state()).toBe('open');
      expect(pane()?.getAttribute('data-state')).toBe('open');
      expect(overlayBackdrops()[0]?.getAttribute('data-state')).toBe('open');
    });

    it('close() removes the overlay synchronously', () => {
      const ref = trigger.open('modal');

      ref.close();

      expect(ref.state()).toBe('closed');
      expect(overlayContainer().childElementCount).toBe(0);
    });

    it('closed resolves with the value given to close()', async () => {
      const ref = trigger.open('popover');

      ref.close('saved');

      expect(await ref.closed).toBe('saved');
    });

    it('closed resolves with undefined when the overlay is dismissed', async () => {
      const ref = trigger.open('popover');

      pressEscape();

      expect(await ref.closed).toBeUndefined();
    });

    it('later close() calls are ignored', async () => {
      const ref = trigger.open('popover');

      ref.close('first');
      ref.close('second');

      expect(await ref.closed).toBe('first');
    });

    it('the content can close itself through the injected ref', async () => {
      const ref = trigger.open('popover');

      await settle(fixture);
      overlayProbes.contents.at(-1)?.ref.close('from content');

      expect(await ref.closed).toBe('from content');
    });

    it('updatePosition() after closing does nothing', () => {
      const ref = trigger.open('popover');

      ref.close();

      expect(() => {
        ref.updatePosition();
      }).not.toThrow();
    });

    it('an animation that was already running in the content is not waited for', async () => {
      const ref = trigger.open('popover', {}, SpinnerProbe);

      await settle(fixture);

      expect(pane()?.getAnimations({ subtree: true }).length).toBe(1);
      ref.close();

      expect(ref.state()).toBe('closed');
    });
  });

  describe('with an exit animation', () => {
    it('the panel stays with data-state="closed" until the animation ends', async () => {
      const ref = trigger.open('modal', { panelClass: 'arn-test-animated' });
      const started = performance.now();

      ref.close('done');

      expect(ref.state()).toBe('closing');
      expect(pane()?.getAttribute('data-state')).toBe('closed');
      expect(overlayBackdrops()[0]?.getAttribute('data-state')).toBe('closed');
      expect(await ref.closed).toBe('done');
      expect(performance.now() - started).toBeGreaterThanOrEqual(100);
      expect(ref.state()).toBe('closed');
      expect(overlayContainer().childElementCount).toBe(0);
    });

    it('a transition is waited for as well', async () => {
      const ref = trigger.open('popover', { panelClass: 'arn-test-transition' });

      // The starting opacity must be painted once for the transition to run
      await settle(fixture);
      ref.close();

      expect(ref.state()).toBe('closing');
      await ref.closed;

      expect(overlayContainer().childElementCount).toBe(0);
    });

    it('an animation on an element inside the panel is waited for', async () => {
      const ref = trigger.open('popover', { panelClass: 'arn-test-child' });

      await settle(fixture);
      ref.close();

      expect(ref.state()).toBe('closing');
      await ref.closed;

      expect(overlayContainer().childElementCount).toBe(0);
    });

    it('stops reacting to Escape and outside clicks as soon as it starts closing', async () => {
      const lower = trigger.open('popover');
      const upper = trigger.open('popover', { panelClass: 'arn-test-animated' });

      upper.close();
      pressEscape();

      expect(lower.state()).toBe('closed');
      await upper.closed;
    });

    it('with prefers-reduced-motion the overlay is removed right away', () => {
      reducedMotion = true;

      const ref = trigger.open('modal', { panelClass: 'arn-test-animated' });

      ref.close();

      expect(ref.state()).toBe('closed');
      expect(overlayContainer().childElementCount).toBe(0);
    });

    it('an animation that never ends does not keep the overlay open', () => {
      const ref = trigger.open('popover', { panelClass: 'arn-test-endless' });

      ref.close();

      expect(ref.state()).toBe('closed');
    });

    it('destroying the opener while closing removes the overlay at once', async () => {
      const ref = trigger.open('popover', { panelClass: 'arn-test-animated' });

      ref.close('late');
      fixture.componentInstance.shown.set(false);
      fixture.detectChanges();

      expect(ref.state()).toBe('closed');
      expect(overlayContainer().childElementCount).toBe(0);
      expect(await ref.closed).toBe('late');
    });
  });

  describe('when the opener is destroyed', () => {
    it('an open overlay is removed and closed resolves with undefined', async () => {
      const ref = trigger.open('modal');

      fixture.componentInstance.shown.set(false);
      fixture.detectChanges();

      expect(ref.state()).toBe('closed');
      expect(overlayContainer().childElementCount).toBe(0);
      expect(await ref.closed).toBeUndefined();
    });

    it('template content goes away with it too', async () => {
      const ref = trigger.openTemplate('popover');

      await settle(fixture);
      fixture.componentInstance.shown.set(false);
      await settle(fixture);

      expect(ref.state()).toBe('closed');
      expect(overlayContainer().childElementCount).toBe(0);
    });
  });
});
