import { TestBed } from '@angular/core/testing';
import { ArnConfigService } from '@arn-ng/ui/core';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';
import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { query, resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, renderExample } from '../../../testing/render-example';
import { ConfigurationSectionsExampleComponent } from './sections.example';

describe('ConfigurationSectionsExampleComponent', () => {
  /** Per section: its title, locale and button texts. */
  function columns(element: HTMLElement): string[][] {
    return Array.from(element.querySelectorAll('section')).map((section) => [
      text(query(section, 'h3')),
      ...Array.from(section.querySelectorAll('dd'))
        .slice(0, 2)
        .map((value) => text(value)),
    ]);
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('labels each section by its heading', async () => {
    const { element } = await renderExample(ConfigurationSectionsExampleComponent);

    for (const section of Array.from(element.querySelectorAll('section'))) {
      expect(section.getAttribute('aria-labelledby')).toBe(query(section, 'h3').id);
    }
  });

  it('a locale alone changes the names, a locale with messages also the texts', async () => {
    const { element } = await renderExample(ConfigurationSectionsExampleComponent);

    expect(columns(element)).toEqual([
      ['The application', 'en-US', 'OK · Cancel · Confirm'],
      ['locale="de-DE" only', 'de-DE', 'OK · Cancel · Confirm'],
      ['locale="tr-TR" with Turkish texts', 'tr-TR', 'Tamam · Vazgeç · Onayla'],
    ]);
    expect(text(query(element, 'section:nth-child(2) dl')).includes('Januar')).toBe(true);
  });

  it('the sections keep their own values when the application changes language', async () => {
    const { fixture, element } = await renderExample(ConfigurationSectionsExampleComponent);

    TestBed.inject(ArnConfigService).update({ locale: 'tr-TR', messages: ARN_MESSAGES_TR });
    await fixture.whenStable();

    // The application column follows; the de-DE section keeps its locale and inherits the texts
    expect(columns(element)).toEqual([
      ['The application', 'tr-TR', 'Tamam · Vazgeç · Onayla'],
      ['locale="de-DE" only', 'de-DE', 'Tamam · Vazgeç · Onayla'],
      ['locale="tr-TR" with Turkish texts', 'tr-TR', 'Tamam · Vazgeç · Onayla'],
    ]);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ConfigurationSectionsExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
