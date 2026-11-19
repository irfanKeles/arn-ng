import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { contrastRatio } from '../../../../../ui/testing/contrast';
import type { DocsNavCategory } from '../../nav/docs-nav';
import { query, queryAs, resetDocument, text } from '../../testing/dom';
import { unknownInternalLinks } from '../../testing/links';
import { A11Y_MODES } from '../../testing/render-example';
import sidebarCss from './sidebar.component.css?source' with { loader: 'text' };
import { SidebarComponent, type DocsSectionSelection } from './sidebar.component';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class EmptyPageComponent {}

const load = (): Promise<typeof EmptyPageComponent> => Promise.resolve(EmptyPageComponent);

const FIXTURE: readonly DocsNavCategory[] = [
  {
    id: 'start',
    title: 'Start',
    pages: [
      {
        slug: '',
        title: 'Home',
        sections: [{ id: 'status', heading: 'Status' }],
        loadComponent: load,
      },
      {
        slug: 'install',
        title: 'Install',
        sections: [
          { id: 'theme', heading: 'Add the theme' },
          { id: 'imports', heading: 'Imports' },
        ],
        loadComponent: load,
      },
    ],
  },
  { id: 'empty', title: 'Empty', pages: [] },
  {
    id: 'forms',
    title: 'Forms',
    pages: [
      {
        slug: 'input',
        title: 'Input',
        sections: [{ id: 'sizes', heading: 'Sizes' }],
        loadComponent: load,
      },
    ],
  },
];

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let element: HTMLElement;

  async function navigate(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
  }

  function links(): HTMLAnchorElement[] {
    return Array.from(element.querySelectorAll('a'));
  }

  function input(): HTMLInputElement {
    return queryAs(element, 'input', HTMLInputElement);
  }

  function status(): string {
    return text(query(element, '[role="status"]'));
  }

  function clearButton(): HTMLButtonElement | null {
    return element.querySelector('button');
  }

  async function search(value: string): Promise<void> {
    input().value = value;
    input().dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  /** Presses Escape in the search field; whether the event reached the document. */
  async function pressEscape(init: KeyboardEventInit = {}): Promise<boolean> {
    let reached = false;
    const listener = (): void => {
      reached = true;
    };

    document.addEventListener('keydown', listener);
    input().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, ...init }),
    );
    document.removeEventListener('keydown', listener);
    await fixture.whenStable();

    return reached;
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', component: EmptyPageComponent },
          { path: 'install', component: EmptyPageComponent },
          { path: 'input', component: EmptyPageComponent },
        ]),
        provideArn({ applyToDocument: true }),
      ],
    });

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.componentRef.setInput('categories', FIXTURE);
    element = fixture.nativeElement as HTMLElement;
    await navigate('/');
  });

  afterEach(() => {
    resetDocument(document);
  });

  describe('list', () => {
    it('renders a labelled navigation landmark', () => {
      expect(query(element, 'nav').getAttribute('aria-label')).toBe('Documentation');
    });

    it('renders the pages under their category headings, without sections', () => {
      const headings = Array.from(element.querySelectorAll('h2'));
      const lists = Array.from(element.querySelectorAll('nav > ul'));

      expect(headings.map((heading) => text(heading))).toEqual(['Start', 'Forms']);
      expect(links().map((link) => text(link))).toEqual(['Home', 'Install', 'Input']);
      expect(links().map((link) => link.getAttribute('href'))).toEqual(['/', '/install', '/input']);
      expect(lists.map((list) => list.getAttribute('aria-labelledby'))).toEqual(
        headings.map((heading) => heading.id),
      );
    });

    it('does not render the heading of an empty category', () => {
      expect(element.textContent).not.toContain('Empty');
    });

    it('marks only the current page with aria-current', async () => {
      expect(links().map((link) => link.getAttribute('aria-current'))).toEqual([
        'page',
        null,
        null,
      ]);

      await navigate('/install');

      expect(links().map((link) => link.getAttribute('aria-current'))).toEqual([
        null,
        'page',
        null,
      ]);
    });

    it('follows a change of the categories', async () => {
      fixture.componentRef.setInput('categories', FIXTURE.slice(2));
      await fixture.whenStable();

      expect(links().map((link) => text(link))).toEqual(['Input']);
    });

    it('moves focus to the first link', () => {
      fixture.componentInstance.focusFirstLink();

      expect(document.activeElement).toBe(links()[0] ?? null);
    });
  });

  describe('search field', () => {
    it('is a labelled search landmark above the navigation, not inside it', () => {
      const landmark = query(element, '[role="search"]');
      const label = query(landmark, 'label');

      expect(landmark.parentElement).toBe(element);
      expect(landmark.nextElementSibling).toBe(query(element, 'nav'));
      expect(query(element, 'nav').querySelector('[role="search"], input')).toBeNull();
      expect(input().type).toBe('search');
      expect(label.getAttribute('for')).toBe(input().id);
      expect(text(label)).toBe('Search the documentation');
    });

    it('has no link of its own, so the first link is still the first page', () => {
      expect(query(element, '[role="search"]').querySelector('a')).toBeNull();
    });

    it('is a bordered control sized like the links, with a border of at least 3:1', async () => {
      const style = getComputedStyle(input());
      const link = getComputedStyle(query(element, '.docs-nav-link'));

      expect(style.boxSizing).toBe('border-box');
      expect(style.minBlockSize).toBe(link.minBlockSize);

      for (const colorScheme of ['light', 'dark'] as const) {
        TestBed.inject(ArnConfigService).update({ colorScheme });
        await fixture.whenStable();

        const current = getComputedStyle(input());
        const ratio = contrastRatio(current.borderTopColor, current.backgroundColor);

        expect(`${colorScheme}: ${String(ratio >= 3)}`).toBe(`${colorScheme}: true`);
      }
    });

    it('hides the browser clear button: there is one, ours', () => {
      // getComputedStyle cannot read this pseudo-element (it returns the input's own style), so
      // the rule is checked in the stylesheet.
      const rule =
        /\.docs-search-input::-webkit-search-cancel-button\s*\{\s*appearance:\s*none;\s*\}/;

      expect(rule.test(sidebarCss)).toBe(true);
    });
  });

  describe('filtering', () => {
    it('keeps a page whose title matches as a link', async () => {
      await search('inst');

      expect(links().map((link) => [text(link), link.getAttribute('href')])).toEqual([
        ['Install', '/install'],
      ]);
      expect(Array.from(element.querySelectorAll('h2')).map((heading) => text(heading))).toEqual([
        'Start',
      ]);
    });

    it('lists matching sections under their page, linking to the fragment', async () => {
      await search('the');

      expect(links().map((link) => link.getAttribute('href'))).toEqual(['/install#theme']);
      expect(query(element, '.docs-nav-sections').closest('li')?.textContent).toContain('Install');
    });

    it('shows a page found only for its sections as a label, not a link', async () => {
      await search('sizes');

      const label = query(element, '.docs-nav-label');

      expect(label.tagName).toBe('SPAN');
      expect(label.closest('a')).toBeNull();
      expect(text(label)).toBe('Input');
      expect(getComputedStyle(label).cursor).toBe('auto');
      expect(links().map((link) => link.getAttribute('href'))).toEqual(['/input#sizes']);
    });

    it('keeps aria-current on the label of the current page', async () => {
      await navigate('/input');
      await search('sizes');

      expect(query(element, '.docs-nav-label').getAttribute('aria-current')).toBe('page');

      await navigate('/install');

      expect(query(element, '.docs-nav-label').hasAttribute('aria-current')).toBe(false);
    });

    it('announces exactly as many results as it shows links', async () => {
      for (const [value, announced, shown] of [
        ['inst', '1 result', 1],
        ['s', '4 results', 4],
        ['the', '1 result', 1],
      ] as const) {
        await search(value);

        expect(`${value}: ${status()}`).toBe(`${value}: ${announced}`);
        expect(`${value}: ${String(links().length)}`).toBe(`${value}: ${String(shown)}`);
      }
    });

    it('says so when nothing matches, and shows no link', async () => {
      await search('  zzz ');

      expect(status()).toBe('No pages or sections match “zzz”.');
      expect(links().length).toBe(0);
      expect(element.querySelectorAll('h2').length).toBe(0);
    });

    it('keeps the status region in the DOM, empty without a query', async () => {
      expect(status()).toBe('');

      await search('inst');
      await search('');

      expect(status()).toBe('');
      expect(links().length).toBe(3);
    });

    it('links only to pages of the navigation', async () => {
      await search('s');

      expect(unknownInternalLinks(element, FIXTURE)).toEqual([]);
    });
  });

  describe('clearing', () => {
    it('shows the clear button only while there is a query', async () => {
      expect(clearButton()).toBeNull();

      await search('inst');

      expect(clearButton()?.getAttribute('aria-label')).toBe('Clear search');
      expect(clearButton()?.type).toBe('button');
    });

    it('clears, shows the whole list and returns focus to the field', async () => {
      await search('inst');
      clearButton()?.click();
      await fixture.whenStable();

      expect(input().value).toBe('');
      expect(clearButton()).toBeNull();
      expect(links().length).toBe(3);
      expect(document.activeElement).toBe(input());
    });

    it('clears with Escape, which then goes no further', async () => {
      await search('inst');

      expect(await pressEscape()).toBe(false);
      expect(input().value).toBe('');
      expect(links().length).toBe(3);
    });

    it('lets Escape through with an empty field (the shell closes the drawer)', async () => {
      expect(await pressEscape()).toBe(true);
    });

    it('leaves Escape to an input method that is composing, and stops it there', async () => {
      await search('inst');

      expect(await pressEscape({ isComposing: true })).toBe(false);
      expect(input().value).toBe('inst');
      expect(links().length).toBe(1);
    });
  });

  describe('section links', () => {
    async function click(link: HTMLAnchorElement, init: MouseEventInit = {}): Promise<void> {
      // A modified click is the browser's: keep the test page where it is.
      const stay = (event: Event): void => {
        event.preventDefault();
      };

      document.addEventListener('click', stay);
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
      document.removeEventListener('click', stay);
      await fixture.whenStable();
    }

    function selections(): DocsSectionSelection[] {
      const selected: DocsSectionSelection[] = [];

      fixture.componentInstance.sectionSelected.subscribe((selection) => {
        selected.push(selection);
      });

      return selected;
    }

    it('reports a plain click with the page path and the section id', async () => {
      const selected = selections();

      await search('the');
      await click(queryAs(element, 'a', HTMLAnchorElement));

      expect(selected).toEqual([{ path: '/install', id: 'theme' }]);
    });

    it('does not report a modified click', async () => {
      const selected = selections();

      await search('the');
      await click(queryAs(element, 'a', HTMLAnchorElement), { ctrlKey: true });

      expect(selected).toEqual([]);
    });
  });

  describe('focus', () => {
    it('moves focus to the search field when the search shows no link', async () => {
      await search('zzz');
      fixture.componentInstance.focusFirstLink();

      expect(document.activeElement).toBe(input());
    });
  });

  describe('accessibility', () => {
    for (const mode of A11Y_MODES) {
      for (const [state, value] of [
        ['without a query', ''],
        ['with results', 's'],
        ['without results', 'zzz'],
      ] as const) {
        it(`has no violations in ${mode.name} mode ${state}`, async () => {
          TestBed.inject(ArnConfigService).update(mode.config);
          await search(value);

          await expectNoA11yViolations(element);
        });
      }
    }
  });
});
