import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnConfigDirective } from '@arn-ng/ui/core';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';
// The component of the previous example: it shows what it reads from the configuration
import { ConfigurationLocaleExampleComponent } from './locale.example';

@Component({
  selector: 'docs-configuration-sections-example',
  imports: [ArnConfigDirective, ConfigurationLocaleExampleComponent],
  templateUrl: './sections.example.html',
  styleUrl: './sections.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationSectionsExampleComponent {
  protected readonly turkish = ARN_MESSAGES_TR;
}
