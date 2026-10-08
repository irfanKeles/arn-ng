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

/**
 * Whether the viewport is narrow. The shell turns it into a class, so the layout has one source
 * for the breakpoint and a spec can switch modes without resizing the browser.
 */
export const DOCS_NARROW_VIEWPORT = new InjectionToken<Signal<boolean>>('DOCS_NARROW_VIEWPORT', {
  providedIn: 'root',
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return signal(false).asReadonly();
    }

    const query = inject(MediaMatcher).matchMedia(DOCS_NARROW_QUERY);
    const narrow = signal(query.matches);
    const onChange = (event: MediaQueryListEvent): void => {
      narrow.set(event.matches);
    };

    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => {
      query.removeEventListener('change', onChange);
    });

    return narrow.asReadonly();
  },
});
