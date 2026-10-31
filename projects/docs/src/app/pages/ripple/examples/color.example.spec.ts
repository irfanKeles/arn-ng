import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { query, queryAs, resetDocument, text } from '../../../testing/dom';
import { RippleColorExampleComponent } from './color.example';
import { A11Y_MODES, pressAt, renderExample, waves } from './ripple-example.testing';

describe('RippleColorExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('paints the wave with the given color instead of the token default', async () => {
    const { element } = await renderExample(RippleColorExampleComponent);
    const button = queryAs(element, 'button', HTMLButtonElement);

    pressAt(button);

    const container = query(button, '.arn-ripple-container');
    const wave = waves(button)[0];

    expect(text(button)).toBe('Publish');
    expect(container.style.getPropertyValue('--arn-ripple-color')).toBe(
      'color-mix(in oklch, var(--arn-primary) 30%, transparent)',
    );

    // The same expression resolved on a probe next to the button
    const probe = document.createElement('span');

    probe.style.background = 'color-mix(in oklch, var(--arn-primary) 30%, transparent)';
    button.after(probe);

    expect(wave && getComputedStyle(wave).backgroundColor).toBe(
      getComputedStyle(probe).backgroundColor,
    );
    probe.remove();
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode, with a wave`, async () => {
      const { element } = await renderExample(RippleColorExampleComponent, mode.config);

      pressAt(queryAs(element, 'button', HTMLButtonElement));

      await expectNoA11yViolations(element);
    });
  }
});
