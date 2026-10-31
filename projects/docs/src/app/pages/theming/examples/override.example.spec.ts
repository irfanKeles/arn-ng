import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { query, resetDocument } from '../../../testing/dom';
import { A11Y_MODES, renderExample } from '../../../testing/render-example';
import overrideCss from './override.example.css?source' with { loader: 'text' };
import { ThemingOverrideExampleComponent } from './override.example';

describe('ThemingOverrideExampleComponent', () => {
  function panels(element: HTMLElement): [HTMLElement, HTMLElement] {
    return [query(element, '.panel:not(.brand)'), query(element, '.panel.brand')];
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('overrides on a class, without !important or ::ng-deep', () => {
    expect(overrideCss).toContain('.brand {');
    expect(overrideCss).toContain('--arn-primary:');
    expect(overrideCss).not.toContain('!important');
    expect(overrideCss).not.toContain('::ng-deep');
  });

  it('changes the primary color only inside .brand', async () => {
    const [theme, brand] = panels(
      await renderExample(ThemingOverrideExampleComponent).then((r) => r.element),
    );

    expect(getComputedStyle(query(brand, '.primary')).backgroundColor).not.toBe(
      getComputedStyle(query(theme, '.primary')).backgroundColor,
    );
  });

  it('a corner computed from --arn-radius follows .brand; --arn-radius-md does not', async () => {
    const { element } = await renderExample(ThemingOverrideExampleComponent);
    const [theme, brand] = panels(element);
    const radius = (panel: HTMLElement, selector: string): string =>
      getComputedStyle(query(panel, selector)).borderTopLeftRadius;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    expect(radius(theme, '.follows')).toBe(`${String(0.625 * 0.8 * rem)}px`);
    expect(radius(brand, '.follows')).toBe(`${String(0.125 * 0.8 * rem)}px`);
    expect(radius(brand, '.step')).toBe(radius(theme, '.step'));
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ThemingOverrideExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
