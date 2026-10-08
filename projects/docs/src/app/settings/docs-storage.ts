import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';

/**
 * Where the settings are kept: the browser's `localStorage`, or `null` when there is none (server,
 * storage blocked). Reading the property itself can throw, so it is read once here.
 */
export const DOCS_STORAGE = new InjectionToken<Storage | null>('DOCS_STORAGE', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return null;
    }

    try {
      return inject(DOCUMENT).defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  },
});
