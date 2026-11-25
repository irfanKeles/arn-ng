import {
  ChangeDetectionStrategy,
  Component,
  type EnvironmentProviders,
  PLATFORM_ID,
  type Provider,
  signal,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { ArnConfigDirective, type ArnDirection } from '@arn-ng/ui/core';
import { cdp, commands, page, userEvent } from 'vitest/browser';
import { a11yViolations, expectNoA11yViolations } from '../../testing/a11y';
import { emulateReducedMotion, isChromium, tabFocusesLinks } from '../../testing/browser';
import { moveOff, moveOnto } from '../../testing/pointer';
import { ArnBadge } from './badge';
import type { ArnBadgeVariant } from './badge.types';

/** The template is set per test (`TestBed.overrideTemplate`); the fields are what it binds. */
@Component({
  selector: 'arn-badge-host',
  imports: [ArnBadge, ArnConfigDirective, RouterLink],
  // Replaced in every test; it uses the imports so the compiler keeps them
  template: '<div arnConfig><a arnBadge routerLink="/next">Next</a></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly variant = signal<ArnBadgeVariant>('default');
  readonly count = signal<number | undefined>(undefined);
  readonly max = signal(99);
  readonly showZero = signal(false);
  readonly dot = signal(false);
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly direction = signal<ArnDirection | undefined>(undefined);
  clicks = 0;

  count$(): void {
    this.clicks++;
  }
}

const VARIANTS: readonly ArnBadgeVariant[] = ['default', 'secondary', 'destructive', 'outline'];

const TOKENS = [
  'bg',
  'fg',
  'border-color',
  'bg-hover',
  'ring-color',
  'height',
  'padding-inline',
  'font-size',
  'icon-size',
  'gap',
  'radius',
  'dot-size',
  'spinner-duration',
].map((name) => `--arn-badge-${name}`);

const ICON = '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12" /></svg>';

describe('ArnBadge', () => {
  let fixture: ComponentFixture<Host> | undefined;

  async function render(
    template: string,
    providers: (Provider | EnvironmentProviders)[] = [],
  ): Promise<{ host: Host; root: HTMLElement }> {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'next', children: [] }]), ...providers],
    });
    TestBed.overrideTemplate(Host, template);

    const created = TestBed.createComponent(Host);

    fixture = created;
    await created.whenStable();

    return { host: created.componentInstance, root: created.nativeElement as HTMLElement };
  }

  async function settle(): Promise<void> {
    await fixture?.whenStable();
  }

  function el(root: Element, selector = '.arn-badge'): HTMLElement {
    const found = root.querySelector<HTMLElement>(selector);

    if (!found) {
      throw new Error(`Expected ${selector}`);
    }

    return found;
  }

  /** A color as the browser resolves it inside `root` (a token, a mix…). */
  function resolved(root: Element, color: string): string {
    const probe = document.createElement('span');

    probe.style.color = color;
    root.appendChild(probe);

    const value = getComputedStyle(probe).color;

    probe.remove();

    return value;
  }

  const size = (element: Element): [number, number] => {
    const rect = element.getBoundingClientRect();

    return [Math.round(rect.width * 100) / 100, Math.round(rect.height * 100) / 100];
  };

  function warnings(): string[] {
    return vi
      .mocked(console.warn)
      .mock.calls.map((call) => String(call[0]))
      .filter((message) => message.includes('ArnBadge'));
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = undefined;
    vi.restoreAllMocks();
  });

  describe('selector', () => {
    it('styles <arn-badge> and a link, and leaves the link its href', async () => {
      const { root } = await render(
        '<arn-badge>New</arn-badge><a arnBadge href="/changelog">v2</a>',
      );
      const [badge, link] = Array.from(root.querySelectorAll('.arn-badge'));

      expect(badge?.nodeName).toBe('ARN-BADGE');
      expect(link?.nodeName).toBe('A');
      expect(link?.getAttribute('href')).toBe('/changelog');
      expect(getComputedStyle(link ?? root).textDecorationLine).toBe('none');
    });

    it('does not match other elements with the attribute', async () => {
      const { root } = await render(
        '<span arnBadge>x</span><button arnBadge type="button">y</button>',
      );

      expect(root.querySelector('.arn-badge')).toBeNull();
    });

    it('projects the content in place, without a wrapper element', async () => {
      const { root } = await render('<arn-badge>New</arn-badge>');

      expect(el(root).children.length).toBe(0);
      expect(el(root).textContent.trim()).toBe('New');
    });

    it('the element is not focusable and has no role', async () => {
      const { root } = await render('<arn-badge>New</arn-badge>');

      expect(el(root).tabIndex).toBe(-1);
      expect(el(root).hasAttribute('role')).toBe(false);
      expect(el(root).hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('variant', () => {
    it('is default when not given and writes each variant on the element', async () => {
      const { host, root } = await render('<arn-badge [variant]="variant()">B</arn-badge>');

      expect(el(root).getAttribute('data-variant')).toBe('default');

      for (const variant of VARIANTS) {
        host.variant.set(variant);
        await settle();

        expect(el(root).getAttribute('data-variant')).toBe(variant);
      }
    });

    it('fills and colors each variant from its semantic tokens', async () => {
      const { host, root } = await render(
        '<div class="light"><arn-badge [variant]="variant()">B</arn-badge></div>',
      );
      const expected: Record<ArnBadgeVariant, [string, string]> = {
        default: ['var(--arn-primary)', 'var(--arn-primary-foreground)'],
        secondary: ['var(--arn-secondary)', 'var(--arn-secondary-foreground)'],
        destructive: ['var(--arn-destructive)', 'var(--arn-destructive-foreground)'],
        outline: ['transparent', 'var(--arn-foreground)'],
      };

      for (const variant of VARIANTS) {
        host.variant.set(variant);
        await settle();

        const style = getComputedStyle(el(root));
        const [bg, fg] = expected[variant];

        expect(style.backgroundColor).toBe(resolved(el(root), bg));
        expect(style.color).toBe(resolved(el(root), fg));
      }
    });

    it('darkens the destructive fill toward the background in dark mode', async () => {
      const { root } = await render(
        '<div class="dark"><arn-badge variant="destructive">B</arn-badge></div>',
      );

      expect(getComputedStyle(el(root)).backgroundColor).toBe(
        resolved(
          el(root),
          'color-mix(in oklch, var(--arn-destructive) 60%, var(--arn-background))',
        ),
      );
    });

    it('outline has an --arn-border border; the others a transparent one, all as tall', async () => {
      const { root } = await render(
        VARIANTS.map((variant) => `<arn-badge variant="${variant}">B</arn-badge>`).join(''),
      );
      const badges = Array.from(root.querySelectorAll<HTMLElement>('.arn-badge'));

      for (const badge of badges) {
        const style = getComputedStyle(badge);
        const outline = badge.getAttribute('data-variant') === 'outline';

        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopColor).toBe(
          outline ? resolved(badge, 'var(--arn-border)') : 'rgba(0, 0, 0, 0)',
        );
        expect(size(badge)[1]).toBe(22);
      }
    });
  });

  describe('size', () => {
    it('is 22px tall with 8px inline padding, a 12px medium font and round corners', async () => {
      const { root } = await render('<arn-badge>Beta</arn-badge>');
      const style = getComputedStyle(el(root));

      expect(size(el(root))[1]).toBe(22);
      expect(style.paddingInlineStart).toBe('8px');
      expect(style.paddingInlineEnd).toBe('8px');
      expect(style.fontSize).toBe('12px');
      expect(style.fontWeight).toBe('500');
      expect(style.borderTopLeftRadius).toBe('9999px');
      expect(style.boxSizing).toBe('border-box');
    });

    it('a single digit is a circle', async () => {
      const { root } = await render('<arn-badge [count]="3" />');

      expect(size(el(root))).toEqual([22, 22]);
    });

    it('has one size: compact density changes nothing', async () => {
      const { root } = await render(
        '<arn-badge>Beta</arn-badge><div data-density="compact"><arn-badge class="c">Beta</arn-badge></div>',
      );

      expect(size(el(root, '.c'))).toEqual(size(el(root)));
    });
  });

  describe('tokens', () => {
    it('defines no --arn-badge-* token on the element: each is read with a fallback', async () => {
      const { root } = await render('<arn-badge>B</arn-badge><a arnBadge href="/x">L</a>');

      for (const badge of Array.from(root.querySelectorAll('.arn-badge'))) {
        const style = getComputedStyle(badge);

        expect(TOKENS.filter((token) => style.getPropertyValue(token) !== '')).toEqual([]);
      }
    });

    it('a token set on a container reaches the badge', async () => {
      const { root } = await render(
        '<div style="--arn-badge-height: 2rem; --arn-badge-bg: rgb(1, 2, 3)"><arn-badge>B</arn-badge></div>',
      );

      expect(size(el(root))[1]).toBe(32);
      expect(getComputedStyle(el(root)).backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('a token set on the element itself applies to that one', async () => {
      const { root } = await render(
        '<arn-badge style="--arn-badge-radius: 2px">B</arn-badge><arn-badge class="other">B</arn-badge>',
      );

      expect(getComputedStyle(el(root)).borderTopLeftRadius).toBe('2px');
      expect(getComputedStyle(el(root, '.other')).borderTopLeftRadius).toBe('9999px');
    });

    it('a single-class rule of the consumer wins over the library rules (:where)', async () => {
      const style = document.createElement('style');

      style.textContent = '.brand { background: rgb(4, 5, 6); padding-inline: 2px; }';
      document.head.appendChild(style);

      try {
        const { root } = await render('<arn-badge class="brand" variant="secondary">B</arn-badge>');
        const computed = getComputedStyle(el(root));

        expect(computed.backgroundColor).toBe('rgb(4, 5, 6)');
        expect(computed.paddingInlineStart).toBe('2px');
      } finally {
        style.remove();
      }
    });
  });

  describe('count', () => {
    it('shows the count instead of the content', async () => {
      const { root } = await render('<arn-badge [count]="7">ignored</arn-badge>');

      expect(el(root).textContent.trim()).toBe('7');
    });

    it('takes a static count attribute', async () => {
      const { root } = await render('<arn-badge count="5" />');

      expect(el(root).textContent.trim()).toBe('5');
    });

    it('is hidden at 0 and shows "0" with showZero', async () => {
      const { host, root } = await render(
        '<arn-badge [count]="count()" [showZero]="showZero()" />',
      );

      host.count.set(0);
      await settle();

      expect(el(root).hasAttribute('data-hidden')).toBe(true);
      expect(getComputedStyle(el(root)).display).toBe('none');

      host.showZero.set(true);
      await settle();

      expect(el(root).hasAttribute('data-hidden')).toBe(false);
      expect(getComputedStyle(el(root)).display).toBe('inline-flex');
      expect(el(root).textContent.trim()).toBe('0');
    });

    it('shows max followed by "+" above max (99 by default) and follows changes', async () => {
      const { host, root } = await render('<arn-badge [count]="count()" [max]="max()" />');

      for (const [count, max, text] of [
        [99, 99, '99'],
        [100, 99, '99+'],
        [10, 9, '9+'],
        [9, 9, '9'],
      ] as const) {
        host.count.set(count);
        host.max.set(max);
        await settle();

        expect(el(root).textContent.trim()).toBe(text);
      }
    });

    it('a count that is not a whole number of 0 or more is hidden and warned about', async () => {
      const { root } = await render(
        '<arn-badge [count]="-1" /><arn-badge class="b" [count]="2.5" />',
      );

      expect(getComputedStyle(el(root)).display).toBe('none');
      expect(getComputedStyle(el(root, '.b')).display).toBe('none');
      expect(warnings()).toEqual([
        '[@arn-ng/ui] ArnBadge: count must be a whole number of 0 or more; the badge is hidden.',
        '[@arn-ng/ui] ArnBadge: count must be a whole number of 0 or more; the badge is hidden.',
      ]);
    });

    it('a max below 1 is warned about and 99 is used', async () => {
      const { root } = await render('<arn-badge [count]="150" [max]="0" />');

      expect(el(root).textContent.trim()).toBe('99+');
      expect(warnings()).toEqual([
        '[@arn-ng/ui] ArnBadge: max must be a whole number of 1 or more; 99 is used.',
      ]);
    });

    it('without a count it shows the content; empty content hides it', async () => {
      const { root } = await render('<arn-badge>New</arn-badge><arn-badge class="e"></arn-badge>');

      expect(getComputedStyle(el(root)).display).toBe('inline-flex');
      expect(getComputedStyle(el(root, '.e')).display).toBe('none');
      expect(warnings()).toEqual([]);
    });
  });

  describe('dot', () => {
    it('is an 8px circle without text, the content and the count not shown', async () => {
      const { root } = await render('<arn-badge dot label="Online" [count]="3">x</arn-badge>');
      const badge = el(root);

      expect(size(badge)).toEqual([8, 8]);
      expect(badge.hasAttribute('data-dot')).toBe(true);
      expect(getComputedStyle(badge).borderTopLeftRadius).toBe('9999px');
      expect(el(root, '.arn-badge-dot').getAttribute('aria-hidden')).toBe('true');
      expect(badge.textContent.trim()).toBe('Online');
    });

    it('is never :empty (ArnButton hides an empty corner badge)', async () => {
      const { root } = await render(
        '<arn-badge dot label="Online" /><arn-badge class="n" dot arnButtonBadge />',
      );

      expect(el(root).matches(':empty')).toBe(false);
      expect(el(root, '.n').matches(':empty')).toBe(false);
    });

    it('gives the label to assistive technology as visually hidden text', async () => {
      const { root } = await render('<arn-badge dot label="Online" />');
      const label = el(root, '.arn-badge-label');

      expect(label.textContent.trim()).toBe('Online');
      expect(size(label)).toEqual([1, 1]);
      expect(getComputedStyle(label).clipPath).toBe('inset(50%)');
    });

    it('keeps the label in the accessibility tree: not hidden from screen readers', async () => {
      const { root } = await render('<arn-badge dot label="Online" />');
      const label = el(root, '.arn-badge-label');
      const style = getComputedStyle(label);

      // Visually hidden is fine; hidden from assistive technology is not
      expect(label.closest('[aria-hidden="true"], [hidden], [inert]')).toBeNull();
      expect(style.display).not.toBe('none');
      expect(style.visibility).toBe('visible');
      expect(style.contentVisibility).not.toBe('hidden');

      if (!isChromium) {
        // Firefox and WebKit (Playwright) have no CDP: Playwright's ARIA snapshot, computed by
        // Playwright itself (not the browser's tree), must still contain the label
        expect(await commands.arnAriaSnapshot(page.elementLocator(label).selector)).toContain(
          'Online',
        );

        return;
      }

      // What Chromium gives to a screen reader: an exposed (not ignored) text node "Online". The
      // test runs in a child frame of the runner page, so every frame's tree is read.
      const { frameTree } = await cdp().send('Page.getFrameTree');
      const frames: string[] = [];
      const collect = (tree: typeof frameTree): void => {
        frames.push(tree.frame.id);
        tree.childFrames?.forEach(collect);
      };

      collect(frameTree);

      const trees = await Promise.all(
        frames.map((frameId) => cdp().send('Accessibility.getFullAXTree', { frameId })),
      );
      const exposed = trees
        .flatMap((tree) => tree.nodes)
        .filter((node) => !node.ignored && node.name?.value === 'Online');

      expect(exposed.length).toBeGreaterThan(0);
    });

    it('warns without a label, except on the corner of a button', async () => {
      await render(
        '<arn-badge dot /><arn-badge dot arnButtonBadge /><arn-badge dot label="Away" />',
      );

      expect(warnings()).toEqual([
        '[@arn-ng/ui] ArnBadge: a dot badge has no accessible name. Give it a label.',
      ]);
    });

    it('uses the label in dot mode only', async () => {
      const { root } = await render('<arn-badge label="ignored">New</arn-badge>');

      expect(root.querySelector('.arn-badge-label')).toBeNull();
      expect(el(root).textContent.trim()).toBe('New');
    });

    it('secondary and outline dots use --arn-muted-foreground (fill and ring)', async () => {
      const { root } = await render(
        '<arn-badge dot label="a" variant="secondary" /><arn-badge class="o" dot label="b" variant="outline" />',
      );
      const muted = resolved(root, 'var(--arn-muted-foreground)');

      expect(getComputedStyle(el(root)).backgroundColor).toBe(muted);
      expect(getComputedStyle(el(root, '.o')).borderTopColor).toBe(muted);
      expect(getComputedStyle(el(root, '.o')).borderTopWidth).toBe('1px');
    });
  });

  describe('corner of a button', () => {
    it('is hidden from assistive technology with arnButtonBadge', async () => {
      const { root } = await render('<arn-badge arnButtonBadge [count]="3" />');

      expect(el(root).getAttribute('aria-hidden')).toBe('true');
    });

    it("keeps the consumer's own aria-hidden elsewhere", async () => {
      const { root } = await render(
        '<arn-badge aria-hidden="true">New</arn-badge><arn-badge class="b">New</arn-badge>',
      );

      expect(el(root).getAttribute('aria-hidden')).toBe('true');
      expect(el(root, '.b').hasAttribute('aria-hidden')).toBe(false);
    });
  });

  describe('icons', () => {
    it('sizes an <svg> to 12px, 4px from the text, on either side or both', async () => {
      const { root } = await render(`<arn-badge>${ICON}Verified${ICON}</arn-badge>`);
      const [start, end] = Array.from(root.querySelectorAll<SVGElement>('svg'));
      const style = getComputedStyle(el(root));

      expect(start && size(start)).toEqual([12, 12]);
      expect(end && size(end)).toEqual([12, 12]);
      expect(style.columnGap).toBe('4px');
      expect(start && getComputedStyle(start).pointerEvents).toBe('none');
      expect(start && getComputedStyle(start).flexShrink).toBe('0');
    });

    it('mirrors a directional icon in rtl only with .arn-rtl-mirror (the consumer adds it)', async () => {
      const { host, root } = await render(
        `<div arnConfig [direction]="direction()">
           <arn-badge>Next <svg class="arn-rtl-mirror" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" /></svg></arn-badge>
           <arn-badge class="plain">Next ${ICON}</arn-badge>
         </div>`,
      );

      host.direction.set('rtl');
      await settle();

      expect(getComputedStyle(el(root, '.arn-rtl-mirror')).scale).toBe('-1 1');
      expect(getComputedStyle(el(root, '.plain svg')).scale).toBe('none');
      expect(getComputedStyle(el(root)).direction).toBe('rtl');
    });
  });

  describe('loading', () => {
    it('shows a spinner in place of the start icon, keeps the text and sets aria-busy', async () => {
      const { host, root } = await render(
        `<arn-badge [loading]="loading()">${ICON}Syncing</arn-badge>`,
      );

      expect(root.querySelector('.arn-badge-spinner')).toBeNull();
      expect(el(root).hasAttribute('aria-busy')).toBe(false);

      host.loading.set(true);
      await settle();

      const spinner = el(root, '.arn-badge-spinner');

      expect(spinner.getAttribute('aria-hidden')).toBe('true');
      expect(size(spinner)).toEqual([12, 12]);
      expect(getComputedStyle(el(root, '.icon')).display).toBe('none');
      expect(el(root).textContent.trim()).toBe('Syncing');
      expect(el(root).getAttribute('aria-busy')).toBe('true');
      expect(el(root).hasAttribute('data-loading')).toBe(true);
    });

    it('keeps an end icon when there is a start icon', async () => {
      const { root } = await render(
        `<arn-badge loading>${ICON}Syncing<svg class="end" viewBox="0 0 16 16" aria-hidden="true"></svg></arn-badge>`,
      );

      expect(getComputedStyle(el(root, '.end')).display).toBe('block');
    });

    it('hides a lone end icon too (documented limit: the svg right after the spinner)', async () => {
      const { root } = await render(`<arn-badge loading>Syncing${ICON}</arn-badge>`);

      expect(getComputedStyle(el(root, '.icon')).display).toBe('none');
    });

    it('turns once a second, and three times slower under reduced motion', async () => {
      const { root } = await render('<arn-badge loading>Syncing</arn-badge>');
      const spinner = el(root, '.arn-badge-spinner');

      expect(getComputedStyle(spinner).animationName).toBe('arn-badge-spin');
      expect(getComputedStyle(spinner).animationDuration).toBe('1s');

      await emulateReducedMotion(true);

      try {
        expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
        expect(getComputedStyle(spinner).animationDuration).toBe('3s');
        expect(getComputedStyle(spinner).animationName).toBe('arn-badge-spin');
      } finally {
        await emulateReducedMotion(false);
      }
    });

    it('is ignored, with a warning, on a dot', async () => {
      const { root } = await render('<arn-badge dot label="Online" loading />');

      expect(root.querySelector('.arn-badge-spinner')).toBeNull();
      expect(el(root).hasAttribute('aria-busy')).toBe(false);
      expect(warnings()).toEqual(['[@arn-ng/ui] ArnBadge: loading is ignored on a dot badge.']);
    });

    it('works with a count', async () => {
      const { root } = await render('<arn-badge loading [count]="4" />');

      expect(root.querySelector('.arn-badge-spinner')).not.toBeNull();
      expect(el(root).textContent.trim()).toBe('4');
    });
  });

  describe('link', () => {
    it('only a link changes on hover', async () => {
      const { root } = await render(
        '<div class="light"><a arnBadge href="/x">Link</a> <arn-badge class="static">Static</arn-badge></div>',
      );

      for (const [badge, changes] of [
        [el(root), true],
        [el(root, '.static'), false],
      ] as const) {
        const before = getComputedStyle(badge).backgroundColor;

        await moveOnto(badge);

        try {
          expect(badge.matches(':hover')).toBe(true);
          expect(getComputedStyle(badge).backgroundColor !== before).toBe(changes);
        } finally {
          await moveOff(badge);
        }
      }
    });

    it('outline hovers to --arn-muted', async () => {
      const { root } = await render('<a arnBadge href="/x" variant="outline">Link</a>');

      await moveOnto(el(root));

      try {
        expect(getComputedStyle(el(root)).backgroundColor).toBe(resolved(root, 'var(--arn-muted)'));
      } finally {
        await moveOff(el(root));
      }
    });

    it('draws a 3px ring in --arn-ring on keyboard focus, the border in the ring color', async ({
      skip,
    }) => {
      skip(!(await tabFocusesLinks(document)), 'engine does not Tab-focus links');

      const { root } = await render('<a arnBadge href="/x" variant="outline">Link</a>');
      const link = el(root);

      window.focus(); // the test frame, so Tab moves inside it
      document.body.focus();
      await userEvent.tab();

      expect(document.activeElement).toBe(link);
      expect(link.matches(':focus-visible')).toBe(true);

      const style = getComputedStyle(link);
      const ring = resolved(root, 'var(--arn-ring)');

      expect(style.boxShadow).toContain(`${ring} 0px 0px 0px 3px`);
      expect(style.borderTopColor).toBe(ring);
      expect([style.outlineStyle, style.outlineColor, style.outlineWidth]).toEqual([
        'solid',
        'rgba(0, 0, 0, 0)',
        '3px',
      ]);
    });

    it('uses --arn-destructive for the destructive ring', async ({ skip }) => {
      skip(!(await tabFocusesLinks(document)), 'engine does not Tab-focus links');

      const { root } = await render('<a arnBadge href="/x" variant="destructive">Link</a>');

      window.focus(); // the test frame, so Tab moves inside it
      document.body.focus();
      await userEvent.tab();

      expect(getComputedStyle(el(root)).boxShadow).toContain(
        `${resolved(root, 'var(--arn-destructive)')} 0px 0px 0px 3px`,
      );
    });

    it('Tab skips <arn-badge>', async ({ skip }) => {
      skip(!(await tabFocusesLinks(document)), 'engine does not Tab-focus links');

      const { root } = await render(
        '<arn-badge>Static</arn-badge><a arnBadge href="/x" class="next">Link</a>',
      );

      window.focus(); // the test frame, so Tab moves inside it
      document.body.focus();
      await userEvent.tab();

      expect(document.activeElement).toBe(el(root, '.next'));
    });

    it('draws the ring for focus() too, where the engine matches :focus-visible', async ({
      skip,
    }) => {
      const { root } = await render('<a arnBadge href="/x" variant="outline">Link</a>');
      const link = el(root);

      link.focus();

      expect(document.activeElement).toBe(link);
      skip(!link.matches(':focus-visible'), 'engine does not match :focus-visible after focus()');
      expect(getComputedStyle(link).boxShadow).toContain(
        `${resolved(root, 'var(--arn-ring)')} 0px 0px 0px 3px`,
      );
    });
  });

  describe('disabled link', () => {
    function click(element: HTMLElement): MouseEvent {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });

      element.dispatchEvent(event);

      return event;
    }

    it('is aria-disabled, out of the tab order, half opaque and keeps its href', async () => {
      const { root } = await render('<a arnBadge href="/x" tabindex="0" disabled>Link</a>');
      const link = el(root);

      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.getAttribute('href')).toBe('/x');
      expect(getComputedStyle(link).opacity).toBe('0.5');
    });

    it('cancels the click and stops the (click) of the template', async () => {
      const { host, root } = await render(
        '<a arnBadge href="/x" [disabled]="disabled()" (click)="count$()">Link</a>',
      );

      host.disabled.set(true);
      await settle();

      expect(click(el(root)).defaultPrevented).toBe(true);
      expect(host.clicks).toBe(0);
    });

    it('stops RouterLink while disabled and lets it navigate once enabled', async () => {
      const { host, root } = await render(
        '<a arnBadge routerLink="/next" [disabled]="disabled()">Next</a>',
      );
      const router = TestBed.inject(Router);

      host.disabled.set(true);
      await settle();
      click(el(root));
      await settle();

      expect(router.url).toBe('/');

      host.disabled.set(false);
      await settle();

      expect(el(root).hasAttribute('aria-disabled')).toBe(false);
      expect(el(root).hasAttribute('tabindex')).toBe(false);

      click(el(root));
      await settle();

      expect(router.url).toBe('/next');
    });

    it('has no hover while disabled', async () => {
      const { root } = await render('<a arnBadge href="/x" disabled>Link</a>');
      const before = getComputedStyle(el(root)).backgroundColor;

      await moveOnto(el(root));

      try {
        expect(getComputedStyle(el(root)).backgroundColor).toBe(before);
      } finally {
        await moveOff(el(root));
      }
    });

    it('on <arn-badge> it does nothing but warn', async () => {
      const { root } = await render('<arn-badge disabled>Static</arn-badge>');

      expect(el(root).hasAttribute('aria-disabled')).toBe(false);
      expect(el(root).hasAttribute('tabindex')).toBe(false);
      expect(getComputedStyle(el(root)).opacity).toBe('1');
      expect(warnings()).toEqual([
        '[@arn-ng/ui] ArnBadge: disabled applies to a[arnBadge] only; <arn-badge> is not interactive.',
      ]);
    });
  });

  describe('a11y', () => {
    const modes = [
      { name: 'light', attributes: 'class="light"' },
      { name: 'dark', attributes: 'class="dark"' },
      { name: 'rtl', attributes: 'class="light" dir="rtl"' },
      { name: 'compact', attributes: 'class="light" data-density="compact"' },
    ];

    for (const scheme of ['light', 'dark']) {
      it(`a disabled link of every variant passes axe in ${scheme} mode`, async () => {
        const { root } = await render(
          `<div class="${scheme}" style="background: var(--arn-background); padding: 1rem">
             ${VARIANTS.map((variant) => `<a arnBadge href="/x" disabled variant="${variant}">${variant}</a>`).join(' ')}
           </div>`,
        );

        expect(await a11yViolations(root)).toEqual([]);
      });
    }

    for (const mode of modes) {
      it(`has no axe violations in ${mode.name} mode`, async () => {
        const { root } = await render(
          `<div ${mode.attributes} style="background: var(--arn-background); color: var(--arn-foreground); padding: 1rem">
             ${VARIANTS.map((variant) => `<arn-badge variant="${variant}">${variant}</arn-badge>`).join(' ')}
             ${VARIANTS.map((variant) => `<a arnBadge href="/x" variant="${variant}">${variant}</a>`).join(' ')}
             <arn-badge [count]="120" />
             <arn-badge dot label="Online" />
             <arn-badge loading>${ICON}Syncing</arn-badge>
           </div>`,
        );

        await expectNoA11yViolations(root);
      });
    }
  });
});

describe('ArnBadge on the server', () => {
  it('renders without an error or a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    TestBed.overrideTemplate(
      Host,
      '<arn-badge dot /><arn-badge [count]="-1" /><a arnBadge href="/x" disabled>X</a>',
    );

    const fixture = TestBed.createComponent(Host);

    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('a')?.getAttribute('tabindex')).toBe('-1');
    expect(warn).not.toHaveBeenCalled();
    fixture.destroy();
    warn.mockRestore();
  });
});
