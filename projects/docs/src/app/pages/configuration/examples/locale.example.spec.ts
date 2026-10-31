import { TestBed } from '@angular/core/testing';
import { ArnConfigService } from '@arn-ng/ui/core';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';
import { expectNoA11yViolations } from '../../../../../../ui/testing/a11y';
import { resetDocument, text } from '../../../testing/dom';
import { A11Y_MODES, renderExample } from '../../../testing/render-example';
import { ConfigurationLocaleExampleComponent } from './locale.example';

describe('ConfigurationLocaleExampleComponent', () => {
  /** The readout as term → description. */
  function readout(element: HTMLElement): Record<string, string> {
    const terms = Array.from(element.querySelectorAll('dt')).map((term) => text(term));
    const values = Array.from(element.querySelectorAll('dd')).map((value) => text(value));

    return Object.fromEntries(terms.map((term, index) => [term, values[index] ?? '']));
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('shows the English texts and names by default', async () => {
    const { element } = await renderExample(ConfigurationLocaleExampleComponent);
    const values = readout(element);

    expect(Object.keys(values)).toEqual(['Locale', 'Buttons', 'Months', 'Days']);
    expect(values['Locale']).toBe('en-US');
    expect(values['Buttons']).toBe('OK · Cancel · Confirm');
    expect(values['Months']?.startsWith('January, February')).toBe(true);
    expect(values['Days']?.startsWith('Sun, Mon')).toBe(true);
  });

  it('changes at once when the application switches to Turkish, as the header does', async () => {
    const { fixture, element } = await renderExample(ConfigurationLocaleExampleComponent);

    TestBed.inject(ArnConfigService).update({ locale: 'tr-TR', messages: ARN_MESSAGES_TR });
    await fixture.whenStable();

    const values = readout(element);

    expect(values['Locale']).toBe('tr-TR');
    expect(values['Buttons']).toBe('Tamam · Vazgeç · Onayla');
    expect(values['Months']?.startsWith('Ocak, Şubat')).toBe(true);
    expect(values['Days']?.startsWith('Paz, Pzt')).toBe(true);
  });

  it('with a locale alone, changes the names but keeps the English texts', async () => {
    const { fixture, element } = await renderExample(ConfigurationLocaleExampleComponent);

    TestBed.inject(ArnConfigService).setLocale('de-DE');
    await fixture.whenStable();

    expect(readout(element)['Buttons']).toBe('OK · Cancel · Confirm');
    expect(readout(element)['Months']?.startsWith('Januar, Februar')).toBe(true);
  });

  for (const mode of A11Y_MODES) {
    it(`has no accessibility violations in ${mode.name} mode`, async () => {
      const { element } = await renderExample(ConfigurationLocaleExampleComponent, mode.config);

      await expectNoA11yViolations(element);
    });
  }
});
