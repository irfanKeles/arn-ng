import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ArnConfigDirective,
  ArnConfigService,
  type ArnDirection,
  type ArnRootConfig,
  provideArn,
} from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../testing/a11y';
import { ArnRippleDirective } from './ripple.directive';
import {
  ARN_RIPPLE_REDUCED_MOTION,
  FALLBACK_DURATION_MS,
  parseDuration,
  reducedMotionReader,
} from './ripple.motion';

/** What a component will do in Phase 4: the directive as a host directive, opened as `ripple`. */
@Component({
  selector: 'arn-ripple-probe',
  template: 'Probe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: ArnRippleDirective,
      inputs: [
        'arnRipple: ripple',
        'arnRippleColor: rippleColor',
        'arnRippleCentered: rippleCentered',
      ],
    },
  ],
  host: { class: 'arn-test-ripple-host' },
})
class RippleProbe {}

@Component({
  imports: [ArnConfigDirective, ArnRippleDirective, RippleProbe],
  templateUrl: './ripple.directive.spec.host.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly sectionRipple = signal<boolean | undefined>(undefined);
  readonly direction = signal<ArnDirection | undefined>(undefined);
  readonly own = signal<boolean | undefined>(undefined);
  readonly rootOwn = signal<boolean | undefined>(undefined);
  readonly probeRipple = signal<boolean | undefined>(undefined);
  readonly color = signal<string | undefined>(undefined);
  readonly centered = signal(false);

  readonly inSection = viewChild.required<ElementRef<HTMLElement>>('inSection');
  readonly atRoot = viewChild.required<ElementRef<HTMLElement>>('atRoot');
  readonly plain = viewChild.required<ElementRef<HTMLElement>>('plain');
  readonly bare = viewChild.required<unknown, ElementRef<HTMLElement>>('bare', {
    read: ElementRef,
  });
  readonly bound = viewChild.required<unknown, ElementRef<HTMLElement>>('bound', {
    read: ElementRef,
  });
}

// The host is positioned by the component (here: the test); the duration is cut short for speed
const styles = `
  .arn-test-ripple-host {
    position: relative;
    display: block;
    box-sizing: border-box;
    inline-size: 200px;
    block-size: 100px;
    padding: 0;
    border: 0;
    color: rgb(0, 0, 0);
    background: rgb(255, 255, 255);
    --arn-ripple-duration: 20ms;
  }
`;

const DURATION = 20;

function press(element: HTMLElement, init: PointerEventInit = {}): void {
  element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, ...init }));
}

function release(element: HTMLElement, type = 'pointerup'): void {
  element.dispatchEvent(new PointerEvent(type, { bubbles: type !== 'pointerleave' }));
}

function containerOf(element: HTMLElement): HTMLElement | null {
  return element.querySelector<HTMLElement>('.arn-ripple-container');
}

function wavesOf(element: HTMLElement): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('.arn-ripple-wave'));
}

function firstWave(element: HTMLElement): HTMLElement {
  const wave = wavesOf(element)[0];

  if (!wave) {
    throw new Error('Expected a wave');
  }

  return wave;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Polls until the condition holds; fails the test when it never does. */
async function until(condition: () => boolean, timeout = 2000): Promise<void> {
  const started = performance.now();

  while (!condition()) {
    if (performance.now() - started > timeout) {
      throw new Error('Timed out waiting for the condition');
    }
    await wait(5);
  }
}

/** The center of a wave relative to its container, and its radius. */
function geometry(wave: HTMLElement): { x: number; y: number; radius: number } {
  const radius = parseFloat(wave.style.width) / 2;

  return {
    x: parseFloat(wave.style.left) + radius,
    y: parseFloat(wave.style.top) + radius,
    radius,
  };
}

describe('ArnRippleDirective', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let style: HTMLStyleElement;
  let reducedMotion: boolean;

  function setup(config?: ArnRootConfig): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: ARN_RIPPLE_REDUCED_MOTION, useValue: () => reducedMotion },
        ...(config ? [provideArn(config)] : []),
      ],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  }

  const inSection = (): HTMLElement => host.inSection().nativeElement;
  const atRoot = (): HTMLElement => host.atRoot().nativeElement;
  const plain = (): HTMLElement => host.plain().nativeElement;

  /** Presses and reports whether a wave was drawn; the wave is removed again. */
  async function draws(element: HTMLElement): Promise<boolean> {
    press(element);

    const drawn = wavesOf(element).length > 0;

    release(element);
    await until(() => containerOf(element) === null);

    return drawn;
  }

  beforeEach(() => {
    reducedMotion = false;
    style = document.createElement('style');
    style.textContent = styles;
    document.head.appendChild(style);
  });

  afterEach(() => {
    fixture.destroy();
    style.remove();
  });

  describe('precedence', () => {
    it('is off by default', async () => {
      setup();

      expect(await draws(atRoot())).toBe(false);
    });

    it('provideArn turns it on', async () => {
      setup({ ripple: true });

      expect(await draws(atRoot())).toBe(true);
    });

    it('the nearest [arnConfig] section wins over provideArn', async () => {
      setup({ ripple: true });
      host.sectionRipple.set(false);
      fixture.detectChanges();

      expect(await draws(inSection())).toBe(false);
      expect(await draws(atRoot())).toBe(true);
    });

    it('a section turns it on while provideArn has it off', async () => {
      setup({ ripple: false });
      host.sectionRipple.set(true);
      fixture.detectChanges();

      expect(await draws(inSection())).toBe(true);
      expect(await draws(atRoot())).toBe(false);
    });

    it('the input of the element wins over the section, both ways', async () => {
      setup({ ripple: true });
      host.sectionRipple.set(false);
      host.own.set(true);
      fixture.detectChanges();

      expect(await draws(inSection())).toBe(true);

      host.sectionRipple.set(true);
      host.own.set(false);
      fixture.detectChanges();

      expect(await draws(inSection())).toBe(false);
    });

    it('an empty attribute turns it on whatever the config says', async () => {
      setup({ ripple: false });

      expect(await draws(plain())).toBe(true);
    });

    it('[arnRipple]="false" turns it off while the config has it on', async () => {
      setup({ ripple: true });
      host.rootOwn.set(false);
      fixture.detectChanges();

      expect(await draws(atRoot())).toBe(false);
    });
  });

  describe('as a host directive opened as `ripple`', () => {
    it('follows the config while the input is not bound', async () => {
      setup({ ripple: true });

      expect(await draws(host.bare().nativeElement)).toBe(true);
      expect(await draws(host.bound().nativeElement)).toBe(true);
    });

    it('stays off without config and takes the aliased input', async () => {
      setup();

      expect(await draws(host.bare().nativeElement)).toBe(false);

      host.probeRipple.set(true);
      fixture.detectChanges();

      expect(await draws(host.bound().nativeElement)).toBe(true);
    });

    it('the aliased input turns it off while the config has it on', async () => {
      setup({ ripple: true });
      host.probeRipple.set(false);
      fixture.detectChanges();

      expect(await draws(host.bound().nativeElement)).toBe(false);
    });
  });

  describe('following the config live', () => {
    it('follows ArnConfigService', async () => {
      setup({ ripple: false });

      const service = TestBed.inject(ArnConfigService);

      expect(await draws(atRoot())).toBe(false);
      service.setRipple(true);

      expect(await draws(atRoot())).toBe(true);
      service.setRipple(false);

      expect(await draws(atRoot())).toBe(false);
    });

    it('follows a section that changes', async () => {
      setup();

      expect(await draws(inSection())).toBe(false);
      host.sectionRipple.set(true);
      fixture.detectChanges();

      expect(await draws(inSection())).toBe(true);
      host.sectionRipple.set(undefined);
      fixture.detectChanges();

      expect(await draws(inSection())).toBe(false);
    });
  });

  describe('DOM', () => {
    it('adds nothing to the host while it is off', () => {
      setup();
      press(atRoot());
      release(atRoot());

      expect(atRoot().childElementCount).toBe(0);
      expect(atRoot().getAttribute('style')).toBeNull();
    });

    it('adds one container with a hidden wave and writes no style on the host', () => {
      setup();
      press(plain());

      const container = containerOf(plain());

      expect(plain().querySelectorAll('.arn-ripple-container').length).toBe(1);
      expect(container?.parentElement).toBe(plain());
      expect(container?.getAttribute('aria-hidden')).toBe('true');
      expect(wavesOf(plain()).length).toBe(1);
      expect(firstWave(plain()).getAttribute('aria-hidden')).toBe('true');
      expect(firstWave(plain()).parentElement).toBe(container);
      expect(plain().getAttribute('style')).toBeNull();
    });

    it('several waves share the same container', () => {
      setup();
      press(plain());
      press(plain());

      expect(plain().querySelectorAll('.arn-ripple-container').length).toBe(1);
      expect(wavesOf(plain()).length).toBe(2);
    });

    it('the wave stays while the pointer is held down', async () => {
      setup();
      press(plain());
      await wait(DURATION * 4);

      expect(wavesOf(plain()).length).toBe(1);
    });

    it('the wave and the container are removed once the fade has finished', async () => {
      setup();
      press(plain());
      release(plain());

      // Still there right after the release: it fades first
      expect(wavesOf(plain()).length).toBe(1);
      await until(() => containerOf(plain()) === null);

      expect(wavesOf(plain()).length).toBe(0);
      expect(plain().childElementCount).toBe(0);
    });

    it('pointercancel and pointerleave fade the wave too', async () => {
      setup();

      for (const type of ['pointercancel', 'pointerleave']) {
        press(plain());
        release(plain(), type);
        await until(() => containerOf(plain()) === null);

        expect(plain().childElementCount).toBe(0);
      }
    });

    it('a second release does not restart the fade', async () => {
      setup();
      press(plain());
      release(plain());

      const animations = firstWave(plain()).getAnimations().length;

      release(plain(), 'pointerleave');

      expect(firstWave(plain()).getAnimations().length).toBe(animations);
      await until(() => containerOf(plain()) === null);
    });

    it('ignores buttons other than the primary one', () => {
      setup();
      press(plain(), { button: 2 });

      expect(plain().childElementCount).toBe(0);
    });

    it('keeps at most 5 waves and drops the oldest first', () => {
      setup();

      for (let index = 0; index < 5; index++) {
        press(plain());
      }

      const [oldest, second] = wavesOf(plain());

      press(plain());

      expect(wavesOf(plain()).length).toBe(5);
      expect(oldest?.isConnected).toBe(false);
      expect(wavesOf(plain())[0]).toBe(second);
    });
  });

  describe('keyboard', () => {
    it('draws nothing for Enter, Space or a programmatic click', () => {
      setup();

      const button = plain();

      for (const key of ['Enter', ' ']) {
        button.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        button.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
      }
      button.click();

      expect(containerOf(button)).toBeNull();
      expect(wavesOf(button).length).toBe(0);
      expect(button.childElementCount).toBe(0);
    });
  });

  describe('color and position', () => {
    it('the default color comes from --arn-ripple-color', () => {
      setup();
      press(plain());

      expect(containerOf(plain())?.getAttribute('style')).toBeNull();
      expect(getComputedStyle(firstWave(plain())).backgroundColor).toMatch(/\/ 0\.12\)$/);
    });

    it('arnRippleColor is written on the container, not on the host', () => {
      setup();
      host.own.set(true);
      host.color.set('rgb(255, 0, 0)');
      fixture.detectChanges();
      press(inSection());

      expect(containerOf(inSection())?.style.getPropertyValue('--arn-ripple-color')).toBe(
        'rgb(255, 0, 0)',
      );
      expect(getComputedStyle(firstWave(inSection())).backgroundColor).toBe('rgb(255, 0, 0)');
      expect(inSection().getAttribute('style')).toBeNull();
    });

    it('a color that is taken back falls back to the token on the next wave', () => {
      setup();
      host.own.set(true);
      host.color.set('rgb(255, 0, 0)');
      fixture.detectChanges();
      press(inSection());
      host.color.set(undefined);
      fixture.detectChanges();
      press(inSection());

      expect(containerOf(inSection())?.style.getPropertyValue('--arn-ripple-color')).toBe('');
    });

    it('starts at the pointer and reaches the farthest corner', () => {
      setup();

      const rect = plain().getBoundingClientRect();

      press(plain(), { clientX: rect.left + 10, clientY: rect.top + 20 });

      const wave = geometry(firstWave(plain()));

      expect(wave.x).toBeCloseTo(10, 1);
      expect(wave.y).toBeCloseTo(20, 1);
      expect(wave.radius).toBeCloseTo(Math.hypot(190, 80), 1);
    });

    it('arnRippleCentered starts at the center whatever the pointer position', () => {
      setup();
      host.own.set(true);
      host.centered.set(true);
      fixture.detectChanges();

      const rect = inSection().getBoundingClientRect();

      press(inSection(), { clientX: rect.left + 10, clientY: rect.top + 20 });

      const wave = geometry(firstWave(inSection()));

      expect(wave.x).toBeCloseTo(100, 1);
      expect(wave.y).toBeCloseTo(50, 1);
      expect(wave.radius).toBeCloseTo(Math.hypot(100, 50), 1);
    });

    it('the position is the same in rtl', () => {
      setup();
      host.own.set(true);
      host.direction.set('rtl');
      fixture.detectChanges();

      const rect = inSection().getBoundingClientRect();

      press(inSection(), { clientX: rect.left + 10, clientY: rect.top + 20 });

      const element = firstWave(inSection());
      const wave = geometry(element);
      const drawn = element.getBoundingClientRect();

      expect(getComputedStyle(inSection()).direction).toBe('rtl');
      expect(wave.x).toBeCloseTo(10, 1);
      expect(wave.y).toBeCloseTo(20, 1);
      // The inline `left` is physical: the wave is laid out around the pointer in rtl as well
      expect(drawn.left + drawn.width / 2).toBeCloseTo(rect.left + 10, 0);
    });
  });

  describe('motion', () => {
    it('the wave grows over --arn-ripple-duration with --arn-ripple-easing', () => {
      setup();
      press(plain());

      const timing = firstWave(plain()).getAnimations()[0]?.effect?.getComputedTiming();

      expect(timing?.duration).toBe(DURATION);
      expect(timing?.easing).toBe('cubic-bezier(0, 0, 0.2, 1)');
    });

    it('falls back when the tokens are not usable', () => {
      setup();
      plain().style.setProperty('--arn-ripple-duration', 'soon');
      plain().style.setProperty('--arn-ripple-easing', 'bouncy');

      expect(() => {
        press(plain());
      }).not.toThrow();

      const timing = firstWave(plain()).getAnimations()[0]?.effect?.getComputedTiming();

      expect(timing?.duration).toBe(FALLBACK_DURATION_MS);
      expect(timing?.easing).toBe('ease-out');
    });

    it('draws nothing under prefers-reduced-motion and follows the setting live', async () => {
      setup();
      reducedMotion = true;
      press(plain());

      expect(plain().childElementCount).toBe(0);

      reducedMotion = false;

      expect(await draws(plain())).toBe(true);

      reducedMotion = true;
      press(plain());

      expect(plain().childElementCount).toBe(0);
    });

    it('does nothing, without an error, where element.animate is missing', () => {
      setup();
      Object.defineProperty(plain(), 'animate', { value: undefined, configurable: true });

      expect(() => {
        press(plain());
        release(plain());
      }).not.toThrow();
      expect(plain().childElementCount).toBe(0);
    });
  });

  describe('destroy', () => {
    it('removes the waves, the container and the listeners', () => {
      setup();

      const button = plain();

      press(button);
      press(button);
      release(button);
      press(button);
      fixture.destroy();

      expect(button.childElementCount).toBe(0);
      expect(() => {
        press(button);
        release(button);
      }).not.toThrow();
      expect(button.childElementCount).toBe(0);
    });
  });

  describe('a11y', () => {
    it('has no axe violations, with and without a wave', async () => {
      setup({ ripple: true });
      await expectNoA11yViolations(fixture.nativeElement as HTMLElement);

      press(plain());
      press(atRoot());
      await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
    });
  });
});

describe('ArnRippleDirective on the server', () => {
  it('sets up no listener and draws nothing', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideArn({ ripple: true })],
    });

    const fixture = TestBed.createComponent(Host);

    fixture.detectChanges();

    const button = fixture.componentInstance.plain().nativeElement;

    expect(() => {
      press(button);
      release(button);
    }).not.toThrow();
    expect(button.childElementCount).toBe(0);
    expect(() => {
      fixture.destroy();
    }).not.toThrow();
  });
});

describe('ripple motion helpers', () => {
  function fakeDocument(view: unknown): Document {
    return { defaultView: view } as unknown as Document;
  }

  it('reads prefers-reduced-motion from the view of the given document, on every call', () => {
    const queries: string[] = [];
    let matches = false;
    const read = reducedMotionReader(
      fakeDocument({
        matchMedia: (query: string) => {
          queries.push(query);
          return { matches };
        },
      }),
    );

    expect(read()).toBe(false);
    matches = true;

    expect(read()).toBe(true);
    expect(queries).toEqual([
      '(prefers-reduced-motion: reduce)',
      '(prefers-reduced-motion: reduce)',
    ]);
  });

  it('is false where there is no view or no matchMedia (SSR)', () => {
    expect(reducedMotionReader(fakeDocument(null))()).toBe(false);
    expect(reducedMotionReader(fakeDocument({}))()).toBe(false);
  });

  it('the token reads the real document by default', () => {
    expect(typeof TestBed.inject(ARN_RIPPLE_REDUCED_MOTION)()).toBe('boolean');
  });

  it('parses ms and s, and falls back for anything else', () => {
    expect(parseDuration('450ms')).toBe(450);
    expect(parseDuration(' 0.2s ')).toBe(200);
    expect(parseDuration('.5s')).toBe(500);
    expect(parseDuration('')).toBe(FALLBACK_DURATION_MS);
    expect(parseDuration('calc(1s * 2)')).toBe(FALLBACK_DURATION_MS);
    expect(parseDuration('fast')).toBe(FALLBACK_DURATION_MS);
  });
});
