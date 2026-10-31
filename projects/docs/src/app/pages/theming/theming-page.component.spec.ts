import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { THEME_CSS, themeStyleSheet } from '../../api/testing/theme-source';
import { scanTokens, tokenMismatches } from '../../api/testing/token-mismatches';
import { query, resetDocument, text } from '../../testing/dom';
import { unknownInternalLinks } from '../../testing/links';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { A11Y_MODES } from '../../testing/render-example';
import { DocsTocService } from '../../toc/docs-toc.service';
import { ThemingPageComponent } from './theming-page.component';
import { THEMING_TOKEN_GROUPS } from './theming.tokens';

describe('ThemingPageComponent', () => {
  interface Page {
    fixture: ComponentFixture<ThemingPageComponent>;
    element: HTMLElement;
  }

  async function render(): Promise<Page> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideArn({ applyToDocument: true })],
    });

    const fixture = TestBed.createComponent(ThemingPageComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('structure', () => {
    it('has a single top-level heading and carries the page class', async () => {
      const { element } = await render();

      expect(element.querySelectorAll('h1').length).toBe(1);
      expect(text(query(element, 'h1'))).toBe('Theming');
      expect(element.classList.contains('docs-page')).toBe(true);
    });

    it('lists its sections under "On this page", in order', async () => {
      await render();

      expect(
        TestBed.inject(DocsTocService)
          .sections()
          .map((section) => section.id()),
      ).toEqual(['theme-file', 'color-tokens', 'dark-mode', 'sizes', 'density', 'overriding']);
    });

    it('links only to pages that exist, among them Configuration', async () => {
      const { element } = await render();

      expect(unknownInternalLinks(element)).toEqual([]);
      expect(
        Array.from(element.querySelectorAll('a[href]')).map((link) => link.getAttribute('href')),
      ).toContain('/configuration');
    });

    it('shows the four examples in their sections', async () => {
      const { element } = await render();
      const host = (id: string): string | undefined =>
        query(element, `docs-section:has(#${id})`).querySelector('docs-example > :first-child > *')
          ?.tagName;

      expect(['dark-mode', 'sizes', 'density', 'overriding'].map(host)).toEqual([
        'DOCS-THEMING-DARK-MODE-EXAMPLE',
        'DOCS-THEMING-SIZES-EXAMPLE',
        'DOCS-THEMING-DENSITY-EXAMPLE',
        'DOCS-THEMING-OVERRIDE-EXAMPLE',
      ]);
    });

    it('warns that derived tokens do not follow a base changed in a part of the page', async () => {
      expect(text(query((await render()).element, 'docs-section:has(#overriding)'))).toContain(
        'Derived tokens do not follow a base changed in a part of the page.',
      );
    });
  });

  describe('tables', () => {
    const scan = scanTokens(themeStyleSheet());
    // The theme file wraps long values over several lines; compare without the line breaks
    const theme = THEME_CSS.replace(/\s+/g, ' ');

    for (const group of THEMING_TOKEN_GROUPS) {
      it(`documents exactly the ${group.id} tokens of the theme`, () => {
        expect(tokenMismatches(group.rows, scan, group.inScope)).toEqual([]);
      });

      it(`gives each ${group.id} token the default the theme defines`, () => {
        const missing = group.rows
          .map((row) => `${row.name}: ${row.default};`)
          .filter((declaration) => !theme.includes(declaration));

        expect(missing).toEqual([]);
      });
    }

    it('gives every table its own caption', async () => {
      const captions = Array.from((await render()).element.querySelectorAll('caption')).map(
        (caption) => text(caption),
      );

      expect(captions).toEqual([
        'Palette',
        'Radius',
        'Typography',
        'Spacing and lines',
        'Semantic colors',
        'Control sizes',
        'Density',
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
