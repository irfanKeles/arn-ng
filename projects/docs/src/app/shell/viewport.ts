import { isPlatformBrowser } from '@angular/common';
import { MediaMatcher } from '@angular/cdk/layout';
import {
  DestroyRef,
  inject,
  InjectionToken,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';

/** Below this width the sidebar becomes a drawer. The only place the breakpoint is written. */
export const DOCS_NARROW_QUERY = '(width < 48rem)';

/** From this width the "On this page" column is shown. The only place the breakpoint is written. */
export const DOCS_TOC_QUERY = '(width >= 80rem)';

/** A signal that follows a media query in the browser and is `false` on the server. */
function injectMediaQuery(media: string): Signal<boolean> {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return signal(false).asReadonly();
  }

  const query = inject(MediaMatcher).matchMedia(media);
  const matches = signal(query.matches);
  const onChange = (event: MediaQueryListEvent): void => {
    matches.set(event.matches);
  };

  query.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => {
    query.removeEventListener('change', onChange);
  });

  return matches.asReadonly();
}

/**
 * Whether the viewport is narrow. The shell turns it into a class, so the layout has one source
 * for the breakpoint and a spec can switch modes without resizing the browser.
 */
export const DOCS_NARROW_VIEWPORT = new InjectionToken<Signal<boolean>>('DOCS_NARROW_VIEWPORT', {
  providedIn: 'root',
  factory: () => injectMediaQuery(DOCS_NARROW_QUERY),
});

/** Whether the viewport is wide enough for the "On this page" column (same pattern as above). */
export const DOCS_TOC_VIEWPORT = new InjectionToken<Signal<boolean>>('DOCS_TOC_VIEWPORT', {
  providedIn: 'root',
  factory: () => injectMediaQuery(DOCS_TOC_QUERY),
});
