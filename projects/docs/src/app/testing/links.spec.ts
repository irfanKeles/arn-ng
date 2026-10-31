import { DOCS_NAV, type DocsNavCategory } from '../nav/docs-nav';
import { docsPaths, unknownInternalLinks } from './links';

class FixturePage {
  readonly name = 'fixture';
}

const NAV: readonly DocsNavCategory[] = [
  {
    id: 'guides',
    title: 'Guides',
    pages: [
      { slug: '', title: 'Home', loadComponent: () => Promise.resolve(FixturePage) },
      { slug: 'ripple', title: 'Ripple', loadComponent: () => Promise.resolve(FixturePage) },
    ],
  },
];

function links(...hrefs: string[]): HTMLElement {
  const root = document.createElement('div');

  for (const href of hrefs) {
    const link = document.createElement('a');

    link.setAttribute('href', href);
    root.append(link);
  }

  return root;
}

describe('docsPaths', () => {
  it('turns every slug into a path, the empty slug into /', () => {
    expect([...docsPaths(NAV)]).toEqual(['/', '/ripple']);
  });

  it('covers the real navigation', () => {
    expect(docsPaths().size).toBe(DOCS_NAV.flatMap((category) => category.pages).length);
  });
});

describe('unknownInternalLinks', () => {
  it('accepts pages of the navigation, with or without a fragment or query', () => {
    expect(unknownInternalLinks(links('/', '/ripple', '/ripple#api', '/?a=1'), NAV)).toEqual([]);
  });

  it('skips external links', () => {
    expect(
      unknownInternalLinks(links('https://github.com/x', 'http://a.b', 'mailto:a@b.c'), NAV),
    ).toEqual([]);
  });

  it('returns a filled list for a page that does not exist and for a bare fragment', () => {
    expect(unknownInternalLinks(links('/configuration', '#api', 'theming'), NAV)).toEqual([
      '/configuration',
      '#api',
      'theming',
    ]);
  });
});
