import axe from 'axe-core';

// Yalnızca testlerde kullanılır; hiçbir entry point'ten export edilmez.

/**
 * Verilen DOM parçasını axe ile tarar ve ihlalleri okunabilir satırlar olarak döndürür.
 * Parça `document`'e eklenmiş olmalıdır.
 */
export async function a11yViolations(
  element: Element,
  options: axe.RunOptions = {},
): Promise<string[]> {
  const results = await axe.run(element, {
    ...options,
    rules: {
      // Sayfa düzeyinde kural, tek başına taranan bir parçada anlamsız
      region: { enabled: false },
      ...options.rules,
    },
  });

  return results.violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id}: ${violation.help} (${node.target.join(' ')})`),
  );
}

/** İhlal varsa hepsini listeleyen bir hata fırlatır, böylece test düşer. */
export async function expectNoA11yViolations(
  element: Element,
  options?: axe.RunOptions,
): Promise<void> {
  const violations = await a11yViolations(element, options);

  if (violations.length > 0) {
    throw new Error(`axe ${String(violations.length)} ihlal buldu:\n${violations.join('\n')}`);
  }
}
