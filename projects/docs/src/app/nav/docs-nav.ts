import type { Type } from '@angular/core';
import type { Route, Routes } from '@angular/router';

/** Site name shown in the header and appended to every page title. */
export const DOCS_SITE_NAME = 'arn-ng';

/** A section of a page, as its `docs-section` declares it. */
export interface DocsNavSection {
  /** The id of the section heading; also the URL fragment. */
  readonly id: string;
  readonly heading: string;
}

/** A documentation page: one sidebar link and one lazy route. */
export interface DocsNavPage {
  /** URL path of the page (`/<slug>`), unique across the site. The empty slug is the home page. */
  readonly slug: string;
  readonly title: string;
  /**
   * The page's sections in page order, for the search. The pages are lazy, so this cannot be read
   * from them at run time; a spec renders every page and compares (`docs-nav-sections.spec.ts`).
   */
  readonly sections: readonly DocsNavSection[];
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
        sections: [
          { id: 'status', heading: 'Status' },
          { id: 'what-exists-today', heading: 'What exists today' },
          { id: 'try-the-settings', heading: 'Try the settings' },
        ],
        loadComponent: () =>
          import('../pages/overview/overview-page.component').then((m) => m.OverviewPageComponent),
      },
      {
        slug: 'installation',
        title: 'Installation',
        sections: [
          { id: 'requirements', heading: 'Requirements' },
          { id: 'install', heading: 'Install' },
          { id: 'theme', heading: 'Add the theme' },
          { id: 'configuration', heading: 'Provide the configuration' },
          { id: 'imports', heading: 'Import what you use' },
        ],
        loadComponent: () =>
          import('../pages/installation/installation-page.component').then(
            (m) => m.InstallationPageComponent,
          ),
      },
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    pages: [
      {
        slug: 'configuration',
        title: 'Configuration',
        sections: [
          { id: 'precedence', heading: 'Precedence' },
          { id: 'global', heading: 'The application: provideArn' },
          { id: 'sections', heading: 'A part of the page: arnConfig' },
          { id: 'runtime', heading: 'At runtime: ArnConfigService' },
          { id: 'own-code', heading: 'In your own components: injectArnConfig' },
          { id: 'locale-and-messages', heading: 'Locale and messages' },
          { id: 'direction', heading: 'Direction (RTL)' },
        ],
        loadComponent: () =>
          import('../pages/configuration/configuration-page.component').then(
            (m) => m.ConfigurationPageComponent,
          ),
      },
      {
        slug: 'theming',
        title: 'Theming',
        sections: [
          { id: 'theme-file', heading: 'The theme file' },
          { id: 'color-tokens', heading: 'Color tokens' },
          { id: 'dark-mode', heading: 'Dark mode' },
          { id: 'sizes', heading: 'Sizes' },
          { id: 'density', heading: 'Density' },
          { id: 'overriding', heading: 'Overriding tokens' },
        ],
        loadComponent: () =>
          import('../pages/theming/theming-page.component').then((m) => m.ThemingPageComponent),
      },
      {
        slug: 'accessibility',
        title: 'Accessibility',
        sections: [
          { id: 'must-meet', heading: 'What every component must meet' },
          { id: 'target-size', heading: 'Target size' },
          { id: 'focus-ring', heading: 'Focus ring' },
          { id: 'reduced-motion', heading: 'Reduced motion' },
          { id: 'rtl', heading: 'RTL' },
          { id: 'testing', heading: 'How it is tested' },
          { id: 'known-limits', heading: 'Known limits' },
        ],
        loadComponent: () =>
          import('../pages/accessibility/accessibility-page.component').then(
            (m) => m.AccessibilityPageComponent,
          ),
      },
    ],
  },
  {
    id: 'directives',
    title: 'Directives',
    pages: [
      {
        slug: 'ripple',
        title: 'Ripple',
        sections: [
          { id: 'import', heading: 'Import' },
          { id: 'basic', heading: 'Basic' },
          { id: 'turning-it-on', heading: 'Turning it on' },
          { id: 'color', heading: 'Color' },
          { id: 'centered', heading: 'Centered' },
          { id: 'accessibility', heading: 'Accessibility' },
          { id: 'api', heading: 'API' },
          { id: 'styling', heading: 'Styling' },
        ],
        loadComponent: () =>
          import('../pages/ripple/ripple-page.component').then((m) => m.RipplePageComponent),
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
