import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CodeBlockComponent } from '../code/code-block.component';
import type { DocsCodeLanguage } from '../code/docs-code';
import { DOCS_CLIPBOARD } from './clipboard';

type ExampleTabId = 'html' | 'ts' | 'css';
type CopyState = 'idle' | 'copied' | 'failed';

interface ExampleTab {
  readonly id: ExampleTabId;
  readonly label: string;
  readonly language: DocsCodeLanguage;
}

const HTML_TAB: ExampleTab = { id: 'html', label: 'HTML', language: 'html' };
const TS_TAB: ExampleTab = { id: 'ts', label: 'TS', language: 'typescript' };
const CSS_TAB: ExampleTab = { id: 'css', label: 'CSS', language: 'css' };

const COPY_LABELS: Record<CopyState, string> = {
  idle: 'Copy code',
  copied: 'Copied',
  failed: 'Copy failed',
};

let nextId = 0;

/**
 * An example: the running demo (projected content) and, behind "Show code", its template, class
 * and, if it has one, stylesheet in tabs with a copy button. `html`, `ts` and `css` are the texts of
 * the files the demo is compiled from.
 */
@Component({
  selector: 'docs-example',
  imports: [CodeBlockComponent],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExampleComponent {
  private readonly announcer = inject(LiveAnnouncer);
  private readonly clipboard = inject(DOCS_CLIPBOARD);
  private readonly directionality = inject(Directionality);
  private readonly document = inject(DOCUMENT);
  private readonly id = `docs-example-${String(nextId++)}`;

  /** The text of the example's template file. */
  readonly html = input.required<string>();
  /** The text of the example's component file. */
  readonly ts = input.required<string>();
  /** The text of the example's stylesheet; without it there is no CSS tab. */
  readonly css = input<string>();

  protected readonly tabs = computed<readonly ExampleTab[]>(() =>
    this.css() === undefined ? [HTML_TAB, TS_TAB] : [HTML_TAB, TS_TAB, CSS_TAB],
  );
  protected readonly codeId = `${this.id}-code`;
  protected readonly panelId = `${this.id}-panel`;
  protected readonly open = signal(false);
  private readonly selected = signal<ExampleTabId>('html');
  /** The selected tab; back to the first one if the selected tab goes away. */
  protected readonly activeTab = computed(
    () => this.tabs().find((tab) => tab.id === this.selected()) ?? HTML_TAB,
  );
  protected readonly active = computed(() => this.activeTab().id);
  protected readonly copyState = signal<CopyState>('idle');
  protected readonly copyLabel = computed(() => COPY_LABELS[this.copyState()]);
  protected readonly activeCode = computed(() => {
    switch (this.active()) {
      case 'html':
        return this.html();
      case 'ts':
        return this.ts();
      case 'css':
        return this.css() ?? '';
    }
  });

  protected tabId(id: ExampleTabId): string {
    return `${this.id}-tab-${id}`;
  }

  protected toggle(): void {
    this.open.update((open) => !open);
    this.copyState.set('idle');
  }

  protected select(id: ExampleTabId): void {
    this.selected.set(id);
    this.copyState.set('idle');
  }

  /** Arrow keys, Home and End move between the tabs; the tab that gets focus is selected. */
  protected onTabKeydown(event: KeyboardEvent): void {
    const tabs = this.tabs();
    const rtl = this.directionality.value === 'rtl';
    const current = tabs.findIndex((tab) => tab.id === this.active());
    let index: number;

    switch (event.key) {
      case 'ArrowRight':
        index = current + (rtl ? -1 : 1);
        break;
      case 'ArrowLeft':
        index = current + (rtl ? 1 : -1);
        break;
      case 'Home':
        index = 0;
        break;
      case 'End':
        index = tabs.length - 1;
        break;
      default:
        return;
    }

    const tab = tabs[(index + tabs.length) % tabs.length];

    if (!tab) {
      return;
    }

    event.preventDefault();
    this.select(tab.id);
    // Both tabs stay in the DOM while the list is shown; tabindex="-1" does not block focus().
    this.document.getElementById(this.tabId(tab.id))?.focus();
  }

  protected async copy(): Promise<void> {
    let copied = false;

    try {
      if (this.clipboard) {
        await this.clipboard.writeText(this.activeCode());
        copied = true;
      }
    } catch {
      copied = false;
    }

    this.copyState.set(copied ? 'copied' : 'failed');
    void this.announcer.announce(copied ? 'Code copied to clipboard' : 'Could not copy the code');
  }
}
