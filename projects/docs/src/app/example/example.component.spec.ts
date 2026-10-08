import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { DocsHighlighterService } from '../code/highlighter.service';
import { nextTask, query, queryAs, resetDocument, text } from '../testing/dom';
import { DOCS_CLIPBOARD, type DocsClipboard } from './clipboard';
import { BASIC_EXAMPLE_HTML, BASIC_EXAMPLE_TS, ExampleHostComponent } from './testing/example-host';

describe('ExampleComponent', () => {
  interface Example {
    fixture: ComponentFixture<ExampleHostComponent>;
    element: HTMLElement;
    announced: string[];
    settle: () => Promise<void>;
  }

  function setup(
    clipboard: DocsClipboard | null = { writeText: () => Promise.resolve() },
  ): Example {
    const announced: string[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideArn({ applyToDocument: true }),
        { provide: DOCS_CLIPBOARD, useValue: clipboard },
        {
          provide: LiveAnnouncer,
          useValue: {
            announce: (message: string) => {
              announced.push(message);

              return Promise.resolve();
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ExampleHostComponent);

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

  function toggle(element: HTMLElement): HTMLButtonElement {
    return queryAs(element, '.docs-example-toggle', HTMLButtonElement);
  }

  function tabs(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>('[role="tab"]'));
  }

  function tab(element: HTMLElement, label: string): HTMLElement {
    const found = tabs(element).find((candidate) => text(candidate) === label);

    if (!found) {
      throw new Error(`No tab is labelled "${label}".`);
    }

    return found;
  }

  function selected(element: HTMLElement): string {
    return text(query(element, '[role="tab"][aria-selected="true"]'));
  }

  function copyButton(element: HTMLElement): HTMLButtonElement {
    return queryAs(element, '.docs-example-copy', HTMLButtonElement);
  }

  async function openCode(example: Example): Promise<void> {
    toggle(example.element).click();
    await example.settle();
  }

  async function press(example: Example, key: string): Promise<KeyboardEvent> {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

    document.activeElement?.dispatchEvent(event);
    await example.settle();

    return event;
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('demo', () => {
    it('runs the example', async () => {
      const example = setup();
      const button = queryAs(example.element, 'docs-basic-example button', HTMLButtonElement);

      button.click();
      await example.settle();

      expect(text(button)).toBe('Clicked 1 times');
    });
  });

  describe('show code', () => {
    it('hides the code at first, behind a button that controls it', () => {
      const { element } = setup();
      const button = toggle(element);
      const region = query(element, '.docs-example-code');

      expect(text(button)).toBe('Show code');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-controls')).toBe(region.id);
      expect(region.hidden).toBe(true);
      expect(element.querySelector('[role="tablist"]')).toBeNull();
    });

    it('shows and hides the code', async () => {
      const example = setup();
      const button = toggle(example.element);
      const region = query(example.element, '.docs-example-code');

      await openCode(example);

      expect(text(button)).toBe('Hide code');
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(region.hidden).toBe(false);
      expect(example.element.querySelector('[role="tablist"]')).not.toBeNull();

      button.click();
      await example.settle();

      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(region.hidden).toBe(true);
    });
  });

  describe('code', () => {
    it('shows the template file, then the component file, exactly as they are compiled', async () => {
      const example = setup();

      await openCode(example);

      expect(query(example.element, 'pre').textContent).toBe(BASIC_EXAMPLE_HTML);

      tab(example.element, 'TS').click();
      await example.settle();

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

      await openCode(example);
      await TestBed.inject(DocsHighlighterService).load();
      await example.settle();

      const pre = query(example.element, 'pre');

      expect(pre.querySelectorAll('span').length).toBeGreaterThan(3);
      expect(pre.textContent).toBe(BASIC_EXAMPLE_HTML);
    });
  });

  describe('tabs', () => {
    it('follows the tabs pattern: roles, selection, relations and a roving tabindex', async () => {
      const example = setup();

      await openCode(example);

      const list = query(example.element, '[role="tablist"]');
      const panel = query(example.element, '[role="tabpanel"]');
      const html = tab(example.element, 'HTML');
      const ts = tab(example.element, 'TS');

      expect(list.getAttribute('aria-label')).toBe('Example code');
      expect(tabs(example.element).map(text)).toEqual(['HTML', 'TS']);
      expect(html.getAttribute('aria-selected')).toBe('true');
      expect(ts.getAttribute('aria-selected')).toBe('false');
      expect(html.tabIndex).toBe(0);
      expect(ts.tabIndex).toBe(-1);
      expect(html.getAttribute('aria-controls')).toBe(panel.id);
      expect(ts.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(html.id);

      ts.click();
      await example.settle();

      expect(ts.getAttribute('aria-selected')).toBe('true');
      expect(html.getAttribute('aria-selected')).toBe('false');
      expect(ts.tabIndex).toBe(0);
      expect(html.tabIndex).toBe(-1);
      expect(panel.getAttribute('aria-labelledby')).toBe(ts.id);
      expect(query(example.element, 'pre').getAttribute('aria-label')).toBe('TS code');
    });

    it('moves with the arrow keys, wrapping at the ends, and selects the focused tab', async () => {
      const example = setup();

      await openCode(example);
      tab(example.element, 'HTML').focus();

      const event = await press(example, 'ArrowRight');

      expect(event.defaultPrevented).toBe(true);
      expect(selected(example.element)).toBe('TS');
      expect(document.activeElement).toBe(tab(example.element, 'TS'));

      await press(example, 'ArrowRight');

      expect(selected(example.element)).toBe('HTML');
      expect(document.activeElement).toBe(tab(example.element, 'HTML'));

      await press(example, 'ArrowLeft');

      expect(selected(example.element)).toBe('TS');
      expect(document.activeElement).toBe(tab(example.element, 'TS'));
    });

    it('jumps to the first and last tab with Home and End', async () => {
      const example = setup();

      await openCode(example);
      tab(example.element, 'HTML').focus();
      await press(example, 'End');

      expect(selected(example.element)).toBe('TS');
      expect(document.activeElement).toBe(tab(example.element, 'TS'));

      await press(example, 'Home');

      expect(selected(example.element)).toBe('HTML');
      expect(document.activeElement).toBe(tab(example.element, 'HTML'));
    });

    it('leaves other keys alone', async () => {
      const example = setup();

      await openCode(example);
      tab(example.element, 'HTML').focus();

      const event = await press(example, 'a');

      expect(event.defaultPrevented).toBe(false);
      expect(selected(example.element)).toBe('HTML');
    });

    it('reverses the arrow keys in a right-to-left page', async () => {
      const example = setup();

      TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
      await openCode(example);
      tab(example.element, 'HTML').focus();
      await press(example, 'ArrowLeft');

      expect(selected(example.element)).toBe('TS');

      await press(example, 'ArrowRight');

      expect(selected(example.element)).toBe('HTML');
    });
  });

  describe('copy', () => {
    it('copies the code of the selected tab, says so and announces it', async () => {
      const copied: string[] = [];
      const example = setup({
        writeText: (value) => {
          copied.push(value);

          return Promise.resolve();
        },
      });

      await openCode(example);

      const button = copyButton(example.element);

      expect(text(button)).toBe('Copy code');

      button.click();
      await example.settle();

      expect(copied).toEqual([BASIC_EXAMPLE_HTML]);
      expect(text(button)).toBe('Copied');
      expect(example.announced).toEqual(['Code copied to clipboard']);

      tab(example.element, 'TS').click();
      await example.settle();

      expect(text(button)).toBe('Copy code');

      button.click();
      await example.settle();

      expect(copied).toEqual([BASIC_EXAMPLE_HTML, BASIC_EXAMPLE_TS]);
    });

    it('shows and announces a failure when the browser refuses', async () => {
      const example = setup({ writeText: () => Promise.reject(new Error('denied')) });

      await openCode(example);
      copyButton(example.element).click();
      await example.settle();

      expect(text(copyButton(example.element))).toBe('Copy failed');
      expect(example.announced).toEqual(['Could not copy the code']);
    });

    it('shows and announces a failure when there is no clipboard', async () => {
      const example = setup(null);

      await openCode(example);
      copyButton(example.element).click();
      await example.settle();

      expect(text(copyButton(example.element))).toBe('Copy failed');
      expect(example.announced).toEqual(['Could not copy the code']);
    });
  });

  describe('layout', () => {
    it('does not make a 320px page scroll sideways; the code scrolls inside', async () => {
      const example = setup();
      const page = document.createElement('div');

      page.style.inlineSize = '320px';
      example.element.before(page);
      page.append(example.element);
      await openCode(example);
      tab(example.element, 'TS').click();
      await example.settle();

      const pre = query(example.element, 'pre');

      expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
      expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);

      example.element.remove();
      page.remove();
    });

    it('keeps code left-to-right in a right-to-left page', async () => {
      const example = setup();

      TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
      await openCode(example);

      expect(getComputedStyle(example.element).direction).toBe('rtl');
      expect(getComputedStyle(query(example.element, 'pre')).direction).toBe('ltr');
    });

    it('gives every button a target of at least 24px, in compact mode too', async () => {
      const example = setup();

      TestBed.inject(ArnConfigService).update({ density: 'compact' });
      await openCode(example);

      expect(
        example.element.querySelectorAll('.docs-example-button, .docs-example-tab').length,
      ).toBe(4);

      for (const button of Array.from(
        example.element.querySelectorAll('.docs-example-button, .docs-example-tab'),
      )) {
        expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
      }
    });
  });

  describe('accessibility', () => {
    const modes: readonly { name: string; config: ArnConfig }[] = [
      { name: 'light', config: { colorScheme: 'light' } },
      { name: 'dark', config: { colorScheme: 'dark' } },
      { name: 'RTL', config: { direction: 'rtl' } },
      { name: 'compact', config: { density: 'compact' } },
    ];

    for (const mode of modes) {
      it(`has no violations in ${mode.name} mode with the code hidden`, async () => {
        const example = setup();

        TestBed.inject(ArnConfigService).update(mode.config);
        await example.settle();

        await expectNoA11yViolations(example.element);
      });

      it(`has no violations in ${mode.name} mode with highlighted code`, async () => {
        const example = setup();

        TestBed.inject(ArnConfigService).update(mode.config);
        await openCode(example);
        await TestBed.inject(DocsHighlighterService).load();
        await example.settle();

        expect(example.element.querySelectorAll('pre span').length).toBeGreaterThan(3);
        await expectNoA11yViolations(example.element);

        tab(example.element, 'TS').click();
        await example.settle();
        await TestBed.inject(DocsHighlighterService).load();
        await example.settle();

        await expectNoA11yViolations(example.element);
      });
    }
  });
});
