export { A11Y_MODES, renderExample } from '../../../testing/render-example';

// Used in the ripple example specs only: pointer and keyboard helpers.

/** A primary-button press at the given point inside the element (its top-left corner by default). */
export function pressAt(element: HTMLElement, offsetX = 4, offsetY = 4): void {
  const rect = element.getBoundingClientRect();

  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: rect.left + offsetX,
      clientY: rect.top + offsetY,
    }),
  );
}

export function waves(element: Element): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('.arn-ripple-wave'));
}

/** Enter and Space as the browser sends them to a focused button. */
export function pressKeys(element: HTMLElement): void {
  for (const key of ['Enter', ' ']) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }
  element.click();
}
