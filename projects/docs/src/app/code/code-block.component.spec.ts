import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { nextTask, query, resetDocument } from '../testing/dom';
import { CodeBlockComponent } from './code-block.component';
import type { DocsHighlight } from './docs-code';
import { DOCS_HIGHLIGHT_LOADER, DocsHighlighterService } from './highlighter.service';

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

  it('is a focusable, named area, so the keyboard can scroll it', () => {
    const { fixture, pre } = setup(() => Promise.resolve(fake));

    expect(pre.tabIndex).toBe(0);
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
      }
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
