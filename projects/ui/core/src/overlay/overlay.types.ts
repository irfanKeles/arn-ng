import type { ElementRef, Injector, ViewContainerRef } from '@angular/core';

/**
 * Stacking layer of an overlay, lowest to highest. Each maps to a `--arn-z-<layer>` token in
 * `theme.css`. `toast` has no preset yet; it is only a layer name.
 */
export type ArnOverlayLayer = 'dropdown' | 'popover' | 'modal' | 'toast' | 'tooltip';

/** Ready-made behavior of an overlay: position, scrolling, backdrop, dismissal and focus. */
export type ArnOverlayPreset = 'modal' | 'popover' | 'dropdown' | 'tooltip';

/**
 * Lifecycle of an overlay. While `closing` the panel is still in the DOM with
 * `data-state="closed"` and its exit animation runs.
 */
export type ArnOverlayState = 'open' | 'closing' | 'closed';

/** Side of the origin the overlay is placed on. `start` / `end` follow the text direction. */
export type ArnOverlaySide = 'top' | 'bottom' | 'start' | 'end';

/** Alignment of the overlay along the chosen side. `start` / `end` follow the text direction. */
export type ArnOverlayAlign = 'start' | 'center' | 'end';

/** Options of `ArnOverlayService.open()`. */
export interface ArnOverlayConfig {
  /** Behavior of the overlay. */
  preset: ArnOverlayPreset;
  /**
   * Injector of the component that opens the overlay (`inject(Injector)`). The content is created
   * with it, so `injectArnConfig()` and CDK's `Directionality` read the opener's values inside,
   * and the overlay is removed when the opener is destroyed.
   */
  injector: Injector;
  /** Stacking layer. Default: the layer named after the preset. */
  layer?: ArnOverlayLayer;
  /**
   * Element the overlay is connected to. Required for every preset except `modal`. The color
   * scheme and density in effect on it are copied to the panel.
   */
  origin?: ElementRef<HTMLElement> | HTMLElement;
  /** Required when the content is a `TemplateRef`. */
  viewContainerRef?: ViewContainerRef;
  /** Preferred side. Default: `bottom` (`top` for `tooltip`). Flips when there is no room. */
  side?: ArnOverlaySide;
  /** Preferred alignment. Default: `center` (`start` for `dropdown`). */
  align?: ArnOverlayAlign;
  /** Gap between the origin and the overlay in px. Default: 4. */
  offset?: number;
  /** Whether Escape closes the overlay. Default: `true` (`false` for `tooltip`). */
  closeOnEscape?: boolean;
  /**
   * Whether a click outside closes the overlay; for `modal`, a click on the backdrop.
   * Default: `true` (`false` for `tooltip`).
   */
  closeOnOutsideClick?: boolean;
  /**
   * Whether focus moves into the overlay when it opens. Default: `true` for `modal` and `popover`,
   * `false` for `dropdown` and `tooltip`.
   */
  autoFocus?: boolean;
  /**
   * Whether focus returns to the previously focused element on close, when it is still inside the
   * overlay. Default: `true` (`false` for `tooltip`).
   */
  restoreFocus?: boolean;
  /** Extra class(es) for the panel element. */
  panelClass?: string | string[];
}
