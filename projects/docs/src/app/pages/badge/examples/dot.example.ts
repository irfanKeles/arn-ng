import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';

@Component({
  selector: 'docs-badge-dot-example',
  imports: [ArnBadge],
  templateUrl: './dot.example.html',
  styleUrl: './dot.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeDotExampleComponent {}
