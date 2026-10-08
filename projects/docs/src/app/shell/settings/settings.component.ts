import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ArnConfigService } from '@arn-ng/ui/core';
import {
  allowedValue,
  COLOR_SCHEME_OPTIONS,
  DENSITY_OPTIONS,
  DIRECTION_OPTIONS,
  LOCALE_OPTIONS,
} from '../../settings/docs-settings.options';
import { DocsSettingsService } from '../../settings/docs-settings.service';

function selectedValue(event: Event): unknown {
  return event.target instanceof HTMLSelectElement ? event.target.value : undefined;
}

/**
 * The header switchers. Each one shows the value in effect in `ArnConfigService` and changes the
 * library's config, not the site: "Language" is the library's locale and texts.
 */
@Component({
  selector: 'docs-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly settings = inject(DocsSettingsService);

  protected readonly config = inject(ArnConfigService);
  protected readonly colorSchemes = COLOR_SCHEME_OPTIONS;
  protected readonly directions = DIRECTION_OPTIONS;
  protected readonly densities = DENSITY_OPTIONS;
  protected readonly locales = LOCALE_OPTIONS;

  protected onColorScheme(event: Event): void {
    const value = allowedValue(COLOR_SCHEME_OPTIONS, selectedValue(event));

    if (value !== undefined) {
      this.settings.setColorScheme(value);
    }
  }

  protected onDirection(event: Event): void {
    const value = allowedValue(DIRECTION_OPTIONS, selectedValue(event));

    if (value !== undefined) {
      this.settings.setDirection(value);
    }
  }

  protected onDensity(event: Event): void {
    const value = allowedValue(DENSITY_OPTIONS, selectedValue(event));

    if (value !== undefined) {
      this.settings.setDensity(value);
    }
  }

  protected onLocale(event: Event): void {
    const value = allowedValue(LOCALE_OPTIONS, selectedValue(event));

    if (value !== undefined) {
      this.settings.setLocale(value);
    }
  }
}
