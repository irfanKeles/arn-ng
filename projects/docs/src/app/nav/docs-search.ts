import {
  visibleCategories,
  type DocsNavCategory,
  type DocsNavPage,
  type DocsNavSection,
} from './docs-nav';

/** A page in the search results. */
export interface DocsSearchPage {
  readonly page: DocsNavPage;
  /** The title matches (or there is no query): the page is shown as a link. */
  readonly titleMatch: boolean;
  /** The sections whose heading matches; empty without a query. */
  readonly sections: readonly DocsNavSection[];
}

/** A category with the pages it keeps. */
export interface DocsSearchCategory {
  readonly category: DocsNavCategory;
  readonly pages: readonly DocsSearchPage[];
}

/**
 * Text as the search compares it: canonical decomposition, combining marks removed, lowercased,
 * dotless ı as i, spaces collapsed. The order matters: "İ" (U+0130) has a mark to remove only after
 * decomposition. `toLowerCase()` does not depend on the browser's locale; `toLocaleLowerCase()`
 * would.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every word of the query appears in the text, in any order. */
function matches(text: string, words: readonly string[]): boolean {
  const normalized = normalizeForSearch(text);

  return words.every((word) => normalized.includes(word));
}

/**
 * Filters the navigation by page titles and section headings, keeping its order and categories.
 * Without a query, every page is a title match and no section is listed: the plain sidebar.
 * A category left without pages is dropped.
 */
export function searchNav(
  nav: readonly DocsNavCategory[],
  query: string,
): readonly DocsSearchCategory[] {
  const normalized = normalizeForSearch(query);
  const words = normalized === '' ? [] : normalized.split(' ');

  return visibleCategories(nav)
    .map((category) => ({
      category,
      pages: category.pages
        .map((page) => ({
          page,
          titleMatch: matches(page.title, words),
          sections:
            words.length === 0
              ? []
              : page.sections.filter((section) => matches(section.heading, words)),
        }))
        .filter((result) => result.titleMatch || result.sections.length > 0),
    }))
    .filter((result) => result.pages.length > 0);
}

/** The number of links the results show: matching page titles and matching sections. */
export function resultCount(results: readonly DocsSearchCategory[]): number {
  return results
    .flatMap((category) => category.pages)
    .reduce((count, page) => count + (page.titleMatch ? 1 : 0) + page.sections.length, 0);
}
