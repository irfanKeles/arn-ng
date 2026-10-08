import type { Type } from '@angular/core';
import type { Route, Routes } from '@angular/router';

/** Site name shown in the header and appended to every page title. */
export const DOCS_SITE_NAME = 'arn-ng';

/** A documentation page: one sidebar link and one lazy route. */
export interface DocsNavPage {
  /** URL path of the page (`/<slug>`), unique across the site. The empty slug is the home page. */
  readonly slug: string;
  readonly title: string;
  readonly loadComponent: () => Promise<Type<unknown>>;
}

/** A sidebar group. A category without pages is not shown. */
export interface DocsNavCategory {
  readonly id: string;
  readonly title: string;
  readonly pages: readonly DocsNavPage[];
}

/** The single source of the sidebar and the routes. Only pages that really exist are listed. */
export const DOCS_NAV: readonly DocsNavCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    pages: [
      {
        slug: '',
        title: 'Overview',
        loadComponent: () =>
          import('../pages/overview/overview-page.component').then((m) => m.OverviewPageComponent),
      },
    ],
  },
];

/** The categories that have at least one page. */
export function visibleCategories(nav: readonly DocsNavCategory[]): readonly DocsNavCategory[] {
  return nav.filter((category) => category.pages.length > 0);
}

/** Document title of a page. */
export function pageTitle(title: string): string {
  return `${title} · ${DOCS_SITE_NAME}`;
}

/** One lazy route per page. */
export function buildRoutes(nav: readonly DocsNavCategory[]): Routes {
  return nav.flatMap((category) =>
    category.pages.map((page): Route => ({
      path: page.slug,
      pathMatch: 'full',
      title: pageTitle(page.title),
      loadComponent: page.loadComponent,
    })),
  );
}
