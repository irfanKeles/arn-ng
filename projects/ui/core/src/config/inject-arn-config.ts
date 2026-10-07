import { assertInInjectionContext, computed, inject, type Signal } from '@angular/core';
import { ARN_CONFIG_SCOPE, type ArnConfigRef } from './config.scope';
import type { ArnResolvedConfig } from './config.types';

/**
 * Returns the config in effect here (nearest `[arnConfig]` section > `provideArn` > default).
 * `direction` is always `ltr` or `rtl`: `auto` is resolved from the nearest `Directionality`.
 * Must be called in an injection context.
 */
export function injectArnConfig(): ArnConfigRef;
/**
 * Combines the component's own input with the hierarchy: the value of `own()` when it gives one,
 * and the config in effect here when it is `undefined`.
 *
 * @example
 * readonly size = input<ArnSize>();
 * protected readonly resolvedSize = injectArnConfig('size', this.size);
 */
export function injectArnConfig<
  K extends 'size' | 'density' | 'colorScheme' | 'direction' | 'ripple' | 'locale',
>(key: K, own: () => ArnResolvedConfig[K] | undefined): Signal<ArnResolvedConfig[K]>;
export function injectArnConfig<K extends keyof ArnResolvedConfig>(
  key?: K,
  own?: () => ArnResolvedConfig[K] | undefined,
): ArnConfigRef | Signal<ArnResolvedConfig[K]> {
  assertInInjectionContext(injectArnConfig);

  const scope: ArnConfigRef = inject(ARN_CONFIG_SCOPE);

  if (key === undefined || own === undefined) {
    return scope;
  }

  const inherited = scope[key];

  return computed(() => own() ?? inherited());
}
