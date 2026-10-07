import { FocusTrapFactory } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import {
  Overlay,
  type FlexibleConnectedPositionStrategy,
  type OverlayRef,
  type PositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  ElementRef,
  inject,
  Injectable,
  Injector,
  PLATFORM_ID,
  TemplateRef,
  type Type,
  type ViewContainerRef,
} from '@angular/core';
import { devWarn } from '../config/dev-mode';
import { ArnOverlayRef, OverlayRefImpl } from './overlay-ref';
import { activeElement, applyInheritedSettings, HOST_CLASS, parentZIndex } from './overlay.inherit';
import { ARN_REDUCED_MOTION } from './overlay.motion';
import {
  connectedPositions,
  DEFAULT_OFFSET,
  OVERLAY_PRESETS,
  VIEWPORT_MARGIN,
  type OverlayPlacement,
  type OverlayPreset,
} from './overlay.presets';
import type { ArnOverlayConfig } from './overlay.types';

const MISSING_VIEW_CONTAINER =
  '[@arn-ng/ui] ArnOverlayService: template content needs "viewContainerRef".';

/** Something that can be unsubscribed; keeps rxjs types out of this file. */
interface Unsubscribable {
  unsubscribe(): void;
}

/** A connected position strategy and how to rebuild its positions when the direction changes. */
interface ConnectedPositioning {
  readonly strategy: FlexibleConnectedPositionStrategy;
  /** Builds the position list for the current direction and hands it to the strategy. */
  update(): void;
  placementOf(position: object): OverlayPlacement | undefined;
}

/**
 * Opens overlays (dropdown, popover, dialog, tooltip…) on top of CDK Overlay. Every overlay of
 * the library goes through here, so they share the stacking layers (`--arn-z-*`), inherit the
 * opener's direction, color scheme and density, and close the same way.
 *
 * The panel carries `data-state="open" | "closed"` and, when connected to an origin, `data-side`
 * and `data-align`; components hang their animations on these.
 *
 * @example
 * const ref = this.overlay.open<string>(this.panel(), {
 *   preset: 'popover',
 *   injector: this.injector,
 *   origin: this.trigger(),
 *   viewContainerRef: this.viewContainerRef,
 * });
 * const result = await ref.closed;
 */
@Injectable({ providedIn: 'root' })
export class ArnOverlayService {
  private readonly overlay = inject(Overlay);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly focusTraps = inject(FocusTrapFactory);
  private readonly reducedMotion = inject(ARN_REDUCED_MOTION);

  /**
   * Opens `content` in an overlay.
   *
   * @param content A template (needs `config.viewContainerRef`) or a component class. It can
   * inject `ArnOverlayRef` to close itself.
   */
  open<R = unknown>(
    content: TemplateRef<unknown> | Type<unknown>,
    config: ArnOverlayConfig,
  ): ArnOverlayRef<R> {
    const preset = OVERLAY_PRESETS[config.preset];
    const layer = config.layer ?? preset.layer;
    const origin =
      config.origin instanceof ElementRef ? config.origin.nativeElement : config.origin;

    if (preset.connected && !origin) {
      throw new Error(`[@arn-ng/ui] ArnOverlayService: preset "${config.preset}" needs "origin".`);
    }

    // Before anything is added to the DOM
    if (content instanceof TemplateRef && !config.viewContainerRef) {
      throw new Error(MISSING_VIEW_CONTAINER);
    }

    warnAboutUnusedOptions(config, preset);

    const directionality = config.injector.get(Directionality);
    const positioning =
      preset.connected && origin
        ? this.connectedPositioning(origin, config, preset, directionality)
        : undefined;
    const positionStrategy: PositionStrategy =
      positioning?.strategy ??
      this.overlay.position().global().centerHorizontally().centerVertically();

    const overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: preset.connected
        ? this.overlay.scrollStrategies.reposition()
        : this.overlay.scrollStrategies.block(),
      hasBackdrop: preset.backdrop,
      // The backdrop color becomes a token with the dialog; until then CDK's own applies
      backdropClass: [
        'arn-overlay-backdrop',
        `arn-overlay-backdrop-${layer}`,
        'cdk-overlay-dark-backdrop',
      ],
      panelClass: ['arn-overlay-pane', `arn-overlay-pane-${layer}`],
      direction: directionality,
      disposeOnNavigation: true,
    });
    const host = overlayRef.hostElement;
    const pane = overlayRef.overlayElement;
    const autoFocus = config.autoFocus ?? preset.autoFocus;
    // Where the settings are read from: the origin, else the element of the opening component
    const source =
      origin ?? config.injector.get<ElementRef<Element> | null>(ElementRef, null)?.nativeElement;
    const previouslyFocused = this.isBrowser ? activeElement(this.document) : null;

    host.classList.add(HOST_CLASS, `${HOST_CLASS}-${layer}`);
    pane.setAttribute('data-state', 'open');

    if (config.panelClass) {
      overlayRef.addPanelClass(config.panelClass);
    }

    if (autoFocus) {
      // Focus target when the content has nothing tabbable
      pane.setAttribute('tabindex', '-1');
    }

    if (source) {
      applyInheritedSettings(source, pane);
    }

    if (positioning) {
      setPlacement(pane, {
        side: config.side ?? preset.side,
        align: config.align ?? preset.align,
      });
    }

    const ref = new OverlayRefImpl<R>(overlayRef, this.reducedMotion);
    const injector = Injector.create({
      parent: config.injector,
      providers: [{ provide: ArnOverlayRef, useValue: ref }],
    });

    overlayRef.attach(createPortal(content, config.viewContainerRef, injector));
    overlayRef.backdropElement?.setAttribute('data-state', 'open');

    if (this.isBrowser && source) {
      this.raiseAboveParent(source, overlayRef);
    }

    const interactions = this.listenForDismissal(overlayRef, ref, config, preset, origin);
    const tracking: Unsubscribable[] = [
      // CDK took the overlay away by itself (navigation, the template's view was destroyed)
      overlayRef.detachments().subscribe(() => {
        ref.destroy();
      }),
      directionality.change.subscribe(() => {
        overlayRef.setDirection(directionality);
        positioning?.update();
        overlayRef.updatePosition();
      }),
    ];

    if (positioning) {
      tracking.push(
        positioning.strategy.positionChanges.subscribe((change) => {
          const placement = positioning.placementOf(change.connectionPair);

          if (placement) {
            setPlacement(pane, placement);
          }
        }),
      );
    }

    const focusTrap =
      this.isBrowser && (preset.trapFocus || autoFocus) ? this.focusTraps.create(pane) : undefined;

    if (focusTrap) {
      focusTrap.enabled = preset.trapFocus;
    }

    if (focusTrap && autoFocus) {
      void focusTrap.focusInitialElementWhenReady().then((moved) => {
        if (!moved && ref.state() === 'open') {
          pane.focus();
        }
      });
    }

    const stopWatchingOpener = config.injector.get(DestroyRef).onDestroy(() => {
      ref.destroy();
    });
    let restoreFocus = false;

    ref.hooks = {
      closing: () => {
        unsubscribeAll(interactions);
      },
      disposing: () => {
        const active = this.isBrowser ? activeElement(this.document) : null;

        // Only when focus would otherwise be lost: it is still in the panel or nowhere
        restoreFocus =
          (config.restoreFocus ?? preset.restoreFocus) &&
          (!active || active === this.document.body || pane.contains(active));
        unsubscribeAll(tracking);
        stopWatchingOpener();
        focusTrap?.destroy();
      },
      disposed: () => {
        if (restoreFocus && previouslyFocused?.isConnected) {
          previouslyFocused.focus();
        }
      },
    };

    return ref;
  }

  private connectedPositioning(
    origin: HTMLElement,
    config: ArnOverlayConfig,
    preset: OverlayPreset,
    directionality: Directionality,
  ): ConnectedPositioning {
    const strategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPush(true)
      .withFlexibleDimensions(false)
      .withViewportMargin(VIEWPORT_MARGIN);
    let placements = new Map<object, OverlayPlacement>();
    const update = (): void => {
      const positions = connectedPositions(
        config.side ?? preset.side,
        config.align ?? preset.align,
        config.offset ?? DEFAULT_OFFSET,
        directionality.value === 'rtl',
      );

      placements = positions;
      strategy.withPositions([...positions.keys()]);
    };

    update();

    return { strategy, update, placementOf: (position) => placements.get(position) };
  }

  /**
   * An overlay opened from inside another one (a dropdown in a dialog) must not end up below it
   * when its own layer is lower. It is raised to the parent's z-index; being later in the DOM
   * then puts it on top.
   */
  private raiseAboveParent(source: Element, overlayRef: OverlayRef): void {
    const zIndex = parentZIndex(source, overlayRef.hostElement);

    if (zIndex !== null) {
      overlayRef.hostElement.style.zIndex = zIndex;

      if (overlayRef.backdropElement) {
        overlayRef.backdropElement.style.zIndex = zIndex;
      }
    }
  }

  /** Escape and outside click. Nothing is subscribed when both are off (tooltip). */
  private listenForDismissal(
    overlayRef: OverlayRef,
    ref: { close(): void },
    config: ArnOverlayConfig,
    preset: OverlayPreset,
    origin: HTMLElement | undefined,
  ): Unsubscribable[] {
    const subscriptions: Unsubscribable[] = [];

    if (config.closeOnEscape ?? preset.closeOnEscape) {
      subscriptions.push(
        overlayRef.keydownEvents().subscribe((event) => {
          const modified = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

          if (event.key === 'Escape' && !modified) {
            event.preventDefault();
            ref.close();
          }
        }),
      );
    }

    if (config.closeOnOutsideClick ?? preset.closeOnOutsideClick) {
      subscriptions.push(
        preset.backdrop
          ? overlayRef.backdropClick().subscribe(() => {
              ref.close();
            })
          : overlayRef.outsidePointerEvents().subscribe((event) => {
              const target = event.composedPath()[0] ?? event.target;

              // A click on the origin is left to the component (it toggles the overlay)
              if (!(origin && target instanceof Node && origin.contains(target))) {
                ref.close();
              }
            }),
      );
    }

    return subscriptions;
  }
}

function createPortal(
  content: TemplateRef<unknown> | Type<unknown>,
  viewContainerRef: ViewContainerRef | undefined,
  injector: Injector,
): TemplatePortal | ComponentPortal<unknown> {
  if (!(content instanceof TemplateRef)) {
    return new ComponentPortal(content, viewContainerRef ?? null, injector);
  }

  if (!viewContainerRef) {
    throw new Error(MISSING_VIEW_CONTAINER);
  }

  return new TemplatePortal(content, viewContainerRef, undefined, injector);
}

function setPlacement(pane: HTMLElement, placement: OverlayPlacement): void {
  pane.setAttribute('data-side', placement.side);
  pane.setAttribute('data-align', placement.align);
}

function unsubscribeAll(subscriptions: Unsubscribable[]): void {
  for (const subscription of subscriptions.splice(0)) {
    subscription.unsubscribe();
  }
}

function warnAboutUnusedOptions(config: ArnOverlayConfig, preset: OverlayPreset): void {
  const hasPlacement =
    config.side !== undefined || config.align !== undefined || config.offset !== undefined;

  if (!preset.connected && hasPlacement) {
    devWarn(
      `ArnOverlayService: "side", "align" and "offset" have no effect with preset "${config.preset}".`,
    );
  }
}
