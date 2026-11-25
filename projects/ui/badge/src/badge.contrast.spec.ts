import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { contrastRatio, luminance } from '../../testing/contrast';
import { moveOff, moveOnto } from '../../testing/pointer';
import { ArnBadge } from './badge';
import type { ArnBadgeVariant } from './badge.types';

/** A badge, a link, a dot and a disabled link, all of the same variant, on the test surface. */
const TEMPLATE =
  '<div class="arn-test-surface" [class]="scheme()" [attr.data-surface]="surface()">' +
  '<arn-badge [variant]="variant()">Label</arn-badge> ' +
  '<a arnBadge href="#x" [variant]="variant()">Link</a> ' +
  '<arn-badge class="dot" dot label="Dot" [variant]="variant()" /> ' +
  '<a arnBadge href="#x" class="off" disabled [variant]="variant()">Off</a>' +
  '</div>';

@Component({
  imports: [ArnBadge],
  template: TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly scheme = signal<'light' | 'dark'>('light');
  readonly surface = signal<'background' | 'card'>('background');
  readonly variant = signal<ArnBadgeVariant>('default');
}

type Pair = readonly [light: number, dark: number];

/**
 * Text against fill, per variant, light / dark (decisions 2026-11, "ArnBadge uygulaması"). The
 * values are the measured paint and are the decision. Normal on --arn-background matches the
 * ArnButton normal state; on --arn-card only the transparent outline differs. Link hover is
 * a[arnBadge] under a real pointer, over --arn-background.
 *
 * Disabled links are exempt: WCAG 1.4.3 does not apply to inactive user interface components. The
 * last test only pins their 0.5 opacity; no ratio is required of them.
 */
const EXPECTED: Readonly<Record<ArnBadgeVariant, { background: Pair; card: Pair; hover: Pair }>> = {
  default: { background: [17.16, 14.22], card: [17.16, 14.22], hover: [11.96, 9.77] },
  secondary: { background: [16.42, 14.48], card: [16.42, 14.48], hover: [11.19, 9.73] },
  destructive: { background: [4.76, 6.94], card: [4.76, 6.94], hover: [5.73, 8.74] },
  outline: { background: [19.79, 18.96], card: [19.79, 17.16], hover: [18.15, 14.48] },
};

/**
 * The dot (a graphic, WCAG 1.4.11) against --arn-background, light / dark. Default: --arn-primary;
 * secondary and outline (a ring): --arn-muted-foreground; destructive: the plain --arn-destructive.
 */
const DOT: Readonly<Record<ArnBadgeVariant, Pair>> = {
  default: [17.91, 15.72],
  secondary: [4.73, 7.63],
  destructive: [4.76, 6.84],
  outline: [4.73, 7.63],
};

const VARIANTS = Object.keys(EXPECTED) as ArnBadgeVariant[];
const SCHEMES = ['light', 'dark'] as const;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/** WCAG ratio of the text over the fill, the fill painted over the opaque surface. */
function ratio(badge: HTMLElement, page: string): number {
  const style = getComputedStyle(badge);
  const fill = style.backgroundColor === TRANSPARENT ? page : style.backgroundColor;
  const text = luminance(style.color, page);
  const under = fill === page ? luminance(page) : luminance(fill, page);
  const [light, dark] = [text, under].sort((a, b) => b - a) as [number, number];

  return (light + 0.05) / (dark + 0.05);
}

describe('ArnBadge contrast', () => {
  let fixture: ComponentFixture<Host> | undefined;
  let style: HTMLStyleElement;

  async function render(
    scheme: 'light' | 'dark',
    variant: ArnBadgeVariant,
    surface: 'background' | 'card' = 'background',
  ): Promise<{ root: HTMLElement; page: string; get: (selector: string) => HTMLElement }> {
    const created = TestBed.createComponent(Host);

    fixture = created;
    created.componentInstance.scheme.set(scheme);
    created.componentInstance.variant.set(variant);
    created.componentInstance.surface.set(surface);
    await created.whenStable();

    const root = created.nativeElement as HTMLElement;
    const get = (selector: string): HTMLElement => {
      const found = root.querySelector<HTMLElement>(selector);

      if (!found) {
        throw new Error(`Expected ${selector}`);
      }

      return found;
    };

    return { root, page: getComputedStyle(get('.arn-test-surface')).backgroundColor, get };
  }

  beforeEach(() => {
    style = document.createElement('style');
    style.textContent = `
      .arn-test-surface { background: var(--arn-background); padding: 2rem; }
      .arn-test-surface[data-surface='card'] { background: var(--arn-card); }
    `;
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

        for (const surface of ['background', 'card'] as const) {
          it(`${variant} on --arn-${surface}: ${String(expected[surface][index])}:1`, async () => {
            const { page, get } = await render(scheme, variant, surface);
            const value = ratio(get('arn-badge'), page);

            expect(value.toFixed(2)).toBe(expected[surface][index].toFixed(2));
            expect(value).toBeGreaterThanOrEqual(4.5);
          });
        }

        it(`${variant} link hover: ${String(expected.hover[index])}:1`, async () => {
          const { page, get } = await render(scheme, variant);
          const link = get('a.arn-badge:not(.off)');
          const before = getComputedStyle(link).backgroundColor;

          await moveOnto(link);

          try {
            expect(link.matches(':hover')).toBe(true);
            expect(getComputedStyle(link).backgroundColor).not.toBe(before);
            expect(ratio(link, page).toFixed(2)).toBe(expected.hover[index].toFixed(2));
            expect(ratio(link, page)).toBeGreaterThanOrEqual(4.5);
          } finally {
            await moveOff(link);
          }
        });

        it(`${variant} dot: ${String(DOT[variant][index])}:1 against the background`, async () => {
          const { page, get } = await render(scheme, variant);
          const dot = getComputedStyle(get('.dot'));
          const color = variant === 'outline' ? dot.borderTopColor : dot.backgroundColor;
          const value = contrastRatio(color, page);

          expect(value.toFixed(2)).toBe(DOT[variant][index].toFixed(2));
          expect(value).toBeGreaterThanOrEqual(3);
        });
      }

      // WCAG 1.4.11: the ring is the focus indicator of a link badge, against the page background
      for (const variant of ['default', 'destructive'] as const) {
        it(`${variant} link: the focus ring color has at least 3:1 against the background`, async () => {
          const { page, get } = await render(scheme, variant);
          const ring = getComputedStyle(get('a.arn-badge')).getPropertyValue(
            variant === 'destructive' ? '--arn-destructive' : '--arn-ring',
          );
          const probe = document.createElement('span');

          probe.style.color = ring;
          get('.arn-test-surface').appendChild(probe);

          expect(contrastRatio(getComputedStyle(probe).color, page)).toBeGreaterThanOrEqual(3);
          probe.remove();
        });
      }

      it('a disabled link is exempt from contrast (WCAG 1.4.3); it is only half opaque', async () => {
        const { get } = await render(scheme, 'default');

        expect(getComputedStyle(get('.off')).opacity).toBe('0.5');
      });
    });
  }
});
