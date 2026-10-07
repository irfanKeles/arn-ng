import { Directionality } from '@angular/cdk/bidi';
import {
  booleanAttribute,
  Directive,
  ElementRef,
  inject,
  InjectionToken,
  Injector,
  input,
  Renderer2,
  type OnChanges,
  type OnInit,
  type SimpleChanges,
} from '@angular/core';
import { ARN_CONFIG_SCOPE, createScope } from './config.scope';
import type {
  ArnColorScheme,
  ArnDeepPartial,
  ArnDensity,
  ArnDirection,
  ArnFormsConfig,
  ArnSize,
} from './config.types';
import {
  ambientDirection,
  createSectionDirectionality,
  explicitDirection,
  type SignalDirectionality,
} from './direction';
import type { ArnMessages } from './messages';

/** The section's `Directionality`, typed; CDK finds the same object under `Directionality`. */
const ARN_SECTION_DIRECTIONALITY = new InjectionToken<SignalDirectionality>(
  'ARN_SECTION_DIRECTIONALITY',
);

/**
 * Config for a section of the template. Components inside take the given fields from here and the
 * rest from the parent `[arnConfig]` section or from `provideArn`. Sections can be nested.
 *
 * When given, `density` and `colorScheme` are reflected on its own element as `data-density` and
 * `.dark` / `.light` (these two work through CSS only), and an explicit `direction` (`ltr` /
 * `rtl`) as `dir`. The element is left alone otherwise.
 *
 * The section also provides CDK's `Directionality`, so CDK-based parts inside see its direction.
 *
 * @example
 * <div arnConfig size="sm" density="compact">…</div>
 * <div arnConfig direction="rtl">…</div>
 */
@Directive({
  selector: '[arnConfig]',
  providers: [
    {
      provide: ARN_CONFIG_SCOPE,
      useFactory: () =>
        createScope(inject(ArnConfigDirective), {
          ...inject(ARN_CONFIG_SCOPE, { skipSelf: true }),
          // The nearest Directionality, not the parent section: a CDK `Dir` in between counts too
          direction: ambientDirection(inject(Directionality, { skipSelf: true })),
        }),
    },
    {
      provide: ARN_SECTION_DIRECTIONALITY,
      useFactory: () =>
        createSectionDirectionality(
          inject(ARN_CONFIG_SCOPE).direction,
          inject(Directionality, { skipSelf: true }),
        ),
    },
    { provide: Directionality, useExisting: ARN_SECTION_DIRECTIONALITY },
  ],
  host: {
    '[attr.data-density]': 'density() ?? null',
    // `null` instead of `false`: when not given, a static class on the element stays in place
    '[class.dark]': 'colorScheme() === "dark" ? true : null',
    '[class.light]': 'colorScheme() === "light" ? true : null',
  },
})
export class ArnConfigDirective implements OnChanges, OnInit {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly injector = inject(Injector);
  private wroteDir = false;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['direction']) {
      this.writeDir();
    }
    this.syncDirectionality();
  }

  ngOnInit(): void {
    // Records the starting direction when no input is bound (ngOnChanges does not run then)
    this.syncDirectionality();
  }

  /**
   * Written through the renderer, not an `[attr.dir]` binding: a `null` binding would remove a
   * static `dir` attribute of the element. Only a `dir` written here is ever removed.
   */
  private writeDir(): void {
    const host = this.element.nativeElement;
    const direction = explicitDirection(this.direction());

    if (direction) {
      this.renderer.setAttribute(host, 'dir', direction);
      this.wroteDir = true;
    } else if (this.wroteDir) {
      this.renderer.removeAttribute(host, 'dir');
      this.wroteDir = false;
    }
  }

  // Resolved lazily: its factory needs this directive, so it cannot be injected in the constructor
  private syncDirectionality(): void {
    this.injector.get(ARN_SECTION_DIRECTIONALITY).sync();
  }
}
