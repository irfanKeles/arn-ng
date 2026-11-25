import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';

@Component({
  selector: 'docs-badge-loading-example',
  imports: [ArnBadge],
  templateUrl: './loading.example.html',
  styleUrl: './loading.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeLoadingExampleComponent {}
