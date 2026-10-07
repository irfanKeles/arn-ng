import { booleanAttribute, Directive, inject, input } from '@angular/core';
import { ARN_CONFIG_SCOPE, createScope } from './config.scope';
import type {
  ArnColorScheme,
  ArnDeepPartial,
  ArnDensity,
  ArnDirection,
  ArnFormsConfig,
  ArnSize,
} from './config.types';
import type { ArnMessages } from './messages';

/**
 * Config for a section of the template. Components inside take the given fields from here and the
 * rest from the parent `[arnConfig]` section or from `provideArn`. Sections can be nested.
 *
 * When given, `density` and `colorScheme` are reflected on its own element as `data-density` and
 * `.dark` / `.light` (these two work through CSS only). The element is left alone otherwise.
 *
 * @example
 * <div arnConfig size="sm" density="compact">…</div>
 */
@Directive({
  selector: '[arnConfig]',
  providers: [
    {
      provide: ARN_CONFIG_SCOPE,
      useFactory: () =>
        createScope(inject(ArnConfigDirective), inject(ARN_CONFIG_SCOPE, { skipSelf: true })),
    },
  ],
  host: {
    '[attr.data-density]': 'density() ?? null',
    // `null` instead of `false`: when not given, a static class on the element stays in place
    '[class.dark]': 'colorScheme() === "dark" ? true : null',
    '[class.light]': 'colorScheme() === "light" ? true : null',
  },
})
export class ArnConfigDirective {
  readonly size = input<ArnSize>();
  readonly density = input<ArnDensity>();
  readonly colorScheme = input<ArnColorScheme>();
  readonly direction = input<ArnDirection>();
  readonly ripple = input(undefined, {
    // `booleanAttribute(undefined)` gives false; "not given" must fall through to the parent
    transform: (value: unknown): boolean | undefined =>
      value === undefined || value === null ? undefined : booleanAttribute(value),
  });
  readonly locale = input<string>();
  readonly messages = input<ArnDeepPartial<ArnMessages>>();
  readonly forms = input<ArnFormsConfig>();
}
