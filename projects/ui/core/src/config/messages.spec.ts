import { captureWarnings } from '../../../testing/console';
import { dateNames } from './date-names';
import { DEFAULT_MESSAGES, resolveMessages } from './messages';

describe('resolveMessages', () => {
  it('gives the English defaults without overrides', () => {
    const messages = resolveMessages('en-US', undefined);

    expect(messages.common).toEqual({
      yes: 'Yes',
      no: 'No',
      confirm: 'Confirm',
      reject: 'Reject',
      cancel: 'Cancel',
      ok: 'OK',
    });
    expect(messages.dialog).toEqual(DEFAULT_MESSAGES.dialog);
    expect(messages.toast).toEqual(DEFAULT_MESSAGES.toast);
  });

  it('generates day and month names from the locale', () => {
    const { datePicker } = resolveMessages('en-US', undefined);

    expect(datePicker.monthNames.length).toBe(12);
    expect(datePicker.monthNamesShort.length).toBe(12);
    expect(datePicker.dayNames.length).toBe(7);
    expect(datePicker.dayNamesShort.length).toBe(7);
    expect(datePicker.dayNamesMin.length).toBe(7);
    expect(datePicker.monthNames[0]).toBe('January');
    expect(datePicker.monthNames[11]).toBe('December');
    expect(datePicker.monthNamesShort[0]).toBe('Jan');
    // Index 0 is Sunday (same as Date.getDay)
    expect(datePicker.dayNames[0]).toBe('Sunday');
    expect(datePicker.dayNames[6]).toBe('Saturday');
    expect(datePicker.dayNamesShort[1]).toBe('Mon');
    expect(datePicker.dayNamesMin[1]).toBe('M');
  });

  it('in another locale the names come in that language', () => {
    const { datePicker } = resolveMessages('tr-TR', undefined);

    expect(datePicker.monthNames[0]).toBe('Ocak');
    expect(datePicker.dayNames[0]).toBe('Pazar');
    expect(datePicker.dayNames[1]).toBe('Pazartesi');
  });

  it('a partial override is deep-merged; the rest keep their defaults', () => {
    const messages = resolveMessages('en-US', {
      common: { ok: 'Tamam' },
      toast: { errorTitle: 'Hata' },
    });

    expect(messages.common.ok).toBe('Tamam');
    expect(messages.common.cancel).toBe('Cancel');
    expect(messages.toast.errorTitle).toBe('Hata');
    expect(messages.toast.successTitle).toBe('Success');
    expect(messages.dialog.confirmTitle).toBe('Confirmation');
  });

  it('a given day/month array wins over Intl; the others come from Intl', () => {
    const dayNamesMin = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    const { datePicker } = resolveMessages('tr-TR', { datePicker: { dayNamesMin } });

    expect(datePicker.dayNamesMin).toEqual(dayNamesMin);
    expect(datePicker.monthNames[0]).toBe('Ocak');
  });
});

describe('dateNames', () => {
  it('returns the cached result for the same locale', () => {
    expect(dateNames('de-DE')).toBe(dateNames('de-DE'));
  });

  it('falls back to en-US for an invalid locale and warns', () => {
    let monthNames: readonly string[] = [];

    const warnings = captureWarnings(() => {
      monthNames = dateNames('not a locale').monthNames;
    });

    expect(monthNames[0]).toBe('January');
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('not a locale');
  });
});
