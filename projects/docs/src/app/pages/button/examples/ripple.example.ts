import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-ripple-example',
  imports: [ArnButton],
  templateUrl: './ripple.example.html',
  styleUrl: './ripple.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonRippleExampleComponent {}
