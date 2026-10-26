import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DocsTableView } from './docs-table';

let nextId = 0;

/**
 * The table behind `docs-api-table` and `docs-token-table`. It sits in a focusable, labelled region
 * that scrolls sideways on its own, so a narrow viewport never scrolls the page and keyboard users
 * can reach the overflow.
 */
@Component({
  selector: 'docs-table',
  templateUrl: './docs-table.component.html',
  styleUrl: './docs-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsTableComponent {
  readonly view = input.required<DocsTableView>();

  protected readonly captionId = `docs-table-${String(nextId++)}-caption`;
}
