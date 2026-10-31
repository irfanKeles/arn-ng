import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { expectApiMatchesComponent } from '../../api/testing/expect-api';
import { THEME_CSS, themeStyleSheet } from '../../api/testing/theme-source';
import { scanTokens, tokenMismatches } from '../../api/testing/token-mismatches';
import { unknownInternalLinks } from '../../testing/links';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { query, queryAs, resetDocument, text } from '../../testing/dom';
import { DocsTocService } from '../../toc/docs-toc.service';
import basicCss from './examples/basic.example.css?source' with { loader: 'text' };
import centeredCss from './examples/centered.example.css?source' with { loader: 'text' };
import colorCss from './examples/color.example.css?source' with { loader: 'text' };
import configCss from './examples/config.example.css?source' with { loader: 'text' };
import { A11Y_MODES } from '../../testing/render-example';
import { RIPPLE_INPUTS, RIPPLE_TOKENS } from './ripple.api';
import { RipplePageComponent } from './ripple-page.component';

describe('RipplePageComponent', () => {
  interface Page {
    fixture: ComponentFixture<RipplePageComponent>;
    element: HTMLElement;
  }

  async function render(): Promise<Page> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideArn({ applyToDocument: true })],
    });

    const fixture = TestBed.createComponent(RipplePageComponent);

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
      expect(text(query(element, 'h1'))).toBe('Ripple');
      expect(element.classList.contains('docs-page')).toBe(true);
    });

    it('lists its sections under "On this page", in the order of the page standard', async () => {
      await create();

      expect(
        TestBed.inject(DocsTocService)
          .sections()
          .map((section) => section.id()),
      ).toEqual([
        'import',
        'basic',
        'turning-it-on',
        'color',
        'centered',
        'accessibility',
        'api',
        'styling',
      ]);
    });

    it('links only to pages that exist', async () => {
      expect(unknownInternalLinks(await create())).toEqual([]);
    });

    it('links to the Configuration page where it explains turning it on', async () => {
      const section = query(await create(), 'docs-section:has(#turning-it-on)');

      expect(queryAs(section, 'a[href]', HTMLAnchorElement).getAttribute('href')).toBe(
        '/configuration',
      );
    });

    it('explains that an empty attribute is always on and overrides the configuration', async () => {
      const section = query(await create(), 'docs-section:has(#turning-it-on)');

      expect(text(section)).toContain('An empty attribute is always on.');
      expect(text(section)).toContain('stronger than any configuration');
      expect(text(section)).toContain('(undefined) follows the configuration');
    });
  });

  describe('examples', () => {
    it('shows four examples, each with HTML, TS and CSS tabs', async () => {
      const { fixture, element } = await render();
      const examples = Array.from(element.querySelectorAll('docs-example'));

      expect(
        examples.map((example) => example.firstElementChild?.firstElementChild?.tagName),
      ).toEqual([
        'DOCS-RIPPLE-BASIC-EXAMPLE',
        'DOCS-RIPPLE-CONFIG-EXAMPLE',
        'DOCS-RIPPLE-COLOR-EXAMPLE',
        'DOCS-RIPPLE-CENTERED-EXAMPLE',
      ]);

      for (const example of examples) {
        queryAs(example, '.docs-example-toggle', HTMLButtonElement).click();
      }
      await fixture.whenStable();

      for (const example of examples) {
        expect(
          Array.from(example.querySelectorAll('[role="tab"]')).map((tab) => text(tab)),
        ).toEqual(['HTML', 'TS', 'CSS']);
      }
    });

    it('positions the button in the CSS a reader copies, so the copied example works', () => {
      for (const css of [basicCss, configCss, colorCss, centeredCss]) {
        expect(css).toContain('position: relative;');
      }
    });
  });

  describe('API and Styling', () => {
    it('documents exactly the inputs of ArnRippleDirective', () => {
      expectApiMatchesComponent(ArnRippleDirective, { inputs: RIPPLE_INPUTS });
    });

    it('documents exactly the --arn-ripple-* tokens of the theme', () => {
      expect(
        tokenMismatches(RIPPLE_TOKENS, scanTokens(themeStyleSheet()), (name) =>
          name.startsWith('--arn-ripple-'),
        ),
      ).toEqual([]);
    });

    it('gives each token the default the theme defines', () => {
      for (const token of RIPPLE_TOKENS) {
        expect(THEME_CSS).toContain(`${token.name}: ${token.default};`);
      }
    });

    it('renders the Inputs and CSS tokens tables', async () => {
      const element = await create();
      const captions = Array.from(element.querySelectorAll('caption')).map((caption) =>
        text(caption),
      );
      const names = Array.from(element.querySelectorAll('tbody th code')).map((code) => text(code));

      expect(captions).toEqual(['Inputs', 'CSS tokens']);
      expect(names).toEqual([
        ...RIPPLE_INPUTS.map((row) => row.name),
        ...RIPPLE_TOKENS.map((row) => row.name),
      ]);
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
