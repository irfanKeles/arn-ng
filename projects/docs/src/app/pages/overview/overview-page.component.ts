import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'docs-overview-page',
  templateUrl: './overview-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class OverviewPageComponent {}
