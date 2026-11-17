import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { DocsNavCategory, DocsNavPage, DocsNavSection } from '../../nav/docs-nav';
import { normalizeForSearch, resultCount, searchNav } from '../../nav/docs-search';
import { isPlainClick } from '../../toc/focus-section';

/** A section link was followed: the page path (`/<slug>`) and the section id. */
export interface DocsSectionSelection {
  readonly path: string;
  readonly id: string;
}

/**
 * The categorized page list with its search. Categories without pages are not rendered. The
 * search filters the list in place by page titles and section headings (not a combobox: the
 * results are the sidebar's own links, in Tab order).
 */
@Component({
  selector: 'docs-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly router = inject(Router);
  /** The path of the current page, without query or fragment. */
  private readonly path = signal(pathOf(this.router.url));

  readonly categories = input.required<readonly DocsNavCategory[]>();

  /** A section link was followed with a plain click (the shell moves focus to the heading). */
  readonly sectionSelected = output<DocsSectionSelection>();

  /** The search text as typed; not kept across reloads. */
  protected readonly query = signal('');
  protected readonly results = computed(() => searchNav(this.categories(), this.query()));
  protected readonly status = computed(() => {
    if (normalizeForSearch(this.query()) === '') {
      return '';
    }

    const count = resultCount(this.results());

    if (count === 0) {
      return `No pages or sections match “${this.query().trim()}”.`;
    }

    return count === 1 ? '1 result' : `${String(count)} results`;
  });

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.path.set(pathOf(event.urlAfterRedirects));
      }
    });

    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  /**
   * Moves focus to the first page link (used when the drawer opens), or to the search field when
   * the search shows no link: focus must not stay behind on the toggle while the page is inert.
   */
  focusFirstLink(): void {
    const link = this.element.nativeElement.querySelector('a');

    if (link) {
      link.focus();
    } else {
      this.searchInput().nativeElement.focus();
    }
  }

  protected link(page: DocsNavPage): string {
    return `/${page.slug}`;
  }

  /** `aria-current` for a page shown as a label: `routerLinkActive` works on links only. */
  protected current(page: DocsNavPage): 'page' | null {
    return this.path() === this.link(page) ? 'page' : null;
  }

  protected onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.query.set(event.target.value);
    }
  }

  /**
   * Escape clears the search and goes no further (the drawer stays open). While an input method
   * is composing, Escape belongs to it: nothing is cleared, and it still goes no further. With an
   * empty search it reaches the document, where the shell closes the drawer.
   */
  protected onEscape(event: Event): void {
    // The template types a filtered key event as a plain Event
    if (event instanceof KeyboardEvent && event.isComposing) {
      event.stopPropagation();

      return;
    }

    if (this.query() === '') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.clear();
  }

  protected clear(): void {
    this.query.set('');
    this.searchInput().nativeElement.focus();
  }

  protected selectSection(event: MouseEvent, page: DocsNavPage, section: DocsNavSection): void {
    if (isPlainClick(event)) {
      this.sectionSelected.emit({ path: this.link(page), id: section.id });
    }
  }
}

function pathOf(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}
