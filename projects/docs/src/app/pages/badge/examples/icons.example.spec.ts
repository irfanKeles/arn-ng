import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, badges, renderExample } from './badge-example.testing';
import { BadgeIconsExampleComponent } from './icons.example';

describe('BadgeIconsExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('sizes the icons to 12px and mirrors only the arrow in RTL', async () => {
    const { element } = await renderExample(BadgeIconsExampleComponent, { direction: 'rtl' });
    const icons = Array.from(element.querySelectorAll('svg'));

    expect(icons.map((icon) => icon.getBoundingClientRect().width)).toEqual([12, 12, 12]);
    expect(icons.map((icon) => getComputedStyle(icon).scale)).toEqual(['none', 'none', '-1 1']);
    expect(badges(element).map((badge) => text(badge))).toEqual(['Verified', 'Failed', 'Next']);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(BadgeIconsExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
