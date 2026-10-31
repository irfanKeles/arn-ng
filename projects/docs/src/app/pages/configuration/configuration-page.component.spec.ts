import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArnConfigDirective, ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { apiMismatches } from '../../api/testing/expect-api';
import { query, resetDocument, text } from '../../testing/dom';
import { unknownInternalLinks } from '../../testing/links';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { A11Y_MODES } from '../../testing/render-example';
import { DocsTocService } from '../../toc/docs-toc.service';
import { ConfigurationPageComponent } from './configuration-page.component';
import { CONFIG_PROPERTIES, CONFIG_SERVICE_METHODS } from './configuration.api';

describe('ConfigurationPageComponent', () => {
  interface Page {
    fixture: ComponentFixture<ConfigurationPageComponent>;
    element: HTMLElement;
  }

  async function render(): Promise<Page> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideArn({ applyToDocument: true })],
    });

    const fixture = TestBed.createComponent(ConfigurationPageComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function section(element: HTMLElement, id: string): HTMLElement {
    return query(element, `docs-section:has(#${id})`);
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('structure', () => {
    it('has a single top-level heading and carries the page class', async () => {
      const { element } = await render();

      expect(element.querySelectorAll('h1').length).toBe(1);
      expect(text(query(element, 'h1'))).toBe('Configuration');
      expect(element.classList.contains('docs-page')).toBe(true);
    });

    it('lists its sections under "On this page", in order', async () => {
      await render();

      expect(
        TestBed.inject(DocsTocService)
          .sections()
          .map((entry) => entry.id()),
      ).toEqual([
        'precedence',
        'global',
        'sections',
        'runtime',
        'own-code',
        'locale-and-messages',
        'direction',
      ]);
    });

    it('links only to pages that exist, among them Installation and Ripple', async () => {
      const { element } = await render();
      const hrefs = Array.from(element.querySelectorAll('a[href]')).map((link) =>
        link.getAttribute('href'),
      );

      expect(unknownInternalLinks(element)).toEqual([]);
      expect(hrefs).toContain('/installation');
      expect(hrefs).toContain('/ripple');
      expect(hrefs).toContain('/theming');
    });

    it('states the four levels of precedence, strongest first', async () => {
      const levels = Array.from(
        section((await render()).element, 'precedence').querySelectorAll('ol > li'),
      ).map((item) => text(item));

      expect(levels.length).toBe(4);
      expect(levels[0]).toContain("component's own input");
      expect(levels[1]).toContain('arnConfig');
      expect(levels[2]).toContain('provideArn()');
      expect(levels[3]).toContain('library default');
    });

    it('warns that density, color scheme and direction need applyToDocument or a section', async () => {
      const { element } = await render();

      expect(text(section(element, 'global'))).toContain(
        'Density, color scheme and direction work through CSS.',
      );
      expect(text(section(element, 'direction'))).toContain('alone changes only the setting');
    });
  });

  describe('tables', () => {
    it('lists exactly the fields of ArnConfig, which are the inputs of arnConfig', () => {
      expect(apiMismatches(ArnConfigDirective, { inputs: CONFIG_PROPERTIES })).toEqual([]);
    });

    it('gives the defaults of the library', () => {
      const defaults = Object.fromEntries(CONFIG_PROPERTIES.map((row) => [row.name, row.default]));
      const expected: Partial<Record<keyof ArnConfig, string>> = {
        size: "'md'",
        density: "'comfortable'",
        colorScheme: "'system'",
        direction: "'auto'",
        ripple: 'false',
        forms: "{ showErrorsOn: 'touched' }",
      };

      for (const [name, value] of Object.entries(expected)) {
        expect(`${name}: ${String(defaults[name])}`).toBe(`${name}: ${value}`);
      }

      // What a fresh service reads back, for the fields with a fixed default
      TestBed.configureTestingModule({ providers: [provideArn()] });

      const config = TestBed.inject(ArnConfigService);

      expect([config.size(), config.density(), config.colorScheme(), config.ripple()]).toEqual([
        'md',
        'comfortable',
        'system',
        false,
      ]);
      expect(config.forms()).toEqual({ showErrorsOn: 'touched' });
    });

    it('lists exactly the public methods of ArnConfigService', () => {
      // TypeScript's private is not visible at runtime: the known private methods are named here,
      // so a new public method still fails this spec until it is documented.
      const privateMethods = ['writeToDocument'];
      const documented = CONFIG_SERVICE_METHODS.map((row) => row.name);
      const methods = Object.getOwnPropertyNames(ArnConfigService.prototype).filter(
        (name) => name !== 'constructor' && !name.startsWith('ɵ'),
      );

      expect(methods.filter((name) => !documented.includes(name))).toEqual(privateMethods);
      expect(documented.filter((name) => !methods.includes(name))).toEqual([]);
    });

    it('renders the Properties and Methods tables', async () => {
      const captions = Array.from((await render()).element.querySelectorAll('caption')).map(
        (caption) => text(caption),
      );

      expect(captions).toEqual(['Properties', 'Methods']);
    });
  });

  describe('examples', () => {
    it('shows the two locale examples in the Locale and messages section', async () => {
      const examples = section((await render()).element, 'locale-and-messages').querySelectorAll(
        'docs-example',
      );

      expect(
        Array.from(examples).map((example) => example.querySelector('*:first-child > *')?.tagName),
      ).toEqual(['DOCS-CONFIGURATION-LOCALE-EXAMPLE', 'DOCS-CONFIGURATION-SECTIONS-EXAMPLE']);
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
