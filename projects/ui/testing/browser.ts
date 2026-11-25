import { cdp, commands, server, userEvent } from 'vitest/browser';

// Used in tests only; not exported from any entry point. Browser-specific test plumbing: Chromium
// keeps the Chrome DevTools Protocol, Firefox and WebKit (Playwright) use the browser commands of
// vitest-base.config.mts.

/** The run is in Chromium: the Chrome DevTools Protocol (`cdp()`) is available. */
export const isChromium = server.browser === 'chromium';

/** Emulates `prefers-reduced-motion: reduce` (true) or clears the emulation (false). */
export async function emulateReducedMotion(reduce: boolean): Promise<void> {
  if (isChromium) {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: reduce ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [],
    });
  } else {
    await commands.arnReducedMotion(reduce);
  }
}

/**
 * Whether Tab moves focus to a link in this engine. WebKit (Playwright) skips links on Tab by
 * default, like its desktop browser setting. Probes with a temporary link at the start of the body.
 */
export async function tabFocusesLinks(doc: Document): Promise<boolean> {
  const probe = doc.createElement('a');

  probe.href = '#tab-probe';
  probe.textContent = 'Tab probe';
  doc.body.prepend(probe);

  try {
    doc.defaultView?.focus(); // the test frame, so Tab moves inside it
    doc.body.focus();
    await userEvent.tab();

    return doc.activeElement === probe;
  } finally {
    probe.remove();
  }
}
