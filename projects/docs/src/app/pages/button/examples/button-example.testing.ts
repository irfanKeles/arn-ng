export { A11Y_MODES, renderExample } from '../../../testing/render-example';

// Used in the button example specs only.

/** Every element the example styles as a button, in document order. */
export function buttons(element: Element): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('.arn-button'));
}

/** A primary-button press near the top-left corner of the element. */
export function pressAt(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();

  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: rect.left + 4,
      clientY: rect.top + 4,
    }),
  );
}
