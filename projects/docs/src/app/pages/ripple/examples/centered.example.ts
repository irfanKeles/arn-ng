import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';

@Component({
  selector: 'docs-ripple-centered-example',
  imports: [ArnRippleDirective],
  templateUrl: './centered.example.html',
  styleUrl: './centered.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RippleCenteredExampleComponent {}
