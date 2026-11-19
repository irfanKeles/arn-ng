import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-variants-example',
  imports: [ArnButton],
  templateUrl: './variants.example.html',
  styleUrl: './variants.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonVariantsExampleComponent {}
