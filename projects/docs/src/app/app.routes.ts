import { Routes } from '@angular/router';
import { buildRoutes, DOCS_NAV, pageTitle } from './nav/docs-nav';

export const routes: Routes = [
  ...buildRoutes(DOCS_NAV),
  {
    path: '**',
    title: pageTitle('Page not found'),
    loadComponent: () =>
      import('./pages/not-found/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];
