import { a11yViolations, expectNoA11yViolations } from './a11y';

describe('a11y test yardımcısı', () => {
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

  describe('alt metni olmayan <img>', () => {
    const html = '<img src="data:," />';

    it('ihlal olarak raporlanır', async () => {
      const violations = await a11yViolations(render(html));

      expect(violations.length).toBe(1);
      expect(violations[0]).toContain('image-alt');
    });

    it('expectNoA11yViolations hata fırlatır', async () => {
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

  describe('erişilebilir parça', () => {
    const html = '<img src="data:," alt="Logo" /><button type="button">Kaydet</button>';

    it('ihlal içermez', async () => {
      expect(await a11yViolations(render(html))).toEqual([]);
    });

    it('expectNoA11yViolations hata fırlatmaz', async () => {
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
