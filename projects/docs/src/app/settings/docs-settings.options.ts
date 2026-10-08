import type {
  ArnColorScheme,
  ArnDeepPartial,
  ArnDensity,
  ArnMessages,
  ArnResolvedConfig,
} from '@arn-ng/ui/core';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';

/** One choice of a switcher. The lists below are also the allowlists for stored values. */
export interface DocsOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** A locale choice: the tag given to `ArnConfig.locale` and the texts that go with it. */
export interface DocsLocaleOption extends DocsOption<string> {
  /** Not given for English: its texts are built into the library. */
  readonly messages?: ArnDeepPartial<ArnMessages>;
}

export const COLOR_SCHEME_OPTIONS: readonly DocsOption<ArnColorScheme>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const DIRECTION_OPTIONS: readonly DocsOption<ArnResolvedConfig['direction']>[] = [
  { value: 'ltr', label: 'LTR' },
  { value: 'rtl', label: 'RTL' },
];

export const DENSITY_OPTIONS: readonly DocsOption<ArnDensity>[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

export const LOCALE_OPTIONS: readonly DocsLocaleOption[] = [
  { value: 'en-US', label: 'English' },
  { value: 'tr-TR', label: 'Türkçe', messages: ARN_MESSAGES_TR },
];

/** Returns `value` typed as one of the options, or `undefined` when it is not in the list. */
export function allowedValue<T extends string>(
  options: readonly DocsOption<T>[],
  value: unknown,
): T | undefined {
  return options.find((option) => option.value === value)?.value;
}
