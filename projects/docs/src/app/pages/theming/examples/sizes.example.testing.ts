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
