import type { OverlayRef } from '@angular/cdk/overlay';
import { signal, type Signal } from '@angular/core';
import { runExit } from './overlay.motion';
import type { ArnOverlayState } from './overlay.types';

/**
 * Handle of an open overlay. `ArnOverlayService.open()` returns it and the content can inject it
 * (`inject(ArnOverlayRef)`) to close itself.
 */
export abstract class ArnOverlayRef<R = unknown> {
  /** `open`, then `closing` while the exit animation runs, then `closed`. */
  abstract readonly state: Signal<ArnOverlayState>;
  /**
   * Resolves once the overlay is removed from the DOM, with the value given to `close()`;
   * `undefined` when it was dismissed (Escape, outside click, navigation, opener destroyed).
   */
  abstract readonly closed: Promise<R | undefined>;
  /**
   * Starts closing: the panel gets `data-state="closed"` and is removed when the exit animation
   * ends, or right away when there is none or the user prefers reduced motion. Later calls are
   * ignored.
   */
  abstract close(result?: R): void;
  /** Re-aligns the overlay with its origin, e.g. after its content changed size. */
  abstract updatePosition(): void;
}

/** Steps the service runs as the overlay goes away. */
export interface OverlayRefHooks {
  /** Closing has started: stop reacting to Escape and outside clicks. */
  closing(): void;
  /** Right before the DOM is removed. */
  disposing(): void;
  /** Right after the DOM is removed. */
  disposed(): void;
}

export class OverlayRefImpl<R> extends ArnOverlayRef<R> {
  private readonly current = signal<ArnOverlayState>('open');
  private resolveClosed: (result: R | undefined) => void = () => undefined;
  private cancelExit: (() => void) | undefined;
  private result: R | undefined;

  /** Set by the service once the overlay is wired up. */
  hooks: OverlayRefHooks | undefined;

  readonly state = this.current.asReadonly();
  readonly closed = new Promise<R | undefined>((resolve) => {
    this.resolveClosed = resolve;
  });

  constructor(
    private readonly overlayRef: OverlayRef,
    private readonly reducedMotion: () => boolean,
  ) {
    super();
  }

  close(result?: R): void {
    if (this.current() !== 'open') {
      return;
    }

    const pane = this.overlayRef.overlayElement;
    const backdrop = this.overlayRef.backdropElement;

    this.result = result;
    this.current.set('closing');
    this.hooks?.closing();
    this.cancelExit = runExit(
      pane,
      () => {
        pane.setAttribute('data-state', 'closed');
        backdrop?.setAttribute('data-state', 'closed');
        // The backdrop fades out while the panel animates; dispose() removes whatever is left
        this.overlayRef.detachBackdrop();
      },
      this.reducedMotion(),
      () => {
        this.destroy();
      },
    );
  }

  updatePosition(): void {
    if (this.current() !== 'closed') {
      this.overlayRef.updatePosition();
    }
  }

  /** Removes the overlay now, without waiting for an exit animation. */
  destroy(): void {
    const previous = this.current();

    if (previous === 'closed') {
      return;
    }

    this.current.set('closed');
    this.cancelExit?.();

    if (previous === 'open') {
      this.hooks?.closing();
    }

    this.hooks?.disposing();
    this.overlayRef.dispose();
    this.hooks?.disposed();
    this.resolveClosed(this.result);
  }
}
