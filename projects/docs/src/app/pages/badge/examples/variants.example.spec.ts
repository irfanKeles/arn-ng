import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, badges, renderExample } from './badge-example.testing';
import { BadgeVariantsExampleComponent } from './variants.example';

describe('BadgeVariantsExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('shows the four variants, default first', async () => {
    const { element } = await renderExample(BadgeVariantsExampleComponent);

    expect(badges(element).map((badge) => badge.getAttribute('data-variant'))).toEqual([
      'default',
      'secondary',
      'destructive',
      'outline',
    ]);
    expect(badges(element).map((badge) => text(badge))).toEqual([
      'Badge',
      'Secondary',
      'Destructive',
      'Outline',
    ]);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(BadgeVariantsExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
