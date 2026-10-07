import type { ArnMessages } from './messages';

/** Control size. Dimensions come from the `--arn-control-*-<size>` tokens in `theme.css`. */
export type ArnSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Density. On the CSS side it is the `data-density` attribute and the `--arn-density` factor. */
export type ArnDensity = 'comfortable' | 'compact';

/** Color scheme. `system` follows the OS preference (no `.dark` / `.light` class is written). */
export type ArnColorScheme = 'light' | 'dark' | 'system';

/**
 * Text direction. `auto` follows the direction in effect at that place: the nearest
 * `Directionality` (a parent `[arnConfig]` section, CDK `Dir`, else the document).
 */
export type ArnDirection = 'ltr' | 'rtl' | 'auto';

/** When the error state of a form control becomes visible. */
export type ArnFormErrorTrigger = 'touched' | 'dirty' | 'submitted';

/** Shared behavior settings of form controls. */
export interface ArnFormsConfig {
  /** When the error of an invalid control is shown. Default: `touched`. */
  showErrorsOn?: ArnFormErrorTrigger;
}

/**
 * Recursively optional type for objects. Arrays are not split; they are given as a whole
 * (e.g. `monthNames` is given with all 12 items or not at all).
 */
export type ArnDeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: ArnDeepPartial<T[K]> }
    : T;

/**
 * Behavioral settings of the library. Every field is optional; a field that is not given comes
 * from the next level up (section → `provideArn` → default). Visual settings such as color, font
 * and border are not here; they are CSS tokens (`@arn-ng/ui/theme.css`).
 */
export interface ArnConfig {
  /** Size of the components. Default: `md`. */
  size?: ArnSize;
  /**
   * Density. Default: `comfortable`. Works through CSS only: to have a visual effect the value
   * must be written to an element as `data-density` (`[arnConfig]` writes it to its own element;
   * use `applyToDocument` for the whole application).
   */
  density?: ArnDensity;
  /**
   * Color scheme. Default: `system`. Works through CSS only: to have a visual effect the `.dark` /
   * `.light` class must be written (`[arnConfig]` writes it to its own element; use
   * `applyToDocument` for the whole application).
   */
  colorScheme?: ArnColorScheme;
  /**
   * Text direction. Default: `auto`. `[arnConfig]` writes an explicit value to its own element as
   * `dir`; for the whole application set `<html dir>` yourself or use `applyToDocument`.
   */
  direction?: ArnDirection;
  /** Whether the ripple effect is enabled. Default: `false`. */
  ripple?: boolean;
  /**
   * BCP 47 language tag (e.g. `tr-TR`). Default: Angular `LOCALE_ID` (`en-US`). Day and month
   * names follow it through `Intl`; other texts need `messages` (e.g. `@arn-ng/ui/locales/tr`).
   */
  locale?: string;
  /** Component texts. May be partial; missing ones are deep-merged with the defaults (English). */
  messages?: ArnDeepPartial<ArnMessages>;
  /** Shared behavior of form controls. */
  forms?: ArnFormsConfig;
}

/** The config passed to `provideArn()`: `ArnConfig` plus options that only make sense at the root. */
export interface ArnRootConfig extends ArnConfig {
  /**
   * When `true`, `colorScheme`, `density` and `direction` are written to the `<html>` element at
   * startup and kept up to date as they change through `ArnConfigService`. Default: `false`
   * (nothing is written to the DOM).
   */
  applyToDocument?: boolean;
}

/** The config after all levels are merged: every field has a value. */
export interface ArnResolvedConfig {
  size: ArnSize;
  density: ArnDensity;
  colorScheme: ArnColorScheme;
  /** Never `auto`: resolved to the direction in effect. */
  direction: Exclude<ArnDirection, 'auto'>;
  ripple: boolean;
  locale: string;
  messages: ArnMessages;
  forms: Required<ArnFormsConfig>;
}
