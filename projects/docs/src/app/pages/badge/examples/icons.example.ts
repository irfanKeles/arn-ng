import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';

@Component({
  selector: 'docs-badge-icons-example',
  imports: [ArnBadge],
  templateUrl: './icons.example.html',
  styleUrl: './icons.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeIconsExampleComponent {}
