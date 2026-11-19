import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  type OnChanges,
} from '@angular/core';
import { CopyButtonComponent } from './copy-button.component';
import type { DocsCodeLanguage, DocsCodeToken } from './docs-code';
import { DocsHighlighterService } from './highlighter.service';

/** Splits tokens at line breaks; the lines joined with "\n" give back the code. */
function splitLines(tokens: readonly DocsCodeToken[]): DocsCodeToken[][] {
  let line: DocsCodeToken[] = [];
  const lines = [line];

  for (const token of tokens) {
    token.content.split('\n').forEach((part, index) => {
      if (index > 0) {
        line = [];
        lines.push(line);
      }
      if (part !== '') {
        line.push({ ...token, content: part });
      }
    });
  }

  return lines;
}

/**
 * A block of code. It shows the plain text at once and swaps in the highlighted tokens, in the same
 * box, when the highlighter has loaded; if it never loads, the plain text stays. With `lineNumbers`
 * each line gets a number that is not part of the text: it cannot be selected or copied.
 *
 * On its own the block has a surface (edge and muted background) and a copy button in its top end
 * corner. `embedded` drops both: the example card frames the block and has its own copy button.
 *
 * The code area is a tab stop only while its text overflows sideways, so the keyboard can scroll
 * it; a block that fits is skipped and Tab goes straight to the copy button. A ResizeObserver
 * measures again when the box changes (window, text size, density); an effect after each render
 * measures new content. On the server, or without ResizeObserver, there is no tab stop.
 */
@Component({
  selector: 'docs-code-block',
  imports: [CopyButtonComponent],
  templateUrl: './code-block.component.html',
  styleUrl: './code-block.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.docs-code-block-embedded]': 'embedded()' },
})
export class CodeBlockComponent implements OnChanges {
  private readonly highlighter = inject(DocsHighlighterService);

  readonly code = input.required<string>();
  readonly language = input.required<DocsCodeLanguage>();
  /** Accessible name of the scrollable code area. */
  readonly label = input('Code');
  /** Numbers the lines. */
  readonly lineNumbers = input(false);
  /** Inside a frame that has its own copy button (the example card): no surface, no copy button. */
  readonly embedded = input(false);

  private readonly copyButton = viewChild(CopyButtonComponent);
  /** A copy result is showing: the button stays visible while it does, pointer or not. */
  protected readonly copyResult = computed(() => (this.copyButton()?.state() ?? 'idle') !== 'idle');

  private readonly pre = viewChild.required<ElementRef<HTMLElement>>('pre');
  /** The text is wider than the code area: it scrolls, so the area takes keyboard focus. */
  protected readonly scrollable = signal(false);
  private observing = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Browser only: render hooks do not run on the server.
    afterNextRender(() => {
      const pre = this.pre().nativeElement;
      const view = pre.ownerDocument.defaultView;

      if (!view || typeof view.ResizeObserver !== 'function') {
        return;
      }

      const observer = new view.ResizeObserver(() => {
        this.measure();
      });

      observer.observe(pre);
      this.observing = true;
      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
    });

    afterRenderEffect({
      read: () => {
        // New text in the same box: the observer does not see it.
        this.code();
        this.tokens();
        this.lineNumbers();
        this.measure();
      },
    });
  }

  private measure(): void {
    if (!this.observing) {
      return;
    }

    const pre = this.pre().nativeElement;

    this.scrollable.set(pre.scrollWidth > pre.clientWidth);
  }

  protected readonly tokens = signal<readonly DocsCodeToken[] | null>(null);
  /**
   * The numbered lines, highlighted or plain. The empty line after a final line break gets no
   * number; `finalBreak` puts the break back.
   */
  protected readonly numbered = computed(() => {
    const lines = splitLines(
      this.tokens() ?? [{ content: this.code(), color: undefined, italic: false, bold: false }],
    );
    const finalBreak = lines.length > 1 && lines.at(-1)?.length === 0;

    if (finalBreak) {
      lines.pop();
    }

    // The digits of the highest number set the width of the number column.
    return { lines, finalBreak, digits: String(lines.length).length };
  });

  ngOnChanges(): void {
    const code = this.code();
    const language = this.language();

    this.tokens.set(null);

    void this.highlighter.load().then((highlight) => {
      // The inputs may have changed while the highlighter was loading.
      if (!highlight || code !== this.code() || language !== this.language()) {
        return;
      }

      try {
        this.tokens.set(highlight(code, language));
      } catch {
        // Keep the plain text.
      }
    });
  }
}
