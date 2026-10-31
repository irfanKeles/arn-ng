import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { queryAs, resetDocument } from '../../../testing/dom';
import { RippleCenteredExampleComponent } from './centered.example';
import { A11Y_MODES, pressAt, renderExample, waves } from './ripple-example.testing';

describe('RippleCenteredExampleComponent', () => {
  function button(element: HTMLElement): HTMLButtonElement {
    return queryAs(element, 'button', HTMLButtonElement);
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('is an icon button named by aria-label; the icon is hidden', async () => {
    const { element } = await renderExample(RippleCenteredExampleComponent);

    expect(button(element).getAttribute('aria-label')).toBe('Add item');
    expect(button(element).querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('starts the wave from the center, wherever it is pressed', async () => {
    const { element } = await renderExample(RippleCenteredExampleComponent);
    const host = button(element);
    const rect = host.getBoundingClientRect();

    pressAt(host, 2, 2);

    const wave = waves(host)[0];
    const waveRect = wave?.getBoundingClientRect();

    expect(waveRect).toBeDefined();
    expect(
      Math.abs((waveRect?.left ?? 0) + (waveRect?.width ?? 0) / 2 - (rect.left + rect.width / 2)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs((waveRect?.top ?? 0) + (waveRect?.height ?? 0) / 2 - (rect.top + rect.height / 2)),
    ).toBeLessThanOrEqual(1);
  });

  it('keeps a target of at least 24px in compact mode', async () => {
    const { element } = await renderExample(RippleCenteredExampleComponent, {
      density: 'compact',
    });
    const rect = button(element).getBoundingClientRect();

    expect(rect.width).toBeGreaterThanOrEqual(24);
    expect(rect.height).toBeGreaterThanOrEqual(24);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode, with a wave`, async () => {
      const { element } = await renderExample(RippleCenteredExampleComponent, mode.config);

      pressAt(button(element));

      await expectNoA11yViolations(element);
    });
  }
});
