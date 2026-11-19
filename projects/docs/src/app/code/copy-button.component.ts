import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCS_CLIPBOARD } from './clipboard';

export type DocsCopyState = 'idle' | 'copied' | 'failed';

/** How long the "copied" check mark stays. A failure stays until the next action. */
export const COPIED_RESET_MS = 3000;

/**
 * An icon button that copies `text`. On success the icon turns into a check mark for
 * `COPIED_RESET_MS`; on failure (refused, or no clipboard) a visible "Copy failed" stays until the
 * next copy or `reset()`. Both are announced politely. The host adds no box (`display: contents`),
 * so the button and the failure text sit in the parent's layout.
 */
@Component({
  selector: 'docs-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrl: './copy-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButtonComponent {
  private readonly announcer = inject(LiveAnnouncer);
  private readonly clipboard = inject(DOCS_CLIPBOARD);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  /** What the button copies. */
  readonly text = input.required<string>();

  private readonly current = signal<DocsCopyState>('idle');
  /** The result of the last copy, until it times out (success) or is reset. */
  readonly state = this.current.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearTimer();
    });
  }

  /** Back to the copy icon, with no failure shown; for the parent's other actions. */
  reset(): void {
    this.clearTimer();
    this.current.set('idle');
  }

  protected async copy(): Promise<void> {
    let copied = false;

    this.clearTimer();

    try {
      if (this.clipboard) {
        await this.clipboard.writeText(this.text());
        copied = true;
      }
    } catch {
      copied = false;
    }

    this.current.set(copied ? 'copied' : 'failed');
    void this.announcer.announce(copied ? 'Copied' : 'Copy failed', 'polite');

    if (copied) {
      this.resetTimer = setTimeout(() => {
        this.resetTimer = undefined;
        this.current.set('idle');
      }, COPIED_RESET_MS);
    }
  }

  private clearTimer(): void {
    if (this.resetTimer !== undefined) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}
