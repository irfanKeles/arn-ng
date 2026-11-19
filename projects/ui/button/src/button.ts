import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { type ArnSize, injectArnConfig, ɵdevWarn } from '@arn-ng/ui/core';
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

  /** The consumer's own `tabindex` on a link, kept while it is disabled; `undefined` = none kept. */
  private keptTabindex: string | null | undefined;

  constructor() {
    if (!this.isButton) {
      const renderer = inject(Renderer2);

      /*
       * A disabled link must not navigate or reach the other click listeners. A host listener runs
       * too late: the template's (click) and RouterLink are registered on the element before it. A
       * capture listener on the target runs before the bubbling ones on the same element.
       */
      const cancel = (event: Event): void => {
        if (this.disabled()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      };

      this.host.addEventListener('click', cancel, { capture: true });
      inject(DestroyRef).onDestroy(() => {
        this.host.removeEventListener('click', cancel, { capture: true });
      });

      // A host binding would replace the consumer's tabindex; this keeps and restores it
      effect(() => {
        if (this.disabled()) {
          if (this.keptTabindex === undefined) {
            this.keptTabindex = this.host.getAttribute('tabindex');
          }
          renderer.setAttribute(this.host, 'tabindex', '-1');
        } else if (this.keptTabindex !== undefined) {
          if (this.keptTabindex === null) {
            renderer.removeAttribute(this.host, 'tabindex');
          } else {
            renderer.setAttribute(this.host, 'tabindex', this.keptTabindex);
          }
          this.keptTabindex = undefined;
        }
      });
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
