import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideArn } from '@arn-ng/ui/core';

import { routes } from './app.routes';
import { DocsSettingsService } from './settings/docs-settings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Experimental in Angular 19; the docs app runs zoneless to exercise the library that way.
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideArn({ applyToDocument: true }),
    // Runs after provideArn's initializer and before the first render: no flash of the defaults.
    provideAppInitializer(() => {
      inject(DocsSettingsService).restore();
    }),
  ],
};
