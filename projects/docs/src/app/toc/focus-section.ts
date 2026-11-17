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
 */
export function focusSection(document: Document, id: string): boolean {
  const heading = document.getElementById(id);

  heading?.focus();

  return heading !== null;
}
