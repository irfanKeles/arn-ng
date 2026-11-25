import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  numberAttribute,
  PLATFORM_ID,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { ɵdevWarn, ɵdisabledLink } from '@arn-ng/ui/core';
import type { ArnBadgeVariant } from './badge.types';

/** The default `max`: a larger count shows as "99+". */
const DEFAULT_MAX = 99;

/** `count="3"`, `[count]="3"`; not given (or empty) = no count. */
function countAttribute(value: unknown): number | undefined {
  return value === undefined || value === null || value === '' ? undefined : numberAttribute(value);
}

const isWholeNumber = (value: number, min: number): boolean =>
  Number.isInteger(value) && value >= min;

/**
 * A small label, a count or a dot. `<arn-badge>` is static text; on an `<a>` (`a[arnBadge]`) it is
 * a link with a hover and a focus ring. The tokens come from `@arn-ng/ui/theme.css`.
 *
 * With the `arnButtonBadge` attribute it sits on the corner of an `ArnButton` and is hidden from
 * assistive technology: put the count in the button's name.
 *
 * @example
 * <arn-badge variant="secondary">New</arn-badge>
 * <arn-badge [count]="unread()" />
 * <arn-badge dot label="Online" />
 * <a arnBadge href="/changelog">v2</a>
 * <button arnButton iconOnly aria-label="Notifications, 3 unread" type="button">
 *   <svg …></svg><arn-badge arnButtonBadge [count]="3" />
 * </button>
 */
@Component({
  selector: 'arn-badge, a[arnBadge]',
  templateUrl: './badge.html',
  styleUrl: './badge.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'arn-badge',
    '[attr.data-variant]': 'variant()',
    '[attr.data-dot]': 'mode() === "dot" ? "" : null',
    '[attr.data-count]': 'mode() === "count" ? "" : null',
    '[attr.data-hidden]': 'hidden() ? "" : null',
    '[attr.data-loading]': 'spinning() ? "" : null',
    '[attr.aria-busy]': 'spinning() ? "true" : null',
    '[attr.aria-disabled]': 'isLink && disabled() ? "true" : null',
  },
})
export class ArnBadge {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** `a[arnBadge]`: a link, the only face with hover, focus and `disabled`. */
  protected readonly isLink = this.host.nodeName.toLowerCase() === 'a';

  /** On the corner of an `ArnButton`: the button's name carries the count. */
  private readonly corner = this.host.hasAttribute('arnButtonBadge');

  /** The look of the badge. */
  readonly variant = input<ArnBadgeVariant>('default');

  /**
   * A count shown instead of the content. Hidden while 0 (see `showZero`); above `max` it shows as
   * `max` followed by "+". A negative or fractional count is hidden (and warned about).
   */
  readonly count = input<number | undefined, unknown>(undefined, { transform: countAttribute });

  /** The largest count shown as is. A whole number of 1 or more; otherwise 99. */
  readonly max = input(DEFAULT_MAX, { transform: numberAttribute });

  /** Shows a count of 0 instead of hiding the badge. */
  readonly showZero = input(false, { transform: booleanAttribute });

  /** A small dot without text; neither the content nor the count shows. Give it a `label`. */
  readonly dot = input(false, { transform: booleanAttribute });

  /** The name of a dot for assistive technology, as visually hidden text. Used in dot mode only. */
  readonly label = input<string>();

  /** A spinner in place of the start icon; the text stays. Sets `aria-busy`. Not on a dot. */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Turns an `a[arnBadge]` off: `aria-disabled="true"`, out of the tab order, clicks cancelled.
   * On `<arn-badge>` it has no effect.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly mode = computed<'dot' | 'count' | 'content'>(() => {
    if (this.dot()) {
      return 'dot';
    }

    return this.count() === undefined ? 'content' : 'count';
  });

  private readonly validMax = computed(() => {
    const max = this.max();

    return isWholeNumber(max, 1) ? max : DEFAULT_MAX;
  });

  /** The count, or `null` when it is not a whole number of 0 or more. */
  private readonly validCount = computed(() => {
    const count = this.count();

    return count !== undefined && isWholeNumber(count, 0) ? count : null;
  });

  protected readonly text = computed(() => {
    const count = this.validCount();

    if (count === null) {
      return '';
    }

    return count > this.validMax() ? `${String(this.validMax())}+` : String(count);
  });

  protected readonly hidden = computed(
    () =>
      this.mode() === 'count' &&
      (this.validCount() === null || (this.validCount() === 0 && !this.showZero())),
  );

  protected readonly spinning = computed(() => this.loading() && this.mode() !== 'dot');

  constructor() {
    // Set once, not bound: a binding would also remove the consumer's own aria-hidden
    if (this.corner) {
      inject(Renderer2).setAttribute(this.host, 'aria-hidden', 'true');
    }

    if (this.isLink) {
      ɵdisabledLink(this.host, this.disabled);
    }

    // The first values only; nothing on the server
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      afterNextRender(() => {
        this.warnAboutInputs();
      });
    }
  }

  private warnAboutInputs(): void {
    const count = this.count();

    if (this.mode() === 'count' && count !== undefined && !isWholeNumber(count, 0)) {
      ɵdevWarn('ArnBadge: count must be a whole number of 0 or more; the badge is hidden.');
    }
    if (!isWholeNumber(this.max(), 1)) {
      ɵdevWarn(
        `ArnBadge: max must be a whole number of 1 or more; ${String(DEFAULT_MAX)} is used.`,
      );
    }
    if (this.dot() && !this.label()?.trim() && !this.corner) {
      ɵdevWarn('ArnBadge: a dot badge has no accessible name. Give it a label.');
    }
    if (this.dot() && this.loading()) {
      ɵdevWarn('ArnBadge: loading is ignored on a dot badge.');
    }
    if (!this.isLink && this.disabled()) {
      ɵdevWarn('ArnBadge: disabled applies to a[arnBadge] only; <arn-badge> is not interactive.');
    }
  }
}
