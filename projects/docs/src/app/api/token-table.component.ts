import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DocsApiToken } from './docs-api';
import { tokenTableView } from './docs-table';
import { DocsTableComponent } from './docs-table.component';

/** The Styling table of a component page: every CSS token with its default and purpose. */
@Component({
  selector: 'docs-token-table',
  imports: [DocsTableComponent],
  template: '<docs-table [view]="view()" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenTableComponent {
  readonly rows = input.required<readonly DocsApiToken[]>();
  /** Names the table and its scroll region; give each table on a page its own. */
  readonly caption = input('CSS tokens');

  protected readonly view = computed(() => tokenTableView(this.rows(), this.caption()));
}
