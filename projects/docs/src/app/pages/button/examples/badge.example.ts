import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnBadge } from '@arn-ng/ui/badge';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-badge-example',
  imports: [ArnBadge, ArnButton],
  templateUrl: './badge.example.html',
  styleUrl: './badge.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonBadgeExampleComponent {}
