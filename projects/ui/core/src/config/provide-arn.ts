import {
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { sanitizeConfig } from './config.merge';
import { ARN_ROOT_CONFIG } from './config.scope';
import { ArnConfigService } from './config.service';
import type { ArnRootConfig } from './config.types';

/**
 * Provides the application-wide config. Every field is optional; fields that are not given keep
 * the library default. Call it once in the root providers; for a section of the template use
 * `[arnConfig]`.
 *
 * @example
 * bootstrapApplication(App, { providers: [provideArn({ size: 'sm', applyToDocument: true })] });
 */
export function provideArn(config: ArnRootConfig = {}): EnvironmentProviders {
  const { applyToDocument, ...rest } = config;
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: ARN_ROOT_CONFIG, useValue: sanitizeConfig(rest, 'provideArn') },
  ];

  if (applyToDocument === true) {
    providers.push(
      provideEnvironmentInitializer(() => {
        inject(ArnConfigService).applyToDocument();
      }),
    );
  }

  return makeEnvironmentProviders(providers);
}
