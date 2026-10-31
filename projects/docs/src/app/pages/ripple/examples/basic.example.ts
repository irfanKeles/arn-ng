import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';

@Component({
  selector: 'docs-ripple-basic-example',
  imports: [ArnRippleDirective],
  templateUrl: './basic.example.html',
  styleUrl: './basic.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RippleBasicExampleComponent {}
