/** Class of the CDK host element of every overlay opened by `ArnOverlayService`. */
export const HOST_CLASS = 'arn-overlay-host';

/**
 * Copies the color scheme and density in effect on `source` to the panel, which is rendered at
 * the end of `<body>` and would otherwise lose them. They are read from the DOM (the nearest
 * `.dark` / `.light` and `data-density`), so the panel looks like the element that opened it
 * whether the value comes from `[arnConfig]` or from hand-written markup. A value that sits on
 * `<html>` is not copied: the panel inherits it anyway and keeps following later changes.
 */
export function applyInheritedSettings(source: Element, pane: HTMLElement): void {
  if (typeof source.closest !== 'function') {
    return;
  }

  const root = source.ownerDocument.documentElement;
  const scheme = source.closest('.dark, .light');
  const density = source.closest('[data-density]');

  if (scheme && scheme !== root) {
    // With both classes on one element `.light` wins in theme.css (it comes later)
    pane.classList.add(scheme.classList.contains('light') ? 'light' : 'dark');
  }

  if (density && density !== root) {
    pane.setAttribute('data-density', density.getAttribute('data-density') ?? '');
  }
}

/**
 * The z-index an overlay opened from inside another overlay must reach to appear above it, or
 * `null` when `source` is not inside an overlay or the parent is not higher than `host`.
 * Equal values are enough: the child comes later in the DOM.
 */
export function parentZIndex(source: Element, host: HTMLElement): string | null {
  const view = host.ownerDocument.defaultView;
  const parent = typeof source.closest === 'function' ? source.closest(`.${HOST_CLASS}`) : null;

  if (!view || !parent) {
    return null;
  }

  const parentValue = parseInt(view.getComputedStyle(parent).zIndex, 10);
  const ownValue = parseInt(view.getComputedStyle(host).zIndex, 10);

  if (Number.isNaN(parentValue) || (!Number.isNaN(ownValue) && ownValue >= parentValue)) {
    return null;
  }

  return String(parentValue);
}

/** The focused element, looking through shadow roots. */
export function activeElement(document: Document): HTMLElement | null {
  let active = document.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active instanceof HTMLElement ? active : null;
}
