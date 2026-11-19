import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-sizes-example',
  imports: [ArnButton],
  templateUrl: './sizes.example.html',
  styleUrl: './sizes.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonSizesExampleComponent {}
