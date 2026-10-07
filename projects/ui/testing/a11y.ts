import axe from 'axe-core';

// Used in tests only; not exported from any entry point.

/**
 * Scans the given DOM fragment with axe and returns the violations as readable lines.
 * The fragment must be attached to the `document`.
 */
export async function a11yViolations(
  element: Element,
  options: axe.RunOptions = {},
): Promise<string[]> {
  const results = await axe.run(element, {
    ...options,
    rules: {
      // Page-level rule; meaningless for a fragment scanned on its own
      region: { enabled: false },
      ...options.rules,
    },
  });

  return results.violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${violation.help} (${node.target.join(' ')})`),
  );
}

/** Throws an error listing every violation, if any, so the test fails. */
export async function expectNoA11yViolations(
  element: Element,
  options?: axe.RunOptions,
): Promise<void> {
  const violations = await a11yViolations(element, options);

  if (violations.length > 0) {
    throw new Error(
      `axe found ${String(violations.length)} violation(s):\n${violations.join('\n')}`,
    );
  }
}
