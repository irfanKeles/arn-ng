// Used in tests only; not exported from any entry point. The ui and docs specs both import it by
// relative path, like a11y.ts.
//
// Works on oklch colors as getComputedStyle returns them (light-dark() and var() are resolved by
// the browser: read the color on an element inside `.light` or `.dark`).

/** An oklch color: lightness 0–1, chroma, hue in degrees, alpha 0–1. */
export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
  readonly alpha: number;
}

/** Linear-light sRGB channels, 0–1. */
export type LinearRgb = readonly [r: number, g: number, b: number];

const NUMBER = String.raw`[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?`;
const OKLCH = new RegExp(
  String.raw`^oklch\(\s*(${NUMBER})(%?)\s+(${NUMBER})(%?)\s+(${NUMBER}|none)(deg)?` +
    String.raw`(?:\s*\/\s*(${NUMBER})(%?))?\s*\)$`,
  'i',
);

/** Reads `oklch(L C H)` or `oklch(L C H / a)`; anything else throws. */
export function parseOklch(color: string): Oklch {
  const match = OKLCH.exec(color.trim());

  if (!match) {
    throw new Error(`Not an oklch color: ${color}`);
  }

  const [, l = '', lPercent, c = '', cPercent, h = '', , alpha, alphaPercent] = match;
  // CSS Color 4: L 100% = 1, C 100% = 0.4, alpha 100% = 1
  const parsed: Oklch = {
    l: Number(l) / (lPercent ? 100 : 1),
    c: cPercent ? (Number(c) / 100) * 0.4 : Number(c),
    h: h.toLowerCase() === 'none' ? 0 : Number(h),
    alpha: alpha === undefined ? 1 : Number(alpha) / (alphaPercent ? 100 : 1),
  };

  if (parsed.l < 0 || parsed.l > 1 || parsed.c < 0 || parsed.alpha < 0 || parsed.alpha > 1) {
    throw new Error(`oklch value out of range: ${color}`);
  }

  return parsed;
}

/** sRGB transfer function: linear channel → gamma-encoded channel. */
export const encode = (y: number): number =>
  y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055;

/** Inverse sRGB transfer function: gamma-encoded channel → linear channel. */
export const decode = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const clip = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * oklch → OKLab → linear sRGB (Björn Ottosson's matrices, as in CSS Color 4). A channel outside
 * 0–1 (a color outside the sRGB gamut) is clipped, as Chromium paints it on an sRGB surface.
 */
function opaqueLinearRgb({ l: lightness, c, h }: Oklch): LinearRgb {
  const hue = (h * Math.PI) / 180;
  const a = c * Math.cos(hue);
  const b = c * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/**
 * The linear sRGB channels of `color` as painted. A translucent color is composited over the opaque
 * `backdrop` in gamma-encoded sRGB, as the browser paints it.
 */
export function linearRgb(color: string, backdrop?: string): LinearRgb {
  const parsed = parseOklch(color);
  const own = opaqueLinearRgb(parsed);

  if (parsed.alpha === 1) {
    return own;
  }
  if (backdrop === undefined || parseOklch(backdrop).alpha !== 1) {
    throw new Error(`A translucent color needs an opaque backdrop: ${color}`);
  }

  const under = opaqueLinearRgb(parseOklch(backdrop));
  const mix = (top: number, bottom: number): number =>
    decode(parsed.alpha * encode(top) + (1 - parsed.alpha) * encode(bottom));

  return [mix(own[0], under[0]), mix(own[1], under[1]), mix(own[2], under[2])];
}

/** WCAG 2.x relative luminance of `color` (over `backdrop` if it is translucent). */
export function luminance(color: string, backdrop?: string): number {
  const [r, g, b] = linearRgb(color, backdrop);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio of `color` painted over the opaque `backdrop` (1–21). */
export function contrastRatio(color: string, backdrop: string): number {
  if (parseOklch(backdrop).alpha !== 1) {
    throw new Error(`The backdrop must be opaque: ${backdrop}`);
  }

  const [light, dark] = [luminance(color, backdrop), luminance(backdrop)].sort((x, y) => y - x) as [
    number,
    number,
  ];

  return (light + 0.05) / (dark + 0.05);
}
