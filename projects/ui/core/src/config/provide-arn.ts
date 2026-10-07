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
import { ROOT_DIRECTIONALITY_PROVIDERS } from './root-directionality';
import type { ArnRootConfig } from './config.types';

/**
 * Provides the application-wide config. Every field is optional; fields that are not given keep
 * the library default. Call it once in the root providers; for a section of the template use
 * `[arnConfig]`.
 *
 * Also replaces the application-wide CDK `Directionality` with one that follows `direction`, so
 * CDK-based parts see a direction changed through `ArnConfigService`.
 *
 * @example
 * bootstrapApplication(App, { providers: [provideArn({ size: 'sm', applyToDocument: true })] });
 */
export function provideArn(config: ArnRootConfig = {}): EnvironmentProviders {
  const { applyToDocument, ...rest } = config;
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: ARN_ROOT_CONFIG, useValue: sanitizeConfig(rest, 'provideArn') },
    ...ROOT_DIRECTIONALITY_PROVIDERS,
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
