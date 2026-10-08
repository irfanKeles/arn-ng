import { inject, Injectable } from '@angular/core';
import {
  ArnConfigService,
  type ArnColorScheme,
  type ArnConfig,
  type ArnDeepPartial,
  type ArnDensity,
  type ArnMessages,
  type ArnResolvedConfig,
} from '@arn-ng/ui/core';
import {
  allowedValue,
  COLOR_SCHEME_OPTIONS,
  DENSITY_OPTIONS,
  DIRECTION_OPTIONS,
  LOCALE_OPTIONS,
} from './docs-settings.options';
import { DOCS_STORAGE } from './docs-storage';

/** The single storage key; the value is a JSON object of the settings the visitor chose. */
export const DOCS_SETTINGS_KEY = 'arn-docs:settings';

type DocsSettings = Pick<ArnConfig, 'colorScheme' | 'direction' | 'density' | 'locale'>;

/**
 * Applies the switchers' choices to the library through `ArnConfigService` and remembers them.
 * Storage is optional: when it is missing or throws, the choices still apply for this visit.
 */
@Injectable({ providedIn: 'root' })
export class DocsSettingsService {
  private readonly config = inject(ArnConfigService);
  private readonly storage = inject(DOCS_STORAGE);

  /**
   * The English texts of every group a locale pack translates, taken before any pack is applied.
   * `ArnConfigService` deep-merges texts and has no reset, so English is restored from this.
   * Groups no pack touches (day and month names) stay out and keep following `locale`.
   */
  private readonly english = this.snapshotEnglish();
  private chosen: DocsSettings = {};

  /** Applies the stored choices. Without a stored value the library default stays in effect. */
  restore(): void {
    const { locale, ...rest } = this.read();

    this.chosen = { ...rest, locale };
    this.config.update(rest);

    if (locale !== undefined) {
      this.applyLocale(locale);
    }
  }

  setColorScheme(colorScheme: ArnColorScheme): void {
    this.config.setColorScheme(colorScheme);
    this.persist({ colorScheme });
  }

  setDirection(direction: ArnResolvedConfig['direction']): void {
    this.config.setDirection(direction);
    this.persist({ direction });
  }

  setDensity(density: ArnDensity): void {
    this.config.setDensity(density);
    this.persist({ density });
  }

  /** Switches the library's locale and texts. A locale that is not offered is ignored. */
  setLocale(locale: string): void {
    if (this.applyLocale(locale)) {
      this.persist({ locale });
    }
  }

  private applyLocale(locale: string): boolean {
    const option = LOCALE_OPTIONS.find((candidate) => candidate.value === locale);

    if (!option) {
      return false;
    }

    // English first, then the pack on top: a partial pack leaves the rest in English.
    this.config.update({ locale: option.value, messages: this.english });

    if (option.messages) {
      this.config.setMessages(option.messages);
    }

    return true;
  }

  private snapshotEnglish(): ArnDeepPartial<ArnMessages> {
    const current = this.config.messages();
    const groups = LOCALE_OPTIONS.flatMap(
      (option) => Object.keys(option.messages ?? {}) as (keyof ArnMessages)[],
    );

    return Object.fromEntries(groups.map((group): [string, unknown] => [group, current[group]]));
  }

  private read(): DocsSettings {
    let parsed: unknown;

    try {
      const raw = this.storage?.getItem(DOCS_SETTINGS_KEY);

      if (raw === null || raw === undefined) {
        return {};
      }

      parsed = JSON.parse(raw);
    } catch {
      return {};
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }

    const stored = parsed as Record<string, unknown>;

    // Each field is checked against its allowlist; an invalid one is dropped, the others are kept.
    return {
      colorScheme: allowedValue(COLOR_SCHEME_OPTIONS, stored['colorScheme']),
      direction: allowedValue(DIRECTION_OPTIONS, stored['direction']),
      density: allowedValue(DENSITY_OPTIONS, stored['density']),
      locale: allowedValue(LOCALE_OPTIONS, stored['locale']),
    };
  }

  private persist(patch: DocsSettings): void {
    this.chosen = { ...this.chosen, ...patch };

    try {
      this.storage?.setItem(DOCS_SETTINGS_KEY, JSON.stringify(this.chosen));
    } catch {
      // Storage is full or blocked: the choice still applies for this visit.
    }
  }
}
