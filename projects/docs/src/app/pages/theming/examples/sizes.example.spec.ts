import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, renderExample } from '../../../testing/render-example';
import { ThemingSizesExampleComponent } from './sizes.example';
import { COMPACT, controlHeight, heights, measured } from './sizes.example.testing';

describe('ThemingSizesExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('shows one box per size, labelled with the size', async () => {
    const { element } = await renderExample(ThemingSizesExampleComponent);

    expect(Array.from(element.querySelectorAll('.box-name')).map((name) => text(name))).toEqual([
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
    ]);
  });

  it('sizes each box with the control height tokens and shows that height', async () => {
    const { fixture, element } = await renderExample(ThemingSizesExampleComponent);

    await measured(fixture, element);

    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    const measuredHeights = heights(element);

    expect(Object.keys(measuredHeights)).toEqual([...sizes]);

    for (const size of sizes) {
      const height = controlHeight(element, size);

      expect(`${size}: ${String(measuredHeights[size]?.actual)}`).toBe(
        `${size}: ${String(height)}`,
      );
      expect(measuredHeights[size]?.shown).toBe(`${String(height)}px`);
    }
  });

  it('follows density live: compact shrinks the boxes, xs stays at the 1.5rem floor', async () => {
    const { fixture, element } = await renderExample(ThemingSizesExampleComponent);
    const md = controlHeight(element, 'md', COMPACT);
    const xs = controlHeight(element, 'xs', COMPACT);

    await measured(fixture, element);
    document.documentElement.setAttribute('data-density', 'compact');

    let compact = heights(element);

    for (let frame = 0; frame < 20 && compact['md']?.shown !== `${String(md)}px`; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await fixture.whenStable();
      compact = heights(element);
    }

    expect(compact['md']).toEqual({ shown: `${String(md)}px`, actual: md });
    expect(compact['xs']).toEqual({ shown: `${String(xs)}px`, actual: xs });
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { fixture, element } = await renderExample(ThemingSizesExampleComponent, mode.config);

      await measured(fixture, element);

      await expectNoA11yViolations(element);
    });
  }
});
