/*
 * Public API Surface of @arn-ng/ui/core
 */

export { ArnConfigDirective } from './config/config.directive';
export type { ArnConfigRef } from './config/config.scope';
/**
 * Internal: shared by the library's entry points, not a supported API (it may change in any
 * release). The `ɵ` prefix marks it, as in Angular.
 */
export { devWarn as ɵdevWarn } from './config/dev-mode';
/** Internal, like ɵdevWarn: the disabled-link behavior shared by ArnButton and ArnBadge. */
export { disabledLink as ɵdisabledLink } from './a11y/disabled-link';
export { ArnConfigService } from './config/config.service';
export type {
  ArnColorScheme,
  ArnConfig,
  ArnDeepPartial,
  ArnDensity,
  ArnDirection,
  ArnFormErrorTrigger,
  ArnFormsConfig,
  ArnResolvedConfig,
  ArnRootConfig,
  ArnSize,
} from './config/config.types';
export { injectArnConfig } from './config/inject-arn-config';
// The per-component message types (dialog, toast, datePicker) stay internal until their
// components exist; a consumer reaches them as ArnMessages['dialog'] (decisions 2026-11).
export type { ArnCommonMessages, ArnMessages } from './config/messages';
export { provideArn } from './config/provide-arn';
export { ArnOverlayRef } from './overlay/overlay-ref';
export { ArnOverlayService } from './overlay/overlay.service';
export type {
  ArnOverlayAlign,
  ArnOverlayConfig,
  ArnOverlayLayer,
  ArnOverlayPreset,
  ArnOverlaySide,
  ArnOverlayState,
} from './overlay/overlay.types';
