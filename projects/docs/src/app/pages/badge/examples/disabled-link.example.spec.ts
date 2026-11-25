import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument } from '../../../testing/dom';
import { A11Y_MODES, badges, renderExample } from './badge-example.testing';
import { BadgeDisabledLinkExampleComponent } from './disabled-link.example';

describe('BadgeDisabledLinkExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('takes the links out of the tab order and keeps their href', async () => {
    const { element } = await renderExample(BadgeDisabledLinkExampleComponent);

    for (const link of badges(element)) {
      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.getAttribute('href')?.startsWith('https://')).toBe(true);
      expect(getComputedStyle(link).opacity).toBe('0.5');
    }
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(BadgeDisabledLinkExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
