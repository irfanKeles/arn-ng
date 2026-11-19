import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-icons-example',
  imports: [ArnButton],
  templateUrl: './icons.example.html',
  styleUrl: './icons.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonIconsExampleComponent {}
