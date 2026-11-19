import { LiveAnnouncer } from '@angular/cdk/a11y';
import type { Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { contrastRatio } from '../../../../ui/testing/contrast';
import { DocsHighlighterService } from '../code/highlighter.service';
import { nextTask, query, queryAs, resetDocument, text } from '../testing/dom';
import { expectNoPageOverflow } from '../testing/page-overflow';
import { A11Y_MODES } from '../testing/render-example';
import { DOCS_CLIPBOARD, type DocsClipboard } from './clipboard';
import { COPIED_RESET_MS } from './example.component';
import {
  BASIC_EXAMPLE_HTML,
  BASIC_EXAMPLE_TS,
  ExampleHostComponent,
  STYLED_EXAMPLE_CSS,
  STYLED_EXAMPLE_HTML,
  STYLED_EXAMPLE_TS,
  StyledExampleHostComponent,
} from './testing/example-host';

describe('ExampleComponent', () => {
  interface Example {
    fixture: ComponentFixture<unknown>;
    element: HTMLElement;
    announced: string[];
    settle: () => Promise<void>;
  }

  function setup(
    clipboard: DocsClipboard | null = { writeText: () => Promise.resolve() },
    host: Type<unknown> = ExampleHostComponent,
  ): Example {
    const announced: string[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideArn({ applyToDocument: true }),
        { provide: DOCS_CLIPBOARD, useValue: clipboard },
        {
          provide: LiveAnnouncer,
          useValue: {
            announce: (message: string, politeness?: string) => {
              announced.push(`${message} (${politeness ?? 'default'})`);

              return Promise.resolve();
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(host);

    fixture.detectChanges();

    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      announced,
      settle: async () => {
        await nextTask();
        await fixture.whenStable();
      },
    };
  }

  /** A clipboard that records what it is given. */
  function recording(copied: string[]): DocsClipboard {
    return {
      writeText: (value) => {
        copied.push(value);

        return Promise.resolve();
      },
    };
  }

  function options(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('.docs-example-option'));
  }

  function option(element: HTMLElement, label: string): HTMLButtonElement {
    const found = options(element).find((candidate) => text(candidate) === label);

    if (!found) {
      throw new Error(`No option is labelled "${label}".`);
    }

    return found;
  }

  function pressed(element: HTMLElement): string[] {
    return options(element)
      .filter((candidate) => candidate.getAttribute('aria-pressed') === 'true')
      .map(text);
  }

  function copyButton(element: HTMLElement): HTMLButtonElement {
    return queryAs(element, '.docs-example-copy', HTMLButtonElement);
  }

  function hideButton(element: HTMLElement): HTMLButtonElement | null {
    return element.querySelector<HTMLButtonElement>('.docs-example-hide');
  }

  function status(element: HTMLElement): string {
    const found = element.querySelector('.docs-example-status');

    return found ? text(found) : '';
  }

  function icon(element: HTMLElement): string | null {
    return copyButton(element).querySelector('svg')?.getAttribute('data-icon') ?? null;
  }

  async function show(example: Example, label = 'HTML'): Promise<void> {
    option(example.element, label).click();
    await example.settle();
  }

  async function hide(example: Example): Promise<void> {
    const button = hideButton(example.element);

    if (!button) {
      throw new Error('The code is not shown.');
    }

    button.focus();
    button.click();
    await example.settle();
  }

  async function copy(example: Example): Promise<void> {
    copyButton(example.element).click();
    await example.settle();
  }

  async function highlighted(example: Example): Promise<void> {
    await TestBed.inject(DocsHighlighterService).load();
    await example.settle();
  }

  afterEach(() => {
    vi.useRealTimers();
    resetDocument(document);
  });

  describe('card', () => {
    it('runs the example in the middle of the card', async () => {
      const example = setup();
      const demo = query(example.element, '.docs-example-demo');
      const button = queryAs(example.element, 'docs-basic-example button', HTMLButtonElement);

      expect(query(example.element, 'docs-example').firstElementChild).toBe(demo);
      expect(getComputedStyle(demo).justifyItems).toBe('center');

      button.click();
      await example.settle();

      expect(text(button)).toBe('Clicked 1 times');
    });

    it('labels the preview at the start of the bar under the demo, before the options', () => {
      const { element } = setup();
      const bar = query(element, '.docs-example-bar');
      const label = query(element, '.docs-example-label');

      expect(query(element, '.docs-example-demo').nextElementSibling).toBe(bar);
      expect(bar.firstElementChild).toBe(label);
      expect(text(label)).toBe('Preview');
      expect(getComputedStyle(label).textTransform).toBe('uppercase');
      expect(label.getBoundingClientRect().right).toBeLessThan(
        query(element, '.docs-example-actions').getBoundingClientRect().left,
      );
    });
  });

  describe('options', () => {
    it('offers HTML and TS as plain buttons, none pressed while the code is hidden', () => {
      const { element } = setup();
      const region = query(element, '.docs-example-code');

      expect(options(element).map(text)).toEqual(['HTML', 'TS']);

      for (const button of options(element)) {
        expect(button.type).toBe('button');
        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(button.getAttribute('aria-controls')).toBe(region.id);
      }

      expect(region.hidden).toBe(true);
      expect(hideButton(element)).toBeNull();
      expect(element.querySelector('[role="tablist"], [role="tab"], [role="tabpanel"]')).toBeNull();
    });

    it('shows a file when its option is pressed, and presses only that option', async () => {
      const example = setup();

      await show(example, 'TS');

      expect(query(example.element, '.docs-example-code').hidden).toBe(false);
      expect(pressed(example.element)).toEqual(['TS']);
      expect(query(example.element, 'pre').getAttribute('aria-label')).toBe('TS code');
      expect(hideButton(example.element)).not.toBeNull();

      await show(example, 'HTML');

      expect(pressed(example.element)).toEqual(['HTML']);
      expect(query(example.element, 'pre').getAttribute('aria-label')).toBe('HTML code');
    });

    it('keeps the code shown when the pressed option is pressed again', async () => {
      const example = setup();

      await show(example, 'TS');
      await show(example, 'TS');

      expect(query(example.element, '.docs-example-code').hidden).toBe(false);
      expect(pressed(example.element)).toEqual(['TS']);
    });

    it('hides the code with the hide button; no option stays pressed and the button goes away', async () => {
      const example = setup();

      await show(example);
      await hide(example);

      expect(query(example.element, '.docs-example-code').hidden).toBe(true);
      expect(pressed(example.element)).toEqual([]);
      expect(hideButton(example.element)).toBeNull();
    });

    it('returns focus to the last chosen option when the code is hidden', async () => {
      const example = setup();

      await show(example, 'HTML');
      await show(example, 'TS');
      await hide(example);

      expect(document.activeElement).toBe(option(example.element, 'TS'));

      await show(example, 'HTML');
      await hide(example);

      expect(document.activeElement).toBe(option(example.element, 'HTML'));
    });

    it('names the icon buttons and hides their icons from assistive technology', async () => {
      const example = setup();

      await show(example);

      for (const [button, name] of [
        [copyButton(example.element), 'Copy code'],
        [hideButton(example.element), 'Hide code'],
      ] as const) {
        const svg = button?.querySelector('svg');

        expect(button?.type).toBe('button');
        expect(button?.getAttribute('aria-label')).toBe(name);
        expect(text(button ?? document.createTextNode(''))).toBe('');
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
        expect(svg?.getAttribute('focusable')).toBe('false');
      }
    });

    it('leaves the arrow keys, Home and End alone', async () => {
      const example = setup();

      await show(example);
      option(example.element, 'HTML').focus();

      for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

        document.activeElement?.dispatchEvent(event);
        await example.settle();

        expect(event.defaultPrevented).toBe(false);
        expect(pressed(example.element)).toEqual(['HTML']);
        expect(document.activeElement).toBe(option(example.element, 'HTML'));
      }
    });
  });

  describe('code', () => {
    it('shows the template file, then the component file, exactly as they are compiled', async () => {
      const example = setup();

      await show(example);

      expect(query(example.element, 'pre').textContent).toBe(BASIC_EXAMPLE_HTML);

      await show(example, 'TS');

      expect(query(example.element, 'pre').textContent).toBe(BASIC_EXAMPLE_TS);
    });

    it('shows complete files: imports, decorator and the template the class points to', () => {
      expect(BASIC_EXAMPLE_TS).toContain("from '@angular/core';");
      expect(BASIC_EXAMPLE_TS).toContain("templateUrl: './basic.example.html'");
      expect(BASIC_EXAMPLE_TS).toContain('export class BasicExampleComponent');
      expect(BASIC_EXAMPLE_HTML).toContain('(click)="increment()"');
    });

    it('keeps the same text once it is highlighted', async () => {
      const example = setup();

      await show(example);
      await highlighted(example);

      const pre = query(example.element, 'pre');

      expect(pre.querySelectorAll('span').length).toBeGreaterThan(3);
      expect(pre.textContent).toBe(BASIC_EXAMPLE_HTML);
    });

    it('numbers the lines of the code panel', async () => {
      const example = setup();

      await show(example, 'TS');

      expect(example.element.querySelectorAll('.docs-code-block-line').length).toBe(
        BASIC_EXAMPLE_TS.replace(/\n$/, '').split('\n').length,
      );
    });
  });

  describe('copy', () => {
    it('copies the template while the code is hidden', async () => {
      const copied: string[] = [];
      const example = setup(recording(copied));

      await copy(example);

      expect(copied).toEqual([BASIC_EXAMPLE_HTML]);
      expect(query(example.element, '.docs-example-code').hidden).toBe(true);
    });

    it('copies the shown file, shows a check mark and announces it politely', async () => {
      const copied: string[] = [];
      const example = setup(recording(copied));

      await show(example, 'TS');

      expect(icon(example.element)).toBe('copy');

      await copy(example);

      expect(copied).toEqual([BASIC_EXAMPLE_TS]);
      expect(icon(example.element)).toBe('check');
      expect(copyButton(example.element).getAttribute('aria-label')).toBe('Copy code');
      expect(status(example.element)).toBe('');
      expect(example.announced).toEqual(['Copied (polite)']);
    });

    it('shows and announces a failure when the browser refuses', async () => {
      const example = setup({ writeText: () => Promise.reject(new Error('denied')) });

      await show(example);
      await copy(example);

      expect(status(example.element)).toBe('Copy failed');
      expect(icon(example.element)).toBe('copy');
      expect(example.announced).toEqual(['Copy failed (polite)']);
    });

    it('shows and announces a failure when there is no clipboard', async () => {
      const example = setup(null);

      await copy(example);

      expect(status(example.element)).toBe('Copy failed');
      expect(example.announced).toEqual(['Copy failed (polite)']);
    });

    // Only the timeouts are faked; changes are rendered by hand, since whenStable() would wait for a
    // faked timeout.
    it(`turns the check mark back after ${String(COPIED_RESET_MS)} ms`, async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      const example = setup();
      const wait = async (ms: number): Promise<void> => {
        await vi.advanceTimersByTimeAsync(ms);
        example.fixture.detectChanges();
      };

      copyButton(example.element).click();
      await wait(0);

      expect(icon(example.element)).toBe('check');

      await wait(COPIED_RESET_MS - 1);

      expect(icon(example.element)).toBe('check');

      await wait(1);

      expect(icon(example.element)).toBe('copy');
    });

    it('keeps a failure past that time, until the next option, hide or copy', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      let calls = 0;
      const example = setup({
        writeText: () =>
          ++calls % 2 === 1 ? Promise.reject(new Error('denied')) : Promise.resolve(),
      });
      const step = async (action: () => void): Promise<void> => {
        action();
        await vi.advanceTimersByTimeAsync(0);
        example.fixture.detectChanges();
      };
      const fail = (): Promise<void> =>
        step(() => {
          copyButton(example.element).click();
        });

      // Wait well past the success time: the failure stays.
      await fail();
      await vi.advanceTimersByTimeAsync(COPIED_RESET_MS * 3);
      example.fixture.detectChanges();

      expect(status(example.element)).toBe('Copy failed');

      // An option clears it.
      await step(() => {
        option(example.element, 'TS').click();
      });

      expect(status(example.element)).toBe('');

      // Hiding clears it.
      await step(() => {
        copyButton(example.element).click();
      });
      await fail();

      expect(status(example.element)).toBe('Copy failed');

      await step(() => {
        hideButton(example.element)?.click();
      });

      expect(status(example.element)).toBe('');

      // A new copy clears it.
      await step(() => {
        copyButton(example.element).click();
      });
      await fail();

      expect(status(example.element)).toBe('Copy failed');

      await step(() => {
        copyButton(example.element).click();
      });

      expect(status(example.element)).toBe('');
      expect(icon(example.element)).toBe('check');
    });

    it('clears the check mark when another option is pressed or the code is hidden', async () => {
      const example = setup();

      await show(example);
      await copy(example);
      await show(example, 'TS');

      expect(icon(example.element)).toBe('copy');

      await copy(example);
      await hide(example);

      expect(icon(example.element)).toBe('copy');
    });

    for (const scheme of ['light', 'dark'] as const) {
      it(`keeps the icons at 3:1 and the failure text at 4.5:1 in the ${scheme} scheme`, async () => {
        const example = setup(null);

        TestBed.inject(ArnConfigService).update({ colorScheme: scheme });
        await show(example);
        await copy(example);

        for (const button of [copyButton(example.element), hideButton(example.element)]) {
          const svg = button?.querySelector('svg');
          const backdrop = getComputedStyle(button ?? example.element).backgroundColor;

          expect(svg ? getComputedStyle(svg).stroke : '').toBe(
            getComputedStyle(svg ?? example.element).color,
          );
          expect(
            contrastRatio(getComputedStyle(svg ?? example.element).color, backdrop),
          ).toBeGreaterThanOrEqual(3);
        }

        // The bar has no background of its own: the failure text sits on the page background,
        // which the buttons share.
        expect(
          contrastRatio(
            getComputedStyle(query(example.element, '.docs-example-status')).color,
            getComputedStyle(copyButton(example.element)).backgroundColor,
          ),
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    it('swaps the icon and shows the failure without any motion', async () => {
      const example = setup(null);

      await show(example);
      await copy(example);

      for (const element of [
        copyButton(example.element),
        copyButton(example.element).querySelector('svg') ?? example.element,
        query(example.element, '.docs-example-status'),
      ]) {
        const style = getComputedStyle(element);

        expect(style.transitionDuration).toBe('0s');
        expect(style.animationName).toBe('none');
      }
    });
  });

  describe('layout', () => {
    it('does not make a 320px page scroll sideways, with the code and a failure shown', async () => {
      const example = setup(null);

      await show(example, 'TS');
      await copy(example);

      expect(status(example.element)).toBe('Copy failed');

      await expectNoPageOverflow(example.element, example.settle);
    });

    it('scrolls long code inside the panel at 320px', async () => {
      const example = setup();
      const page = document.createElement('div');

      page.style.inlineSize = '320px';
      example.element.before(page);
      page.append(example.element);
      await show(example, 'TS');

      const pre = query(example.element, 'pre');

      expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
      expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);

      example.element.remove();
      page.remove();
    });

    it('mirrors the bar in a right-to-left page and keeps the code left-to-right', async () => {
      const example = setup();

      TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
      await show(example);

      expect(getComputedStyle(example.element).direction).toBe('rtl');
      expect(
        query(example.element, '.docs-example-label').getBoundingClientRect().left,
      ).toBeGreaterThan(
        query(example.element, '.docs-example-actions').getBoundingClientRect().right,
      );
      expect(getComputedStyle(query(example.element, 'pre')).direction).toBe('ltr');
    });

    it('gives every button a target of at least 24 by 24px, in compact mode too', async () => {
      const example = setup();

      TestBed.inject(ArnConfigService).update({ density: 'compact' });
      await show(example);

      const buttons = Array.from(example.element.querySelectorAll('.docs-example-button'));

      expect(buttons.length).toBe(4);

      for (const button of buttons) {
        const box = button.getBoundingClientRect();

        expect(box.height).toBeGreaterThanOrEqual(24);
        expect(box.width).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('accessibility', () => {
    for (const mode of A11Y_MODES) {
      it(`has no violations in ${mode.name} mode with the code hidden`, async () => {
        const example = setup();

        TestBed.inject(ArnConfigService).update(mode.config);
        await example.settle();

        await expectNoA11yViolations(example.element);
      });

      it(`has no violations in ${mode.name} mode with highlighted code`, async () => {
        const example = setup();

        TestBed.inject(ArnConfigService).update(mode.config);
        await show(example);
        await highlighted(example);

        expect(example.element.querySelectorAll('pre span').length).toBeGreaterThan(3);
        await expectNoA11yViolations(example.element);

        await show(example, 'TS');
        await highlighted(example);

        await expectNoA11yViolations(example.element);
      });
    }
  });

  describe('with a CSS file', () => {
    function setupStyled(clipboard?: DocsClipboard): Example {
      return setup(clipboard, StyledExampleHostComponent);
    }

    it('adds a third option after HTML and TS, controlling the same code', async () => {
      const example = setupStyled();
      const region = query(example.element, '.docs-example-code');

      expect(options(example.element).map(text)).toEqual(['HTML', 'TS', 'CSS']);
      expect(option(example.element, 'CSS').getAttribute('aria-controls')).toBe(region.id);

      await show(example, 'CSS');

      expect(pressed(example.element)).toEqual(['CSS']);
      expect(query(example.element, 'pre').getAttribute('aria-label')).toBe('CSS code');
    });

    it('shows each file exactly as it is compiled; the class points to the stylesheet', async () => {
      const example = setupStyled();

      await show(example);

      expect(query(example.element, 'pre').textContent).toBe(STYLED_EXAMPLE_HTML);

      await show(example, 'TS');

      expect(query(example.element, 'pre').textContent).toBe(STYLED_EXAMPLE_TS);
      expect(STYLED_EXAMPLE_TS).toContain("styleUrl: './styled.example.css'");

      await show(example, 'CSS');

      expect(query(example.element, 'pre').textContent).toBe(STYLED_EXAMPLE_CSS);
    });

    it('applies the stylesheet to the demo', () => {
      const { element } = setupStyled();
      const badge = query(element, 'docs-styled-example .badge');

      expect(getComputedStyle(badge).borderTopLeftRadius).not.toBe('0px');
    });

    it('copies the stylesheet when the CSS option is pressed, and focus returns to it', async () => {
      const copied: string[] = [];
      const example = setupStyled(recording(copied));

      await show(example, 'CSS');
      await copy(example);

      expect(copied).toEqual([STYLED_EXAMPLE_CSS]);

      await hide(example);

      expect(document.activeElement).toBe(option(example.element, 'CSS'));
    });

    it('keeps every option at least 24px tall in compact mode', async () => {
      const example = setupStyled();

      TestBed.inject(ArnConfigService).update({ density: 'compact' });
      await show(example);

      expect(options(example.element).length).toBe(3);

      for (const button of options(example.element)) {
        expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
      }
    });

    for (const mode of A11Y_MODES) {
      it(`has no violations in ${mode.name} mode with highlighted CSS`, async () => {
        const example = setupStyled();

        TestBed.inject(ArnConfigService).update(mode.config);
        await show(example, 'CSS');
        await highlighted(example);

        expect(example.element.querySelectorAll('pre span').length).toBeGreaterThan(3);
        await expectNoA11yViolations(example.element);
      });
    }
  });
});
