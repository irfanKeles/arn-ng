import { DOCS_SETTINGS_KEY } from '../settings/docs-settings.service';

// Used in specs only.

/** Like `querySelector`, but fails the test unless an element of the given type matches. */
export function queryAs<T extends Element>(
  root: ParentNode,
  selector: string,
  type: new () => T,
): T {
  const element = root.querySelector(selector);

  if (!(element instanceof type)) {
    throw new Error(`No ${type.name} matches "${selector}".`);
  }

  return element;
}

/** Like `querySelector`, but fails the test when no HTML element matches. */
export function query(root: ParentNode, selector: string): HTMLElement {
  return queryAs(root, selector, HTMLElement);
}

/** Removes what `applyToDocument` and the settings service leave behind; call it after each test. */
export function resetDocument(doc: Document): void {
  const root = doc.documentElement;

  root.classList.remove('dark', 'light');
  root.removeAttribute('data-density');
  root.removeAttribute('dir');

  try {
    doc.defaultView?.localStorage.removeItem(DOCS_SETTINGS_KEY);
  } catch {
    // No storage in this browser: nothing to clean.
  }
}

/** The trimmed text of a node. */
export function text(node: Node): string {
  return (node.textContent ?? '').trim();
}
