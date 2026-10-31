import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { query, resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, renderExample } from '../../../testing/render-example';
import { ThemingDensityExampleComponent } from './density.example';
import { heights, measured } from './sizes.example.testing';

describe('ThemingDensityExampleComponent', () => {
  function sections(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>('section'));
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('puts the boxes in a comfortable and a compact section, each named by its heading', async () => {
    const { element } = await renderExample(ThemingDensityExampleComponent);

    expect(sections(element).map((section) => section.getAttribute('data-density'))).toEqual([
      'comfortable',
      'compact',
    ]);

    for (const section of sections(element)) {
      expect(section.getAttribute('aria-labelledby')).toBe(query(section, 'h3').id);
    }
    expect(sections(element).map((section) => text(query(section, 'h3')))).toEqual([
      'density="comfortable"',
      'density="compact"',
    ]);
  });

  it('scales height by 0.875 in the compact section, keeps xs at 24px and the text size', async () => {
    const { fixture, element } = await renderExample(ThemingDensityExampleComponent);
    const [comfortable, compact] = sections(element);

    if (!comfortable || !compact) {
      throw new Error('Two sections expected.');
    }

    await measured(fixture, comfortable);
    await measured(fixture, compact);

    const shown = (section: HTMLElement): string[] =>
      Object.values(heights(section)).map((height) => height.shown);

    expect(shown(comfortable)).toEqual(['24px', '32px', '36px', '40px', '48px']);
    expect(shown(compact)).toEqual(['24px', '28px', '31.5px', '35px', '42px']);
    expect(getComputedStyle(query(compact, '.box[data-size="md"]')).fontSize).toBe(
      getComputedStyle(query(comfortable, '.box[data-size="md"]')).fontSize,
    );
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ThemingDensityExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
