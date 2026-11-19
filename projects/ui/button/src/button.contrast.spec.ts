import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { contrastRatio, luminance } from '../../testing/contrast';
import { moveOff, moveOnto, pressAndHold } from '../../testing/pointer';
import { ArnButton } from './button';
import type { ArnButtonVariant } from './button.types';

@Component({
  imports: [ArnButton],
  template: `
    <div class="arn-test-surface" [class]="scheme()">
      <button arnButton type="button" [variant]="variant()">Label</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly scheme = signal<'light' | 'dark'>('light');
  readonly variant = signal<ArnButtonVariant>('default');
}

type Pair = readonly [light: number, dark: number];

/**
 * Text against fill, painted over --arn-background, per state (decisions 2026-11, "ArnButton
 * uygulaması"). Values the decision fixed: default, secondary (normal), destructive, outline and
 * link (normal). The rest are what the chosen formulas give, locked here.
 *
 * Destructive: the decision is the painted value. Chromium interpolates the hue of the neutral end
 * (`oklch(… 0 0deg)`: --arn-black, neutral-950) as 0deg, not as missing, so the mix drifts a
 * little toward 0deg; computing with the hue as missing gives 0.02-0.03 more except light normal.
 */
const EXPECTED: Readonly<Record<ArnButtonVariant, Record<'normal' | 'hover' | 'active', Pair>>> = {
  default: { normal: [17.16, 14.22], hover: [12.96, 11.51], active: [9.12, 9.15] },
  secondary: { normal: [16.42, 14.48], hover: [16.72, 15.52], active: [13.02, 11.23] },
  destructive: { normal: [4.76, 6.94], hover: [5.73, 8.74], active: [6.92, 10.91] },
  outline: { normal: [19.79, 18.96], hover: [16.42, 14.48], active: [13.02, 11.23] },
  ghost: { normal: [19.79, 18.96], hover: [16.42, 14.48], active: [13.02, 11.23] },
  link: { normal: [17.91, 15.72], hover: [17.91, 15.72], active: [17.91, 15.72] },
};

const VARIANTS = Object.keys(EXPECTED) as ArnButtonVariant[];
const SCHEMES = ['light', 'dark'] as const;

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/** WCAG ratio of the text over the fill, the fill painted over the opaque page background. */
function ratio(button: HTMLElement, page: string): number {
  const style = getComputedStyle(button);
  const fill = style.backgroundColor === TRANSPARENT ? page : style.backgroundColor;
  const text = luminance(style.color, page);
  const under = fill === page ? luminance(page) : luminance(fill, page);
  const [light, dark] = [text, under].sort((a, b) => b - a) as [number, number];

  return (light + 0.05) / (dark + 0.05);
}

describe('ArnButton contrast', () => {
  let fixture: ComponentFixture<Host> | undefined;
  let style: HTMLStyleElement;

  async function render(
    scheme: 'light' | 'dark',
    variant: ArnButtonVariant,
  ): Promise<{ button: HTMLElement; page: string }> {
    const created = TestBed.createComponent(Host);

    fixture = created;
    created.componentInstance.scheme.set(scheme);
    created.componentInstance.variant.set(variant);
    await created.whenStable();

    const root = created.nativeElement as HTMLElement;
    const surface = root.querySelector<HTMLElement>('.arn-test-surface');
    const button = root.querySelector<HTMLElement>('button');

    if (!surface || !button) {
      throw new Error('Expected the surface and the button');
    }

    return { button, page: getComputedStyle(surface).backgroundColor };
  }

  beforeEach(() => {
    style = document.createElement('style');
    style.textContent = `.arn-test-surface { background: var(--arn-background); padding: 2rem; }`;
    document.head.appendChild(style);
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = undefined;
    style.remove();
  });

  it('the test page reports a hovering pointer, so the hover rules apply', () => {
    expect(matchMedia('(hover: hover)').matches).toBe(true);
  });

  for (const scheme of SCHEMES) {
    const index = scheme === 'light' ? 0 : 1;

    describe(`${scheme} mode`, () => {
      for (const variant of VARIANTS) {
        const expected = EXPECTED[variant];

        it(`${variant}: normal ${String(expected.normal[index])}:1`, async () => {
          const { button, page } = await render(scheme, variant);

          expect(ratio(button, page).toFixed(2)).toBe(expected.normal[index].toFixed(2));
          expect(ratio(button, page)).toBeGreaterThanOrEqual(4.5);
        });

        it(`${variant}: hover ${String(expected.hover[index])}:1`, async () => {
          const { button, page } = await render(scheme, variant);
          const before = getComputedStyle(button).backgroundColor;

          await moveOnto(button);

          try {
            expect(button.matches(':hover')).toBe(true);
            expect(ratio(button, page).toFixed(2)).toBe(expected.hover[index].toFixed(2));
            expect(ratio(button, page)).toBeGreaterThanOrEqual(4.5);

            if (variant !== 'link') {
              expect(getComputedStyle(button).backgroundColor).not.toBe(before);
            }
          } finally {
            await moveOff(button);
          }
        });

        it(`${variant}: active ${String(expected.active[index])}:1`, async () => {
          const { button, page } = await render(scheme, variant);
          const release = await pressAndHold(button);

          try {
            expect(button.matches(':active')).toBe(true);
            expect(ratio(button, page).toFixed(2)).toBe(expected.active[index].toFixed(2));
            expect(ratio(button, page)).toBeGreaterThanOrEqual(4.5);
          } finally {
            await release();
            await moveOff(button);
          }
        });
      }

      // WCAG 1.4.11: the ring is the focus indicator, against the page background
      for (const variant of ['default', 'destructive'] as const) {
        it(`${variant}: the focus ring color has at least 3:1 against the background`, async () => {
          const { button, page } = await render(scheme, variant);
          const ring = getComputedStyle(button).getPropertyValue(
            variant === 'destructive' ? '--arn-destructive' : '--arn-ring',
          );
          const probe = document.createElement('span');

          probe.style.color = ring;
          button.parentElement?.appendChild(probe);

          expect(contrastRatio(getComputedStyle(probe).color, page)).toBeGreaterThanOrEqual(3);
          probe.remove();
        });
      }
    });
  }
});
