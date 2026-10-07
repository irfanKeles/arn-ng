import { deepMerge } from './config.merge';
import type { ArnDeepPartial } from './config.types';
import { dateNames } from './date-names';

/** Button texts shared by several components. */
export interface ArnCommonMessages {
  yes: string;
  no: string;
  confirm: string;
  reject: string;
  cancel: string;
  ok: string;
}

/** Dialog and confirm dialog texts. */
export interface ArnDialogMessages {
  /** Default title of the confirm dialog. */
  confirmTitle: string;
  /** Accessible name of the close button. */
  closeLabel: string;
}

/** Toast texts. */
export interface ArnToastMessages {
  successTitle: string;
  infoTitle: string;
  warningTitle: string;
  errorTitle: string;
  /** Accessible name of the close button. */
  closeLabel: string;
}

/**
 * Date picker day and month names. When not given they are generated from the resolved `locale`
 * with `Intl`. In the day arrays index 0 is Sunday (same as `Date.prototype.getDay()`).
 */
export interface ArnDatePickerMessages {
  /** 12 month names (e.g. "January"). */
  monthNames: readonly string[];
  /** 12 short month names (e.g. "Jan"). */
  monthNamesShort: readonly string[];
  /** 7 day names (e.g. "Sunday"). */
  dayNames: readonly string[];
  /** 7 short day names (e.g. "Sun"). */
  dayNamesShort: readonly string[];
  /** 7 shortest day names (e.g. "S"). */
  dayNamesMin: readonly string[];
}

/**
 * Component texts. Each component adds its own group; a new key always comes with a default.
 * Consumers do not implement this type in full, they pass `ArnDeepPartial<ArnMessages>`.
 */
export interface ArnMessages {
  common: ArnCommonMessages;
  dialog: ArnDialogMessages;
  toast: ArnToastMessages;
  datePicker: ArnDatePickerMessages;
}

/** Default texts (English). Day and month names are not here; `dateNames()` generates them. */
export const DEFAULT_MESSAGES: Omit<ArnMessages, 'datePicker'> = {
  common: {
    yes: 'Yes',
    no: 'No',
    confirm: 'Confirm',
    reject: 'Reject',
    cancel: 'Cancel',
    ok: 'OK',
  },
  dialog: {
    confirmTitle: 'Confirmation',
    closeLabel: 'Close',
  },
  toast: {
    successTitle: 'Success',
    infoTitle: 'Information',
    warningTitle: 'Warning',
    errorTitle: 'Error',
    closeLabel: 'Close',
  },
};

/** Merges the default texts, the day/month names of `locale` and the overrides. */
export function resolveMessages(
  locale: string,
  overrides: ArnDeepPartial<ArnMessages> | undefined,
): ArnMessages {
  return deepMerge<ArnMessages>({ ...DEFAULT_MESSAGES, datePicker: dateNames(locale) }, overrides);
}
