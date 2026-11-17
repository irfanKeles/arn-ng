import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
  DOCUMENT,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { DOCS_NAV, DOCS_SITE_NAME } from './nav/docs-nav';
import { SettingsComponent } from './shell/settings/settings.component';
import { SidebarComponent, type DocsSectionSelection } from './shell/sidebar/sidebar.component';
import { DOCS_NARROW_VIEWPORT, DOCS_TOC_VIEWPORT } from './shell/viewport';
import { DocsTocComponent } from './toc/docs-toc.component';
import { DocsTocService } from './toc/docs-toc.service';
import { focusSection } from './toc/focus-section';

/**
 * The site shell: header with the switchers, sidebar, the page and, on a wide viewport, "On this
 * page". On a narrow viewport the sidebar is a drawer that opens below the header (a disclosure,
 * not a modal: the header stays usable).
 */
@Component({
  selector: 'docs-root',
  imports: [DocsTocComponent, RouterLink, RouterOutlet, SettingsComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeDrawer()',
    '(click)': 'onClick($event)',
  },
})
export class AppComponent {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly drawerToggle = viewChild<ElementRef<HTMLButtonElement>>('drawerToggle');
  private readonly sidebar = viewChild.required(SidebarComponent);
  private readonly drawerOpen = signal(false);
  private readonly tocViewport = inject(DOCS_TOC_VIEWPORT);
  private readonly tocSections = inject(DocsTocService).sections;

  protected readonly siteName = DOCS_SITE_NAME;
  protected readonly nav = DOCS_NAV;
  protected readonly narrow = inject(DOCS_NARROW_VIEWPORT);
  /** The drawer exists only on a narrow viewport; widening the window closes it by itself. */
  protected readonly drawerVisible = computed(() => this.narrow() && this.drawerOpen());
  /** The path of the current page, without query or fragment; `undefined` before the first navigation. */
  protected readonly path = signal<string | undefined>(undefined);
  /**
   * "On this page" needs a wide viewport and at least two sections. The breakpoints do not overlap
   * with the drawer's; `narrow()` is checked anyway, so the two never show together.
   */
  protected readonly tocVisible = computed(
    () =>
      this.tocViewport() &&
      !this.narrow() &&
      this.path() !== undefined &&
      this.tocSections().length >= 2,
  );

  constructor() {
    const subscription = inject(Router).events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.onNavigated(event.urlAfterRedirects);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      subscription.unsubscribe();
    });
  }

  protected skipToContent(event: Event): void {
    // A bare fragment link would resolve against <base href> and navigate to the home page.
    event.preventDefault();
    this.main().nativeElement.focus();
  }

  protected toggleDrawer(): void {
    if (this.drawerVisible()) {
      this.closeDrawer();
    } else {
      this.drawerOpen.set(true);
      // The sidebar is hidden until the class is written; render before moving focus into it.
      // (The classes sit on an element of this view: detectChanges() does not refresh host bindings.)
      this.changeDetector.detectChanges();
      this.sidebar().focusFirstLink();
    }
  }

  protected closeDrawer(): void {
    if (!this.drawerVisible()) {
      return;
    }

    this.drawerOpen.set(false);
    this.drawerToggle()?.nativeElement.focus();
  }

  protected onClick(event: Event): void {
    if (event.target instanceof Element && event.target.classList.contains('docs-backdrop')) {
      this.closeDrawer();
    }
  }

  /**
   * A section link of the sidebar was followed. On the current page the router only changes the
   * fragment (or nothing, if it is already in the URL), so the heading is focused here; on another
   * page `onNavigated` does it once the page is rendered.
   */
  protected onSectionSelected(selection: DocsSectionSelection): void {
    if (selection.path !== this.path()) {
      return;
    }

    // Not closeDrawer(): it moves focus to the drawer button, which would override the heading.
    this.closeDrawerForPage();
    focusSection(this.document, selection.id);
  }

  /**
   * Moves focus on a real page change, so the new content is announced: to the section named by
   * the fragment if there is one, otherwise to the page.
   */
  private onNavigated(url: string): void {
    const path = url.split(/[?#]/)[0] ?? url;
    // Not split(/[?#]/)[1]: with a query, that would be the query.
    const fragment = url.split('#')[1];
    const previous = this.path();

    this.path.set(path);

    // Not on the first navigation (page load) and not when only the fragment changed.
    if (previous === undefined || previous === path) {
      return;
    }

    this.closeDrawerForPage();

    if (fragment) {
      // The headings get their ids when the new page is rendered.
      this.changeDetector.detectChanges();

      if (focusSection(this.document, fragment)) {
        return;
      }
    }

    this.main().nativeElement.focus();
  }

  /** Closes the drawer before focus moves into the page, which is inert while it is open. */
  private closeDrawerForPage(): void {
    if (this.drawerVisible()) {
      this.drawerOpen.set(false);
      // Render before focusing (the classes and inert sit on elements of this view).
      this.changeDetector.detectChanges();
    }
  }
}
