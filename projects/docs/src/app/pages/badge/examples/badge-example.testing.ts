export { A11Y_MODES, renderExample } from '../../../testing/render-example';

// Used in the badge example specs only.

/** Every badge of the example, in document order. */
export function badges(element: Element): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('.arn-badge'));
}
