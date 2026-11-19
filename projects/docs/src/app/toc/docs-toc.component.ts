import { LocationStrategy } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { DOCS_SMOOTH_SCROLL } from '../shell/viewport';
import { DocsTocService } from './docs-toc.service';
import { focusSection, isPlainClick } from './focus-section';
import { activeIndex } from './scroll-spy';

/** The id of the empty element at the end of the page content; the shell renders it. */
export const DOCS_MAIN_END_ID = 'docs-main-end';

/**
 * Without `scrollend` (older Safari) the lock of a click ends this long after the last scroll
 * event; if the click does not scroll at all, this long after the click.
 */
export const DOCS_SCROLL_IDLE_MS = 150;
export const DOCS_SCROLL_START_MS = 1000;

/**
 * "On this page": links to the sections of the current page. The shell decides when it is shown
 * and passes the page path (the list lives outside the routed page, so a relative link would
 * resolve against the root route).
 *
 * The link of the section being read is marked `aria-current="location"` (scrollspy). An
 * IntersectionObserver tells when a heading crosses the reading line or the end of the page comes
 * into view; the active section is then computed from the page (`activeIndex`). Scrolling never
 * writes the URL. A click scrolls to the heading (smooth unless the reader asked for reduced
 * motion), moves focus there and changes the fragment; the clicked link stays active until the
 * scroll ends, so the sections passed on the way do not flash.
 */
@Component({
  selector: 'docs-toc',
  templateUrl: './docs-toc.component.html',
  styleUrl: './docs-toc.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsTocComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly locationStrategy = inject(LocationStrategy);
  private readonly smooth = inject(DOCS_SMOOTH_SCROLL);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly links = viewChildren<ElementRef<HTMLAnchorElement>>('link');

  /** The path of the current page, without query or fragment. */
  readonly path = input.required<string>();

  protected readonly sections = inject(DocsTocService).sections;

  /** The section the page is scrolled to. */
  private readonly spied = signal<string | undefined>(undefined);
  /** The clicked section, while the scroll to it runs. */
  private readonly pinned = signal<string | undefined>(undefined);
  protected readonly active = computed(() => this.pinned() ?? this.spied());

  private releasePin: (() => void) | undefined;

  constructor() {
    const view = this.document.defaultView;

    // Browser only: render hooks do not run on the server.
    afterRenderEffect((onCleanup) => {
      const headings = this.sections()
        .map((section) => section.element())
        .filter((element) => element !== undefined);
      const first = headings[0];

      if (!view || typeof view.IntersectionObserver !== 'function' || !first) {
        return;
      }

      const end = this.document.getElementById(DOCS_MAIN_END_ID);
      const observer = new view.IntersectionObserver(
        () => {
          this.spy();
        },
        {
          rootMargin: `${String(-this.line(first))}px 0px 0px 0px`,
          threshold: [0, 1],
        },
      );

      for (const heading of headings) {
        observer.observe(heading);
      }
      if (end) {
        observer.observe(end);
      }
      this.spy();
      onCleanup(() => {
        observer.disconnect();
      });
    });

    // Keep the active link in view inside a long list (the list scrolls, not the page).
    afterRenderEffect({
      write: () => {
        const id = this.active();
        const link = this.links().find((ref) => ref.nativeElement.dataset['section'] === id);

        if (link) {
          this.reveal(link.nativeElement);
        }
      },
    });

    inject(DestroyRef).onDestroy(() => this.releasePin?.());
  }

  /** The real link address, so a middle click and "copy link" work (what RouterLink would write). */
  protected href(id: string): string {
    const tree = this.router.createUrlTree([this.path()], { fragment: id });

    return this.locationStrategy.prepareExternalUrl(this.router.serializeUrl(tree));
  }

  /**
   * A plain click scrolls to the section and moves focus to its heading, so keyboard users
   * continue from there. Other clicks (new tab, new window) are left to the browser.
   */
  protected follow(event: MouseEvent, id: string): void {
    if (!isPlainClick(event)) {
      return;
    }

    event.preventDefault();
    this.pin(id);
    focusSection(this.document, id, this.smooth() ? 'smooth' : 'instant');

    // The fragment changes on a click only. The router scrolls nothing ('manual'), and a fragment
    // already in the URL is not navigated to again (the router would schedule its own scroll).
    if (this.router.parseUrl(this.router.url).fragment !== id) {
      void this.router.navigate([this.path()], { fragment: id, scroll: 'manual' });
    }
  }

  /** The reading line: the scroll margin of the headings, below the top of the viewport. */
  private line(heading: HTMLElement): number {
    return parseFloat(getComputedStyle(heading).scrollMarginBlockStart) || 0;
  }

  private spy(): void {
    if (this.pinned() !== undefined) {
      return;
    }

    const view = this.document.defaultView;
    const sections = this.sections();
    const headings = sections.map((section) => section.element());
    const first = headings.find((heading) => heading !== undefined);

    if (!view || !first) {
      this.spied.set(undefined);

      return;
    }

    const root = this.document.documentElement;
    const end = this.document.getElementById(DOCS_MAIN_END_ID);
    const atBottom = end
      ? end.getBoundingClientRect().top <= view.innerHeight
      : view.scrollY + view.innerHeight >= root.scrollHeight - 1;
    const index = activeIndex({
      headingTops: headings.map((heading) => heading?.getBoundingClientRect().top ?? Infinity),
      // A heading scrolled to its margin may sit a fraction of a pixel below it.
      line: this.line(first) + 1,
      atBottom,
      scrollable: root.scrollHeight > view.innerHeight,
    });

    this.spied.set(sections[index]?.id());
  }

  /**
   * Keeps the clicked link active until the scroll ends: at `scrollend`, after a short quiet time
   * without it, or when the reader takes over (wheel, touch, a key, a press).
   */
  private pin(id: string): void {
    const view = this.document.defaultView;

    this.releasePin?.();
    this.pinned.set(id);

    if (!view) {
      return;
    }

    let timer = view.setTimeout(() => {
      release();
    }, DOCS_SCROLL_START_MS);
    const onScroll = (): void => {
      view.clearTimeout(timer);
      timer = view.setTimeout(() => {
        release();
      }, DOCS_SCROLL_IDLE_MS);
    };
    // In the capture phase: a press or key anywhere counts. Not scrollend: it would catch the end
    // of any element's scroll (the list's own, a code block's); the page's reaches the window.
    const takeovers = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    const release = (): void => {
      view.clearTimeout(timer);
      view.removeEventListener('scroll', onScroll);
      view.removeEventListener('scrollend', release);
      for (const takeover of takeovers) {
        view.removeEventListener(takeover, release, true);
      }
      this.releasePin = undefined;
      this.pinned.set(undefined);
      this.spy();
    };

    view.addEventListener('scroll', onScroll, { passive: true });
    view.addEventListener('scrollend', release);
    for (const takeover of takeovers) {
      view.addEventListener(takeover, release, { capture: true, passive: true });
    }
    this.releasePin = release;
  }

  /** Scrolls the list itself just enough to show the link; never the page (no scrollIntoView). */
  private reveal(link: HTMLElement): void {
    const list = this.host.nativeElement;
    const box = list.getBoundingClientRect();
    const target = link.getBoundingClientRect();

    if (target.top < box.top) {
      list.scrollTop -= box.top - target.top;
    } else if (target.bottom > box.bottom) {
      list.scrollTop += target.bottom - box.bottom;
    }
  }
}
