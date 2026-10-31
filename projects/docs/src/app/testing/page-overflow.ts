// Used in specs only: a page at a phone's width must not scroll sideways.

/**
 * The amount by which the document is wider than the window while `element` sits in a container
 * `width` px wide at the window's right edge, minus what the document was wider before (Karma's
 * own reporter overhangs by a few pixels). Left-to-right pages only. Measures `document.documentElement`, not the page: an absolutely positioned element
 * that escapes a scroll container widens the document without widening its own ancestors.
 */
export async function pageOverflow(
  element: HTMLElement,
  settle: () => Promise<void>,
  width = 320,
): Promise<number> {
  const doc = element.ownerDocument;
  const root = doc.documentElement;
  const parent = element.parentNode;
  const next = element.nextSibling;
  const container = doc.createElement('div');

  element.remove();

  const before = Math.max(root.scrollWidth, root.clientWidth);

  // Flush with the window's right edge: whatever escapes the container's right edge widens the
  // document, as it would in a window that is only `width` px wide.
  container.style.inlineSize = `${String(width)}px`;
  container.style.marginInlineStart = `${String(Math.max(0, root.clientWidth - width))}px`;

  doc.body.append(container);
  container.append(element);
  await settle();

  const after = root.scrollWidth;

  parent?.insertBefore(element, next);
  container.remove();

  return Math.max(0, after - before);
}

/** Fails the spec unless the element fits a `width` px wide page without sideways scrolling. */
export async function expectNoPageOverflow(
  element: HTMLElement,
  settle: () => Promise<void>,
  width = 320,
): Promise<void> {
  expect(await pageOverflow(element, settle, width)).toBe(0);
}
