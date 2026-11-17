import { DOCS_NAV, type DocsNavCategory } from './docs-nav';
import { normalizeForSearch, resultCount, searchNav, type DocsSearchCategory } from './docs-search';

class FixturePage {
  readonly name = 'fixture';
}

const load = (): Promise<typeof FixturePage> => Promise.resolve(FixturePage);

const FIXTURE: readonly DocsNavCategory[] = [
  {
    id: 'start',
    title: 'Getting started',
    pages: [
      {
        slug: '',
        title: 'Overview',
        sections: [{ id: 'status', heading: 'Status' }],
        loadComponent: load,
      },
      {
        slug: 'installation',
        title: 'Installation',
        sections: [{ id: 'theme', heading: 'Add the theme' }],
        loadComponent: load,
      },
    ],
  },
  { id: 'empty', title: 'Empty', pages: [] },
  {
    id: 'guides',
    title: 'Guides',
    pages: [
      {
        slug: 'theming',
        title: 'Theming',
        sections: [
          { id: 'dark-mode', heading: 'Dark mode' },
          { id: 'density', heading: 'Density' },
        ],
        loadComponent: load,
      },
    ],
  },
];

/** `slug` for a title match, `slug#id` for a section, in result order. */
function hits(results: readonly DocsSearchCategory[]): string[] {
  return results.flatMap((category) =>
    category.pages.flatMap((result) => [
      ...(result.titleMatch ? [result.page.slug] : []),
      ...result.sections.map((section) => `${result.page.slug}#${section.id}`),
    ]),
  );
}

describe('docs search', () => {
  describe('normalizeForSearch', () => {
    it('lowercases, removes marks and collapses spaces', () => {
      expect(normalizeForSearch('  Densité   MODE ')).toBe('densite mode');
    });

    it('turns both Turkish i letters into a plain i', () => {
      expect(normalizeForSearch('İnstallation')).toBe('installation');
      expect(normalizeForSearch('ınstallatıon')).toBe('installation');
      expect(normalizeForSearch('DENSİTY')).toBe('density');
    });

    it('needs decomposition before the marks are removed, which a plain lowercase does not do', () => {
      // The trap the order avoids: each of these leaves U+0307 (combining dot) behind.
      const lowercaseOnly = 'İnstallation'.toLowerCase();
      const marksBeforeDecomposition = 'İnstallation'
        .replace(/\p{M}/gu, '')
        .normalize('NFD')
        .toLowerCase();

      expect(lowercaseOnly).not.toBe('installation');
      expect(marksBeforeDecomposition).not.toBe('installation');
      expect(normalizeForSearch('İnstallation')).toBe('installation');
    });
  });

  describe('searchNav', () => {
    for (const [query, expected] of [
      ['İnstallation', ['installation']],
      ['ınstallatıon', ['installation']],
      ['DENSİTY', ['theming#density']],
      // An accented spelling of the same word ("densité" would be "densite", another word)
      ['densíty', ['theming#density']],
    ] as const) {
      it(`matches "${query}" in the real navigation`, () => {
        expect(hits(searchNav(DOCS_NAV, query))).toEqual([...expected]);
      });
    }

    it('matches part of a word, in titles and section headings', () => {
      expect(hits(searchNav(FIXTURE, 'the'))).toEqual(['installation#theme', 'theming']);
    });

    it('needs every word, in any order', () => {
      expect(hits(searchNav(FIXTURE, 'mode dark'))).toEqual(['theming#dark-mode']);
      expect(hits(searchNav(FIXTURE, 'dark density'))).toEqual([]);
    });

    it('keeps the navigation order and the categories', () => {
      const results = searchNav(FIXTURE, 's');

      expect(results.map((result) => result.category.id)).toEqual(['start', 'guides']);
      expect(hits(results)).toEqual(['#status', 'installation', 'theming#density']);
    });

    it('keeps a page shown only for its sections, without a title match', () => {
      const [start] = searchNav(FIXTURE, 'status');

      expect(start?.pages.map((page) => [page.page.slug, page.titleMatch])).toEqual([['', false]]);
    });

    it('drops the categories left without pages, and the empty one', () => {
      expect(searchNav(FIXTURE, 'density').map((result) => result.category.id)).toEqual(['guides']);
    });

    it('returns nothing when nothing matches', () => {
      expect(searchNav(FIXTURE, 'zzz')).toEqual([]);
    });

    it('lists every page and no section without a query, or with only spaces', () => {
      for (const query of ['', '   ']) {
        expect(hits(searchNav(FIXTURE, query))).toEqual(['', 'installation', 'theming']);
      }
    });
  });

  describe('resultCount', () => {
    it('counts the links shown: matching titles and matching sections', () => {
      expect(resultCount(searchNav(FIXTURE, 's'))).toBe(3);
      expect(resultCount(searchNav(FIXTURE, 'zzz'))).toBe(0);
    });
  });
});
