import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  type OnChanges,
} from '@angular/core';
import type { DocsCodeLanguage, DocsCodeToken } from './docs-code';
import { DocsHighlighterService } from './highlighter.service';

/**
 * A block of code. It shows the plain text at once and swaps in the highlighted tokens, in the same
 * box, when the highlighter has loaded; if it never loads, the plain text stays.
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

  protected readonly tokens = signal<readonly DocsCodeToken[] | null>(null);

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
