// Used in specs only: contrast of the theme's achromatic colors, as theme.spec.ts computes it.

/** Relative luminance of a computed achromatic oklch color: Y = L³. */
export function luminance(color: string): number {
  const match = /^oklch\(([\d.]+)(%?) 0 0\)$/.exec(color);

  if (!match?.[1]) {
    throw new Error(`Not an achromatic oklch color: ${color}`);
  }

  return (Number(match[1]) / (match[2] === '%' ? 100 : 1)) ** 3;
}

/** WCAG contrast ratio of two computed achromatic oklch colors. */
export function contrastRatio(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [
    number,
    number,
  ];

  return (light + 0.05) / (dark + 0.05);
}
