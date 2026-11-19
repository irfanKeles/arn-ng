import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument } from '../../../testing/dom';
import { A11Y_MODES, buttons, renderExample } from './button-example.testing';
import { ButtonDisabledExampleComponent } from './disabled.example';

describe('ButtonDisabledExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('disables the button natively and the link with aria-disabled', async () => {
    const { element } = await renderExample(ButtonDisabledExampleComponent);
    const [button, link] = buttons(element);

    expect(button?.matches(':disabled')).toBe(true);
    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('aria-disabled')).toBe('true');
    expect(link?.getAttribute('tabindex')).toBe('-1');
  });

  it('cancels a click on the disabled link', async () => {
    const { element } = await renderExample(ButtonDisabledExampleComponent);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    buttons(element)[1]?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonDisabledExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
