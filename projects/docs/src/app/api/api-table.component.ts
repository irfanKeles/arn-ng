import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { DocsApiTable } from './docs-api';
import { apiTableView } from './docs-table';
import { DocsTableComponent } from './docs-table.component';

/** An API table of a component page: inputs, outputs, methods or templates. */
@Component({
  selector: 'docs-api-table',
  imports: [DocsTableComponent],
  template: '<docs-table [view]="view()" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiTableComponent {
  readonly table = input.required<DocsApiTable>();

  protected readonly view = computed(() => apiTableView(this.table()));
}
