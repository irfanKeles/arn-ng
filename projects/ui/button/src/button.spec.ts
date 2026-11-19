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
import {
  ArnConfigDirective,
  ArnConfigService,
  type ArnDirection,
  type ArnSize,
  provideArn,
} from '@arn-ng/ui/core';
import { userEvent } from 'vitest/browser';
import { a11yViolations, expectNoA11yViolations } from '../../testing/a11y';
import { pressAndHold } from '../../testing/pointer';
import { ArnButton } from './button';
import type { ArnButtonVariant } from './button.types';

/** The template is set per test (`TestBed.overrideTemplate`); the fields are what it binds. */
@Component({
  selector: 'arn-button-host',
  imports: [ArnButton, ArnConfigDirective, RouterLink],
  // Replaced in every test; it uses the imports so the compiler keeps them
  template: '<div arnConfig><a arnButton routerLink="/next">Next</a></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly variant = signal<ArnButtonVariant>('default');
  readonly size = signal<ArnSize | undefined>(undefined);
  readonly sectionSize = signal<ArnSize | undefined>(undefined);
  readonly direction = signal<ArnDirection | undefined>(undefined);
  readonly disabled = signal(false);
  readonly iconOnly = signal(false);
  readonly round = signal(false);
  readonly ripple = signal<boolean | undefined>(undefined);
  readonly scheme = signal('light');
  clicks = 0;

  count(): void {
    this.clicks++;
  }
}

const VARIANTS: readonly ArnButtonVariant[] = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'ghost',
  'link',
];
const SIZES: readonly ArnSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

/** The control tokens per size, in rem (tokens-sizes.md §3). */
const REM = {
  height: { xs: 1.5, sm: 2, md: 2.25, lg: 2.5, xl: 3 },
  padding: { xs: 0.5, sm: 0.75, md: 1, lg: 1.5, xl: 2 },
  font: { xs: 0.75, sm: 0.875, md: 0.875, lg: 0.875, xl: 1 },
  icon: { xs: 0.75, sm: 1, md: 1, lg: 1, xl: 1.25 },
  gap: { xs: 0.25, sm: 0.375, md: 0.5, lg: 0.5, xl: 0.5 },
} satisfies Record<string, Record<ArnSize, number>>;

const TOKENS = [
  'bg',
  'fg',
  'border-color',
  'bg-hover',
  'bg-active',
  'ring-color',
  'height',
  'padding-inline',
  'font-size',
  'icon-size',
  'gap',
  'radius',
].map((name) => `--arn-button-${name}`);

const ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12" /></svg>';

describe('ArnButton', () => {
  let fixture: ComponentFixture<Host> | undefined;
  let rem: number;

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

  function el(root: Element, selector = '.arn-button'): HTMLElement {
    const found = root.querySelector<HTMLElement>(selector);

    if (!found) {
      throw new Error(`Expected ${selector}`);
    }

    return found;
  }

  /** The native <button>, typed. */
  function nativeButton(root: Element): HTMLButtonElement {
    const found = el(root, 'button');

    if (!(found instanceof HTMLButtonElement)) {
      throw new Error('Expected a <button>');
    }

    return found;
  }

  const px = (value: string): number => Math.round(parseFloat(value) * 1000) / 1000;
  const heightOf = (element: Element): number => px(String(element.getBoundingClientRect().height));
  const widthOf = (element: Element): number => px(String(element.getBoundingClientRect().width));

  beforeEach(() => {
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = undefined;
    vi.restoreAllMocks();
  });

  describe('selector', () => {
    it('styles a native button and a link, and leaves the element and its attributes alone', async () => {
      const { root } = await render(
        `<button arnButton type="submit" name="save" value="1" form="f">Save</button>
         <a arnButton href="/docs">Docs</a>`,
      );
      const button = nativeButton(root);
      const link = el(root, 'a');

      expect(button.classList.contains('arn-button')).toBe(true);
      expect(link.classList.contains('arn-button')).toBe(true);
      expect([button.type, button.name, button.value, button.getAttribute('form')]).toEqual([
        'submit',
        'save',
        '1',
        'f',
      ]);
      expect(link.getAttribute('href')).toBe('/docs');
    });

    it('does not match other elements', async () => {
      const { root } = await render('<div arnButton>Not a button</div>');

      expect(root.querySelector('.arn-button')).toBeNull();
    });

    it('projects the content in place, without a wrapper element', async () => {
      const { root } = await render('<button arnButton type="button">Save</button>');

      expect(el(root).children.length).toBe(0);
      expect(el(root).textContent.trim()).toBe('Save');
    });

    it('keeps a class of the consumer next to its own', async () => {
      const { root } = await render('<button arnButton type="button" class="mine">Save</button>');

      expect([...el(root).classList].sort()).toEqual(['arn-button', 'mine']);
    });
  });

  describe('variant', () => {
    it('is default when not given', async () => {
      const { root } = await render('<button arnButton type="button">Save</button>');

      expect(el(root).getAttribute('data-variant')).toBe('default');
    });

    it('writes each variant on the element', async () => {
      const { host, root } = await render(
        '<button arnButton type="button" [variant]="variant()">Save</button>',
      );

      for (const variant of VARIANTS) {
        host.variant.set(variant);
        await settle();

        expect(el(root).getAttribute('data-variant')).toBe(variant);
      }
    });

    it('every variant has a 1px border and the same height', async () => {
      const { host, root } = await render(
        '<button arnButton type="button" [variant]="variant()">Save</button>',
      );
      const heights: number[] = [];

      for (const variant of VARIANTS) {
        host.variant.set(variant);
        await settle();

        const style = getComputedStyle(el(root));

        expect([variant, style.borderTopWidth, style.borderTopStyle]).toEqual([
          variant,
          '1px',
          'solid',
        ]);
        heights.push(heightOf(el(root)));
      }

      expect(new Set(heights)).toEqual(new Set([2.25 * rem]));
    });

    it('the link variant underlines only on hover', async () => {
      const { root } = await render(
        '<a arnButton variant="link" href="/docs">Docs</a><span>away</span>',
      );
      const link = el(root);

      expect(getComputedStyle(link).textDecorationLine).toBe('none');
      await userEvent.hover(link);

      expect(getComputedStyle(link).textDecorationLine).toBe('underline');
      await userEvent.unhover(link);
    });
  });

  describe('size', () => {
    it('follows the control tokens at every size, border inside the height', async () => {
      const { host, root } = await render(
        `<button arnButton type="button" [size]="size()">${ICON} Save</button>`,
      );

      for (const size of SIZES) {
        host.size.set(size);
        await settle();

        const button = el(root);
        const style = getComputedStyle(button);
        const icon = el(root, 'svg');

        expect(style.boxSizing).toBe('border-box');
        expect([size, heightOf(button)]).toEqual([size, REM.height[size] * rem]);
        expect([size, px(style.paddingInlineStart), px(style.paddingInlineEnd)]).toEqual([
          size,
          REM.padding[size] * rem,
          REM.padding[size] * rem,
        ]);
        expect([size, px(style.fontSize)]).toEqual([size, REM.font[size] * rem]);
        expect([size, px(style.columnGap)]).toEqual([size, REM.gap[size] * rem]);
        expect([size, widthOf(icon), heightOf(icon)]).toEqual([
          size,
          REM.icon[size] * rem,
          REM.icon[size] * rem,
        ]);
      }
    });

    it('the radius is --arn-radius × 0.8 and follows the base set in a container', async () => {
      const { root } = await render(
        `<button arnButton type="button">Save</button>
         <div style="--arn-radius: 20px"><button arnButton type="button" class="inner">In</button></div>`,
      );

      expect(px(getComputedStyle(el(root)).borderTopLeftRadius)).toBe(0.625 * rem * 0.8);
      expect(px(getComputedStyle(el(root, '.inner')).borderTopLeftRadius)).toBe(16);
    });
  });

  describe('density', () => {
    it('compact scales height and inline padding, not font, icon or gap', async () => {
      const { host, root } = await render(
        `<div data-density="compact">
           <button arnButton type="button" [size]="size()">${ICON} Save</button>
         </div>`,
      );

      for (const size of SIZES) {
        host.size.set(size);
        await settle();

        const style = getComputedStyle(el(root));
        // xs would be 21px; the --arn-control-min-size floor keeps it at 24px (WCAG 2.2 SC 2.5.8)
        const height = size === 'xs' ? 1.5 * rem : REM.height[size] * rem * 0.875;

        expect([size, heightOf(el(root))]).toEqual([size, px(String(height))]);
        expect([size, px(style.paddingInlineStart)]).toEqual([
          size,
          px(String(REM.padding[size] * rem * 0.875)),
        ]);
        expect([size, px(style.fontSize)]).toEqual([size, REM.font[size] * rem]);
        expect([size, px(style.columnGap)]).toEqual([size, REM.gap[size] * rem]);
        expect([size, widthOf(el(root, 'svg'))]).toEqual([size, REM.icon[size] * rem]);
      }
    });

    it('with nested density the nearest one applies', async () => {
      const { root } = await render(
        `<div data-density="compact">
           <button arnButton type="button" class="outer">Outer</button>
           <div data-density="comfortable"><button arnButton type="button" class="inner">In</button></div>
         </div>`,
      );

      expect(heightOf(el(root, '.outer'))).toBe(2.25 * rem * 0.875);
      expect(heightOf(el(root, '.inner'))).toBe(2.25 * rem);
    });
  });

  describe('size from the config', () => {
    const template = `
      <div arnConfig [size]="sectionSize()">
        <button arnButton type="button" class="in-section" [size]="size()">In</button>
      </div>
      <button arnButton type="button" class="at-root">Root</button>`;

    it('is md without any config', async () => {
      const { root } = await render(template);

      expect(el(root, '.at-root').getAttribute('data-size')).toBe('md');
    });

    it('follows provideArn, the nearest section wins over it, the input wins over both', async () => {
      const { host, root } = await render(template, [provideArn({ size: 'lg' })]);

      expect(el(root, '.at-root').getAttribute('data-size')).toBe('lg');
      expect(heightOf(el(root, '.at-root'))).toBe(2.5 * rem);
      expect(el(root, '.in-section').getAttribute('data-size')).toBe('lg');

      host.sectionSize.set('sm');
      await settle();

      expect(el(root, '.in-section').getAttribute('data-size')).toBe('sm');

      host.size.set('xl');
      await settle();

      expect(el(root, '.in-section').getAttribute('data-size')).toBe('xl');

      host.size.set(undefined);
      await settle();

      expect(el(root, '.in-section').getAttribute('data-size')).toBe('sm');
    });

    it('follows ArnConfigService at runtime', async () => {
      const { root } = await render(template);

      TestBed.inject(ArnConfigService).update({ size: 'xs' });
      await settle();

      expect(el(root, '.at-root').getAttribute('data-size')).toBe('xs');
      expect(heightOf(el(root, '.at-root'))).toBe(1.5 * rem);
    });
  });

  describe('tokens', () => {
    it('defines no --arn-button-* token on the element: each is read with a fallback', async () => {
      const { root } = await render('<button arnButton type="button">Save</button>');
      const style = getComputedStyle(el(root));

      expect(TOKENS.filter((token) => style.getPropertyValue(token) !== '')).toEqual([]);
    });

    it('a token set on a container reaches the button', async () => {
      const { root } = await render(
        `<div style="--arn-button-bg: rgb(1, 2, 3); --arn-button-height: 50px; --arn-button-radius: 2px">
           <button arnButton type="button" variant="secondary">Save</button>
         </div>`,
      );
      const style = getComputedStyle(el(root));

      expect(style.backgroundColor).toBe('rgb(1, 2, 3)');
      expect(heightOf(el(root))).toBe(50);
      expect(style.borderTopLeftRadius).toBe('2px');
    });

    it('a token set on the element itself applies to that one', async () => {
      const { root } = await render(
        `<button arnButton type="button" style="--arn-button-fg: rgb(4, 5, 6)">One</button>
         <button arnButton type="button" class="other">Other</button>`,
      );

      expect(getComputedStyle(el(root)).color).toBe('rgb(4, 5, 6)');
      expect(getComputedStyle(el(root, '.other')).color).not.toBe('rgb(4, 5, 6)');
    });

    it('a single-class rule of the consumer wins over the library rules (:where)', async () => {
      const style = document.createElement('style');

      style.textContent = '.mine { background: rgb(7, 8, 9); padding-inline: 3px; }';
      document.head.appendChild(style);

      try {
        const { root } = await render(
          '<button arnButton type="button" variant="destructive" size="xl" class="mine">Go</button>',
        );
        const computed = getComputedStyle(el(root));

        expect(computed.backgroundColor).toBe('rgb(7, 8, 9)');
        expect(computed.paddingInlineStart).toBe('3px');
      } finally {
        style.remove();
      }
    });
  });

  describe('icon only and round', () => {
    it('icon only is square at every size and density', async () => {
      const { host, root } = await render(
        `<div data-density="compact">
           <button arnButton type="button" iconOnly aria-label="Add" class="compact" [size]="size()">${ICON}</button>
         </div>
         <button arnButton type="button" iconOnly aria-label="Add" class="plain" [size]="size()">${ICON}</button>`,
      );

      for (const size of SIZES) {
        host.size.set(size);
        await settle();

        for (const selector of ['.compact', '.plain']) {
          const button = el(root, selector);

          expect([size, selector, widthOf(button)]).toEqual([size, selector, heightOf(button)]);
          expect(getComputedStyle(button).paddingInlineStart).toBe('0px');
        }
      }
    });

    it('round makes an icon-only button a circle and a labelled one a pill', async () => {
      const { root } = await render(
        `<button arnButton type="button" iconOnly round aria-label="Add" class="circle">${ICON}</button>
         <button arnButton type="button" round class="pill">Subscribe</button>`,
      );
      const circle = el(root, '.circle');
      const pill = el(root, '.pill');

      expect(getComputedStyle(circle).borderTopLeftRadius).toBe('9999px');
      expect(widthOf(circle)).toBe(heightOf(circle));
      expect(getComputedStyle(pill).borderTopLeftRadius).toBe('9999px');
      expect(widthOf(pill)).toBeGreaterThan(heightOf(pill));
    });

    it('writes data-icon-only and data-round only while they are on', async () => {
      const { host, root } = await render(
        '<button arnButton type="button" aria-label="Add" [iconOnly]="iconOnly()" [round]="round()">+</button>',
      );

      expect(el(root).hasAttribute('data-icon-only')).toBe(false);
      expect(el(root).hasAttribute('data-round')).toBe(false);

      host.iconOnly.set(true);
      host.round.set(true);
      await settle();

      expect(el(root).hasAttribute('data-icon-only')).toBe(true);
      expect(el(root).hasAttribute('data-round')).toBe(true);
    });
  });

  describe('icon-only name warning', () => {
    function warnings(): string[] {
      return vi
        .mocked(console.warn)
        .mock.calls.map((call) => String(call[0]))
        .filter((message) => message.includes('ArnButton'));
    }

    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    it('warns in development for an icon-only button without a name', async () => {
      await render(`<button arnButton type="button" iconOnly>${ICON}</button>`);

      expect(warnings()).toEqual([
        '[@arn-ng/ui] ArnButton: an icon-only button has no accessible name. Give it an aria-label (or aria-labelledby).',
      ]);
    });

    it('counts neither the badge nor hidden content as a name', async () => {
      await render(
        `<button arnButton type="button" iconOnly>
           <span aria-hidden="true">+</span><span arnButtonBadge>3</span>
         </button>`,
      );

      expect(warnings().length).toBe(1);
    });

    it('does not warn with aria-label, aria-labelledby, title or text', async () => {
      await render(
        `<span id="name">Add</span>
         <button arnButton type="button" iconOnly aria-label="Add">${ICON}</button>
         <button arnButton type="button" iconOnly aria-labelledby="name">${ICON}</button>
         <button arnButton type="button" iconOnly title="Add">${ICON}</button>
         <button arnButton type="button" iconOnly>${ICON}<span class="hidden-text">Add</span></button>`,
      );

      expect(warnings()).toEqual([]);
    });

    it('does not warn for a button that is not icon-only', async () => {
      await render(`<button arnButton type="button">${ICON}</button>`);

      expect(warnings()).toEqual([]);
    });
  });

  describe('disabled <button>', () => {
    const template =
      '<button arnButton type="button" [disabled]="disabled()" (click)="count()">Save</button>';

    it('uses the native disabled attribute and gets no click', async () => {
      const { host, root } = await render(template);
      const button = nativeButton(root);

      host.disabled.set(true);
      await settle();

      expect(button.disabled).toBe(true);
      expect(button.getAttribute('disabled')).toBe('');
      expect(button.hasAttribute('aria-disabled')).toBe(false);
      button.click();

      expect(host.clicks).toBe(0);
      expect(getComputedStyle(button).opacity).toBe('0.5');
    });

    it('turns back on when disabled is cleared', async () => {
      const { host, root } = await render(template);

      host.disabled.set(true);
      await settle();
      host.disabled.set(false);
      await settle();

      const button = nativeButton(root);

      expect(button.hasAttribute('disabled')).toBe(false);
      button.click();

      expect(host.clicks).toBe(1);
      expect(getComputedStyle(button).opacity).toBe('1');
    });

    it('takes a static disabled attribute', async () => {
      const { root } = await render('<button arnButton type="button" disabled>Save</button>');

      expect(nativeButton(root).disabled).toBe(true);
    });

    it('looks disabled inside a disabled fieldset', async () => {
      const { root } = await render(
        '<fieldset disabled><button arnButton type="button">Save</button></fieldset>',
      );

      expect(el(root).matches(':disabled')).toBe(true);
      expect(getComputedStyle(el(root)).opacity).toBe('0.5');
    });

    it('a real press on a disabled button gets no :active color', async () => {
      const { host, root } = await render(template);

      host.disabled.set(true);
      await settle();

      const button = el(root);
      const before = getComputedStyle(button).backgroundColor;
      const release = await pressAndHold(button);

      try {
        expect(getComputedStyle(button).backgroundColor).toBe(before);
      } finally {
        await release();
      }

      expect(host.clicks).toBe(0);
    });
  });

  describe('disabled <a>', () => {
    function click(element: HTMLElement): MouseEvent {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });

      element.dispatchEvent(event);

      return event;
    }

    it('is aria-disabled, out of the tab order and has no disabled attribute', async () => {
      const { host, root } = await render(
        '<a arnButton href="/docs" disabled [disabled]="disabled()">Docs</a>',
      );

      host.disabled.set(true);
      await settle();

      const link = el(root);

      expect(link.getAttribute('aria-disabled')).toBe('true');
      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.hasAttribute('disabled')).toBe(false);
      expect(link.getAttribute('href')).toBe('/docs');
      expect(getComputedStyle(link).opacity).toBe('0.5');
    });

    it('cancels the click and stops the (click) of the template and of the ancestors', async () => {
      const { host, root } = await render(
        `<div (click)="count()">
           <a arnButton href="/docs" [disabled]="disabled()" (click)="count()">Docs</a>
         </div>`,
      );

      host.disabled.set(true);
      await settle();

      const event = click(el(root));

      expect(event.defaultPrevented).toBe(true);
      expect(host.clicks).toBe(0);
    });

    it('stops RouterLink while disabled and lets it navigate once enabled', async () => {
      const { host, root } = await render(
        '<a arnButton routerLink="/next" [disabled]="disabled()">Next</a>',
      );
      const router = TestBed.inject(Router);

      host.disabled.set(true);
      await settle();
      click(el(root));
      await settle();

      expect(router.url).toBe('/');

      host.disabled.set(false);
      await settle();
      click(el(root));
      await settle();

      expect(router.url).toBe('/next');
    });

    it('lets clicks through and drops aria-disabled when enabled', async () => {
      const { host, root } = await render(
        '<a arnButton href="/docs" [disabled]="disabled()" (click)="$event.preventDefault(); count()">Docs</a>',
      );

      host.disabled.set(true);
      await settle();
      host.disabled.set(false);
      await settle();

      expect(el(root).hasAttribute('aria-disabled')).toBe(false);
      click(el(root));

      expect(host.clicks).toBe(1);
    });

    it("keeps the consumer's tabindex and restores it once enabled", async () => {
      const { host, root } = await render(
        '<a arnButton href="/docs" tabindex="0" [disabled]="disabled()">Docs</a>',
      );

      for (let round = 0; round < 2; round++) {
        host.disabled.set(true);
        await settle();

        expect(el(root).getAttribute('tabindex')).toBe('-1');

        host.disabled.set(false);
        await settle();

        expect(el(root).getAttribute('tabindex')).toBe('0');
      }
    });

    it('removes the tabindex it added when the link had none', async () => {
      const { host, root } = await render(
        '<a arnButton href="/docs" [disabled]="disabled()">Docs</a>',
      );

      expect(el(root).hasAttribute('tabindex')).toBe(false);

      host.disabled.set(true);
      await settle();
      host.disabled.set(false);
      await settle();

      expect(el(root).hasAttribute('tabindex')).toBe(false);
    });

    it('is out of the tab order from the start when it starts disabled', async () => {
      const { root } = await render('<a arnButton href="/docs" tabindex="3" disabled>Docs</a>');

      expect(el(root).getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('ripple (host directive)', () => {
    const wavesOf = (element: Element): number =>
      element.querySelectorAll('.arn-ripple-wave').length;

    function pointerDown(element: HTMLElement): void {
      const rect = element.getBoundingClientRect();

      element.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          button: 0,
          clientX: rect.left + 4,
          clientY: rect.top + 4,
        }),
      );
    }

    it('positions the host for the ripple', async () => {
      const { root } = await render('<button arnButton type="button">Save</button>');

      expect(getComputedStyle(el(root)).position).toBe('relative');
    });

    it('is off by default and follows the ripple config', async () => {
      const { root } = await render('<button arnButton type="button" class="off">Off</button>', []);

      pointerDown(el(root, '.off'));

      expect(wavesOf(root)).toBe(0);
    });

    it('draws with provideArn({ ripple: true }) and [ripple]="false" turns it off', async () => {
      const { host, root } = await render(
        '<button arnButton type="button" [ripple]="ripple()">Save</button>',
        [provideArn({ ripple: true })],
      );

      pointerDown(el(root));

      expect(wavesOf(root)).toBe(1);

      host.ripple.set(false);
      await settle();
      el(root).querySelector('.arn-ripple-container')?.remove();
      pointerDown(el(root));

      expect(wavesOf(root)).toBe(0);
    });

    it('opens rippleColor and rippleCentered under the button names', async () => {
      const { root } = await render(
        '<button arnButton type="button" ripple rippleCentered rippleColor="rgb(255, 0, 0)">Save</button>',
      );
      const button = el(root);

      pointerDown(button);

      const wave = el(button, '.arn-ripple-wave');
      const rect = button.getBoundingClientRect();
      const drawn = wave.getBoundingClientRect();

      expect(getComputedStyle(wave).backgroundColor).toBe('rgb(255, 0, 0)');
      expect(drawn.left + drawn.width / 2).toBeCloseTo(rect.left + rect.width / 2, 0);
    });

    // Known limit (decisions 2026-11): pointer events stay on, so a disabled link still ripples
    it('still draws on a disabled link (documented limit)', async () => {
      const { root } = await render('<a arnButton href="/docs" ripple disabled>Docs</a>');

      pointerDown(el(root));

      expect(wavesOf(root)).toBe(1);
    });

    // Chromium sends pointerdown to a disabled <button> too, so the limit covers both elements
    it('still draws for a real press on a disabled <button> (documented limit)', async () => {
      const { root } = await render(
        '<button arnButton type="button" ripple disabled>Save</button>',
      );
      const release = await pressAndHold(el(root));

      try {
        expect(wavesOf(root)).toBe(1);
      } finally {
        await release();
      }
    });
  });

  describe('badge', () => {
    it('projects the badge after the content, whatever the source order', async () => {
      const { root } = await render(
        '<button arnButton type="button"><span arnButtonBadge>3</span>Inbox</button>',
      );

      expect(el(root).firstChild?.textContent).toBe('Inbox');
      expect(el(root).lastElementChild?.textContent).toBe('3');
    });

    it('sits on the top inline-end corner, ringed with the background', async () => {
      const { root } = await render(
        '<button arnButton type="button">Inbox<span arnButtonBadge>3</span></button>',
      );
      const button = el(root).getBoundingClientRect();
      const badge = el(root, '[arnButtonBadge]');
      const rect = badge.getBoundingClientRect();
      const style = getComputedStyle(badge);

      expect(style.position).toBe('absolute');
      expect(style.translate).toBe('35% -35%');
      expect(rect.right).toBeGreaterThan(button.right);
      expect(rect.top).toBeLessThan(button.top);
      expect(style.boxShadow).toContain('0px 0px 0px 2px');
    });

    it('is mirrored to the top-left corner in rtl', async () => {
      const { root } = await render(
        `<div arnConfig direction="rtl">
           <button arnButton type="button">Inbox<span arnButtonBadge>3</span></button>
         </div>`,
      );
      const button = el(root).getBoundingClientRect();
      const rect = el(root, '[arnButtonBadge]').getBoundingClientRect();

      expect(getComputedStyle(el(root, '[arnButtonBadge]')).translate).toBe('-35% -35%');
      expect(rect.left).toBeLessThan(button.left);
      expect(rect.top).toBeLessThan(button.top);
    });

    it('is hidden while empty', async () => {
      const { root } = await render(
        '<button arnButton type="button">Inbox<span arnButtonBadge></span></button>',
      );

      expect(getComputedStyle(el(root, '[arnButtonBadge]')).display).toBe('none');
    });
  });

  describe('rtl', () => {
    it('keeps logical padding and mirrors a directional icon with .arn-rtl-mirror', async () => {
      const { host, root } = await render(
        `<div arnConfig [direction]="direction()">
           <button arnButton type="button">Next <svg class="arn-rtl-mirror" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8h8" /></svg></button>
         </div>`,
      );

      host.direction.set('rtl');
      await settle();

      const style = getComputedStyle(el(root));

      expect(style.direction).toBe('rtl');
      expect(style.paddingInlineStart).toBe(style.paddingInlineEnd);
      expect(getComputedStyle(el(root, 'svg')).scale).toBe('-1 1');
    });
  });

  describe('focus', () => {
    async function focusWithKeyboard(button: HTMLElement): Promise<void> {
      await userEvent.tab();

      expect(document.activeElement).toBe(button);
      expect(button.matches(':focus-visible')).toBe(true);
    }

    it('draws a 3px ring in --arn-ring and keeps the border', async () => {
      const { root } = await render(
        '<button arnButton type="button" variant="outline">Save</button>',
      );
      const button = el(root);
      const border = getComputedStyle(button).borderTopColor;

      await focusWithKeyboard(button);

      const style = getComputedStyle(button);
      const ring = document.createElement('span');

      ring.style.color = 'var(--arn-ring)';
      root.appendChild(ring);

      expect(style.boxShadow).toContain(`${getComputedStyle(ring).color} 0px 0px 0px 3px`);
      expect(style.borderTopColor).toBe(border);
      expect([style.outlineStyle, style.outlineColor, style.outlineWidth]).toEqual([
        'solid',
        'rgba(0, 0, 0, 0)',
        '3px',
      ]);
    });

    it('uses --arn-destructive for the destructive ring', async () => {
      const { root } = await render(
        '<button arnButton type="button" variant="destructive">Delete</button>',
      );
      const button = el(root);

      await focusWithKeyboard(button);

      const ring = document.createElement('span');

      ring.style.color = 'var(--arn-destructive)';
      root.appendChild(ring);

      expect(getComputedStyle(button).boxShadow).toContain(
        `${getComputedStyle(ring).color} 0px 0px 0px 3px`,
      );
    });

    it('a disabled link is skipped by Tab', async () => {
      const { root } = await render(
        `<a arnButton href="/a" disabled>A</a><button arnButton type="button" class="next">B</button>`,
      );

      await userEvent.tab();

      expect(document.activeElement).toBe(el(root, '.next'));
    });
  });

  describe('tap highlight', () => {
    it('turns off the browser tap highlight (feedback is the :active color)', async () => {
      const { root } = await render('<button arnButton type="button">Save</button>');
      const style = getComputedStyle(el(root)) as CSSStyleDeclaration & {
        webkitTapHighlightColor?: string;
      };

      expect(style.webkitTapHighlightColor).toBe('rgba(0, 0, 0, 0)');
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
             ${VARIANTS.map((variant) => `<a arnButton href="/x" disabled variant="${variant}">${variant}</a>`).join('')}
           </div>`,
        );

        expect(await a11yViolations(root)).toEqual([]);
      });
    }

    for (const mode of modes) {
      it(`has no axe violations in ${mode.name} mode`, async () => {
        const { root } = await render(
          `<div ${mode.attributes} style="background: var(--arn-background); color: var(--arn-foreground); padding: 1rem">
             ${VARIANTS.map((variant) => `<button arnButton type="button" variant="${variant}">${variant}</button>`).join('')}
             <a arnButton href="/docs">Link</a>
             <button arnButton type="button" disabled>Disabled</button>
             <a arnButton href="/docs" disabled>Disabled link</a>
             <button arnButton type="button" iconOnly round aria-label="Add">${ICON}</button>
             <button arnButton type="button">Inbox<span arnButtonBadge aria-label="3 unread">3</span></button>
           </div>`,
        );

        await expectNoA11yViolations(root);
      });
    }
  });
});

describe('ArnButton on the server', () => {
  it('renders without an error or a warning, and a disabled link is out of the tab order', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    TestBed.overrideTemplate(
      Host,
      `<button arnButton type="button" iconOnly>${ICON}</button><a arnButton href="/x" disabled>X</a>`,
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
