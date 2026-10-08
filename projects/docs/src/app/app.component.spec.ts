import { signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../ui/testing/a11y';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { DOCS_STORAGE } from './settings/docs-storage';
import { DOCS_NARROW_VIEWPORT } from './shell/viewport';
import { query, queryAs, resetDocument, text } from './testing/dom';

interface Shell {
  fixture: ComponentFixture<AppComponent>;
  element: HTMLElement;
  router: Router;
  narrow: WritableSignal<boolean>;
}

describe('AppComponent', () => {
  async function setup(options: { narrow?: boolean; url?: string } = {}): Promise<Shell> {
    const narrow = signal(options.narrow ?? false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideArn({ applyToDocument: true }),
        { provide: DOCS_NARROW_VIEWPORT, useValue: narrow },
        { provide: DOCS_STORAGE, useValue: null },
      ],
    });

    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl(options.url ?? '/');
    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement, router, narrow };
  }

  function toggle(element: HTMLElement): HTMLButtonElement {
    return queryAs(element, '.docs-drawer-toggle', HTMLButtonElement);
  }

  function main(element: HTMLElement): HTMLElement {
    return query(element, 'main');
  }

  async function openDrawer(shell: Shell): Promise<void> {
    toggle(shell.element).click();
    await shell.fixture.whenStable();
  }

  async function pressEscape(shell: Shell): Promise<void> {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await shell.fixture.whenStable();
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('structure', () => {
    it('renders the header, navigation and main landmarks', async () => {
      const { element } = await setup();

      expect(element.querySelectorAll('header').length).toBe(1);
      expect(element.querySelectorAll('main').length).toBe(1);
      expect(query(element, 'nav').getAttribute('aria-label')).toBe('Documentation');
      expect(query(element, 'header .docs-site-name').textContent).toBe('arn-ng');
      expect(element.querySelectorAll('header select').length).toBe(4);
    });

    it('renders the current page inside main and marks its link', async () => {
      const { element } = await setup();

      expect(query(main(element), 'h1').textContent).toBe('arn-ng');
      expect(query(element, 'nav a').getAttribute('aria-current')).toBe('page');
    });

    it('lists every visible page in the sidebar', async () => {
      const { element } = await setup();

      expect(Array.from(element.querySelectorAll('nav a')).map((link) => text(link))).toEqual([
        'Overview',
      ]);
    });

    it('starts with a skip link that moves focus to main', async () => {
      const { element } = await setup();
      const link = queryAs(element, 'a', HTMLAnchorElement);

      expect(element.firstElementChild).toBe(link);
      expect(link.textContent).toBe('Skip to content');
      expect(link.getAttribute('href')).toBe(`#${main(element).id}`);

      link.click();

      expect(document.activeElement).toBe(main(element));
    });

    it('shows the skip link only while it is focused', async () => {
      const { element } = await setup();
      const link = queryAs(element, '.docs-skip-link', HTMLAnchorElement);

      expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);

      link.focus();

      expect(link.getBoundingClientRect().width).toBeGreaterThan(1);
    });
  });

  describe('navigation', () => {
    it('does not move focus on the first navigation', async () => {
      const { element } = await setup();

      expect(document.activeElement).not.toBe(main(element));
    });

    it('moves focus to main and updates the title on a page change', async () => {
      const { element, router, fixture } = await setup();

      expect(document.title).toBe('Overview · arn-ng');

      await router.navigateByUrl('/missing');
      await fixture.whenStable();

      expect(document.activeElement).toBe(main(element));
      expect(document.title).toBe('Page not found · arn-ng');
      expect(query(main(element), 'h1').textContent).toBe('Page not found');
      expect(query(element, 'nav a').hasAttribute('aria-current')).toBe(false);
    });

    it('does not move focus when only the fragment changes', async () => {
      const { element, router, fixture } = await setup();

      await router.navigateByUrl('/#status');
      await fixture.whenStable();

      expect(document.activeElement).not.toBe(main(element));
    });
  });

  describe('wide viewport', () => {
    it('shows the sidebar and has no drawer button', async () => {
      const { element } = await setup();

      expect(element.querySelector('.docs-drawer-toggle')).toBeNull();
      expect(getComputedStyle(query(element, 'docs-sidebar')).display).toBe('block');
      expect(main(element).hasAttribute('inert')).toBe(false);
    });

    it('ignores Escape', async () => {
      const shell = await setup();

      queryAs(shell.element, 'nav a', HTMLAnchorElement).focus();
      await pressEscape(shell);

      expect(document.activeElement).toBe(query(shell.element, 'nav a'));
    });
  });

  describe('drawer (narrow viewport)', () => {
    it('hides the sidebar behind a labelled button', async () => {
      const { element } = await setup({ narrow: true });
      const button = toggle(element);

      expect(button.getAttribute('type')).toBe('button');
      expect(text(button)).toBe('Navigation');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-controls')).toBe(query(element, 'docs-sidebar').id);
      expect(getComputedStyle(query(element, 'docs-sidebar')).display).toBe('none');
      expect(element.querySelector('.docs-backdrop')).toBeNull();
    });

    it('opens, moves focus to the first link and makes the page inert', async () => {
      const shell = await setup({ narrow: true });

      await openDrawer(shell);

      expect(toggle(shell.element).getAttribute('aria-expanded')).toBe('true');
      expect(getComputedStyle(query(shell.element, 'docs-sidebar')).display).toBe('block');
      expect(document.activeElement).toBe(query(shell.element, 'nav a'));
      expect(main(shell.element).hasAttribute('inert')).toBe(true);
      expect(shell.element.querySelector('.docs-backdrop')).not.toBeNull();
    });

    it('closes with the button and returns focus to it', async () => {
      const shell = await setup({ narrow: true });

      await openDrawer(shell);
      toggle(shell.element).click();
      await shell.fixture.whenStable();

      expect(toggle(shell.element).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(toggle(shell.element));
      expect(main(shell.element).hasAttribute('inert')).toBe(false);
      expect(getComputedStyle(query(shell.element, 'docs-sidebar')).display).toBe('none');
    });

    it('closes with Escape and returns focus to the button', async () => {
      const shell = await setup({ narrow: true });

      await openDrawer(shell);
      await pressEscape(shell);

      expect(toggle(shell.element).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(toggle(shell.element));
      expect(shell.element.querySelector('.docs-backdrop')).toBeNull();
    });

    it('closes when the backdrop is clicked', async () => {
      const shell = await setup({ narrow: true });

      await openDrawer(shell);
      query(shell.element, '.docs-backdrop').click();
      await shell.fixture.whenStable();

      expect(toggle(shell.element).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(toggle(shell.element));
    });

    it('stays open when the sidebar itself is clicked', async () => {
      const shell = await setup({ narrow: true });

      await openDrawer(shell);
      query(shell.element, 'nav h2').click();
      await shell.fixture.whenStable();

      expect(toggle(shell.element).getAttribute('aria-expanded')).toBe('true');
    });

    it('does not take focus when Escape is pressed while closed', async () => {
      const shell = await setup({ narrow: true });

      await pressEscape(shell);

      expect(document.activeElement).not.toBe(toggle(shell.element));
    });

    it('closes on navigation and moves focus to main', async () => {
      const shell = await setup({ narrow: true });

      await openDrawer(shell);
      await shell.router.navigateByUrl('/missing');
      await shell.fixture.whenStable();

      expect(toggle(shell.element).getAttribute('aria-expanded')).toBe('false');
      expect(main(shell.element).hasAttribute('inert')).toBe(false);
      expect(document.activeElement).toBe(main(shell.element));
    });

    it('is gone when the viewport becomes wide', async () => {
      const shell = await setup({ narrow: true });

      await openDrawer(shell);
      shell.narrow.set(false);
      await shell.fixture.whenStable();

      expect(shell.element.querySelector('.docs-drawer-toggle')).toBeNull();
      expect(shell.element.querySelector('.docs-backdrop')).toBeNull();
      expect(main(shell.element).hasAttribute('inert')).toBe(false);
      expect(getComputedStyle(query(shell.element, 'docs-sidebar')).display).toBe('block');
    });
  });

  describe('layout', () => {
    function sidebar(element: HTMLElement): HTMLElement {
      return query(element, 'docs-sidebar');
    }

    function expectNear(actual: number, expected: number): void {
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
    }

    it('stretches the body and the divider to the bottom of the shell', async () => {
      // A short page: its content alone would not fill the viewport
      const { element } = await setup({ url: '/missing' });
      const host = element.getBoundingClientRect();
      const body = query(element, '.docs-body').getBoundingClientRect();
      const content = main(element).getBoundingClientRect();
      const side = sidebar(element).getBoundingClientRect();

      expectNear(body.bottom, host.bottom);
      expectNear(content.height, body.height);
      expect(content.height).toBeGreaterThan(side.height);
      expectNear(content.left, side.right);
      expect(getComputedStyle(main(element)).borderInlineStartWidth).toBe('1px');
      expect(getComputedStyle(sidebar(element)).borderInlineEndWidth).toBe('0px');
    });

    it('draws the divider on the sidebar side in RTL', async () => {
      const { element, fixture } = await setup();

      TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
      await fixture.whenStable();

      expect(getComputedStyle(main(element)).borderRightWidth).toBe('1px');
      expect(getComputedStyle(main(element)).borderLeftWidth).toBe('0px');
    });

    it('has no divider in a narrow viewport', async () => {
      const { element } = await setup({ narrow: true, url: '/missing' });

      expect(getComputedStyle(main(element)).borderInlineStartWidth).toBe('0px');
      expectNear(
        query(element, '.docs-body').getBoundingClientRect().bottom,
        element.getBoundingClientRect().bottom,
      );
    });

    it('gives the open drawer the full height of the body and an edge', async () => {
      const shell = await setup({ narrow: true, url: '/missing' });

      await openDrawer(shell);

      expectNear(
        sidebar(shell.element).getBoundingClientRect().height,
        query(shell.element, '.docs-body').getBoundingClientRect().height,
      );
      expect(getComputedStyle(sidebar(shell.element)).borderInlineEndWidth).toBe('1px');
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
      async function setupMode(narrow: boolean): Promise<Shell> {
        const shell = await setup({ narrow });

        TestBed.inject(ArnConfigService).update(mode.config);
        await shell.fixture.whenStable();

        return shell;
      }

      it(`has no violations in ${mode.name} mode`, async () => {
        const { element } = await setupMode(false);

        await expectNoA11yViolations(element);
      });

      it(`has no violations in ${mode.name} mode with the drawer closed`, async () => {
        const { element } = await setupMode(true);

        await expectNoA11yViolations(element);
      });

      it(`has no violations in ${mode.name} mode with the drawer open`, async () => {
        const shell = await setupMode(true);

        await openDrawer(shell);

        await expectNoA11yViolations(shell.element);
      });
    }

    it('writes the mode to <html>, so the shell follows it', async () => {
      await setup();
      const config = TestBed.inject(ArnConfigService);

      config.update({ colorScheme: 'dark', direction: 'rtl', density: 'compact' });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
      expect(document.documentElement.getAttribute('data-density')).toBe('compact');
    });

    it('keeps the targets at least as tall as the minimum control size', async () => {
      const shell = await setup({ narrow: true });

      TestBed.inject(ArnConfigService).setDensity('compact');
      await openDrawer(shell);

      const minimum = 24;
      const targets = shell.element.querySelectorAll<HTMLElement>(
        'header a, header button, header select, nav a',
      );

      expect(targets.length).toBe(7);

      for (const target of Array.from(targets)) {
        expect(target.getBoundingClientRect().height).toBeGreaterThanOrEqual(minimum);
      }
    });
  });
});
