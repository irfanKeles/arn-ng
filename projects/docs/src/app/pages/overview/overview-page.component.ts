import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsSectionComponent } from '../../toc/docs-section.component';

@Component({
  selector: 'docs-overview-page',
  imports: [DocsSectionComponent],
  templateUrl: './overview-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class OverviewPageComponent {}
