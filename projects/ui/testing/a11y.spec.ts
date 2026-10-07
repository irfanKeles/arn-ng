import { a11yViolations, expectNoA11yViolations } from './a11y';

describe('a11y test helper', () => {
  let host: HTMLElement;

  function render(html: string): HTMLElement {
    host.innerHTML = html;
    return host;
  }

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  describe('<img> without alt text', () => {
    const html = '<img src="data:," />';

    it('is reported as a violation', async () => {
      const violations = await a11yViolations(render(html));

      expect(violations.length).toBe(1);
      expect(violations[0]).toContain('image-alt');
    });

    it('expectNoA11yViolations throws', async () => {
      let error: unknown;

      try {
        await expectNoA11yViolations(render(html));
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('image-alt');
    });
  });

  describe('accessible fragment', () => {
    const html = '<img src="data:," alt="Logo" /><button type="button">Save</button>';

    it('has no violations', async () => {
      expect(await a11yViolations(render(html))).toEqual([]);
    });

    it('expectNoA11yViolations does not throw', async () => {
      let error: unknown;

      try {
        await expectNoA11yViolations(render(html));
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeUndefined();
    });
  });
});
