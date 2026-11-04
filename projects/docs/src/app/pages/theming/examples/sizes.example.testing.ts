import type { ComponentFixture } from '@angular/core/testing';
import { text } from '../../../testing/dom';

// Used in the Theming example specs only.

/** Waits frame by frame until the ResizeObserver has written every height (or gives up). */
export async function measured(
  fixture: ComponentFixture<unknown>,
  root: HTMLElement,
): Promise<void> {
  for (let frame = 0; frame < 20; frame++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();

    const boxes = root.querySelectorAll('.box');

    if (boxes.length > 0 && root.querySelectorAll('.box-height').length === boxes.length) {
      return;
    }
  }
}

/** `--arn-control-height-<size>` in rem (theme.css). */
const CONTROL_HEIGHTS = { xs: 1.5, sm: 2, md: 2.25, lg: 2.5, xl: 3 } as const;

/** `--arn-control-min-size` in rem (theme.css). */
const CONTROL_MIN_SIZE = 1.5;

/** `--arn-density` in compact density. */
export const COMPACT = 0.875;

/**
 * The height in px a box of `size` should have at `density`, from the root font size of
 * `element`'s document, rounded to one decimal like the example shows it:
 * max(min size, height × density).
 */
export function controlHeight(
  element: HTMLElement,
  size: keyof typeof CONTROL_HEIGHTS,
  density = 1,
): number {
  const rem = parseFloat(getComputedStyle(element.ownerDocument.documentElement).fontSize);
  const height = Math.max(CONTROL_MIN_SIZE, CONTROL_HEIGHTS[size] * density) * rem;

  return Math.round(height * 10) / 10;
}

/** Size → the height the box shows, and the height it has. */
export function heights(root: HTMLElement): Record<string, { shown: string; actual: number }> {
  return Object.fromEntries(
    Array.from(root.querySelectorAll<HTMLElement>('.box')).map((box) => [
      box.dataset['size'] ?? '',
      {
        shown: text(box.querySelector('.box-height') ?? box),
        actual: Math.round(box.getBoundingClientRect().height * 10) / 10,
      },
    ]),
  );
}
