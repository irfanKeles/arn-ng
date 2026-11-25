import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, badges, renderExample } from './badge-example.testing';
import { BadgeLoadingExampleComponent } from './loading.example';

describe('BadgeLoadingExampleComponent', () => {
  afterEach(() => {
    resetDocument(document);
  });

  it('replaces the start icon with the spinner, keeps the text and sets aria-busy', async () => {
    const { element } = await renderExample(BadgeLoadingExampleComponent);
    const [upload, deploy] = badges(element);

    expect(upload?.querySelector('.arn-badge-spinner')).not.toBeNull();
    expect(deploy?.querySelector('.arn-badge-spinner')).not.toBeNull();
    expect(
      upload &&
        getComputedStyle(upload.querySelector('svg:not(.arn-badge-spinner)') ?? upload).display,
    ).toBe('none');
    expect(badges(element).map((badge) => badge.getAttribute('aria-busy'))).toEqual([
      'true',
      'true',
    ]);
    expect(badges(element).map((badge) => text(badge))).toEqual(['Uploading', 'Deploying']);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(BadgeLoadingExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
