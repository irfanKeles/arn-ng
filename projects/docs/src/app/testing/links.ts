import { DOCS_NAV, type DocsNavCategory } from '../nav/docs-nav';

// Used in specs only: a page links only to pages that exist.

/** The paths of the pages in the navigation (`/` and `/<slug>`). */
export function docsPaths(nav: readonly DocsNavCategory[] = DOCS_NAV): ReadonlySet<string> {
  return new Set(nav.flatMap((category) => category.pages.map((page) => `/${page.slug}`)));
}

/**
 * The internal links under `root` whose target is not a page of the navigation. External links
 * (`http:`, `https:`, `mailto:`) are skipped; a bare `#fragment` is reported, because it resolves
 * against `<base href>` and leads to the home page. An empty list means every link resolves.
 */
export function unknownInternalLinks(
  root: ParentNode,
  nav: readonly DocsNavCategory[] = DOCS_NAV,
): string[] {
  const paths = docsPaths(nav);

  return Array.from(root.querySelectorAll('a[href]'))
    .map((link) => link.getAttribute('href') ?? '')
    .filter((href) => !/^(https?:|mailto:)/.test(href))
    .filter((href) => {
      const path = href.split(/[?#]/)[0] ?? '';

      return !paths.has(path);
    });
}
