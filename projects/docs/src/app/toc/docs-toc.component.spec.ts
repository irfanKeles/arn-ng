import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { contrastRatio } from '../../../../ui/testing/contrast';
import { DOCS_SMOOTH_SCROLL } from '../shell/viewport';
import { query, queryAs, resetDocument, text } from '../testing/dom';
import { DOCS_MAIN_END_ID, DOCS_SCROLL_START_MS, DocsTocComponent } from './docs-toc.component';
import { DocsTocService } from './docs-toc.service';

/**
 * A page that scrolls: two long sections and a short last one, then the end of the content (the
 * shell renders that element). The headings carry the site's scroll margin (`.docs-page h2`).
 */
@Component({
  selector: 'docs-toc-host',
  imports: [DocsTocComponent],
  template: `
    <docs-toc path="/guide" />
    <div class="docs-page">
      <h2 id="intro" tabindex="-1">Intro</h2>
      <div class="intro-body" style="block-size: 1500px"></div>
      <h2 id="usage" tabindex="-1">Usage</h2>
      <div style="block-size: 1500px"></div>
      <h2 id="api" tabindex="-1">API</h2>
      <div style="block-size: 40px"></div>
      <div id="${DOCS_MAIN_END_ID}"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TocHostComponent {}

/** A page shorter than the viewport. */
@Component({
  selector: 'docs-toc-short-host',
  imports: [DocsTocComponent],
  template: `
    <docs-toc path="/guide" />
    <div class="docs-page">
      <h2 id="intro" tabindex="-1">Intro</h2>
      <h2 id="usage" tabindex="-1">Usage</h2>
      <h2 id="api" tabindex="-1">API</h2>
      <div id="${DOCS_MAIN_END_ID}"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ShortHostComponent {}

@Component({
  selector: 'docs-guide-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GuidePageComponent {}

const SECTIONS = [
  ['intro', 'Intro'],
  ['usage', 'Usage'],
  ['api', 'API'],
] as const;

describe('DocsTocComponent', () => {
  interface Setup<T> {
    fixture: ComponentFixture<T>;
    element: HTMLElement;
    smooth: ReturnType<typeof signal<boolean>>;
  }

  async function setup<T = TocHostComponent>(
    host: new () => T = TocHostComponent as unknown as new () => T,
    sections: readonly (readonly [string, string])[] = SECTIONS,
  ): Promise<Setup<T>> {
    const smooth = signal(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'guide', component: GuidePageComponent }]),
        provideArn({ applyToDocument: true }),
        { provide: DOCS_SMOOTH_SCROLL, useValue: smooth },
      ],
    });

    const toc = TestBed.inject(DocsTocService);

    for (const [id, heading] of sections) {
      toc.register({
        id: signal(id),
        heading: signal(heading),
        element: computed(() => document.getElementById(id) ?? undefined),
      });
    }

    const fixture = TestBed.createComponent(host);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement, smooth };
  }

  function links(element: HTMLElement): HTMLAnchorElement[] {
    return Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));
  }

  function link(element: HTMLElement, label: string): HTMLAnchorElement {
    const found = links(element).find((candidate) => text(candidate) === label);

    if (!found) {
      throw new Error(`No link "${label}".`);
    }

    return found;
  }

  /** The labels of the links marked as the current location. */
  function current(element: HTMLElement): string[] {
    return links(element)
      .filter((candidate) => candidate.getAttribute('aria-current') === 'location')
      .map((candidate) => text(candidate));
  }

  /** Scrolls the page so the heading sits at its scroll margin, as a reader would. */
  function scrollToHeading(id: string): void {
    const heading = query(document, `#${id}`);
    const margin = parseFloat(getComputedStyle(heading).scrollMarginBlockStart);

    window.scrollTo({
      top: window.scrollY + heading.getBoundingClientRect().top - margin,
      behavior: 'instant',
    });
  }

  const nextFrame = (): Promise<void> =>
    new Promise((resolve) =>
      requestAnimationFrame(() => {
        resolve();
      }),
    );

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.scrollTo({ top: 0, behavior: 'instant' });
    resetDocument(document);
  });

  it('is a navigation landmark named by its visible label, which is not a heading', async () => {
    const { element } = await setup();
    const nav = query(element, 'nav');
    const label = query(element, `#${nav.getAttribute('aria-labelledby') ?? ''}`);

    expect(label.tagName).toBe('P');
    expect(text(label)).toBe('On this page');
    expect(nav.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('lists the registered sections in order, linking to their fragments on the page path', async () => {
    const { element } = await setup();

    expect(links(element).map((candidate) => text(candidate))).toEqual(['Intro', 'Usage', 'API']);
    expect(links(element).map((candidate) => candidate.getAttribute('href'))).toEqual([
      '/guide#intro',
      '/guide#usage',
      '/guide#api',
    ]);
  });

  it('follows the list when a section leaves', async () => {
    const { fixture, element } = await setup();
    const toc = TestBed.inject(DocsTocService);
    const first = toc.sections()[0];

    if (first) {
      toc.unregister(first);
    }
    await fixture.whenStable();

    expect(links(element).map((candidate) => text(candidate))).toEqual(['Usage', 'API']);
  });

  it('navigates to the fragment and moves focus to the section heading', async () => {
    const { fixture, element } = await setup();

    link(element, 'Usage').click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/guide#usage');
    expect(document.activeElement).toBe(query(element, '#usage'));
  });

  it('leaves focus and the page alone on a modified click', async () => {
    const { element } = await setup();
    const target = queryAs(element, 'nav a', HTMLAnchorElement);
    // A synthetic Ctrl+click on a link still opens a new tab, which takes focus from the test
    // window and breaks later focus specs. Cancel the default action once the handlers have run.
    const cancel = (event: Event): void => {
      event.preventDefault();
    };
    const scroll = vi.spyOn(query(element, '#intro'), 'scrollIntoView');

    element.addEventListener('click', cancel);
    target.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }),
    );
    element.removeEventListener('click', cancel);

    expect(document.activeElement).not.toBe(query(element, '#intro'));
    expect(scroll).not.toHaveBeenCalled();
  });

  it('keeps the links at least as tall as the minimum control size in compact mode', async () => {
    const { fixture, element } = await setup();

    TestBed.inject(ArnConfigService).setDensity('compact');
    await fixture.whenStable();

    for (const candidate of links(element)) {
      expect(candidate.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
  });

  describe('scrollspy', () => {
    it('marks the first section at the top of the page, and only that one', async () => {
      const { element } = await setup();

      await expect.poll(() => current(element)).toEqual(['Intro']);
    });

    it('marks the section whose heading the reader has scrolled to, without touching the URL', async () => {
      const { element } = await setup();
      const router = TestBed.inject(Router);
      const url = router.url;
      const hash = location.hash;

      scrollToHeading('usage');
      await expect.poll(() => current(element)).toEqual(['Usage']);

      // Halfway back up the intro: the heading above is the one being read.
      window.scrollTo({ top: 700, behavior: 'instant' });
      await expect.poll(() => current(element)).toEqual(['Intro']);

      expect(router.url).toBe(url);
      expect(location.hash).toBe(hash);
    });

    it('marks the short last section at the end of the page, before its heading reaches the line', async () => {
      const { element } = await setup();

      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });

      const api = query(element, '#api');

      await expect.poll(() => current(element)).toEqual(['API']);
      expect(api.getBoundingClientRect().top).toBeGreaterThan(
        parseFloat(getComputedStyle(api).scrollMarginBlockStart) + 1,
      );
    });

    it('marks the first section on a page that does not scroll', async () => {
      const { element } = await setup(ShortHostComponent);

      expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight);
      await expect.poll(() => current(element)).toEqual(['Intro']);
    });

    it('marks nothing without IntersectionObserver', async () => {
      vi.stubGlobal('IntersectionObserver', undefined);

      const { fixture, element } = await setup();

      await fixture.whenStable();
      await nextFrame();

      expect(current(element)).toEqual([]);
    });

    it('stops observing when the list is destroyed', async () => {
      const disconnect = vi.spyOn(IntersectionObserver.prototype, 'disconnect');
      const { fixture } = await setup();

      fixture.destroy();

      expect(disconnect).toHaveBeenCalled();
    });

    it('keeps the active link in view inside a list that scrolls', async () => {
      const many = Array.from(
        { length: 12 },
        (_, index) => [`s${String(index)}`, `Section ${String(index)}`] as const,
      );

      @Component({
        selector: 'docs-toc-long-host',
        imports: [DocsTocComponent],
        template: `
          <docs-toc path="/guide" style="display: block; max-block-size: 120px; overflow: auto" />
          <div class="docs-page">
            @for (section of sections; track section[0]) {
              <h2 [id]="section[0]" tabindex="-1">{{ section[1] }}</h2>
              <div style="block-size: 900px"></div>
            }
            <div id="${DOCS_MAIN_END_ID}"></div>
          </div>
        `,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class LongHostComponent {
        protected readonly sections = many;
      }

      const { element } = await setup(LongHostComponent, many);
      const list = query(element, 'docs-toc');

      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);

      for (const id of ['s9', 's2']) {
        scrollToHeading(id);

        const active = link(element, `Section ${id.slice(1)}`);

        await expect.poll(() => active.getAttribute('aria-current')).toBe('location');
        await expect
          .poll(() => {
            const box = list.getBoundingClientRect();
            const target = active.getBoundingClientRect();

            return target.top >= box.top - 1 && target.bottom <= box.bottom + 1;
          })
          .toBe(true);
      }
    });

    for (const scheme of ['light', 'dark'] as const) {
      it(`marks the active link by weight and a leading line at 3:1, not color alone (${scheme})`, async () => {
        const { fixture, element } = await setup();

        TestBed.inject(ArnConfigService).update({ colorScheme: scheme });
        await fixture.whenStable();
        await expect.poll(() => current(element)).toEqual(['Intro']);

        const active = getComputedStyle(link(element, 'Intro'));
        const other = getComputedStyle(link(element, 'Usage'));
        const page = getComputedStyle(document.body).backgroundColor;

        expect(Number(active.fontWeight)).toBeGreaterThan(Number(other.fontWeight));
        expect(active.borderLeftStyle).toBe('solid');
        expect(parseFloat(active.borderLeftWidth)).toBeGreaterThanOrEqual(2);
        expect(contrastRatio(active.borderLeftColor, page)).toBeGreaterThanOrEqual(3);
        // The others carry the same edge, unseen, so marking one moves no text.
        expect(other.borderLeftWidth).toBe(active.borderLeftWidth);
        expect(other.borderLeftColor).toBe('rgba(0, 0, 0, 0)');
      });
    }

    it('draws the leading line on the right in a right-to-left page', async () => {
      const { fixture, element } = await setup();

      TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
      await fixture.whenStable();
      await expect.poll(() => current(element)).toEqual(['Intro']);

      const active = getComputedStyle(link(element, 'Intro'));

      expect(parseFloat(active.borderRightWidth)).toBeGreaterThanOrEqual(2);
      expect(active.borderLeftWidth).toBe('0px');
      expect(
        contrastRatio(active.borderRightColor, getComputedStyle(document.body).backgroundColor),
      ).toBeGreaterThanOrEqual(3);
    });
  });

  describe('scroll on click', () => {
    function spyHeading(element: HTMLElement, id: string) {
      const heading = query(element, `#${id}`);

      return {
        heading,
        scroll: vi.spyOn(heading, 'scrollIntoView'),
        focus: vi.spyOn(heading, 'focus'),
      };
    }

    it('scrolls smoothly while the reader has not asked for reduced motion', async () => {
      const { element, smooth } = await setup();
      const { scroll, focus } = spyHeading(element, 'usage');

      smooth.set(true);
      link(element, 'Usage').click();

      expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('jumps at once when the reader asked for reduced motion', async () => {
      const { element, smooth } = await setup();
      const { heading, scroll, focus } = spyHeading(element, 'usage');

      smooth.set(false);
      link(element, 'Usage').click();

      expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      expect(Math.round(heading.getBoundingClientRect().top)).toBe(
        Math.round(parseFloat(getComputedStyle(heading).scrollMarginBlockStart)),
      );
      expect(document.activeElement).toBe(heading);
    });

    it('leaves the scroll to the list: the router scrolls nothing', async () => {
      const { fixture, element } = await setup();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

      link(element, 'API').click();
      await fixture.whenStable();

      expect(navigate).toHaveBeenCalledWith(['/guide'], { fragment: 'api', scroll: 'manual' });
    });

    it('does not navigate again to the fragment already in the URL, but still scrolls there', async () => {
      const { fixture, element } = await setup();
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/guide#usage');
      await fixture.whenStable();

      const navigate = vi.spyOn(router, 'navigate');
      const { scroll } = spyHeading(element, 'usage');

      link(element, 'Usage').click();

      expect(navigate).not.toHaveBeenCalled();
      expect(scroll).toHaveBeenCalled();
    });

    describe('while a smooth scroll runs', () => {
      /**
       * The click starts a smooth scroll that the test plays by hand: the sections it passes are
       * brought to the line by moving the content, not by scrolling, so no real scroll ends early.
       */
      async function clickApi(): Promise<Setup<TocHostComponent>> {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

        const result = await setup();

        // Inside the intro, the usage heading below the viewport line. Two frames: the scrollend
        // of this scroll comes before the click, not into its lock.
        window.scrollTo({ top: 1000, behavior: 'instant' });
        await nextFrame();
        await nextFrame();
        await expect.poll(() => current(result.element)).toEqual(['Intro']);

        result.smooth.set(true);
        vi.spyOn(query(result.element, '#api'), 'scrollIntoView').mockImplementation(
          () => undefined,
        );
        link(result.element, 'API').click();
        await result.fixture.whenStable();

        // On the way down, the usage heading passes the line.
        query(result.element, '.intro-body').style.blockSize = '500px';
        await nextFrame();
        await nextFrame();
        await result.fixture.whenStable();

        return result;
      }

      it('keeps the clicked link active over the sections it passes, until scrollend', async () => {
        const { element } = await clickApi();

        expect(current(element)).toEqual(['API']);

        window.dispatchEvent(new Event('scrollend'));
        await expect.poll(() => current(element)).toEqual(['Usage']);
      });

      it('lets go when no scrollend comes', async () => {
        const { element } = await clickApi();

        expect(current(element)).toEqual(['API']);

        vi.advanceTimersByTime(DOCS_SCROLL_START_MS);
        await expect.poll(() => current(element)).toEqual(['Usage']);
      });

      it('lets go as soon as the reader scrolls on their own', async () => {
        const { element } = await clickApi();

        window.dispatchEvent(new WheelEvent('wheel', { bubbles: true }));
        await expect.poll(() => current(element)).toEqual(['Usage']);
      });

      it('does not let go when another element ends its own scroll', async () => {
        const { element } = await clickApi();

        query(element, 'docs-toc').dispatchEvent(new Event('scrollend'));

        expect(current(element)).toEqual(['API']);
      });
    });
  });

  describe('accessibility', () => {
    const modes: readonly { name: string; config: ArnConfig }[] = [
      { name: 'light', config: { colorScheme: 'light' } },
      { name: 'dark', config: { colorScheme: 'dark' } },
      { name: 'RTL', config: { direction: 'rtl' } },
      { name: 'compact', config: { density: 'compact' } },
    ];

    for (const mode of modes) {
      it(`has no violations in ${mode.name} mode, with a link marked active`, async () => {
        const { fixture, element } = await setup();

        TestBed.inject(ArnConfigService).update(mode.config);
        await fixture.whenStable();
        await expect.poll(() => current(element)).toEqual(['Intro']);

        await expectNoA11yViolations(query(element, 'docs-toc'));
      });
    }
  });
});
