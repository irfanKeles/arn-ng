import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { THEME_CSS } from '../../api/testing/theme-source';
import { query, resetDocument, text } from '../../testing/dom';
import { unknownInternalLinks } from '../../testing/links';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { A11Y_MODES } from '../../testing/render-example';
import { DocsTocService } from '../../toc/docs-toc.service';
import { AccessibilityPageComponent, RING_CONTRAST } from './accessibility-page.component';

describe('AccessibilityPageComponent', () => {
  interface Page {
    fixture: ComponentFixture<AccessibilityPageComponent>;
    element: HTMLElement;
  }

  async function render(): Promise<Page> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideArn({ applyToDocument: true })],
    });

    const fixture = TestBed.createComponent(AccessibilityPageComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function section(element: HTMLElement, id: string): string {
    return text(query(element, `docs-section:has(#${id})`));
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('structure', () => {
    it('has a single top-level heading and carries the page class', async () => {
      const { element } = await render();

      expect(element.querySelectorAll('h1').length).toBe(1);
      expect(text(query(element, 'h1'))).toBe('Accessibility');
      expect(element.classList.contains('docs-page')).toBe(true);
    });

    it('lists its sections under "On this page", in order', async () => {
      await render();

      expect(
        TestBed.inject(DocsTocService)
          .sections()
          .map((entry) => entry.id()),
      ).toEqual([
        'must-meet',
        'target-size',
        'focus-ring',
        'reduced-motion',
        'rtl',
        'testing',
        'known-limits',
      ]);
    });

    it('links only to pages that exist, among them Theming, Configuration and Ripple', async () => {
      const { element } = await render();
      const hrefs = Array.from(element.querySelectorAll('a[href]')).map((link) =>
        link.getAttribute('href'),
      );

      expect(unknownInternalLinks(element)).toEqual([]);
      for (const page of ['/theming', '/configuration', '/ripple']) {
        expect(hrefs).toContain(page);
      }
    });

    it('has no examples and no token or API tables, only code blocks', async () => {
      const { element } = await render();

      expect(element.querySelector('docs-example')).toBeNull();
      expect(element.querySelector('docs-token-table, docs-api-table')).toBeNull();
      expect(element.querySelectorAll('docs-code-block').length).toBe(5);
    });
  });

  describe('wording', () => {
    it('says there are no components yet and speaks of rules, not guarantees', async () => {
      const { element } = await render();
      const note = text(query(element, '[role="note"]'));

      expect(note).toContain('No components yet.');
      expect(note).toContain('These are rules');
      expect(text(element).toLowerCase()).not.toContain('guarantee');
      expect(text(query(element, 'docs-section:has(#must-meet) h2'))).toBe(
        'What every component must meet',
      );
    });

    it('lists the known limits honestly', async () => {
      const limits = section((await render()).element, 'known-limits');

      expect(limits).toContain('Automated checks find only part of the problems.');
      expect(limits).toContain('No screen reader testing yet.');
      expect(limits).toContain('Real key presses are not simulated.');
      expect(limits).toContain('The ripple ignores the keyboard by design.');
    });
  });

  describe('numbers', () => {
    /** Relative luminance of a computed achromatic oklch color: Y = L³ (as in theme.spec.ts). */
    function luminance(color: string): number {
      const match = /^oklch\(([\d.]+)(%?) 0 0\)$/.exec(color);

      if (!match?.[1]) {
        throw new Error(`Not an achromatic oklch color: ${color}`);
      }

      return (Number(match[1]) / (match[2] === '%' ? 100 : 1)) ** 3;
    }

    function resolved(scheme: string, token: string): string {
      const probe = document.createElement('div');

      probe.className = scheme;
      probe.style.background = `var(${token})`;
      document.body.append(probe);

      const color = getComputedStyle(probe).backgroundColor;

      probe.remove();

      return color;
    }

    for (const scheme of ['light', 'dark'] as const) {
      it(`states the ${scheme} ring contrast the theme gives`, async () => {
        const [a, b] = [
          luminance(resolved(scheme, '--arn-ring')),
          luminance(resolved(scheme, '--arn-background')),
        ].sort((x, y) => y - x) as [number, number];
        const contrast = ((a + 0.05) / (b + 0.05)).toFixed(1);

        expect(contrast).toBe(RING_CONTRAST[scheme]);
        expect(section((await render()).element, 'focus-ring')).toContain(`${contrast}:1`);
      });
    }

    it('states the 24px floor and the 3px ring the theme defines', async () => {
      const { element } = await render();
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

      expect(THEME_CSS).toContain('--arn-control-min-size: 1.5rem;');
      expect(THEME_CSS).toContain('--arn-ring-width: 3px;');
      expect(1.5 * rem).toBe(24);
      expect(section(element, 'target-size')).toContain('24 CSS pixels');
      expect(section(element, 'focus-ring')).toContain('(3px)');
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
