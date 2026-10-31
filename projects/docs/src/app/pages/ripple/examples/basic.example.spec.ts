import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { queryAs, resetDocument, text } from '../../../testing/dom';
import { RippleBasicExampleComponent } from './basic.example';
import { A11Y_MODES, pressAt, pressKeys, renderExample, waves } from './ripple-example.testing';

describe('RippleBasicExampleComponent', () => {
  function button(element: HTMLElement): HTMLButtonElement {
    return queryAs(element, 'button', HTMLButtonElement);
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('is a native button with a visible name', async () => {
    const { element } = await renderExample(RippleBasicExampleComponent);

    expect(button(element).type).toBe('button');
    expect(text(button(element))).toBe('Save');
  });

  it('is positioned, as the ripple requires, by its own stylesheet', async () => {
    const { element } = await renderExample(RippleBasicExampleComponent);

    expect(getComputedStyle(button(element)).position).toBe('relative');
  });

  it('draws a wave inside the button on a pointer press', async () => {
    const { element } = await renderExample(RippleBasicExampleComponent);
    const host = button(element);

    pressAt(host);

    expect(waves(host).length).toBe(1);
    expect(waves(host)[0]?.closest('.arn-ripple-container')?.parentElement).toBe(host);
  });

  it('draws nothing for the keyboard', async () => {
    const { element } = await renderExample(RippleBasicExampleComponent);

    pressKeys(button(element));

    expect(waves(element).length).toBe(0);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode, with a wave`, async () => {
      const { element } = await renderExample(RippleBasicExampleComponent, mode.config);

      pressAt(button(element));

      await expectNoA11yViolations(element);
    });
  }
});
