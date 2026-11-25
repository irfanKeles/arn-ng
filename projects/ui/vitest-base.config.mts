import type {} from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import type { BrowserCommand } from 'vitest/node';

// Loaded by the unit-test builder through `runnerConfig` (angular.json, ui:test). The builder keeps
// `test.browser.commands` and sets the browser itself (`browsers`, `--browsers`).
//
// Browser commands run in Node with Playwright's page. They stand in for the Chrome DevTools
// Protocol (Chromium only) in Firefox and WebKit (Playwright); Chromium keeps its CDP path. Types:
// testing/browser-commands.d.ts.

/** Real (trusted) mouse input at top-level page coordinates (see testing/pointer.ts). */
const arnMouse: BrowserCommand<[type: 'move' | 'down' | 'up', x: number, y: number]> = async (
  { page },
  type,
  x,
  y,
) => {
  await page.mouse.move(x, y);

  if (type === 'down') {
    await page.mouse.down();
  } else if (type === 'up') {
    await page.mouse.up();
  }
};

/** Emulates `prefers-reduced-motion: reduce` on the page and its frames; false clears it. */
const arnReducedMotion: BrowserCommand<[reduce: boolean]> = async ({ page }, reduce) => {
  await page.emulateMedia({ reducedMotion: reduce ? 'reduce' : null });
};

/**
 * Playwright's ARIA snapshot of the element (a selector from `page.elementLocator(el).selector`).
 * Playwright computes it itself; it is not the browser's accessibility tree.
 */
const arnAriaSnapshot: BrowserCommand<[selector: string], string> = ({ iframe }, selector) =>
  iframe.locator(selector).ariaSnapshot();

export default defineConfig({
  test: {
    browser: {
      commands: { arnMouse, arnReducedMotion, arnAriaSnapshot },
    },
  },
});
