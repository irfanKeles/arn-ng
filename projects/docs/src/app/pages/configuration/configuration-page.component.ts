import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiTableComponent } from '../../api/api-table.component';
import type { DocsApiTable } from '../../api/docs-api';
import { CodeBlockComponent } from '../../code/code-block.component';
import { ExampleComponent } from '../../example/example.component';
import { DocsSectionComponent } from '../../toc/docs-section.component';
import { CONFIG_PROPERTIES, CONFIG_SERVICE_METHODS } from './configuration.api';
import { ConfigurationLocaleExampleComponent } from './examples/locale.example';
import localeCss from './examples/locale.example.css?source' with { loader: 'text' };
import localeHtml from './examples/locale.example.html?source' with { loader: 'text' };
import localeTs from './examples/locale.example.ts?source' with { loader: 'text' };
import { ConfigurationSectionsExampleComponent } from './examples/sections.example';
import sectionsCss from './examples/sections.example.css?source' with { loader: 'text' };
import sectionsHtml from './examples/sections.example.html?source' with { loader: 'text' };
import sectionsTs from './examples/sections.example.ts?source' with { loader: 'text' };

const GLOBAL_CODE = `// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideArn } from '@arn-ng/ui/core';

export const appConfig: ApplicationConfig = {
  providers: [provideArn({ size: 'sm', ripple: true, applyToDocument: true })],
};`;

const SECTION_CODE = `<!-- Everything inside follows these values; sections can be nested -->
<div arnConfig size="sm" density="compact" colorScheme="dark">
  …
</div>`;

const RUNTIME_CODE = `import { inject } from '@angular/core';
import { ArnConfigService } from '@arn-ng/ui/core';

const config = inject(ArnConfigService);

config.setDensity('compact');
config.update({ colorScheme: 'dark', direction: 'rtl' });
config.density(); // 'compact': every field is also a signal`;

const OWN_CODE = `import { Component, input } from '@angular/core';
import { injectArnConfig, type ArnSize } from '@arn-ng/ui/core';

@Component({ selector: 'app-tag', template: '…' })
export class TagComponent {
  /** Not given (undefined): the configuration decides. */
  readonly size = input<ArnSize>();
  protected readonly resolvedSize = injectArnConfig('size', this.size);
  protected readonly messages = injectArnConfig().messages;
}`;

const MESSAGES_CODE = `import { provideArn } from '@arn-ng/ui/core';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';

provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR });

// Or change single texts; the rest stays as it is
provideArn({ messages: { common: { cancel: 'Dismiss' } } });`;

const DIRECTION_CODE = `<!-- The whole application: set it on <html>, also right for server rendering -->
<html dir="rtl">

<!-- One part of the page -->
<div arnConfig direction="rtl">…</div>

<!-- An icon that points somewhere is mirrored in RTL -->
<svg class="arn-rtl-mirror" …>…</svg>`;

@Component({
  selector: 'docs-configuration-page',
  imports: [
    ApiTableComponent,
    CodeBlockComponent,
    ConfigurationLocaleExampleComponent,
    ConfigurationSectionsExampleComponent,
    DocsSectionComponent,
    ExampleComponent,
    RouterLink,
  ],
  templateUrl: './configuration-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class ConfigurationPageComponent {
  protected readonly globalCode = GLOBAL_CODE;
  protected readonly sectionCode = SECTION_CODE;
  protected readonly runtimeCode = RUNTIME_CODE;
  protected readonly ownCode = OWN_CODE;
  protected readonly messagesCode = MESSAGES_CODE;
  protected readonly directionCode = DIRECTION_CODE;

  protected readonly locale = { html: localeHtml, ts: localeTs, css: localeCss };
  protected readonly sections = { html: sectionsHtml, ts: sectionsTs, css: sectionsCss };

  protected readonly properties: DocsApiTable = { kind: 'properties', rows: CONFIG_PROPERTIES };
  protected readonly methods: DocsApiTable = { kind: 'methods', rows: CONFIG_SERVICE_METHODS };
}
