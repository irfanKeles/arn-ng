import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument } from '../../../testing/dom';
import { A11Y_MODES, badges, renderExample } from './badge-example.testing';
import { BadgeLinkExampleComponent } from './link.example';

describe('BadgeLinkExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('renders real links with an href, without the site underline', async () => {
    const { element } = await renderExample(BadgeLinkExampleComponent);
    const all = badges(element);

    expect(all.map((link) => link.tagName)).toEqual(['A', 'A', 'A']);
    expect(all.every((link) => link.getAttribute('href')?.startsWith('https://'))).toBe(true);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(BadgeLinkExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
