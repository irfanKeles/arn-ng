import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument } from '../../../testing/dom';
import { A11Y_MODES, buttons, renderExample } from './button-example.testing';
import { ButtonSizesExampleComponent } from './sizes.example';

describe('ButtonSizesExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('shows the five sizes, each taller than the one before', async () => {
    const { element } = await renderExample(ButtonSizesExampleComponent);
    const all = buttons(element);
    const heights = all.map((button) => button.getBoundingClientRect().height);

    expect(all.map((button) => button.getAttribute('data-size'))).toEqual([
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
    ]);
    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(5);
  });

  it('keeps the smallest one at 24px in compact density', async () => {
    const { element } = await renderExample(ButtonSizesExampleComponent, { density: 'compact' });

    expect(buttons(element)[0]?.getBoundingClientRect().height).toBe(24);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonSizesExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
