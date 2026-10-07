import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { deepMerge, sanitizeConfig } from './config.merge';
import { ARN_CONFIG_SCOPE, ARN_ROOT_OVERRIDES, type ArnConfigRef } from './config.scope';
import type {
  ArnColorScheme,
  ArnConfig,
  ArnDeepPartial,
  ArnDensity,
  ArnDirection,
  ArnFormsConfig,
  ArnSize,
} from './config.types';
import { devWarn } from './dev-mode';
import { explicitDirection } from './direction';
import type { ArnMessages } from './messages';
import { ArnRootDirectionality } from './root-directionality';

/**
 * Application-wide config (the `provideArn` level): read-only signals and methods that change it
 * at runtime. A value given by an `[arnConfig]` section or a component input takes precedence.
 *
 * Never writes to the DOM on its own; `<html>` is updated only if `applyToDocument()` is called.
 */
@Injectable({ providedIn: 'root' })
export class ArnConfigService implements ArnConfigRef {
  private readonly document = inject(DOCUMENT);
  private readonly overrides = inject(ARN_ROOT_OVERRIDES);
  private readonly scope = inject(ARN_CONFIG_SCOPE);
  // Present only with `provideArn()`. Injected up front so it reads the document before we write.
  private readonly rootDirectionality = inject(ArnRootDirectionality, { optional: true });
  private applied = false;
  private wroteDir = false;

  readonly size = this.scope.size;
  readonly density = this.scope.density;
  readonly colorScheme = this.scope.colorScheme;
  /** The direction in effect application-wide; `auto` is resolved to the document's direction. */
  readonly direction = this.scope.direction;
  readonly ripple = this.scope.ripple;
  readonly locale = this.scope.locale;
  readonly messages = this.scope.messages;
  readonly forms = this.scope.forms;

  setSize(size: ArnSize): void {
    this.update({ size });
  }

  setDensity(density: ArnDensity): void {
    this.update({ density });
  }

  setColorScheme(colorScheme: ArnColorScheme): void {
    this.update({ colorScheme });
  }

  setDirection(direction: ArnDirection): void {
    this.update({ direction });
  }

  setRipple(ripple: boolean): void {
    this.update({ ripple });
  }

  setLocale(locale: string): void {
    this.update({ locale });
  }

  /** Deep-merges the given texts with the current application-wide texts. */
  setMessages(messages: ArnDeepPartial<ArnMessages>): void {
    this.update({ messages });
  }

  setForms(forms: ArnFormsConfig): void {
    this.update({ forms });
  }

  /** Changes several fields at once. `messages` and `forms` are deep-merged. */
  update(config: ArnConfig): void {
    const patch = sanitizeConfig(config, 'ArnConfigService');

    this.overrides.update((current) => deepMerge(current, patch));

    if (this.applied) {
      this.writeToDocument();
    }

    if (this.rootDirectionality) {
      this.rootDirectionality.sync();
    } else if (patch.direction !== undefined) {
      devWarn(
        'ArnConfigService: "direction" was set without provideArn(); sections and CDK-based parts will not follow it.',
      );
    }
  }

  /**
   * Writes the application-wide `colorScheme`, `density` and `direction` to the `<html>` element
   * and keeps them up to date on later changes. May be called more than once.
   *
   * Takes ownership of the `.dark` / `.light` classes and `data-density` on `<html>`.
   * Leaves the `dir` attribute alone while `direction` is `auto`.
   */
  applyToDocument(): void {
    this.applied = true;
    this.writeToDocument();
  }

  private writeToDocument(): void {
    const root = this.document.documentElement;
    const colorScheme = this.colorScheme();
    const direction = explicitDirection(this.overrides().direction);

    root.classList.toggle('dark', colorScheme === 'dark');
    root.classList.toggle('light', colorScheme === 'light');
    root.setAttribute('data-density', this.density());

    if (direction) {
      root.setAttribute('dir', direction);
      this.wroteDir = true;
    } else if (this.wroteDir) {
      root.removeAttribute('dir');
      this.wroteDir = false;
    }
  }
}
