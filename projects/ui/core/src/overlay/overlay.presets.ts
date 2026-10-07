import type { ConnectedPosition } from '@angular/cdk/overlay';
import type {
  ArnOverlayAlign,
  ArnOverlayLayer,
  ArnOverlayPreset,
  ArnOverlaySide,
} from './overlay.types';

/** What a preset fixes (`connected`, `backdrop`, `trapFocus`) and what it only defaults. */
export interface OverlayPreset {
  readonly layer: ArnOverlayLayer;
  /** Positioned next to an origin element; otherwise centered in the viewport. */
  readonly connected: boolean;
  readonly backdrop: boolean;
  readonly trapFocus: boolean;
  readonly side: ArnOverlaySide;
  readonly align: ArnOverlayAlign;
  readonly closeOnEscape: boolean;
  readonly closeOnOutsideClick: boolean;
  readonly autoFocus: boolean;
  readonly restoreFocus: boolean;
}

export const OVERLAY_PRESETS: Record<ArnOverlayPreset, OverlayPreset> = {
  modal: {
    layer: 'modal',
    connected: false,
    backdrop: true,
    trapFocus: true,
    side: 'bottom',
    align: 'center',
    closeOnEscape: true,
    closeOnOutsideClick: true,
    autoFocus: true,
    restoreFocus: true,
  },
  popover: {
    layer: 'popover',
    connected: true,
    backdrop: false,
    trapFocus: false,
    side: 'bottom',
    align: 'center',
    closeOnEscape: true,
    closeOnOutsideClick: true,
    autoFocus: true,
    restoreFocus: true,
  },
  dropdown: {
    layer: 'dropdown',
    connected: true,
    backdrop: false,
    trapFocus: false,
    side: 'bottom',
    align: 'start',
    closeOnEscape: true,
    closeOnOutsideClick: true,
    // The component decides: a select keeps focus on its trigger, a menu moves it inside
    autoFocus: false,
    restoreFocus: true,
  },
  tooltip: {
    layer: 'tooltip',
    connected: true,
    backdrop: false,
    trapFocus: false,
    side: 'top',
    align: 'center',
    // No keydown or outside-click subscription, so overlays below still get the events
    closeOnEscape: false,
    closeOnOutsideClick: false,
    autoFocus: false,
    restoreFocus: false,
  },
};

/** Gap between the origin and the overlay in px (shadcn `sideOffset`). */
export const DEFAULT_OFFSET = 4;

/** Minimum distance between a connected overlay and the viewport edge in px. */
export const VIEWPORT_MARGIN = 8;

/** A placement: the side of the origin and the alignment along it. */
export interface OverlayPlacement {
  readonly side: ArnOverlaySide;
  readonly align: ArnOverlayAlign;
}

const OPPOSITE_SIDE: Record<ArnOverlaySide, ArnOverlaySide> = {
  top: 'bottom',
  bottom: 'top',
  start: 'end',
  end: 'start',
};

const OPPOSITE_ALIGN: Record<ArnOverlayAlign, ArnOverlayAlign> = {
  start: 'end',
  center: 'center',
  end: 'start',
};

const VERTICAL_ALIGN = { start: 'top', center: 'center', end: 'bottom' } as const;

function toPosition(
  { side, align }: OverlayPlacement,
  offset: number,
  rtl: boolean,
): ConnectedPosition {
  if (side === 'top' || side === 'bottom') {
    return {
      originX: align,
      overlayX: align,
      originY: side,
      overlayY: OPPOSITE_SIDE[side] as 'top' | 'bottom',
      offsetY: side === 'bottom' ? offset : -offset,
    };
  }

  // CDK mirrors `start` / `end` in RTL but not the sign of `offsetX`
  const away = (side === 'end') !== rtl ? offset : -offset;

  return {
    originX: side,
    overlayX: OPPOSITE_SIDE[side] as 'start' | 'end',
    originY: VERTICAL_ALIGN[align],
    overlayY: VERTICAL_ALIGN[align],
    offsetX: away,
  };
}

/**
 * The positions CDK tries in order: the requested placement, the opposite side, then both with
 * the alignment flipped. Each position maps back to its placement (for `data-side` / `data-align`).
 */
export function connectedPositions(
  side: ArnOverlaySide,
  align: ArnOverlayAlign,
  offset: number,
  rtl: boolean,
): Map<ConnectedPosition, OverlayPlacement> {
  const placements: OverlayPlacement[] = [
    { side, align },
    { side: OPPOSITE_SIDE[side], align },
  ];

  if (align !== 'center') {
    placements.push(
      { side, align: OPPOSITE_ALIGN[align] },
      { side: OPPOSITE_SIDE[side], align: OPPOSITE_ALIGN[align] },
    );
  }

  return new Map(placements.map((placement) => [toPosition(placement, offset, rtl), placement]));
}
