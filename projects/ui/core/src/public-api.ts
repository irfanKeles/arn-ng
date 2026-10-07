/*
 * Public API Surface of @arn-ng/ui/core
 */

export { ArnConfigDirective } from './config/config.directive';
export type { ArnConfigRef } from './config/config.scope';
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
export type {
  ArnCommonMessages,
  ArnDatePickerMessages,
  ArnDialogMessages,
  ArnMessages,
  ArnToastMessages,
} from './config/messages';
export { provideArn } from './config/provide-arn';
