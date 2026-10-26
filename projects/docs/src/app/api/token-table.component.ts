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

  protected readonly view = computed(() => tokenTableView(this.rows()));
}
