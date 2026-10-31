import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { queryAs, resetDocument, text } from '../../../testing/dom';
import { RippleConfigExampleComponent } from './config.example';
import { A11Y_MODES, pressAt, renderExample, waves } from './ripple-example.testing';

describe('RippleConfigExampleComponent', () => {
  function buttons(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll('button'));
  }

  /** Which buttons draw a wave when pressed, by label. */
  function ripplingLabels(element: HTMLElement): string[] {
    return buttons(element)
      .filter((button) => {
        pressAt(button);

        return waves(button).length > 0;
      })
      .map((button) => text(button));
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('labels the checkbox and the three buttons', async () => {
    const { element } = await renderExample(RippleConfigExampleComponent);

    expect(text(queryAs(element, 'label', HTMLLabelElement))).toBe('Ripple on in this section');
    expect(buttons(element).map((button) => text(button))).toEqual([
      'Follows the section',
      'Always on',
      'Always off',
    ]);
  });

  it('with the section on, the button that follows it and the always-on button ripple', async () => {
    const { element } = await renderExample(RippleConfigExampleComponent);

    expect(ripplingLabels(element)).toEqual(['Follows the section', 'Always on']);
  });

  it('with the section off, only the always-on button (an empty attribute) ripples', async () => {
    const { fixture, element } = await renderExample(RippleConfigExampleComponent);

    queryAs(element, 'input[type="checkbox"]', HTMLInputElement).click();
    await fixture.whenStable();

    expect(ripplingLabels(element)).toEqual(['Always on']);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(RippleConfigExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
