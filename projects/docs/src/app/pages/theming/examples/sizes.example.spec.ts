import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, renderExample } from '../../../testing/render-example';
import { ThemingSizesExampleComponent } from './sizes.example';
import { heights, measured } from './sizes.example.testing';

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
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

    await measured(fixture, element);

    const expected = { xs: 1.5, sm: 2, md: 2.25, lg: 2.5, xl: 3 };

    for (const [size, value] of Object.entries(heights(element))) {
      const height = expected[size as keyof typeof expected] * rem;

      expect(`${size}: ${String(value.actual)}`).toBe(`${size}: ${String(height)}`);
      expect(value.shown).toBe(`${String(height)}px`);
    }
  });

  it('follows density live: compact shrinks the boxes, xs stays at the 24px floor', async () => {
    const { fixture, element } = await renderExample(ThemingSizesExampleComponent);

    await measured(fixture, element);
    document.documentElement.setAttribute('data-density', 'compact');

    let compact = heights(element);

    for (let frame = 0; frame < 20 && compact['md']?.shown !== '31.5px'; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await fixture.whenStable();
      compact = heights(element);
    }

    expect(compact['md']).toEqual({ shown: '31.5px', actual: 31.5 });
    expect(compact['xs']).toEqual({ shown: '24px', actual: 24 });
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { fixture, element } = await renderExample(ThemingSizesExampleComponent, mode.config);

      await measured(fixture, element);

      await expectNoA11yViolations(element);
    });
  }
});
