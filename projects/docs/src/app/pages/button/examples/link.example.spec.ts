import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument } from '../../../testing/dom';
import { A11Y_MODES, buttons, renderExample } from './button-example.testing';
import { ButtonLinkExampleComponent } from './link.example';

describe('ButtonLinkExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('renders real links with an href in three variants', async () => {
    const { element } = await renderExample(ButtonLinkExampleComponent);
    const all = buttons(element);

    expect(all.map((link) => link.tagName)).toEqual(['A', 'A', 'A']);
    expect(all.every((link) => link.getAttribute('href')?.startsWith('https://'))).toBe(true);
    expect(all.map((link) => link.getAttribute('data-variant'))).toEqual([
      'default',
      'outline',
      'link',
    ]);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ButtonLinkExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
