// Used in tests only; not exported from any entry point.

/**
 * Removes everything the library may write on `<html>`: `.dark` / `.light`, `data-density`
 * and `dir`. `applyToDocument` writes `data-density` on every call, so a spec that uses it
 * must reset the document, or the attribute leaks into the specs that run after it.
 */
export function resetDocument(doc: Document): void {
  const root = doc.documentElement;

  root.classList.remove('dark', 'light');
  root.removeAttribute('data-density');
  root.removeAttribute('dir');
}
