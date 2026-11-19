import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument } from '../../../testing/dom';
import { A11Y_MODES, buttons, renderExample } from './button-example.testing';
import { ButtonIconOnlyExampleComponent } from './icon-only.example';

describe('ButtonIconOnlyExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('names every icon-only button and makes it square; round gives a circle and a pill', async () => {
    const { element } = await renderExample(ButtonIconOnlyExampleComponent);
    const [settings, add, subscribe] = buttons(element);

    for (const button of [settings, add]) {
      const rect = button?.getBoundingClientRect();

      expect(button?.getAttribute('aria-label')).toBeTruthy();
      expect(rect?.width).toBe(rect?.height);
    }
    expect(add && getComputedStyle(add).borderTopLeftRadius).toBe('9999px');
    expect(subscribe && getComputedStyle(subscribe).borderTopLeftRadius).toBe('9999px');
    expect(subscribe?.getBoundingClientRect().width).toBeGreaterThan(
      subscribe?.getBoundingClientRect().height ?? 0,
    );
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonIconOnlyExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
