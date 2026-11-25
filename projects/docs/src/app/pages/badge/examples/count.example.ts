import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';

@Component({
  selector: 'docs-badge-count-example',
  imports: [ArnBadge],
  templateUrl: './count.example.html',
  styleUrl: './count.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeCountExampleComponent {}
