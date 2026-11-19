import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-disabled-example',
  imports: [ArnButton],
  templateUrl: './disabled.example.html',
  styleUrl: './disabled.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDisabledExampleComponent {}
