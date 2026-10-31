import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ArnConfigDirective } from '@arn-ng/ui/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';

@Component({
  selector: 'docs-ripple-config-example',
  imports: [ArnConfigDirective, ArnRippleDirective],
  templateUrl: './config.example.html',
  styleUrl: './config.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RippleConfigExampleComponent {
  /** The section's ripple setting. */
  protected readonly enabled = signal(true);
  /** Not given: the directive follows the configuration of its section. */
  protected readonly followConfig = undefined;

  protected toggle(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.enabled.set(event.target.checked);
    }
  }
}
