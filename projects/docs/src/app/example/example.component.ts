import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { CodeBlockComponent } from '../code/code-block.component';
import { CopyButtonComponent } from '../code/copy-button.component';
import type { DocsCodeLanguage } from '../code/docs-code';

export { COPIED_RESET_MS } from '../code/copy-button.component';

type ExampleFileId = 'html' | 'ts' | 'css';

interface ExampleFile {
  readonly id: ExampleFileId;
  readonly label: string;
  readonly language: DocsCodeLanguage;
}

const HTML_FILE: ExampleFile = { id: 'html', label: 'HTML', language: 'html' };
const TS_FILE: ExampleFile = { id: 'ts', label: 'TS', language: 'typescript' };
const CSS_FILE: ExampleFile = { id: 'css', label: 'CSS', language: 'css' };

let nextId = 0;

/**
 * An example card: the running demo (projected content) in the middle and, below it, a bar with a
 * "Preview" label, one option per file (HTML, TS and, if the example has one, CSS), a copy button
 * and, while code is shown, a button that hides it. An option shows that file in a numbered code
 * panel under the bar. `html`, `ts` and `css` are the texts of the files the demo is compiled from.
 */
@Component({
  selector: 'docs-example',
  imports: [CodeBlockComponent, CopyButtonComponent],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  private readonly id = `docs-example-${String(nextId++)}`;
  private readonly optionButtons = viewChildren<ElementRef<HTMLButtonElement>>('option');
  private readonly copyButton = viewChild.required(CopyButtonComponent);

  /** The text of the example's template file. */
  readonly html = input.required<string>();
  /** The text of the example's component file. */
  readonly ts = input.required<string>();
  /** The text of the example's stylesheet; without it there is no CSS option. */
  readonly css = input<string>();

  protected readonly files = computed<readonly ExampleFile[]>(() =>
    this.css() === undefined ? [HTML_FILE, TS_FILE] : [HTML_FILE, TS_FILE, CSS_FILE],
  );
  protected readonly codeId = `${this.id}-code`;
  protected readonly open = signal(false);
  /** The last chosen file; remembered while the code is hidden, to return focus to its option. */
  private readonly selected = signal<ExampleFileId>('html');
  /** The chosen file; back to HTML if it goes away. */
  protected readonly activeFile = computed(
    () => this.files().find((file) => file.id === this.selected()) ?? HTML_FILE,
  );
  protected readonly shownCode = computed(() => {
    switch (this.activeFile().id) {
      case 'html':
        return this.html();
      case 'ts':
        return this.ts();
      case 'css':
        return this.css() ?? '';
    }
  });
  /** What the copy button copies: the shown file, or the template while the code is hidden. */
  protected readonly copyText = computed(() => (this.open() ? this.shownCode() : this.html()));

  protected pressed(id: ExampleFileId): boolean {
    return this.open() && this.activeFile().id === id;
  }

  /** Shows a file. Choosing the shown file again keeps it shown. */
  protected select(id: ExampleFileId): void {
    if (this.pressed(id)) {
      return;
    }

    this.selected.set(id);
    this.open.set(true);
    this.copyButton().reset();
  }

  /** Hides the code. The hide button goes away with it, so focus moves to the last option. */
  protected hide(): void {
    const index = this.files().indexOf(this.activeFile());

    this.open.set(false);
    this.copyButton().reset();
    this.optionButtons()[index]?.nativeElement.focus();
  }
}
