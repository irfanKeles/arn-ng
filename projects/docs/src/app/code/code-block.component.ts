import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  type OnChanges,
} from '@angular/core';
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
 */
@Component({
  selector: 'docs-code-block',
  templateUrl: './code-block.component.html',
  styleUrl: './code-block.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBlockComponent implements OnChanges {
  private readonly highlighter = inject(DocsHighlighterService);

  readonly code = input.required<string>();
  readonly language = input.required<DocsCodeLanguage>();
  /** Accessible name of the scrollable code area. */
  readonly label = input('Code');
  /** Numbers the lines. */
  readonly lineNumbers = input(false);

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
