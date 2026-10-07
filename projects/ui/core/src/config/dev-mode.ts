// Angular CLI defines `ngDevMode` as `false` in production builds; outside the CLI it is undefined.
declare const ngDevMode: unknown;

/** Writes a warning to the console in development mode only. */
export function devWarn(message: string): void {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    console.warn(`[@arn-ng/ui] ${message}`);
  }
}
