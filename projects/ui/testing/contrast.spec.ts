import { contrastRatio, decode, linearRgb, luminance, parseOklch } from './contrast';

const white = 'oklch(1 0 0)';
const black = 'oklch(0 0 0)';

describe('contrast test helper', () => {
  describe('parseOklch', () => {
    it('reads numbers, percentages, deg and alpha as getComputedStyle and theme.css write them', () => {
      expect(parseOklch('oklch(0.577 0.245 27.325)')).toEqual({
        l: 0.577,
        c: 0.245,
        h: 27.325,
        alpha: 1,
      });
      expect(parseOklch('oklch(50% 25% 90deg / 40%)')).toEqual({
        l: 0.5,
        c: 0.1,
        h: 90,
        alpha: 0.4,
      });
      expect(parseOklch('oklch(1 0 none / 0.4)')).toEqual({ l: 1, c: 0, h: 0, alpha: 0.4 });
    });

    it('throws on anything that is not an oklch color in range', () => {
      for (const color of ['rgb(0, 0, 0)', '#fff', 'oklch(0.5 0 0', 'oklch(0.5 0)', '']) {
        expect(() => parseOklch(color)).toThrow(/Not an oklch color/);
      }
      for (const color of ['oklch(1.5 0 0)', 'oklch(0.5 -0.1 0)', 'oklch(0.5 0 0 / 2)']) {
        expect(() => parseOklch(color)).toThrow(/out of range/);
      }
    });
  });

  describe('luminance', () => {
    it('is L³ for an achromatic color, whatever the backdrop', () => {
      expect(luminance('oklch(0.5 0 0)')).toBeCloseTo(0.125, 6);
      expect(luminance('oklch(50% 0 0)', black)).toBeCloseTo(0.125, 6);
      expect(luminance('oklch(0.5 0 0 / 1)', black)).toBeCloseTo(0.125, 6);
    });

    it('composites a translucent color over the backdrop in gamma-encoded sRGB', () => {
      // White at 40% over black is the encoded channel 0.4, linear ≈0.1329 (not 0.4)
      expect(luminance('oklch(1 0 0 / 0.4)', black)).toBeCloseTo(decode(0.4), 6);
      expect(decode(0.4)).toBeCloseTo(0.1329, 4);
      expect(luminance('oklch(1 0 0 / 0.4)', white)).toBeCloseTo(1, 6);
      expect(luminance('oklch(1 0 0 / 0)', 'oklch(0.5 0 0)')).toBeCloseTo(0.125, 6);
    });

    it('composites a translucent chromatic color channel by channel', () => {
      const [r, g, b] = linearRgb('oklch(0.6 0.12 250 / 0.5)', white);

      // Blue over white: the blue channel stays highest, red lowest, all lighter than the opaque blue
      expect(r).toBeLessThan(g);
      expect(g).toBeLessThan(b);
      expect(luminance('oklch(0.6 0.12 250 / 0.5)', white)).toBeGreaterThan(
        luminance('oklch(0.6 0.12 250)'),
      );
    });

    it('clips a color outside the sRGB gamut channel by channel', () => {
      // red-600: its green channel is below 0 before clipping
      expect(linearRgb('oklch(0.577 0.245 27.325)')[1]).toBe(0);
      // red-400: its red channel is above 1 before clipping
      expect(linearRgb('oklch(0.704 0.191 22.216)')[0]).toBe(1);
    });

    // Independent reference: the pixel Chromium paints on an sRGB canvas, read back as 8-bit sRGB
    it('matches what Chromium paints on an sRGB canvas, to 8-bit precision', () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });

      if (!context) {
        throw new Error('No 2D canvas context');
      }

      const painted = (color: string, backdrop: string): number => {
        context.fillStyle = backdrop;
        context.fillRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);

        const [r = 0, g = 0, b = 0] = context.getImageData(0, 0, 1, 1).data;

        return 0.2126 * decode(r / 255) + 0.7152 * decode(g / 255) + 0.0722 * decode(b / 255);
      };
      const cases = [
        ['oklch(0.577 0.245 27.325)', white],
        ['oklch(0.704 0.191 22.216)', white],
        ['oklch(0.6 0.12 250)', white],
        ['oklch(1 0 0 / 0.4)', 'oklch(0.145 0 0)'],
        ['oklch(0.6 0.12 250 / 0.5)', white],
      ] as const;

      for (const [color, backdrop] of cases) {
        expect([color, luminance(color, backdrop)]).toEqual([
          color,
          expect.closeTo(painted(color, backdrop), 2),
        ]);
      }
    });

    it('a translucent color without an opaque backdrop throws', () => {
      expect(() => luminance('oklch(1 0 0 / 0.4)')).toThrow(/opaque backdrop/);
      expect(() => luminance('oklch(1 0 0 / 0.4)', 'oklch(0 0 0 / 0.5)')).toThrow(
        /opaque backdrop/,
      );
    });
  });

  describe('contrastRatio', () => {
    it('is 21:1 for black and white, in either order', () => {
      expect(contrastRatio(black, white)).toBeCloseTo(21, 6);
      expect(contrastRatio(white, black)).toBeCloseTo(21, 6);
      expect(contrastRatio(white, white)).toBeCloseTo(1, 6);
    });

    // The theme's values, as theme.spec.ts and the docs specs read them (decisions 2026-11)
    it('gives the known ratios of the theme colors', () => {
      expect(contrastRatio('oklch(0.556 0 0)', white)).toBeCloseTo(4.7323, 4);
      expect(contrastRatio('oklch(0.556 0 0)', 'oklch(0.145 0 0)')).toBeCloseTo(4.1826, 4);
      expect(contrastRatio('oklch(0.65 0 0)', white)).toBeCloseTo(3.2345, 4);
      expect(contrastRatio('oklch(1 0 0 / 0.4)', 'oklch(0.145 0 0)')).toBeCloseTo(3.7708, 4);
      expect(contrastRatio('oklch(1 0 0 / 0.4)', 'oklch(0.205 0 0)')).toBeCloseTo(3.8244, 4);
    });

    // Reference values from colorjs.io 0.7.1 (Color.contrast(..., 'WCAG21'), which converts through
    // XYZ with its own matrices): 3.931050 and 5.418754. Both colors are inside the sRGB gamut.
    it('agrees with an independent conversion for in-gamut chromatic colors', () => {
      expect(contrastRatio('oklch(0.6 0.12 250)', white)).toBeCloseTo(3.931, 3);
      expect(contrastRatio('oklch(0.5 0.1 145)', 'oklch(0.98 0 0)')).toBeCloseTo(5.4187, 3);
    });

    // Clipped as painted: 4.7647, not the unclipped 4.9140 colorjs.io gives for the same color
    it('uses the clipped color for one outside the sRGB gamut', () => {
      expect(contrastRatio('oklch(0.577 0.245 27.325)', white)).toBeCloseTo(4.7647, 4);
    });

    it('throws for a translucent backdrop or an input that is not oklch', () => {
      expect(() => contrastRatio(white, 'oklch(0 0 0 / 0.5)')).toThrow(/must be opaque/);
      expect(() => contrastRatio('rgb(0, 0, 0)', white)).toThrow(/Not an oklch color/);
    });
  });
});
