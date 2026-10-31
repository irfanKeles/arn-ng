import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { query, resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, renderExample } from '../../../testing/render-example';
import { ThemingDarkModeExampleComponent } from './dark-mode.example';

describe('ThemingDarkModeExampleComponent', () => {
  function sections(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>('section'));
  }

  /** The resolved color of a token in a section, through a probe painted with it. */
  function resolved(section: HTMLElement, token: string): string {
    const probe = document.createElement('span');

    probe.style.background = `var(${token})`;
    section.append(probe);

    const color = getComputedStyle(probe).backgroundColor;

    probe.remove();

    return color;
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('forces light in the first section and dark in the second', async () => {
    const { element } = await renderExample(ThemingDarkModeExampleComponent);
    const [light, dark] = sections(element);

    expect(light?.classList.contains('light')).toBe(true);
    expect(dark?.classList.contains('dark')).toBe(true);
    expect(sections(element).map((section) => text(query(section, 'h3')))).toEqual([
      'colorScheme="light"',
      'colorScheme="dark"',
    ]);
  });

  it('paints each section and its swatches with the values of its own scheme', async () => {
    const { element } = await renderExample(ThemingDarkModeExampleComponent);
    const [light, dark] = sections(element);

    if (!light || !dark) {
      throw new Error('Two sections expected.');
    }

    expect(getComputedStyle(light).backgroundColor).toBe(resolved(light, '--arn-white'));
    expect(getComputedStyle(dark).backgroundColor).toBe(resolved(dark, '--arn-neutral-950'));

    const primary = (section: HTMLElement): string =>
      getComputedStyle(query(section, 'li:nth-child(3) .swatch')).backgroundColor;

    expect(text(query(light, 'li:nth-child(3) code'))).toBe('--arn-primary');
    expect(primary(light)).toBe(resolved(light, '--arn-neutral-900'));
    expect(primary(dark)).toBe(resolved(dark, '--arn-neutral-200'));
  });

  it('keeps both schemes whatever the page uses', async () => {
    const { element } = await renderExample(ThemingDarkModeExampleComponent, {
      colorScheme: 'dark',
    });
    const [light] = sections(element);

    expect(light && getComputedStyle(light).backgroundColor).toBe(
      light && resolved(light, '--arn-white'),
    );
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ThemingDarkModeExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
