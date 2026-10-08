import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';
import type { DocsHighlight } from './docs-code';

/** Fetches the highlighter. The default loads it as a separate chunk; specs replace it. */
export const DOCS_HIGHLIGHT_LOADER = new InjectionToken<() => Promise<DocsHighlight>>(
  'DOCS_HIGHLIGHT_LOADER',
  {
    providedIn: 'root',
    factory: () => () => import('./docs-highlight').then((module) => module.loadDocsHighlight()),
  },
);

/** Loads the highlighter once, when the first code block asks for it. */
@Injectable({ providedIn: 'root' })
export class DocsHighlighterService {
  private readonly loader = inject(DOCS_HIGHLIGHT_LOADER);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private pending: Promise<DocsHighlight | null> | undefined;

  /** Resolves to `null` when there is no highlighter (server, failed download): show plain text. */
  load(): Promise<DocsHighlight | null> {
    if (!this.browser) {
      return Promise.resolve(null);
    }

    this.pending ??= this.start();

    return this.pending;
  }

  private async start(): Promise<DocsHighlight | null> {
    try {
      return await this.loader();
    } catch {
      return null;
    }
  }
}
