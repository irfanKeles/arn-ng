import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, badges, renderExample } from './badge-example.testing';
import { BadgeCountExampleComponent } from './count.example';

describe('BadgeCountExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('caps the count at max, hides 0 and shows it with showZero', async () => {
    const { element } = await renderExample(BadgeCountExampleComponent);
    const all = badges(element);

    expect(all.map((badge) => text(badge))).toEqual(['3', '99+', '999+', '', '0']);
    expect(all.map((badge) => getComputedStyle(badge).display)).toEqual([
      'flex',
      'flex',
      'flex',
      'none',
      'flex',
    ]);
  });

  it('a single digit is a 22px circle', async () => {
    const { element } = await renderExample(BadgeCountExampleComponent);
    const rect = badges(element)[0]?.getBoundingClientRect();

    expect([rect?.width, rect?.height]).toEqual([22, 22]);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(BadgeCountExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
