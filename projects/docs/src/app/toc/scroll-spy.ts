/** What the active section is computed from, read from the page in one go. */
export interface ScrollSpyState {
  /** The top edge of each section heading, in viewport pixels, in page order. */
  readonly headingTops: readonly number[];
  /** The reading line: a heading at or above it has been reached. */
  readonly line: number;
  /** The end of the page content is in view. */
  readonly atBottom: boolean;
  /** The page is taller than the viewport. */
  readonly scrollable: boolean;
}

/**
 * The index of the active section, or -1 when there are none.
 *
 * - At the end of a page that scrolls, the last section: a short last section never reaches the
 *   line, and the reader is at it.
 * - Otherwise the last heading that has reached the line.
 * - Before the first heading reaches it, the first section.
 */
export function activeIndex(state: ScrollSpyState): number {
  const count = state.headingTops.length;

  if (count === 0) {
    return -1;
  }

  if (state.scrollable && state.atBottom) {
    return count - 1;
  }

  let reached = -1;

  state.headingTops.forEach((top, index) => {
    if (top <= state.line) {
      reached = index;
    }
  });

  return Math.max(reached, 0);
}
