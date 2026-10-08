import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  Directive,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  Renderer2,
  type OnDestroy,
} from '@angular/core';
import { injectArnConfig } from '@arn-ng/ui/core';
import {
  ARN_RIPPLE_REDUCED_MOTION,
  FALLBACK_DURATION_MS,
  FALLBACK_EASING,
  parseDuration,
} from './ripple.motion';

/** Waves alive at the same time; one more removes the oldest right away. */
const MAX_WAVES = 5;

interface Wave {
  readonly element: HTMLElement;
  readonly enter: Animation;
  readonly duration: number;
  fade: Animation | null;
}

/**
 * Draws a wave from the pointer position when the element is pressed. Off by default: it follows
 * the `ripple` config (`provideArn`, `[arnConfig]`) unless a value is given on the element.
 *
 * The host must be positioned (`position: relative`); the directive writes no style on it. The
 * styles and tokens come from `@arn-ng/ui/theme.css`. Nothing is drawn for the keyboard, under
 * `prefers-reduced-motion: reduce` or on the server.
 *
 * @example
 * <button arnRipple>Save</button>
 * <button [arnRipple]="false">No ripple</button>
 * <button arnRipple arnRippleCentered arnRippleColor="oklch(60% 0.2 250deg / 20%)">Icon</button>
 */
@Directive({
  selector: '[arnRipple]',
})
export class ArnRippleDirective implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly reducedMotion = inject(ARN_RIPPLE_REDUCED_MOTION);
  private readonly unlisten: (() => void)[] = [];
  private readonly waves: Wave[] = [];
  private container: HTMLElement | null = null;

  /** An empty attribute or `true` turns the ripple on, `false` off; not given follows the config. */
  readonly arnRipple = input(undefined, {
    // `booleanAttribute(undefined)` gives false; "not given" must fall through to the config
    transform: (value: unknown): boolean | undefined =>
      value === undefined || value === null ? undefined : booleanAttribute(value),
  });

  /** Color of the wave, used as given (bring your own alpha). Defaults to `--arn-ripple-color`. */
  readonly arnRippleColor = input<string>();

  /** Starts the wave from the center of the element instead of the pointer position. */
  readonly arnRippleCentered = input(false, { transform: booleanAttribute });

  private readonly enabled = injectArnConfig('ripple', this.arnRipple);

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }

    const renderer = inject(Renderer2);
    const fade = (): void => {
      this.fadeAll();
    };

    this.unlisten.push(
      renderer.listen(this.host, 'pointerdown', (event: PointerEvent) => {
        this.start(event);
      }),
      renderer.listen(this.host, 'pointerup', fade),
      renderer.listen(this.host, 'pointercancel', fade),
      renderer.listen(this.host, 'pointerleave', fade),
    );
  }

  ngOnDestroy(): void {
    for (const unlisten of this.unlisten) {
      unlisten();
    }
    for (const wave of [...this.waves]) {
      this.remove(wave);
    }
  }

  // The config and the media query are read on every press, so both are followed live
  private start(event: PointerEvent): void {
    if (
      event.button !== 0 ||
      !this.enabled() ||
      this.reducedMotion() ||
      typeof (this.host as Partial<HTMLElement>).animate !== 'function'
    ) {
      return;
    }

    const container = this.ensureContainer();
    const color = this.arnRippleColor();

    if (color) {
      container.style.setProperty('--arn-ripple-color', color);
    } else {
      container.style.removeProperty('--arn-ripple-color');
    }

    const rect = container.getBoundingClientRect();
    const centered = this.arnRippleCentered();
    const x = centered ? rect.width / 2 : event.clientX - rect.left;
    const y = centered ? rect.height / 2 : event.clientY - rect.top;
    // Far enough to cover the farthest corner
    const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
    const element = this.document.createElement('span');

    element.className = 'arn-ripple-wave';
    element.setAttribute('aria-hidden', 'true');
    // Physical on purpose: the coordinates come from the pointer and the bounding box
    element.style.left = `${String(x - radius)}px`;
    element.style.top = `${String(y - radius)}px`;
    element.style.width = `${String(radius * 2)}px`;
    element.style.height = `${String(radius * 2)}px`;
    container.appendChild(element);

    const style = this.document.defaultView?.getComputedStyle(container);
    const duration = style
      ? parseDuration(style.getPropertyValue('--arn-ripple-duration'))
      : FALLBACK_DURATION_MS;
    const ownEasing = style?.getPropertyValue('--arn-ripple-easing').trim();
    const easing = ownEasing === undefined || ownEasing === '' ? FALLBACK_EASING : ownEasing;
    const keyframes = [{ transform: 'scale(0)' }, { transform: 'scale(1)' }];
    let enter: Animation;

    try {
      enter = element.animate(keyframes, { duration, easing, fill: 'forwards' });
    } catch {
      // An easing the browser does not accept throws
      enter = element.animate(keyframes, { duration, easing: FALLBACK_EASING, fill: 'forwards' });
    }

    this.waves.push({ element, enter, duration, fade: null });

    const oldest = this.waves[0];

    if (this.waves.length > MAX_WAVES && oldest) {
      this.remove(oldest);
    }
  }

  private fadeAll(): void {
    for (const wave of this.waves) {
      if (wave.fade) {
        continue;
      }

      const fade = wave.element.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: wave.duration,
        fill: 'forwards',
      });

      wave.fade = fade;
      fade.finished.then(
        () => {
          this.remove(wave);
        },
        // Cancelled by `remove`
        () => undefined,
      );
    }
  }

  private ensureContainer(): HTMLElement {
    if (!this.container) {
      this.container = this.document.createElement('span');
      this.container.className = 'arn-ripple-container';
      this.container.setAttribute('aria-hidden', 'true');
      this.host.appendChild(this.container);
    }

    return this.container;
  }

  /** Removes the wave, and the container with the last one, so an idle host has no extra DOM. */
  private remove(wave: Wave): void {
    const index = this.waves.indexOf(wave);

    if (index === -1) {
      return;
    }

    this.waves.splice(index, 1);
    wave.enter.cancel();
    wave.fade?.cancel();
    wave.element.remove();

    if (this.waves.length === 0) {
      this.container?.remove();
      this.container = null;
    }
  }
}
