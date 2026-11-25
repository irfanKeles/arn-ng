import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, badges, renderExample } from './badge-example.testing';
import { BadgeDotExampleComponent } from './dot.example';

describe('BadgeDotExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('gives every dot a name and no visible text', async () => {
    const { element } = await renderExample(BadgeDotExampleComponent);

    expect(badges(element).map((badge) => text(badge))).toEqual([
      'New messages',
      'Not synced yet',
      'Payment failed',
      'Incomplete',
    ]);

    for (const badge of badges(element)) {
      expect(badge.getBoundingClientRect().width).toBe(8);
    }
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(BadgeDotExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
