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

    expect(badge.tagName).toBe('ARN-BADGE');
    expect(getComputedStyle(badge).position).toBe('absolute');
    expect(badge.getBoundingClientRect().top).toBeLessThan(bell?.getBoundingClientRect().top ?? 0);
  });

  it('hides the corner badges from assistive technology and puts the count in the name', async () => {
    const { element } = await renderExample(ButtonBadgeExampleComponent);
    const [, bell, messages] = buttons(element);

    expect(bell?.getAttribute('aria-label')).toContain('3 unread');
    expect(messages?.getAttribute('aria-label')).toContain('new messages');

    for (const badge of Array.from(element.querySelectorAll('[arnButtonBadge]'))) {
      expect(badge.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('shows the dot on the corner (the empty-slot rule does not hide it)', async () => {
    const { element } = await renderExample(ButtonBadgeExampleComponent);
    const dot = query(element, 'arn-badge[dot]');

    expect(getComputedStyle(dot).display).not.toBe('none');
    expect(dot.getBoundingClientRect().width).toBe(8);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonBadgeExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
