import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnButton } from '@arn-ng/ui/button';

@Component({
  selector: 'docs-button-link-example',
  imports: [ArnButton],
  templateUrl: './link.example.html',
  styleUrl: './link.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonLinkExampleComponent {}
