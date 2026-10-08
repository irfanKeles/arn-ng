import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { DocsCodeLanguage, DocsHighlight } from './docs-code';
import { loadDocsHighlight } from './docs-highlight';
import { DOCS_HIGHLIGHT_LOADER, DocsHighlighterService } from './highlighter.service';

describe('DocsHighlighterService', () => {
  const plain: DocsHighlight = (code) => [
    { content: code, color: undefined, italic: false, bold: false },
  ];

  function setup(loader: () => Promise<DocsHighlight>, platform = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCS_HIGHLIGHT_LOADER, useValue: loader },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });

    return TestBed.inject(DocsHighlighterService);
  }

  it('loads the highlighter once, however often it is asked for', async () => {
    let calls = 0;
    const service = setup(() => {
      calls++;

      return Promise.resolve(plain);
    });

    const first = service.load();
    const second = service.load();

    expect(await first).toBe(plain);
    expect(await second).toBe(plain);
    expect(await service.load()).toBe(plain);
    expect(calls).toBe(1);
  });

  it('does not load anything until it is asked', () => {
    let calls = 0;

    setup(() => {
      calls++;

      return Promise.resolve(plain);
    });

    expect(calls).toBe(0);
  });

  it('resolves to null when the download fails', async () => {
    const service = setup(() => Promise.reject(new Error('offline')));

    expect(await service.load()).toBeNull();
  });

  it('resolves to null when the loader throws', async () => {
    const service = setup(() => {
      throw new Error('broken');
    });

    expect(await service.load()).toBeNull();
  });

  it('does not load on the server', async () => {
    let calls = 0;
    const service = setup(() => {
      calls++;

      return Promise.resolve(plain);
    }, 'server');

    expect(await service.load()).toBeNull();
    expect(calls).toBe(0);
  });

  describe('with the real highlighter', () => {
    const samples: readonly { language: DocsCodeLanguage; code: string }[] = [
      { language: 'html', code: '<button type="button" (click)="save()">Save</button>\n' },
      {
        language: 'typescript',
        code: "import { signal } from '@angular/core';\n\n// A counter\nexport const count = signal(0);\n",
      },
      { language: 'css', code: '.docs-page {\n  color: var(--arn-foreground);\n}\n' },
    ];

    async function load(): Promise<DocsHighlight> {
      const highlight = await TestBed.inject(DocsHighlighterService).load();

      if (!highlight) {
        throw new Error('The highlighter did not load.');
      }

      return highlight;
    }

    for (const sample of samples) {
      it(`splits ${sample.language} into more than one style without changing the text`, async () => {
        const tokens = (await load())(sample.code, sample.language);

        expect(tokens.map((token) => token.content).join('')).toBe(sample.code);
        expect(new Set(tokens.map((token) => token.color)).size).toBeGreaterThan(2);

        for (const token of tokens) {
          expect(token.color ?? 'var(--docs-code-foreground)').toMatch(
            /^var\(--docs-code-[a-z-]+\)$/,
          );
        }
      });
    }

    it('gives every caller the same highlighter', async () => {
      const first = loadDocsHighlight();

      expect(loadDocsHighlight()).toBe(first);
      expect(await load()).toBe(await first);
    });
  });
});
