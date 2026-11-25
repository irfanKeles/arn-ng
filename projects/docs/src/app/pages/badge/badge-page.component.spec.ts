import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArnBadge } from '@arn-ng/ui/badge';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import badgeCss from '../../../../../ui/badge/src/badge.css?source' with { loader: 'text' };
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { expectApiMatchesComponent } from '../../api/testing/expect-api';
import { componentTokenMismatches } from '../../api/testing/token-mismatches';
import { query, resetDocument, text } from '../../testing/dom';
import { unknownInternalLinks } from '../../testing/links';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { A11Y_MODES } from '../../testing/render-example';
import { DocsTocService } from '../../toc/docs-toc.service';
import {
  BADGE_COLOR_TOKENS,
  BADGE_INPUTS,
  BADGE_KEYS,
  BADGE_MOTION_TOKENS,
  BADGE_SIZE_TOKENS,
  BADGE_SLOTS,
} from './badge.api';
import { BadgePageComponent } from './badge-page.component';

const ALL_TOKENS = [...BADGE_SIZE_TOKENS, ...BADGE_COLOR_TOKENS, ...BADGE_MOTION_TOKENS];

/** Whitespace-insensitive CSS text: line breaks inside var(…) do not matter. */
const normalize = (css: string): string =>
  css.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();

/** Every fallback the stylesheet writes for the token: the text after `var(<name>,` up to its `)`. */
function fallbacks(css: string, name: string): string[] {
  const source = normalize(css);
  const found: string[] = [];
  const opening = `var(${name},`;
  let from = source.indexOf(opening);

  while (from !== -1) {
    let depth = 1;
    let index = from + opening.length;

    while (index < source.length && depth > 0) {
      const char = source[index];

      depth += char === '(' ? 1 : char === ')' ? -1 : 0;
      index++;
    }

    found.push(source.slice(from + opening.length, index - 1).trim());
    from = source.indexOf(opening, index);
  }

  return found;
}

describe('BadgePageComponent', () => {
  interface Page {
    fixture: ComponentFixture<BadgePageComponent>;
    element: HTMLElement;
  }

  async function render(): Promise<Page> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideArn({ applyToDocument: true })],
    });

    const fixture = TestBed.createComponent(BadgePageComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  async function create(): Promise<HTMLElement> {
    return (await render()).element;
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('structure', () => {
    it('has a single top-level heading and carries the page class', async () => {
      const element = await create();

      expect(element.querySelectorAll('h1').length).toBe(1);
      expect(text(query(element, 'h1'))).toBe('Badge');
      expect(element.classList.contains('docs-page')).toBe(true);
    });

    it('lists its sections in the order of the component page template', async () => {
      await create();

      expect(
        TestBed.inject(DocsTocService)
          .sections()
          .map((section) => section.id()),
      ).toEqual([
        'import',
        'variants',
        'count',
        'dot',
        'icons',
        'loading',
        'as-a-link',
        'disabled-link',
        'on-a-button',
        'accessibility',
        'api',
        'styling',
      ]);
    });

    it('links only to pages that exist, among them Button and Accessibility', async () => {
      const element = await create();

      expect(unknownInternalLinks(element)).toEqual([]);
      expect(
        element.querySelector('docs-section:has(#on-a-button) a[href="/button"]'),
      ).not.toBeNull();
      expect(
        element.querySelector('docs-section:has(#accessibility) a[href="/accessibility"]'),
      ).not.toBeNull();
    });

    it('says why the secondary and outline dots use --arn-muted-foreground (WCAG 1.4.11)', async () => {
      const section = text(query(await create(), 'docs-section:has(#dot)'));

      expect(section).toContain('WCAG 1.4.11');
      expect(section).toContain('--arn-muted-foreground');
    });

    it('documents the start-icon limit of loading and that there is no end position', async () => {
      const section = text(query(await create(), 'docs-section:has(#loading)'));

      expect(section).toContain('there is no end position');
      expect(section).toContain('loses that icon while loading');
    });

    it('says the badge does not mirror icons and points to arn-rtl-mirror', async () => {
      const section = text(query(await create(), 'docs-section:has(#icons)'));

      expect(section).toContain('arn-rtl-mirror');
    });
  });

  describe('examples', () => {
    it('shows eight examples, each with HTML, TS and CSS options, the last from the Button page', async () => {
      const { element } = await render();
      const examples = Array.from(element.querySelectorAll('docs-example'));

      expect(
        examples.map((example) => example.firstElementChild?.firstElementChild?.tagName),
      ).toEqual([
        'DOCS-BADGE-VARIANTS-EXAMPLE',
        'DOCS-BADGE-COUNT-EXAMPLE',
        'DOCS-BADGE-DOT-EXAMPLE',
        'DOCS-BADGE-ICONS-EXAMPLE',
        'DOCS-BADGE-LOADING-EXAMPLE',
        'DOCS-BADGE-LINK-EXAMPLE',
        'DOCS-BADGE-DISABLED-LINK-EXAMPLE',
        'DOCS-BUTTON-BADGE-EXAMPLE',
      ]);

      for (const example of examples) {
        expect(
          Array.from(example.querySelectorAll('button[aria-pressed]')).map((option) =>
            text(option),
          ),
        ).toEqual(['HTML', 'TS', 'CSS']);
      }
    });
  });

  describe('Accessibility', () => {
    it('has the keyboard table and the LiveAnnouncer pattern', async () => {
      const section = query(await create(), 'docs-section:has(#accessibility)');

      expect(Array.from(section.querySelectorAll('tbody th')).map((cell) => text(cell))).toEqual(
        BADGE_KEYS.rows.map((row) => row.name),
      );
      expect(text(section)).toContain('LiveAnnouncer');
      expect(text(section)).toContain('aria-hidden="true"');
    });
  });

  describe('API and Styling', () => {
    it('documents exactly the inputs of ArnBadge', () => {
      expectApiMatchesComponent(ArnBadge, { inputs: BADGE_INPUTS });
    });

    it('documents exactly the --arn-badge-* tokens the stylesheet reads, and it defines none', () => {
      const sheet = new CSSStyleSheet();

      sheet.replaceSync(badgeCss);

      expect(
        componentTokenMismatches(ALL_TOKENS, sheet, (name) => name.startsWith('--arn-badge-')),
      ).toEqual([]);
    });

    it('gives each token, as its default, a fallback the stylesheet really writes', () => {
      expect(
        ALL_TOKENS.filter((row) => !fallbacks(badgeCss, row.name).includes(row.default)).map(
          (row) =>
            `${row.name}: ${row.default} is not in [${fallbacks(badgeCss, row.name).join(' | ')}]`,
        ),
      ).toEqual([]);
    });

    it('documents every size and motion fallback of the stylesheet, in the default or the description', () => {
      const missing = [...BADGE_SIZE_TOKENS, ...BADGE_MOTION_TOKENS].flatMap((row) =>
        fallbacks(badgeCss, row.name)
          .filter((value) => value !== row.default && !row.description.includes(value))
          .map((value) => `${row.name}: ${value}`),
      );

      expect(missing).toEqual([]);
    });

    it('the documented sizes are the painted ones: 22px high, 8px padding, 6px with a count', async () => {
      const element = await create();
      const label = query(element, 'docs-badge-variants-example .arn-badge');
      const count = query(element, 'docs-badge-count-example .arn-badge');

      expect(label.getBoundingClientRect().height).toBe(22);
      expect(getComputedStyle(label).paddingInlineStart).toBe('8px');
      expect(getComputedStyle(count).paddingInlineStart).toBe('6px');
      expect(getComputedStyle(label).fontSize).toBe('12px');
    });

    it('says there are no outputs and no public methods', async () => {
      const section = text(query(await create(), 'docs-section:has(#api)'));

      expect(section).toContain('no outputs and no public methods');
    });

    it('renders Keyboard, Inputs, Templates, Size, Color and Motion tables', async () => {
      const element = await create();
      const captions = Array.from(element.querySelectorAll('caption')).map((caption) =>
        text(caption),
      );
      const names = (root: HTMLElement): string[] =>
        Array.from(root.querySelectorAll('tbody th')).map((cell) => text(cell));

      expect(captions).toEqual(['Keyboard', 'Inputs', 'Templates', 'Size', 'Color', 'Motion']);
      expect(names(query(element, 'docs-section:has(#api)'))).toEqual([
        ...BADGE_INPUTS.map((row) => row.name),
        ...BADGE_SLOTS.map((row) => row.name),
      ]);
      expect(names(query(element, 'docs-section:has(#styling)'))).toEqual(
        ALL_TOKENS.map((row) => row.name),
      );
    });
  });

  // The library rules have zero specificity: the site's own link and focus rules must skip badges
  describe('site styles', () => {
    it('leaves a link badge without the text-link underline, in its own color', async () => {
      const element = await create();
      const link = query(element, 'docs-badge-link-example a.arn-badge');
      const badge = query(element, 'docs-badge-variants-example .arn-badge');

      expect(getComputedStyle(link).textDecorationLine).toBe('none');
      expect(getComputedStyle(link).color).toBe(getComputedStyle(badge).color);
    });

    it('does not add the site focus outline to a link badge', async () => {
      const element = await create();
      const link = query(element, 'docs-badge-link-example a.arn-badge');

      link.focus({ focusVisible: true });

      expect(getComputedStyle(link).outlineColor).toBe('rgba(0, 0, 0, 0)');
    });
  });

  describe('layout', () => {
    it('does not make a 320px page scroll sideways', async () => {
      const { fixture, element } = await render();

      await expectNoPageOverflow(element, () => fixture.whenStable());
    });
  });

  describe('accessibility', () => {
    for (const mode of A11Y_MODES) {
      it(`has no violations in ${mode.name} mode`, async () => {
        const { fixture, element } = await render();

        TestBed.inject(ArnConfigService).update(mode.config);
        await fixture.whenStable();

        await expectNoA11yViolations(element);
      });
    }
  });
});
