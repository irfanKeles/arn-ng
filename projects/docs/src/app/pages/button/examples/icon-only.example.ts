import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-icon-only-example',
  imports: [ArnButton],
  templateUrl: './icon-only.example.html',
  styleUrl: './icon-only.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconOnlyExampleComponent {}
