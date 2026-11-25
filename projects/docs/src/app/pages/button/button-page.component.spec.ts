import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArnButton } from '@arn-ng/ui/button';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';
import buttonCss from '../../../../../ui/button/src/button.css?source' with { loader: 'text' };
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { cssFallbacks } from '../../api/testing/css-fallbacks';
import { directiveTemplateNames, expectApiMatchesComponent } from '../../api/testing/expect-api';
import { componentTokenMismatches } from '../../api/testing/token-mismatches';
import { query, resetDocument, text } from '../../testing/dom';
import { unknownInternalLinks } from '../../testing/links';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { A11Y_MODES } from '../../testing/render-example';
import { DocsTocService } from '../../toc/docs-toc.service';
import {
  BUTTON_COLOR_TOKENS,
  BUTTON_INPUTS,
  BUTTON_KEYS,
  BUTTON_SIZE_TOKENS,
  BUTTON_SLOTS,
} from './button.api';
import { ButtonPageComponent } from './button-page.component';

/** The ripple inputs the button opens through its host directive, under the button's names. */
const RIPPLE_ALIASES = ['ripple', 'rippleColor', 'rippleCentered'];

// The test build is AOT: binding a name the button does not open would fail to compile
@Component({
  imports: [ArnButton],
  template: `<button
    arnButton
    type="button"
    [ripple]="true"
    [rippleColor]="'red'"
    [rippleCentered]="true"
  >
    Save
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RippleAliasesProbe {}

describe('ButtonPageComponent', () => {
  interface Page {
    fixture: ComponentFixture<ButtonPageComponent>;
    element: HTMLElement;
  }

  async function render(): Promise<Page> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideArn({ applyToDocument: true })],
    });

    const fixture = TestBed.createComponent(ButtonPageComponent);

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
      expect(text(query(element, 'h1'))).toBe('Button');
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
        'disabled',
        'sizes',
        'icons',
        'icon-only-and-round',
        'as-a-link',
        'badge',
        'ripple',
        'accessibility',
        'api',
        'styling',
      ]);
    });

    it('links only to pages that exist, among them Accessibility from its Accessibility section', async () => {
      const element = await create();

      expect(unknownInternalLinks(element)).toEqual([]);
      expect(
        element.querySelector('docs-section:has(#accessibility) a[href="/accessibility"]'),
      ).not.toBeNull();
      expect(element.querySelector('docs-section:has(#ripple) a[href="/ripple"]')).not.toBeNull();
    });

    it('says the link variant underlines only on hover and press and does not suit running text', async () => {
      const section = text(query(await create(), 'docs-section:has(#variants)'));

      expect(section).toContain('underlined only on hover and while pressed');
      expect(section).toContain('not a fit for a link inside running text');
    });

    it('documents the ripple limit of a disabled button', async () => {
      const section = text(query(await create(), 'docs-section:has(#accessibility)'));

      expect(section).toContain('Known limit: the ripple on a disabled button.');
    });
  });

  describe('examples', () => {
    it('shows eight examples, each with HTML, TS and CSS options', async () => {
      const { element } = await render();
      const examples = Array.from(element.querySelectorAll('docs-example'));

      expect(
        examples.map((example) => example.firstElementChild?.firstElementChild?.tagName),
      ).toEqual([
        'DOCS-BUTTON-VARIANTS-EXAMPLE',
        'DOCS-BUTTON-DISABLED-EXAMPLE',
        'DOCS-BUTTON-SIZES-EXAMPLE',
        'DOCS-BUTTON-ICONS-EXAMPLE',
        'DOCS-BUTTON-ICON-ONLY-EXAMPLE',
        'DOCS-BUTTON-LINK-EXAMPLE',
        'DOCS-BUTTON-BADGE-EXAMPLE',
        'DOCS-BUTTON-RIPPLE-EXAMPLE',
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
    it('has the keyboard table with Enter and Space', async () => {
      const section = query(await create(), 'docs-section:has(#accessibility)');
      const keys = Array.from(section.querySelectorAll('tbody th')).map((cell) => text(cell));

      expect(keys).toEqual(BUTTON_KEYS.rows.map((row) => row.name));
      expect(keys).toEqual(expect.arrayContaining(['Enter', 'Space']));
    });
  });

  describe('API and Styling', () => {
    // reflectComponentType lists the component's own inputs, not those of its host directives
    it('documents exactly the own inputs of ArnButton', () => {
      expectApiMatchesComponent(ArnButton, {
        inputs: BUTTON_INPUTS.filter((row) => !RIPPLE_ALIASES.includes(row.name)),
      });
    });

    it('documents the three ripple inputs the button opens, and they bind', async () => {
      expect(
        BUTTON_INPUTS.map((row) => row.name).filter((name) => RIPPLE_ALIASES.includes(name)),
      ).toEqual(RIPPLE_ALIASES);
      expect(directiveTemplateNames(ArnRippleDirective)?.inputs.length).toBe(RIPPLE_ALIASES.length);

      const fixture = TestBed.createComponent(RippleAliasesProbe);

      await fixture.whenStable();

      expect((fixture.nativeElement as HTMLElement).querySelector('.arn-button')).not.toBeNull();
    });

    it('documents exactly the --arn-button-* tokens the stylesheet reads, and it defines none', () => {
      const sheet = new CSSStyleSheet();

      sheet.replaceSync(buttonCss);

      expect(
        componentTokenMismatches([...BUTTON_SIZE_TOKENS, ...BUTTON_COLOR_TOKENS], sheet, (name) =>
          name.startsWith('--arn-button-'),
        ),
      ).toEqual([]);
    });

    it('gives each token, as its default, a fallback the stylesheet really writes (every size for <size>)', () => {
      const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

      expect(
        [...BUTTON_SIZE_TOKENS, ...BUTTON_COLOR_TOKENS].flatMap((row) => {
          const written = cssFallbacks(buttonCss, row.name);
          const expected = row.default.includes('<size>')
            ? SIZES.map((size) => row.default.replaceAll('<size>', size))
            : [row.default];

          return expected
            .filter((value) => !written.includes(value))
            .map((value) => `${row.name}: ${value} is not in [${written.join(' | ')}]`);
        }),
      ).toEqual([]);
    });

    it('says there are no outputs and no public methods', async () => {
      const section = text(query(await create(), 'docs-section:has(#api)'));

      expect(section).toContain('no outputs and no public methods');
    });

    it('renders Inputs, Templates, Size and Color tables', async () => {
      const element = await create();
      const captions = Array.from(element.querySelectorAll('caption')).map((caption) =>
        text(caption),
      );
      const api = query(element, 'docs-section:has(#api)');
      const styling = query(element, 'docs-section:has(#styling)');
      const names = (root: HTMLElement): string[] =>
        Array.from(root.querySelectorAll('tbody th')).map((cell) => text(cell));

      expect(captions).toEqual(['Keyboard', 'Inputs', 'Templates', 'Size', 'Color']);
      expect(names(api)).toEqual([
        ...BUTTON_INPUTS.map((row) => row.name),
        ...BUTTON_SLOTS.map((row) => row.name),
      ]);
      expect(names(styling)).toEqual([
        ...BUTTON_SIZE_TOKENS.map((row) => row.name),
        ...BUTTON_COLOR_TOKENS.map((row) => row.name),
      ]);
    });
  });

  // The library rules have zero specificity: the site's own link and focus rules must skip buttons
  describe('site styles', () => {
    it('leaves a link styled as a button without the text-link color and underline', async () => {
      const element = await create();
      const link = query(element, 'docs-button-link-example a[data-variant="default"]');
      const button = query(element, 'docs-button-variants-example button[data-variant="default"]');

      expect(getComputedStyle(link).textDecorationLine).toBe('none');
      expect(getComputedStyle(link).color).toBe(getComputedStyle(button).color);
    });

    it('does not add the site focus outline to a button', async () => {
      const element = await create();
      const button = query(element, 'docs-button-variants-example button');

      button.focus({ focusVisible: true });

      expect(getComputedStyle(button).outlineColor).toBe('rgba(0, 0, 0, 0)');
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
