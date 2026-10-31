import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { injectArnConfig } from '@arn-ng/ui/core';

/** Shows what a component reads from the configuration where it is placed. */
@Component({
  selector: 'docs-configuration-locale-example',
  templateUrl: './locale.example.html',
  styleUrl: './locale.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationLocaleExampleComponent {
  private readonly config = injectArnConfig();

  protected readonly locale = this.config.locale;
  protected readonly common = computed(() => this.config.messages().common);
  protected readonly months = computed(() =>
    this.config.messages().datePicker.monthNames.join(', '),
  );
  protected readonly days = computed(() =>
    this.config.messages().datePicker.dayNamesShort.join(', '),
  );
}
