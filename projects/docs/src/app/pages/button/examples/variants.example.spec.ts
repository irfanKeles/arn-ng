import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, buttons, renderExample } from './button-example.testing';
import { ButtonVariantsExampleComponent } from './variants.example';

describe('ButtonVariantsExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('shows the six variants in order, as native buttons with a visible name', async () => {
    const { element } = await renderExample(ButtonVariantsExampleComponent);
    const all = buttons(element);

    expect(all.map((button) => button.getAttribute('data-variant'))).toEqual([
      'default',
      'secondary',
      'destructive',
      'outline',
      'ghost',
      'link',
    ]);
    expect(all.map((button) => button.getAttribute('type'))).toEqual(Array(6).fill('button'));
    expect(all.map((button) => text(button))).toEqual([
      'Default',
      'Secondary',
      'Destructive',
      'Outline',
      'Ghost',
      'Link',
    ]);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonVariantsExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
