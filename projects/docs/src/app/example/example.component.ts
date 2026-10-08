import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CodeBlockComponent } from '../code/code-block.component';
import type { DocsCodeLanguage } from '../code/docs-code';
import { DOCS_CLIPBOARD } from './clipboard';

type ExampleTabId = 'html' | 'ts';
type CopyState = 'idle' | 'copied' | 'failed';

interface ExampleTab {
  readonly id: ExampleTabId;
  readonly label: string;
  readonly language: DocsCodeLanguage;
}

const HTML_TAB: ExampleTab = { id: 'html', label: 'HTML', language: 'html' };
const TS_TAB: ExampleTab = { id: 'ts', label: 'TS', language: 'typescript' };
const TABS: readonly ExampleTab[] = [HTML_TAB, TS_TAB];

const COPY_LABELS: Record<CopyState, string> = {
  idle: 'Copy code',
  copied: 'Copied',
  failed: 'Copy failed',
};

let nextId = 0;

/**
 * An example: the running demo (projected content) and, behind "Show code", its template and class
 * in tabs with a copy button. `html` and `ts` are the texts of the files the demo is compiled from.
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

  protected readonly tabs = TABS;
  protected readonly codeId = `${this.id}-code`;
  protected readonly panelId = `${this.id}-panel`;
  protected readonly open = signal(false);
  protected readonly active = signal<ExampleTabId>('html');
  protected readonly copyState = signal<CopyState>('idle');
  protected readonly copyLabel = computed(() => COPY_LABELS[this.copyState()]);
  protected readonly activeTab = computed(() => (this.active() === 'html' ? HTML_TAB : TS_TAB));
  protected readonly activeCode = computed(() =>
    this.active() === 'html' ? this.html() : this.ts(),
  );

  protected tabId(id: ExampleTabId): string {
    return `${this.id}-tab-${id}`;
  }

  protected toggle(): void {
    this.open.update((open) => !open);
    this.copyState.set('idle');
  }

  protected select(id: ExampleTabId): void {
    this.active.set(id);
    this.copyState.set('idle');
  }

  /** Arrow keys, Home and End move between the tabs; the tab that gets focus is selected. */
  protected onTabKeydown(event: KeyboardEvent): void {
    const rtl = this.directionality.value === 'rtl';
    const current = TABS.findIndex((tab) => tab.id === this.active());
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
        index = TABS.length - 1;
        break;
      default:
        return;
    }

    const tab = TABS[(index + TABS.length) % TABS.length];

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
