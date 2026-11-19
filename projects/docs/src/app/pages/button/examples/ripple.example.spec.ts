import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument } from '../../../testing/dom';
import { A11Y_MODES, buttons, pressAt, renderExample } from './button-example.testing';
import { ButtonRippleExampleComponent } from './ripple.example';

describe('ButtonRippleExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('draws a wave inside each button on a pointer press, without any configuration', async () => {
    const { element } = await renderExample(ButtonRippleExampleComponent);

    for (const button of buttons(element)) {
      pressAt(button);

      expect(button.querySelectorAll('.arn-ripple-wave').length).toBe(1);
    }
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonRippleExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
