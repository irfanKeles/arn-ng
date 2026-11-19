/**
 * A plain primary click: the router follows it. A modified or non-primary click opens the link
 * elsewhere, and the router ignores it, so focus must stay where it is.
 */
export function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

/**
 * Moves focus to the section heading with this id (`docs-section` headings carry
 * `tabindex="-1"`), which also scrolls it into view. Returns whether it was found.
 *
 * With `scroll`, the heading is scrolled to the top with that behavior first, and focus then moves
 * without scrolling again, so a smooth scroll is not cut short by the jump focusing makes.
 */
export function focusSection(document: Document, id: string, scroll?: ScrollBehavior): boolean {
  const heading = document.getElementById(id);

  if (heading && scroll) {
    heading.scrollIntoView({ block: 'start', behavior: scroll });
    heading.focus({ preventScroll: true });
  } else {
    heading?.focus();
  }

  return heading !== null;
}
