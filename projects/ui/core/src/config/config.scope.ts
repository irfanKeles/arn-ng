import { Directionality } from '@angular/cdk/bidi';
import {
  computed,
  inject,
  InjectionToken,
  LOCALE_ID,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { DEFAULT_CONFIG } from './config.defaults';
import { deepMerge } from './config.merge';
import type { ArnConfig, ArnDeepPartial, ArnResolvedConfig } from './config.types';
import { ambientDirection, explicitDirection } from './direction';
import { resolveMessages, type ArnMessages } from './messages';

/** Read-only signals of the resolved config: each field gives the value in effect at its level. */
export type ArnConfigRef = {
  readonly [K in keyof ArnResolvedConfig]: Signal<ArnResolvedConfig[K]>;
};

/**
 * A node of the hierarchy (the root or an `[arnConfig]` section). `messages` is the resolved form;
 * child nodes inherit `messageOverrides`, not the resolved messages, so that a section which only
 * changes `locale` does not inherit its parent's `Intl`-generated names.
 */
export interface ConfigScope extends ArnConfigRef {
  readonly messageOverrides: Signal<ArnDeepPartial<ArnMessages>>;
}

/** A node's own (partial) values: a field that is not given returns `undefined`. */
type ScopeInput = { readonly [K in keyof ArnConfig]-?: () => ArnConfig[K] };

type ScopeParent = {
  readonly [K in Exclude<keyof ArnResolvedConfig, 'messages'>]: () => ArnResolvedConfig[K];
} & { readonly messageOverrides: () => ArnDeepPartial<ArnMessages> };

/**
 * The single place where precedence is applied: the node's own value, else its parent's.
 * For `direction` the parent is the nearest `Directionality`; `auto` counts as not given.
 */
export function createScope(own: ScopeInput, parent: ScopeParent): ConfigScope {
  const locale = computed(() => own.locale() ?? parent.locale());
  const messageOverrides = computed(() => deepMerge(parent.messageOverrides(), own.messages()));

  return {
    size: computed(() => own.size() ?? parent.size()),
    density: computed(() => own.density() ?? parent.density()),
    colorScheme: computed(() => own.colorScheme() ?? parent.colorScheme()),
    direction: computed(() => explicitDirection(own.direction()) ?? parent.direction()),
    ripple: computed(() => own.ripple() ?? parent.ripple()),
    locale,
    messageOverrides,
    messages: computed(() => resolveMessages(locale(), messageOverrides())),
    forms: computed(() => deepMerge<ArnResolvedConfig['forms']>(parent.forms(), own.forms())),
  };
}

/** The initial config given by `provideArn()`. */
export const ARN_ROOT_CONFIG = new InjectionToken<ArnConfig>('ARN_ROOT_CONFIG');

/** Application-wide config; `ArnConfigService` changes it at runtime. */
export const ARN_ROOT_OVERRIDES = new InjectionToken<WritableSignal<ArnConfig>>(
  'ARN_ROOT_OVERRIDES',
  {
    providedIn: 'root',
    factory: () => signal(inject(ARN_ROOT_CONFIG, { optional: true }) ?? {}),
  },
);

/**
 * The nearest node. At the root it is `provideArn` merged over the defaults (it exists even when
 * `provideArn` is not called; `locale` then comes from `LOCALE_ID` and `direction` from the
 * application-wide `Directionality`); `[arnConfig]` provides it again on its own element.
 */
export const ARN_CONFIG_SCOPE = new InjectionToken<ConfigScope>('ARN_CONFIG_SCOPE', {
  providedIn: 'root',
  factory: () => {
    const overrides = inject(ARN_ROOT_OVERRIDES);
    const defaultLocale = inject(LOCALE_ID);
    const empty: ArnDeepPartial<ArnMessages> = {};

    return createScope(
      {
        size: () => overrides().size,
        density: () => overrides().density,
        colorScheme: () => overrides().colorScheme,
        direction: () => overrides().direction,
        ripple: () => overrides().ripple,
        locale: () => overrides().locale,
        messages: () => overrides().messages,
        forms: () => overrides().forms,
      },
      {
        size: () => DEFAULT_CONFIG.size,
        density: () => DEFAULT_CONFIG.density,
        colorScheme: () => DEFAULT_CONFIG.colorScheme,
        direction: ambientDirection(inject(Directionality)),
        ripple: () => DEFAULT_CONFIG.ripple,
        locale: () => defaultLocale,
        messageOverrides: () => empty,
        forms: () => DEFAULT_CONFIG.forms,
      },
    );
  },
});
