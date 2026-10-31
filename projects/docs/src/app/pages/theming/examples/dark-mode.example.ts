import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnConfigDirective } from '@arn-ng/ui/core';

@Component({
  selector: 'docs-theming-dark-mode-example',
  imports: [ArnConfigDirective],
  templateUrl: './dark-mode.example.html',
  styleUrl: './dark-mode.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemingDarkModeExampleComponent {
  /** Semantic colors; each swatch resolves light-dark() in its own section. */
  protected readonly tokens = [
    '--arn-background',
    '--arn-card',
    '--arn-primary',
    '--arn-secondary',
    '--arn-muted',
    '--arn-accent',
    '--arn-destructive',
    '--arn-border',
    '--arn-ring',
  ];
}
