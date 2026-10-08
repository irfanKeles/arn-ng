import { routes } from '../app.routes';
import {
  buildRoutes,
  DOCS_NAV,
  pageTitle,
  visibleCategories,
  type DocsNavCategory,
} from './docs-nav';

class FirstPage {
  readonly name = 'first';
}
class SecondPage {
  readonly name = 'second';
}

const FIXTURE: readonly DocsNavCategory[] = [
  {
    id: 'guides',
    title: 'Guides',
    pages: [
      { slug: 'first', title: 'First', loadComponent: () => Promise.resolve(FirstPage) },
      { slug: 'second', title: 'Second', loadComponent: () => Promise.resolve(SecondPage) },
    ],
  },
  { id: 'empty', title: 'Empty', pages: [] },
];

describe('docs nav', () => {
  const pages = DOCS_NAV.flatMap((category) => category.pages);

  it('has unique slugs', () => {
    const slugs = pages.map((page) => page.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has unique category ids', () => {
    const ids = DOCS_NAV.map((category) => category.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has exactly one route for every slug', () => {
    for (const page of pages) {
      expect(routes.filter((route) => route.path === page.slug).length).toBe(1);
    }
  });

  it('resolves the component of every page', async () => {
    for (const page of pages) {
      expect(typeof (await page.loadComponent())).toBe('function');
    }
  });

  it('lists no empty category', () => {
    expect(DOCS_NAV.length).toBeGreaterThan(0);
    expect(visibleCategories(DOCS_NAV)).toEqual(DOCS_NAV);
  });

  it('ends with the not-found route', () => {
    expect(routes.at(-1)?.path).toBe('**');
    expect(routes.at(-1)?.title).toBe(pageTitle('Page not found'));
  });

  it('drops a category that has no pages', () => {
    expect(visibleCategories(FIXTURE).map((category) => category.id)).toEqual(['guides']);
  });

  it('builds one lazy route per page', async () => {
    const built = buildRoutes(FIXTURE);

    expect(built.map((route) => route.path)).toEqual(['first', 'second']);
    expect(built.map((route) => route.title)).toEqual(['First · arn-ng', 'Second · arn-ng']);
    expect(built.every((route) => route.pathMatch === 'full')).toBe(true);
    expect(await built[1]?.loadComponent?.()).toBe(SecondPage);
  });
});
