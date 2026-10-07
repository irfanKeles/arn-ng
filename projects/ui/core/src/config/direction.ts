import type { Directionality } from '@angular/cdk/bidi';
import { computed, DestroyRef, EventEmitter, inject, signal, type Signal } from '@angular/core';
import type { ArnDirection, ArnResolvedConfig } from './config.types';

/** A direction with `auto` resolved. */
export type ResolvedDirection = ArnResolvedConfig['direction'];

/** `ltr` / `rtl` when given explicitly; `undefined` for `auto` and for "not given". */
export function explicitDirection(
  direction: ArnDirection | undefined,
): ResolvedDirection | undefined {
  return direction === 'ltr' || direction === 'rtl' ? direction : undefined;
}

/**
 * The value of a `Directionality` as a signal. CDK 20+ (and our own nodes) expose `valueSignal`;
 * CDK 19 only has `value` and `change`, so the value is re-read whenever `change` emits.
 * Must be called in an injection context.
 */
export function ambientDirection(directionality: Directionality): Signal<ResolvedDirection> {
  const { valueSignal } = directionality as { valueSignal?: Signal<ResolvedDirection> };

  if (typeof valueSignal === 'function') {
    return valueSignal;
  }

  const version = signal(0);
  const subscription = directionality.change.subscribe(() => {
    version.update((current) => current + 1);
  });
  inject(DestroyRef).onDestroy(() => {
    subscription.unsubscribe();
  });

  return computed(() => {
    version();
    return directionality.value;
  });
}

/**
 * The shape CDK expects from a `Directionality` (`value`, `change`, and `valueSignal` from CDK 20
 * on), driven by a signal. `sync()` emits `change` when the value differs from the last one seen;
 * the first call only records the value.
 */
export class SignalDirectionality {
  readonly change = new EventEmitter<ResolvedDirection>();
  private seen: ResolvedDirection | undefined;

  constructor(readonly valueSignal: Signal<ResolvedDirection>) {}

  get value(): ResolvedDirection {
    return this.valueSignal();
  }

  sync(): void {
    const next = this.valueSignal();
    const previous = this.seen;

    this.seen = next;

    if (previous !== undefined && previous !== next) {
      this.change.emit(next);
    }
  }
}

/**
 * The `Directionality` of an `[arnConfig]` section: follows the section's resolved direction and
 * re-emits when the parent's direction changes. Must be called in an injection context.
 */
export function createSectionDirectionality(
  direction: Signal<ResolvedDirection>,
  parent: Directionality,
): SignalDirectionality {
  const section = new SignalDirectionality(direction);
  const subscription = parent.change.subscribe(() => {
    section.sync();
  });

  inject(DestroyRef).onDestroy(() => {
    subscription.unsubscribe();
    section.change.complete();
  });

  return section;
}
