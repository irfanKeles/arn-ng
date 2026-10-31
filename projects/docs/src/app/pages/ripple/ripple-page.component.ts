import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiTableComponent } from '../../api/api-table.component';
import type { DocsApiTable } from '../../api/docs-api';
import { TokenTableComponent } from '../../api/token-table.component';
import { CodeBlockComponent } from '../../code/code-block.component';
import { ExampleComponent } from '../../example/example.component';
import { DocsSectionComponent } from '../../toc/docs-section.component';
import { RippleBasicExampleComponent } from './examples/basic.example';
import basicCss from './examples/basic.example.css?source' with { loader: 'text' };
import basicHtml from './examples/basic.example.html?source' with { loader: 'text' };
import basicTs from './examples/basic.example.ts?source' with { loader: 'text' };
import { RippleCenteredExampleComponent } from './examples/centered.example';
import centeredCss from './examples/centered.example.css?source' with { loader: 'text' };
import centeredHtml from './examples/centered.example.html?source' with { loader: 'text' };
import centeredTs from './examples/centered.example.ts?source' with { loader: 'text' };
import { RippleColorExampleComponent } from './examples/color.example';
import colorCss from './examples/color.example.css?source' with { loader: 'text' };
import colorHtml from './examples/color.example.html?source' with { loader: 'text' };
import colorTs from './examples/color.example.ts?source' with { loader: 'text' };
import { RippleConfigExampleComponent } from './examples/config.example';
import configCss from './examples/config.example.css?source' with { loader: 'text' };
import configHtml from './examples/config.example.html?source' with { loader: 'text' };
import configTs from './examples/config.example.ts?source' with { loader: 'text' };
import { RIPPLE_INPUTS, RIPPLE_TOKENS } from './ripple.api';

const IMPORT_CODE = `import { ArnRippleDirective } from '@arn-ng/ui/ripple';`;

const THEME_CODE = `/* styles.css: the ripple's classes and tokens are in the theme */
@import '@arn-ng/ui/theme.css';`;

const CONFIG_CODE = `// app.config.ts: every ripple that is not set on the element
provideArn({ ripple: true });

// At runtime
inject(ArnConfigService).setRipple(false);`;

const OVERRIDE_CODE = `/* Everywhere */
:root {
  --arn-ripple-duration: 300ms;
}

/* In one part of the page */
.toolbar {
  --arn-ripple-color: color-mix(in oklch, currentcolor 20%, transparent);
}`;

@Component({
  selector: 'docs-ripple-page',
  imports: [
    ApiTableComponent,
    CodeBlockComponent,
    DocsSectionComponent,
    ExampleComponent,
    RippleBasicExampleComponent,
    RippleCenteredExampleComponent,
    RippleColorExampleComponent,
    RippleConfigExampleComponent,
    TokenTableComponent,
  ],
  templateUrl: './ripple-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class RipplePageComponent {
  protected readonly importCode = IMPORT_CODE;
  protected readonly themeCode = THEME_CODE;
  protected readonly configCode = CONFIG_CODE;
  protected readonly overrideCode = OVERRIDE_CODE;

  protected readonly basic = { html: basicHtml, ts: basicTs, css: basicCss };
  protected readonly config = { html: configHtml, ts: configTs, css: configCss };
  protected readonly color = { html: colorHtml, ts: colorTs, css: colorCss };
  protected readonly centered = { html: centeredHtml, ts: centeredTs, css: centeredCss };

  protected readonly inputs: DocsApiTable = { kind: 'inputs', rows: RIPPLE_INPUTS };
  protected readonly tokens = RIPPLE_TOKENS;
}
