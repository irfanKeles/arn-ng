import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, buttons, renderExample } from './button-example.testing';
import { ButtonIconsExampleComponent } from './icons.example';

describe('ButtonIconsExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('hides the icons from assistive technology and keeps the label as the name', async () => {
    const { element } = await renderExample(ButtonIconsExampleComponent);

    for (const icon of Array.from(element.querySelectorAll('svg'))) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }
    expect(buttons(element).map((button) => text(button))).toEqual(['New file', 'Next']);
  });

  it('sizes the icons from the button and mirrors the arrow in RTL', async () => {
    const { element } = await renderExample(ButtonIconsExampleComponent, { direction: 'rtl' });
    const arrow = element.querySelector('svg.arn-rtl-mirror');

    if (!arrow) {
      throw new Error('Expected the mirrored arrow');
    }

    expect(arrow.getBoundingClientRect().width).toBe(16);
    expect(getComputedStyle(arrow).scale).toBe('-1 1');
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonIconsExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
