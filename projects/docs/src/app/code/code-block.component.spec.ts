import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { userEvent } from 'vitest/browser';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { contrastRatio } from '../../../../ui/testing/contrast';
import { nextTask, query, queryAs, resetDocument, text } from '../testing/dom';
import { expectNoPageOverflow } from '../testing/page-overflow';
import { A11Y_MODES } from '../testing/render-example';
import { DOCS_CLIPBOARD, type DocsClipboard } from './clipboard';
import { CodeBlockComponent } from './code-block.component';
import type { DocsHighlight } from './docs-code';
import { DOCS_HIGHLIGHT_LOADER, DocsHighlighterService } from './highlighter.service';

/** Every text color of the block: the token colors, the plain text and the line numbers. */
const TEXT_COLORS = [
  '--docs-code-foreground',
  '--docs-code-token-keyword',
  '--docs-code-token-function',
  '--docs-code-token-link',
  '--docs-code-token-constant',
  '--docs-code-token-parameter',
  '--docs-code-token-string',
  '--docs-code-token-string-expression',
  '--docs-code-token-punctuation',
  '--docs-code-token-comment',
  '--docs-code-token-inserted',
  '--docs-code-token-deleted',
  '--docs-code-token-changed',
  '--docs-code-line-number',
] as const;

describe('CodeBlockComponent', () => {
  const code = 'const answer = 42;\n\nexport { answer };\n';
  const longLine = `const text = '${'long '.repeat(60)}';\n`;

  /** One token per word, alternating styles; the contents add up to the code. */
  const fake: DocsHighlight = (source) =>
    source.split(/(\s+)/).map((content, index) => ({
      content,
      color: index % 4 === 0 ? 'var(--docs-code-token-keyword)' : undefined,
      italic: index % 4 === 2,
      bold: index % 8 === 0,
    }));

  interface Block {
    fixture: ComponentFixture<CodeBlockComponent>;
    element: HTMLElement;
    pre: HTMLElement;
    settle: () => Promise<void>;
  }

  function setup(loader: () => Promise<DocsHighlight>, source = code): Block {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCS_HIGHLIGHT_LOADER, useValue: loader }],
    });

    const fixture = TestBed.createComponent(CodeBlockComponent);
    const element = fixture.nativeElement as HTMLElement;

    fixture.componentRef.setInput('code', source);
    fixture.componentRef.setInput('language', 'typescript');
    fixture.detectChanges();

    return {
      fixture,
      element,
      pre: query(element, 'pre'),
      settle: async () => {
        await nextTask();
        await fixture.whenStable();
      },
    };
  }

  /** A loader that resolves or rejects when the test says so. */
  const nextFrame = (): Promise<void> =>
    new Promise((resolve) =>
      requestAnimationFrame(() => {
        resolve();
      }),
    );

  /** Lets the size observer report and the render after it run. */
  async function measured(block: Block): Promise<void> {
    await block.settle();
    await nextFrame();
    await nextFrame();
    await block.settle();
  }

  /**
   * A real Tab from a stop just before the block: the browser's focus-visible heuristic sees
   * keyboard use, and focus never leaves the test page (past its last stop, Tab would).
   */
  async function tabFromBefore(block: Block): Promise<void> {
    const before = document.createElement('button');

    before.type = 'button';
    before.textContent = 'Before the block';
    block.element.before(before);
    before.focus();
    await userEvent.tab();
    before.remove();
  }

  function deferred() {
    let resolve: (highlight: DocsHighlight) => void = () => undefined;
    let reject: (error: Error) => void = () => undefined;
    const promise = new Promise<DocsHighlight>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { loader: () => promise, resolve, reject };
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('shows the plain code until the highlighter has loaded', async () => {
    const pending = deferred();
    const { element, pre, settle } = setup(pending.loader);

    await settle();

    expect(pre.textContent).toBe(code);
    expect(element.querySelectorAll('span').length).toBe(0);
  });

  it('swaps in the tokens without changing the text or the size of the block', async () => {
    const pending = deferred();
    const { element, pre, settle } = setup(pending.loader);
    const before = pre.getBoundingClientRect();

    pending.resolve(fake);
    await settle();

    const after = pre.getBoundingClientRect();

    expect(element.querySelectorAll('span').length).toBeGreaterThan(3);
    expect(pre.textContent).toBe(code);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
  });

  it('applies the color variable and the font style of each token', async () => {
    const { element, settle } = setup(() => Promise.resolve(fake));

    await settle();

    const first = query(element, 'span');

    expect(first.textContent).toBe('const');
    expect(first.style.color).toBe('var(--docs-code-token-keyword)');
    expect(first.classList.contains('docs-code-block-bold')).toBe(true);
    expect(getComputedStyle(first).color).not.toBe('');
    expect(element.querySelectorAll('.docs-code-block-italic').length).toBeGreaterThan(0);
  });

  it('keeps the plain code when the highlighter fails to load', async () => {
    const pending = deferred();
    const { element, pre, settle } = setup(pending.loader);

    pending.reject(new Error('offline'));
    await settle();

    expect(pre.textContent).toBe(code);
    expect(element.querySelectorAll('span').length).toBe(0);
  });

  it('keeps the plain code when highlighting throws', async () => {
    const { element, pre, settle } = setup(() =>
      Promise.resolve(() => {
        throw new Error('bad grammar');
      }),
    );

    await settle();

    expect(pre.textContent).toBe(code);
    expect(element.querySelectorAll('span').length).toBe(0);
  });

  it('drops a result that arrives after the code has changed', async () => {
    const pending = deferred();
    const { fixture, pre, settle } = setup(pending.loader);

    fixture.componentRef.setInput('code', longLine);
    fixture.detectChanges();
    pending.resolve(fake);
    await settle();

    expect(pre.textContent).toBe(longLine);
  });

  it('is a named area', () => {
    const { fixture, pre } = setup(() => Promise.resolve(fake));

    expect(pre.getAttribute('role')).toBe('group');
    expect(pre.getAttribute('aria-label')).toBe('Code');

    fixture.componentRef.setInput('label', 'HTML code');
    fixture.detectChanges();

    expect(pre.getAttribute('aria-label')).toBe('HTML code');
  });

  it('scrolls a long line inside the block instead of widening a 320px page', async () => {
    const { element, pre, settle } = setup(() => Promise.resolve(fake), longLine);
    const page = document.createElement('div');

    page.style.inlineSize = '320px';
    element.before(page);
    page.append(element);
    await settle();

    expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);

    element.remove();
    page.remove();
  });

  it('stays left-to-right in a right-to-left page', () => {
    document.documentElement.setAttribute('dir', 'rtl');

    const { pre } = setup(() => Promise.resolve(fake));

    expect(getComputedStyle(pre).direction).toBe('ltr');
  });

  it('is not styled as an inline code badge inside a page', async () => {
    const { element, settle } = setup(() => Promise.resolve(fake));

    element.classList.add('docs-page');
    await settle();

    expect(getComputedStyle(query(element, 'code')).display).toBe('inline');
  });

  it('defines every color variable the real highlighter uses', async () => {
    TestBed.configureTestingModule({});

    const fixture = TestBed.createComponent(CodeBlockComponent);
    const element = fixture.nativeElement as HTMLElement;
    const samples = [
      ['html', '<button type="button" (click)="save()">Save</button>\n'],
      [
        'typescript',
        "import { signal } from '@angular/core';\n\n// A counter\nexport const count = signal(0);\n",
      ],
      ['css', '.docs-page {\n  color: var(--arn-foreground);\n}\n'],
      ['shellscript', '# Install the package\nnpm install @arn-ng/ui @angular/cdk --save\n'],
    ] as const;

    for (const [language, source] of samples) {
      fixture.componentRef.setInput('code', source);
      fixture.componentRef.setInput('language', language);
      fixture.detectChanges();
      await TestBed.inject(DocsHighlighterService).load();
      await nextTask();
      await fixture.whenStable();

      // Line breaks carry no color.
      const spans = Array.from(element.querySelectorAll<HTMLElement>('span')).filter(
        (span) => span.style.color !== '',
      );
      const names = new Set(
        spans.map((span) => /^var\((--docs-code-[a-z-]+)\)$/.exec(span.style.color)?.[1] ?? ''),
      );

      expect(spans.length).toBeGreaterThan(3);
      expect(names.size).toBeGreaterThan(2);

      for (const name of names) {
        expect(name).not.toBe('');
        expect(getComputedStyle(element).getPropertyValue(name)).not.toBe('');
        // The contrast specs below check every color in the list.
        expect(TEXT_COLORS).toContain(name);
      }
    }
  });

  describe('line numbers', () => {
    function numbered(loader: () => Promise<DocsHighlight>, source = code): Block {
      const block = setup(loader, source);

      block.fixture.componentRef.setInput('lineNumbers', true);
      block.fixture.detectChanges();

      return block;
    }

    function numbers(element: HTMLElement): string[] {
      return Array.from(element.querySelectorAll('.docs-code-block-line')).map(
        (line) => getComputedStyle(line, '::before').content,
      );
    }

    it('has none unless asked for', async () => {
      const { element, settle } = setup(() => Promise.resolve(fake));

      await settle();

      expect(element.querySelector('.docs-code-block-line')).toBeNull();
    });

    it('numbers each line, plain and highlighted alike, without changing the size', async () => {
      const pending = deferred();
      const { element, pre, settle } = numbered(pending.loader);
      const before = pre.getBoundingClientRect();

      // Three lines and a final line break, which starts no numbered line.
      expect(element.querySelectorAll('.docs-code-block-line').length).toBe(3);
      expect(pre.textContent).toBe(code);

      pending.resolve(fake);
      await settle();

      const after = pre.getBoundingClientRect();
      const lines = Array.from(element.querySelectorAll('.docs-code-block-line'));

      expect(lines.map((line) => line.textContent)).toEqual([
        'const answer = 42;',
        '',
        'export { answer };',
      ]);
      expect(element.querySelectorAll('.docs-code-block-line span').length).toBeGreaterThan(3);
      expect(pre.textContent).toBe(code);
      expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
      expect(new Set(numbers(element)).size).toBe(1);
      expect(numbers(element)[0]).toContain('counter(docs-code-line)');
    });

    it('keeps the numbers out of the text: not selected, not copied, not read', async () => {
      const { element, pre, settle } = numbered(() => Promise.resolve(fake));

      await settle();

      const selection = getSelection();

      selection?.selectAllChildren(pre);

      // Chromium leaves the final line break of a selected block out; no number gets in.
      expect(selection?.toString()).toBe(code.replace(/\n$/, ''));

      selection?.removeAllRanges();

      const line = query(element, '.docs-code-block-line');
      const before = getComputedStyle(line, '::before');

      expect(before.userSelect).toBe('none');
      // The empty alternative text keeps the number out of the accessibility tree.
      expect(before.content).toMatch(/\/\s*""$/);
    });

    it('widens the number column for the digits of the highest number', () => {
      const tens = Array.from({ length: 12 }, (_, index) => `line ${String(index + 1)}`).join('\n');
      const { pre } = numbered(() => new Promise<DocsHighlight>(() => undefined), tens);

      expect(pre.style.getPropertyValue('--docs-code-digits')).toBe('2');
    });
  });

  for (const surface of ['standalone', 'embedded'] as const) {
    for (const scheme of ['light', 'dark'] as const) {
      it(`gives every text color at least 4.5:1 on the ${surface} background in the ${scheme} scheme`, () => {
        const { fixture, element, pre } = setup(() => new Promise<DocsHighlight>(() => undefined));
        const probe = document.createElement('span');

        fixture.componentRef.setInput('embedded', surface === 'embedded');
        fixture.detectChanges();
        element.classList.add(scheme);
        pre.append(probe);

        const background = getComputedStyle(pre).backgroundColor;

        for (const name of TEXT_COLORS) {
          probe.style.color = `var(${name})`;

          const ratio = contrastRatio(getComputedStyle(probe).color, background);

          expect({ name, enough: ratio >= 4.5 }).toEqual({ name, enough: true });
        }

        probe.remove();
      });
    }
  }

  describe('surface', () => {
    for (const scheme of ['light', 'dark'] as const) {
      it(`stands apart from the page on its own in the ${scheme} scheme: an edge and the muted background`, () => {
        const { element, pre } = setup(() => Promise.resolve(fake));

        document.documentElement.classList.add(scheme);

        const style = getComputedStyle(element);
        const page = getComputedStyle(document.body).backgroundColor;
        const probe = document.createElement('span');

        probe.style.color = 'var(--arn-muted)';
        element.append(probe);

        expect(style.borderTopStyle).toBe('solid');
        expect(style.borderTopWidth).toBe('1px');
        expect(style.borderTopLeftRadius).not.toBe('0px');
        expect(style.backgroundColor).toBe(getComputedStyle(probe).color);
        expect(getComputedStyle(pre).backgroundColor).toBe(style.backgroundColor);
        expect(style.backgroundColor).not.toBe(page);

        probe.remove();
      });
    }

    it('has no surface of its own inside the example card', () => {
      const { fixture, element, pre } = setup(() => Promise.resolve(fake));

      fixture.componentRef.setInput('embedded', true);
      fixture.detectChanges();

      const probe = document.createElement('span');

      probe.style.color = 'var(--arn-card)';
      element.append(probe);

      expect(getComputedStyle(element).borderTopStyle).toBe('none');
      expect(getComputedStyle(pre).backgroundColor).toBe(getComputedStyle(probe).color);

      probe.remove();
    });
  });

  describe('copy button', () => {
    function withClipboard(
      clipboard: DocsClipboard | null,
      source = code,
    ): Block & { announced: string[] } {
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

      return { ...setup(() => Promise.resolve(fake), source), announced };
    }

    function copyButton(element: HTMLElement): HTMLButtonElement {
      return queryAs(element, '.docs-code-block-copy button', HTMLButtonElement);
    }

    function column(element: HTMLElement): HTMLElement {
      return query(element, '.docs-code-block-copy');
    }

    it('copies the code, with a check mark and a polite announcement', async () => {
      const copied: string[] = [];
      const block = withClipboard({
        writeText: (value) => {
          copied.push(value);

          return Promise.resolve();
        },
      });
      const button = copyButton(block.element);

      expect(button.type).toBe('button');
      expect(button.getAttribute('aria-label')).toBe('Copy code');
      expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(button.querySelector('svg')?.getAttribute('focusable')).toBe('false');

      button.click();
      await block.settle();

      expect(copied).toEqual([code]);
      expect(button.querySelector('svg')?.getAttribute('data-icon')).toBe('check');
      expect(block.announced).toEqual(['Copied (polite)']);
    });

    it('shows and announces a failure when there is no clipboard, and keeps the button shown', async () => {
      const block = withClipboard(null);

      copyButton(block.element).click();
      await block.settle();
      copyButton(block.element).blur();

      expect(text(query(block.element, '.docs-copy-status'))).toBe('Copy failed');
      expect(block.announced).toEqual(['Copy failed (polite)']);
      expect(getComputedStyle(column(block.element)).opacity).toBe('1');
    });

    it('is not there inside the example card', () => {
      const { fixture, element } = setup(() => Promise.resolve(fake));

      fixture.componentRef.setInput('embedded', true);
      fixture.detectChanges();

      expect(element.querySelector('button')).toBeNull();
      expect(element.querySelector('.docs-code-block-copy')).toBeNull();
    });

    it('hides until hover or focus, but stays in the tab order', async () => {
      const block = withClipboard(null, longLine);
      const button = copyButton(block.element);

      await measured(block);

      // The test runner's pointer is not over the block.
      expect(getComputedStyle(column(block.element)).opacity).toBe('0');
      expect(button.tabIndex).toBe(0);
      expect(getComputedStyle(button).visibility).toBe('visible');
      expect(getComputedStyle(button).display).not.toBe('none');

      button.focus();
      await block.settle();

      expect(getComputedStyle(column(block.element)).opacity).toBe('1');

      block.pre.focus();
      await block.settle();

      expect(getComputedStyle(column(block.element)).opacity).toBe('1');
    });

    it('shows while a pointer hovers the block', async () => {
      const block = withClipboard(null);

      // The browser updates the hover state on its next frame, not inside the pointer move.
      await userEvent.hover(block.pre);
      await expect.poll(() => getComputedStyle(column(block.element)).opacity).toBe('1');

      await userEvent.unhover(block.pre);
      await expect.poll(() => getComputedStyle(column(block.element)).opacity).toBe('0');
    });

    it('shows on hover where a pointer hovers, and always where nothing hovers', () => {
      withClipboard(null);

      const rules = (media: string): string[] =>
        Array.from(document.styleSheets)
          .flatMap((sheet) => Array.from(sheet.cssRules))
          .filter(
            (rule): rule is CSSMediaRule =>
              rule instanceof CSSMediaRule && rule.conditionText === media,
          )
          .flatMap((rule) => Array.from(rule.cssRules))
          .filter(
            (rule): rule is CSSStyleRule =>
              rule instanceof CSSStyleRule &&
              rule.selectorText.includes('docs-code-block-copy') &&
              rule.style.opacity === '1',
          )
          .map((rule) => rule.selectorText);

      expect(rules('(hover: none)').length).toBe(1);
      expect(rules('(hover: hover)').some((selector) => selector.includes(':hover'))).toBe(true);
    });

    it('never covers the code: a scrolled long line ends at the edge of the pre', async () => {
      const block = withClipboard(null, longLine);

      await block.settle();
      block.pre.scrollLeft = block.pre.scrollWidth;

      const pre = block.pre.getBoundingClientRect();
      const button = copyButton(block.element).getBoundingClientRect();

      expect(block.pre.scrollLeft).toBeGreaterThan(0);
      expect(button.left).toBeGreaterThanOrEqual(pre.right);
      expect(button.top).toBeLessThan(pre.top + pre.height / 2);
    });

    it('sits at the inline end in a right-to-left page; the code stays left-to-right', async () => {
      const block = withClipboard(null);

      TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
      await block.settle();

      expect(copyButton(block.element).getBoundingClientRect().right).toBeLessThanOrEqual(
        block.pre.getBoundingClientRect().left,
      );
      expect(getComputedStyle(block.pre).direction).toBe('ltr');
    });

    it('does not make a 320px page scroll sideways, with a long line and a failure shown', async () => {
      const block = withClipboard(null, longLine);

      copyButton(block.element).click();
      await block.settle();

      expect(block.element.querySelector('.docs-copy-status')).not.toBeNull();
      await expectNoPageOverflow(block.element, block.settle);
    });

    it('gives the button a target of at least 24 by 24px in compact mode', async () => {
      const block = withClipboard(null);

      TestBed.inject(ArnConfigService).update({ density: 'compact' });
      await block.settle();

      const box = copyButton(block.element).getBoundingClientRect();

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    });

    for (const scheme of ['light', 'dark'] as const) {
      it(`keeps the icon at 3:1 and the failure text at 4.5:1 in the ${scheme} scheme`, async () => {
        const block = withClipboard(null);

        TestBed.inject(ArnConfigService).update({ colorScheme: scheme });
        copyButton(block.element).click();
        await block.settle();

        const button = copyButton(block.element);
        const svg = button.querySelector('svg') ?? button;
        const status = query(block.element, '.docs-copy-status');

        expect(getComputedStyle(svg).stroke).toBe(getComputedStyle(svg).color);
        expect(
          contrastRatio(getComputedStyle(svg).color, getComputedStyle(button).backgroundColor),
        ).toBeGreaterThanOrEqual(3);
        // The icon identifies the button; it holds 3:1 against the block around the button too.
        expect(
          contrastRatio(
            getComputedStyle(svg).color,
            getComputedStyle(block.element).backgroundColor,
          ),
        ).toBeGreaterThanOrEqual(3);
        expect(
          contrastRatio(getComputedStyle(status).color, getComputedStyle(status).backgroundColor),
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    describe('tab stop', () => {
      const mediumLine = `const value = '${'x'.repeat(100)}';\n`;

      /** Puts the block in a box of the given width, as a narrow or a wide page would. */
      function inPage(block: Block, width: string): HTMLElement {
        const page = document.createElement('div');

        page.style.inlineSize = width;
        block.element.before(page);
        page.append(block.element);
        onTestFinished(() => {
          page.remove();
        });

        return page;
      }

      it('is no tab stop when the code fits: Tab goes straight to the copy button', async () => {
        const block = withClipboard(null);

        await measured(block);

        expect(block.pre.scrollWidth).toBeLessThanOrEqual(block.pre.clientWidth);
        expect(block.pre.hasAttribute('tabindex')).toBe(false);

        await tabFromBefore(block);

        expect(document.activeElement).toBe(copyButton(block.element));
      });

      it('is a tab stop when a long line overflows a 320px page: the ring shows, arrows scroll it', async () => {
        const block = withClipboard(null, longLine);

        inPage(block, '320px');
        await measured(block);

        expect(block.pre.getAttribute('tabindex')).toBe('0');

        await tabFromBefore(block);

        expect(document.activeElement).toBe(block.pre);
        expect(block.pre.matches(':focus-visible')).toBe(true);
        expect(getComputedStyle(block.pre).outlineStyle).toBe('solid');

        await userEvent.keyboard('{ArrowRight}');
        await expect.poll(() => block.pre.scrollLeft).toBeGreaterThan(0);
      });

      it('becomes a tab stop when the page narrows, and stops being one when it widens', async () => {
        const block = withClipboard(null, mediumLine);
        const page = inPage(block, '1400px');

        await measured(block);

        expect(block.pre.hasAttribute('tabindex')).toBe(false);

        page.style.inlineSize = '320px';
        await expect.poll(() => block.pre.getAttribute('tabindex')).toBe('0');

        page.style.inlineSize = '1400px';
        await expect.poll(() => block.pre.hasAttribute('tabindex')).toBe(false);
      });

      it('measures again when the code changes in the same box', async () => {
        const block = withClipboard(null);

        inPage(block, '800px');
        await measured(block);

        expect(block.pre.hasAttribute('tabindex')).toBe(false);

        block.fixture.componentRef.setInput('code', longLine);
        await expect.poll(() => block.pre.getAttribute('tabindex')).toBe('0');
      });

      it('has no scrollable-region-focusable violation, fitting or overflowing', async () => {
        const fits = withClipboard(null);

        await measured(fits);
        await expectNoA11yViolations(fits.element);

        TestBed.resetTestingModule();

        const overflows = withClipboard(null, longLine);

        inPage(overflows, '320px');
        await measured(overflows);

        expect(overflows.pre.getAttribute('tabindex')).toBe('0');
        await expectNoA11yViolations(overflows.element);
      });

      it('is no tab stop without ResizeObserver, even when the code overflows', async () => {
        vi.stubGlobal('ResizeObserver', undefined);
        onTestFinished(() => {
          vi.unstubAllGlobals();
        });

        const block = withClipboard(null, longLine);

        inPage(block, '320px');
        await measured(block);

        expect(block.pre.scrollWidth).toBeGreaterThan(block.pre.clientWidth);
        expect(block.pre.hasAttribute('tabindex')).toBe(false);
      });

      it('disconnects its observer when destroyed', async () => {
        const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect');
        const block = withClipboard(null);

        await measured(block);
        block.fixture.destroy();

        expect(disconnect).toHaveBeenCalled();
        disconnect.mockRestore();
      });
    });

    describe('focus ring', () => {
      /** The box the outline paints: the border box grown by offset plus width. */
      function ringBox(target: HTMLElement): DOMRect {
        const style = getComputedStyle(target);
        const grow = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
        const box = target.getBoundingClientRect();

        return new DOMRect(box.x - grow, box.y - grow, box.width + grow * 2, box.height + grow * 2);
      }

      /** The block clips its overflow at the padding box, inside the border. */
      function clipBox(element: HTMLElement): DOMRect {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const top = parseFloat(style.borderTopWidth);
        const right = parseFloat(style.borderRightWidth);
        const bottom = parseFloat(style.borderBottomWidth);
        const left = parseFloat(style.borderLeftWidth);

        return new DOMRect(
          box.x + left,
          box.y + top,
          box.width - left - right,
          box.height - top - bottom,
        );
      }

      function expectUnclipped(ring: DOMRect, clip: DOMRect): void {
        expect(ring.top).toBeGreaterThanOrEqual(clip.top);
        expect(ring.left).toBeGreaterThanOrEqual(clip.left);
        expect(ring.bottom).toBeLessThanOrEqual(clip.bottom);
        expect(ring.right).toBeLessThanOrEqual(clip.right);
      }

      async function tabTo(block: Block, target: HTMLElement): Promise<void> {
        await tabFromBefore(block);
        if (document.activeElement !== target) {
          await userEvent.tab();
        }

        expect(document.activeElement).toBe(target);
        expect(target.matches(':focus-visible')).toBe(true);
      }

      /** The ring of the pre is drawn inside it, in its padding: on all four edges, over no code. */
      function expectPreRing(block: Block): void {
        const style = getComputedStyle(block.pre);
        const inset = -parseFloat(style.outlineOffset);

        expect(style.outlineStyle).toBe('solid');
        expectUnclipped(ringBox(block.pre), clipBox(block.element));
        expect(inset).toBeGreaterThanOrEqual(parseFloat(style.outlineWidth));
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
          expect(inset).toBeLessThanOrEqual(parseFloat(style[`padding${side}`]));
        }
      }

      for (const scheme of ['light', 'dark'] as const) {
        it(`shows the ring of the focused code on all four edges in the ${scheme} scheme, at 3:1`, async () => {
          const block = withClipboard(null, longLine);

          TestBed.inject(ArnConfigService).update({ colorScheme: scheme });
          await measured(block);
          await tabTo(block, block.pre);

          expectPreRing(block);
          expect(
            contrastRatio(
              getComputedStyle(block.pre).outlineColor,
              getComputedStyle(block.pre).backgroundColor,
            ),
          ).toBeGreaterThanOrEqual(3);
        });
      }

      it('shows the ring of the focused code on all four edges in a right-to-left page', async () => {
        const block = withClipboard(null, longLine);

        TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
        await measured(block);
        await tabTo(block, block.pre);

        expectPreRing(block);
      });

      it('shows the ring of the focused code on all four edges on a 320px page', async () => {
        const block = withClipboard(null, longLine);
        const page = document.createElement('div');

        page.style.inlineSize = '320px';
        block.element.before(page);
        page.append(block.element);
        await measured(block);
        await tabTo(block, block.pre);

        expectPreRing(block);

        block.element.remove();
        page.remove();
      });

      it('shows the whole ring of the copy button when Tab reaches it', async () => {
        const block = withClipboard(null);
        const button = copyButton(block.element);

        await measured(block);
        await tabTo(block, button);

        expect(getComputedStyle(button).outlineStyle).toBe('solid');
        expectUnclipped(ringBox(button), clipBox(block.element));
      });
    });

    for (const mode of A11Y_MODES) {
      it(`has no accessibility violations in ${mode.name} mode, with a failure shown`, async () => {
        const block = withClipboard(null);

        TestBed.inject(ArnConfigService).update(mode.config);
        copyButton(block.element).click();
        await block.settle();

        await expectNoA11yViolations(block.element);
      });
    }
  });

  it('has no accessibility violations, plain or highlighted', async () => {
    const pending = deferred();
    const { element, settle } = setup(pending.loader);

    await expectNoA11yViolations(element);

    pending.resolve(fake);
    await settle();

    await expectNoA11yViolations(element);
  });
});
