import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';

@Component({
  selector: 'docs-badge-link-example',
  imports: [ArnBadge],
  templateUrl: './link.example.html',
  styleUrl: './link.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeLinkExampleComponent {}
