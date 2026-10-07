import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

/** Slack added to the fallback timer that removes the panel if an animation never settles. */
const FALLBACK_MARGIN_MS = 50;

/** Whether the user asked for reduced motion. Always `false` where `matchMedia` is missing (SSR). */
export const ARN_REDUCED_MOTION = new InjectionToken<() => boolean>('ARN_REDUCED_MOTION', {
  providedIn: 'root',
  factory: () => {
    const view = inject(DOCUMENT).defaultView;

    return () =>
      typeof view?.matchMedia === 'function' &&
      view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
});

/** Time left until the animation ends, in ms; `Infinity` when it never ends by itself. */
function remainingTime(animation: Animation): number {
  const endTime = animation.effect?.getComputedTiming().endTime;
  const currentTime = animation.currentTime;

  if (typeof endTime !== 'number') {
    return Infinity;
  }

  return Math.max(0, endTime - (typeof currentTime === 'number' ? currentTime : 0));
}

/**
 * Applies `change` (the switch to `data-state="closed"`) and calls `done` once the animations and
 * transitions it started inside `element` have finished. `done` runs synchronously when nothing
 * was started, when `skip` is set or when the Web Animations API is missing (SSR). Animations that
 * were already running and ones that never end (a spinner) are not waited for.
 *
 * @returns A function that cancels the wait; `done` is not called after it.
 */
export function runExit(
  element: HTMLElement,
  change: () => void,
  skip: boolean,
  done: () => void,
): () => void {
  const supported = !skip && typeof element.getAnimations === 'function';
  const before = new Set(supported ? element.getAnimations({ subtree: true }) : []);

  change();

  if (!supported) {
    done();
    return () => undefined;
  }

  // Reading the animations flushes styles, so whatever `change` started is already listed
  const started = element
    .getAnimations({ subtree: true })
    .filter((animation) => !before.has(animation))
    .map((animation) => ({ animation, remaining: remainingTime(animation) }))
    .filter(({ remaining }) => Number.isFinite(remaining));

  if (started.length === 0) {
    done();
    return () => undefined;
  }

  let settled = false;
  const finish = (): void => {
    if (!settled) {
      settled = true;
      clearTimeout(timer);
      done();
    }
  };
  const longest = Math.max(...started.map(({ remaining }) => remaining));
  const timer = setTimeout(finish, longest + FALLBACK_MARGIN_MS);

  void Promise.allSettled(started.map(({ animation }) => animation.finished)).then(finish);

  return () => {
    settled = true;
    clearTimeout(timer);
  };
}
