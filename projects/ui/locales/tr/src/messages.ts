import type { ArnDeepPartial, ArnMessages } from '@arn-ng/ui/core';

/**
 * Turkish texts. Day and month names are not here; they come from `Intl` through `locale`.
 *
 * @example
 * provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR })
 */
export const ARN_MESSAGES_TR: ArnDeepPartial<ArnMessages> = {
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
};
