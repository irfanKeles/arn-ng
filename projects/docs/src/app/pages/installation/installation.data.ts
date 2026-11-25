import libraryPackage from '../../../../../ui/package.json?source' with { loader: 'text' };

/** A peer dependency of the library, as its package.json states it. */
export interface DocsPeerDependency {
  readonly name: string;
  readonly range: string;
}

/**
 * The `peerDependencies` of a package.json text. The requirements on the page come from the
 * library's own manifest, so they cannot drift from what npm enforces.
 */
export function peerDependencies(manifest: string): readonly DocsPeerDependency[] {
  const parsed: unknown = JSON.parse(manifest);
  const peers: unknown =
    typeof parsed === 'object' && parsed !== null
      ? Reflect.get(parsed, 'peerDependencies')
      : undefined;

  if (typeof peers !== 'object' || peers === null) {
    return [];
  }

  return Object.entries(peers)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([name, range]) => ({ name, range }));
}

/** The text of `projects/ui/package.json`. */
export const LIBRARY_PACKAGE_JSON = libraryPackage;

export const LIBRARY_PEERS = peerDependencies(LIBRARY_PACKAGE_JSON);

/** A browser and the first version the library supports. */
export interface DocsBrowserSupport {
  readonly name: string;
  readonly version: string;
}

/**
 * The browser baseline (decisions 2026-11, "Tarayıcı tabanı"). The CSS `light-dark()` function
 * sets it; every other feature the stylesheets use is older. Below it there is no fallback.
 */
export const BROWSER_SUPPORT: readonly DocsBrowserSupport[] = [
  { name: 'Chrome', version: '123' },
  { name: 'Edge', version: '123' },
  { name: 'Firefox', version: '120' },
  { name: 'Safari (macOS and iOS)', version: '17.5' },
];

// The steps below are the ones the local registry runs went through (Verdaccio, Angular 22;
// local-package-test.md).

export const INSTALL_COMMAND = 'npm install @arn-ng/ui';

export const THEME_CODE = `/* src/styles.css */
@import '@arn-ng/ui/theme.css';`;

export const CONFIG_CODE = `// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideArn } from '@arn-ng/ui/core';

export const appConfig: ApplicationConfig = {
  providers: [provideArn({ applyToDocument: true })],
};`;

export const LOCALE_CODE = `import { provideArn } from '@arn-ng/ui/core';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';

provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR });`;

export const IMPORT_CODE = `import { ArnConfigDirective, ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { ArnButton } from '@arn-ng/ui/button';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';`;
