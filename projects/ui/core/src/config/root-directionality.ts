import { Directionality } from '@angular/cdk/bidi';
import { computed, inject, Injectable, InjectionToken, type OnDestroy } from '@angular/core';
import { ARN_ROOT_OVERRIDES } from './config.scope';
import { explicitDirection, SignalDirectionality } from './direction';

/** CDK's own `Directionality`: the direction of the document (`<html>` / `<body>` `dir`). */
export const ARN_DOCUMENT_DIRECTIONALITY = new InjectionToken<Directionality>(
  'ARN_DOCUMENT_DIRECTIONALITY',
);

/**
 * The application-wide `Directionality` that `provideArn()` puts in place of CDK's: the explicit
 * `direction` of the root config, else the direction of the document. Unlike CDK's it follows
 * `ArnConfigService` at runtime, so CDK-based parts (overlays etc.) see the change too.
 */
@Injectable()
export class ArnRootDirectionality extends SignalDirectionality implements OnDestroy {
  constructor() {
    const overrides = inject(ARN_ROOT_OVERRIDES);
    const documentDirectionality = inject(ARN_DOCUMENT_DIRECTIONALITY);

    super(computed(() => explicitDirection(overrides().direction) ?? documentDirectionality.value));
    this.sync();
  }

  ngOnDestroy(): void {
    this.change.complete();
  }
}

/** Providers that make `ArnRootDirectionality` the application-wide `Directionality`. */
export const ROOT_DIRECTIONALITY_PROVIDERS = [
  { provide: ARN_DOCUMENT_DIRECTIONALITY, useClass: Directionality },
  ArnRootDirectionality,
  { provide: Directionality, useExisting: ArnRootDirectionality },
];
