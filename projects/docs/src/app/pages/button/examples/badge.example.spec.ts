import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { query, resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, buttons, renderExample } from './button-example.testing';
import { ButtonBadgeExampleComponent } from './badge.example';

describe('ButtonBadgeExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('keeps the inline count in the label and puts the corner count in the slot', async () => {
    const { element } = await renderExample(ButtonBadgeExampleComponent);
    const [inbox, bell] = buttons(element);

    expect(inbox?.querySelector('[arnButtonBadge]')).toBeNull();
    expect(inbox && text(inbox)).toBe('Inbox 12');

    const badge = query(element, '[arnButtonBadge]');

    expect(getComputedStyle(badge).position).toBe('absolute');
    expect(badge.getBoundingClientRect().top).toBeLessThan(bell?.getBoundingClientRect().top ?? 0);
  });

  it('gives the corner count to the name of the icon-only button', async () => {
    const { element } = await renderExample(ButtonBadgeExampleComponent);

    expect(buttons(element)[1]?.getAttribute('aria-label')).toContain('3 unread');
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonBadgeExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
