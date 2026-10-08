import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

/** Used when `--arn-ripple-duration` is missing (theme.css not loaded) or cannot be parsed. */
export const FALLBACK_DURATION_MS = 450;

/** Used when `--arn-ripple-easing` is missing or is not a valid easing. */
export const FALLBACK_EASING = 'ease-out';

/**
 * Returns a reader for `prefers-reduced-motion: reduce`. The query is evaluated on every call, so
 * the reader follows the setting live. Always `false` where `matchMedia` is missing (SSR).
 */
export function reducedMotionReader(document: Document): () => boolean {
  const view = document.defaultView;

  return () =>
    typeof view?.matchMedia === 'function' &&
    view.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Whether the user asked for reduced motion. Not exported from the entry point. */
export const ARN_RIPPLE_REDUCED_MOTION = new InjectionToken<() => boolean>(
  'ARN_RIPPLE_REDUCED_MOTION',
  {
    providedIn: 'root',
    factory: () => reducedMotionReader(inject(DOCUMENT)),
  },
);

/** Parses a CSS time (`450ms`, `0.45s`) into ms; the fallback when it is not a plain time. */
export function parseDuration(value: string): number {
  const match = /^(\d*\.?\d+)(ms|s)$/.exec(value.trim());
  const amount = match ? Number(match[1]) : NaN;

  if (!match || !Number.isFinite(amount)) {
    return FALLBACK_DURATION_MS;
  }

  return match[2] === 's' ? amount * 1000 : amount;
}
