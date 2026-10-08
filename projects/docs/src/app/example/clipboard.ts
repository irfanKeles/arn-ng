import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';

/** The part of the Clipboard API the site uses. */
export type DocsClipboard = Pick<Clipboard, 'writeText'>;

/**
 * The browser's clipboard, or `null` when there is none (server, insecure context, blocked access).
 */
export const DOCS_CLIPBOARD = new InjectionToken<DocsClipboard | null>('DOCS_CLIPBOARD', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return null;
    }

    try {
      return inject(DOCUMENT).defaultView?.navigator.clipboard ?? null;
    } catch {
      return null;
    }
  },
});
