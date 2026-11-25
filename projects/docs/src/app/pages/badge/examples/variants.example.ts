import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';

@Component({
  selector: 'docs-badge-variants-example',
  imports: [ArnBadge],
  templateUrl: './variants.example.html',
  styleUrl: './variants.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeVariantsExampleComponent {}
