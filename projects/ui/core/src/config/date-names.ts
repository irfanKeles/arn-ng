import { devWarn } from './dev-mode';
import type { ArnDatePickerMessages } from './messages';

const FALLBACK_LOCALE = 'en-US';
const cache = new Map<string, ArnDatePickerMessages>();

function build(locale: string): ArnDatePickerMessages {
  const months = (month: 'long' | 'short'): string[] => {
    const format = new Intl.DateTimeFormat(locale, { month, timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, index) => format.format(Date.UTC(2024, index, 1)));
  };
  const days = (weekday: 'long' | 'short' | 'narrow'): string[] => {
    const format = new Intl.DateTimeFormat(locale, { weekday, timeZone: 'UTC' });
    // 7 January 2024 is a Sunday, so index 0 is Sunday
    return Array.from({ length: 7 }, (_, index) => format.format(Date.UTC(2024, 0, 7 + index)));
  };

  return {
    monthNames: months('long'),
    monthNamesShort: months('short'),
    dayNames: days('long'),
    dayNamesShort: days('short'),
    dayNamesMin: days('narrow'),
  };
}

/** Generates the day and month names of `locale` with `Intl`; the result is cached per locale. */
export function dateNames(locale: string): ArnDatePickerMessages {
  let names = cache.get(locale);

  if (!names) {
    try {
      names = build(locale);
    } catch {
      devWarn(`Invalid locale "${locale}"; falling back to "${FALLBACK_LOCALE}".`);
      names = build(FALLBACK_LOCALE);
    }
    cache.set(locale, names);
  }

  return names;
}
