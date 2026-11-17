import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideArn } from '@arn-ng/ui/core';

import { routes } from './app.routes';
import { DocsSettingsService } from './settings/docs-settings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Stable since Angular 20.2; the docs app runs zoneless to exercise the library that way.
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideArn({ applyToDocument: true }),
    // Runs after provideArn's initializer and before the first render: no flash of the defaults.
    provideAppInitializer(() => {
      inject(DocsSettingsService).restore();
    }),
  ],
};
