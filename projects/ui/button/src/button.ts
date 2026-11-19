import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { type ArnSize, injectArnConfig, ɵdevWarn, ɵdisabledLink } from '@arn-ng/ui/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';
import type { ArnButtonVariant } from './button.types';

const BADGE = '[arnButtonBadge]';

/** Whether the element's own content (not the badge, not hidden parts) gives it a name. */
function hasAccessibleName(host: HTMLElement): boolean {
  for (const attribute of ['aria-label', 'aria-labelledby', 'title']) {
    if (host.getAttribute(attribute)?.trim()) {
      return true;
    }
  }

  const named = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? '').trim() !== '';
    }
    if (!(node instanceof Element) || node.matches(BADGE) || node.closest('[aria-hidden="true"]')) {
      return false;
    }
    if (node.getAttribute('aria-label')?.trim() || node.getAttribute('alt')?.trim()) {
      return true;
    }

    return Array.from(node.childNodes).some(named);
  };

  return Array.from(host.childNodes).some(named);
}

/**
 * Styles a native `<button>` or `<a>` as a button. The element stays the element: `type`, `form`,
 * `href`, `aria-*` and the rest work as they always do. The styles come with the component; the
 * tokens come from `@arn-ng/ui/theme.css`.
 *
 * Content with the `arnButtonBadge` attribute is placed on the corner of the button.
 *
 * @example
 * <button arnButton type="button">Save</button>
 * <button arnButton variant="outline" size="sm" type="button">Cancel</button>
 * <a arnButton variant="link" href="/docs">Read the docs</a>
 * <button arnButton iconOnly round aria-label="Close" type="button"><svg …></svg></button>
 */
@Component({
  selector: 'button[arnButton], a[arnButton]',
  template: '<ng-content /><ng-content select="[arnButtonBadge]" />',
  styleUrl: './button.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: ArnRippleDirective,
      inputs: [
        'arnRipple: ripple',
        'arnRippleColor: rippleColor',
        'arnRippleCentered: rippleCentered',
      ],
    },
  ],
  host: {
    class: 'arn-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'resolvedSize()',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
    '[attr.data-round]': 'round() ? "" : null',
    '[attr.disabled]': 'isButton && disabled() ? "" : null',
    '[attr.aria-disabled]': '!isButton && disabled() ? "true" : null',
  },
})
export class ArnButton {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** `<button>` (native `disabled`) or `<a>` (`aria-disabled`). */
  protected readonly isButton = this.host.nodeName.toLowerCase() === 'button';

  /** The look of the button. */
  readonly variant = input<ArnButtonVariant>('default');

  /** Height, padding, font and icon size. Not given, it follows the `size` config (default `md`). */
  readonly size = input<ArnSize>();

  /** A square button for a single icon. It needs a name: `aria-label` or `aria-labelledby`. */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  /** Fully round corners: a circle with `iconOnly`, a pill with a label. */
  readonly round = input(false, { transform: booleanAttribute });

  /**
   * Turns the button off. On `<button>` it is the native `disabled`; on `<a>` it sets
   * `aria-disabled="true"`, takes the link out of the tab order and cancels its clicks.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly resolvedSize = injectArnConfig('size', this.size);

  constructor() {
    // A disabled link: clicks cancelled, out of the tab order, the consumer's tabindex kept
    if (!this.isButton) {
      ɵdisabledLink(this.host, this.disabled);
    }

    // Once the projected content is there; the name is a browser question (nothing on the server)
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      afterNextRender(() => {
        if (this.iconOnly() && !hasAccessibleName(this.host)) {
          ɵdevWarn(
            'ArnButton: an icon-only button has no accessible name. Give it an aria-label (or aria-labelledby).',
          );
        }
      });
    }
  }
}
