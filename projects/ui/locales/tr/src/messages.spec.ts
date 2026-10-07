import { TestBed } from '@angular/core/testing';
import { ArnConfigService } from '../../../core/src/config/config.service';
import { DEFAULT_MESSAGES } from '../../../core/src/config/messages';
import { provideArn } from '../../../core/src/config/provide-arn';
import { ARN_MESSAGES_TR } from './messages';

/** Dotted paths of every leaf of a nested object (e.g. `common.yes`). */
function leafPaths(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]: [string, unknown]) =>
    typeof child === 'object' && child !== null && !Array.isArray(child)
      ? leafPaths(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('ARN_MESSAGES_TR', () => {
  it('translates every text key of the defaults and adds none', () => {
    expect(leafPaths(ARN_MESSAGES_TR).sort()).toEqual(leafPaths(DEFAULT_MESSAGES).sort());
  });

  it('carries no day or month names; those come from Intl', () => {
    expect(Object.keys(ARN_MESSAGES_TR)).not.toContain('datePicker');
  });

  it('has the reviewed texts', () => {
    expect(ARN_MESSAGES_TR).toEqual({
      common: {
        yes: 'Evet',
        no: 'Hayır',
        confirm: 'Onayla',
        reject: 'Reddet',
        cancel: 'Vazgeç',
        ok: 'Tamam',
      },
      dialog: {
        confirmTitle: 'Onay',
        closeLabel: 'Kapat',
      },
      toast: {
        successTitle: 'Başarılı',
        infoTitle: 'Bilgi',
        warningTitle: 'Uyarı',
        errorTitle: 'Hata',
        closeLabel: 'Kapat',
      },
    });
  });

  it('works with provideArn: texts from the pack, day and month names from the locale', () => {
    TestBed.configureTestingModule({
      providers: [provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR })],
    });

    const messages = TestBed.inject(ArnConfigService).messages();

    expect(messages.common.yes).toBe('Evet');
    expect(messages.common.cancel).toBe('Vazgeç');
    expect(messages.dialog.confirmTitle).toBe('Onay');
    expect(messages.datePicker.monthNames[0]).toBe('Ocak');
    expect(messages.datePicker.dayNames[1]).toBe('Pazartesi');
  });
});
