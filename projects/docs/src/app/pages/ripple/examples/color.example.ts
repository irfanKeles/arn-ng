import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';

@Component({
  selector: 'docs-ripple-color-example',
  imports: [ArnRippleDirective],
  templateUrl: './color.example.html',
  styleUrl: './color.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RippleColorExampleComponent {}
