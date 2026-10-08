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
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { DOCS_NAV, DOCS_SITE_NAME } from './nav/docs-nav';
import { SettingsComponent } from './shell/settings/settings.component';
import { SidebarComponent } from './shell/sidebar/sidebar.component';
import { DOCS_NARROW_VIEWPORT } from './shell/viewport';

/**
 * The site shell: header with the switchers, sidebar and the page. On a narrow viewport the sidebar
 * is a drawer that opens below the header (a disclosure, not a modal: the header stays usable).
 */
@Component({
  selector: 'docs-root',
  imports: [RouterLink, RouterOutlet, SettingsComponent, SidebarComponent],
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
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly drawerToggle = viewChild<ElementRef<HTMLButtonElement>>('drawerToggle');
  private readonly sidebar = viewChild.required(SidebarComponent);
  private readonly drawerOpen = signal(false);
  private currentPath: string | undefined;

  protected readonly siteName = DOCS_SITE_NAME;
  protected readonly nav = DOCS_NAV;
  protected readonly narrow = inject(DOCS_NARROW_VIEWPORT);
  /** The drawer exists only on a narrow viewport; widening the window closes it by itself. */
  protected readonly drawerVisible = computed(() => this.narrow() && this.drawerOpen());

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

  /** Moves focus to the page on a real page change, so the new content is announced. */
  private onNavigated(url: string): void {
    const path = url.split('#')[0];
    const previous = this.currentPath;

    this.currentPath = path;

    // Not on the first navigation (page load) and not when only the fragment changed.
    if (previous === undefined || previous === path) {
      return;
    }

    if (this.drawerVisible()) {
      this.drawerOpen.set(false);
      // The page is inert while the drawer is open; render before focusing it.
      this.changeDetector.detectChanges();
    }

    this.main().nativeElement.focus();
  }
}
