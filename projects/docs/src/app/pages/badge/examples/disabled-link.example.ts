import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';

@Component({
  selector: 'docs-badge-disabled-link-example',
  imports: [ArnBadge],
  templateUrl: './disabled-link.example.html',
  styleUrl: './disabled-link.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDisabledLinkExampleComponent {}
