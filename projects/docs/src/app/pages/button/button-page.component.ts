import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiTableComponent } from '../../api/api-table.component';
import type { DocsApiTable } from '../../api/docs-api';
import { DocsTableComponent } from '../../api/docs-table.component';
import { TokenTableComponent } from '../../api/token-table.component';
import { CodeBlockComponent } from '../../code/code-block.component';
import { ExampleComponent } from '../../example/example.component';
import { DocsSectionComponent } from '../../toc/docs-section.component';
import {
  BUTTON_COLOR_TOKENS,
  BUTTON_INPUTS,
  BUTTON_KEYS,
  BUTTON_SIZE_TOKENS,
  BUTTON_SLOTS,
} from './button.api';
import { ButtonBadgeExampleComponent } from './examples/badge.example';
import badgeCss from './examples/badge.example.css?source' with { loader: 'text' };
import badgeHtml from './examples/badge.example.html?source' with { loader: 'text' };
import badgeTs from './examples/badge.example.ts?source' with { loader: 'text' };
import { ButtonDisabledExampleComponent } from './examples/disabled.example';
import disabledCss from './examples/disabled.example.css?source' with { loader: 'text' };
import disabledHtml from './examples/disabled.example.html?source' with { loader: 'text' };
import disabledTs from './examples/disabled.example.ts?source' with { loader: 'text' };
import { ButtonIconOnlyExampleComponent } from './examples/icon-only.example';
import iconOnlyCss from './examples/icon-only.example.css?source' with { loader: 'text' };
import iconOnlyHtml from './examples/icon-only.example.html?source' with { loader: 'text' };
import iconOnlyTs from './examples/icon-only.example.ts?source' with { loader: 'text' };
import { ButtonIconsExampleComponent } from './examples/icons.example';
import iconsCss from './examples/icons.example.css?source' with { loader: 'text' };
import iconsHtml from './examples/icons.example.html?source' with { loader: 'text' };
import iconsTs from './examples/icons.example.ts?source' with { loader: 'text' };
import { ButtonLinkExampleComponent } from './examples/link.example';
import linkCss from './examples/link.example.css?source' with { loader: 'text' };
import linkHtml from './examples/link.example.html?source' with { loader: 'text' };
import linkTs from './examples/link.example.ts?source' with { loader: 'text' };
import { ButtonRippleExampleComponent } from './examples/ripple.example';
import rippleCss from './examples/ripple.example.css?source' with { loader: 'text' };
import rippleHtml from './examples/ripple.example.html?source' with { loader: 'text' };
import rippleTs from './examples/ripple.example.ts?source' with { loader: 'text' };
import { ButtonSizesExampleComponent } from './examples/sizes.example';
import sizesCss from './examples/sizes.example.css?source' with { loader: 'text' };
import sizesHtml from './examples/sizes.example.html?source' with { loader: 'text' };
import sizesTs from './examples/sizes.example.ts?source' with { loader: 'text' };
import { ButtonVariantsExampleComponent } from './examples/variants.example';
import variantsCss from './examples/variants.example.css?source' with { loader: 'text' };
import variantsHtml from './examples/variants.example.html?source' with { loader: 'text' };
import variantsTs from './examples/variants.example.ts?source' with { loader: 'text' };

const IMPORT_CODE = `import { ArnButton } from '@arn-ng/ui/button';`;

const THEME_CODE = `/* styles.css: the button's tokens come from the theme */
@import '@arn-ng/ui/theme.css';`;

const OVERRIDE_CODE = `/* Every button in a toolbar */
.toolbar {
  --arn-button-radius: var(--arn-radius-full);
  --arn-button-height: 2rem;
}

/* One button: a single class wins over the library rules */
.brand-button {
  --arn-button-bg: oklch(55% 0.2 260deg);
  --arn-button-bg-hover: oklch(50% 0.2 260deg);
  --arn-button-bg-active: oklch(45% 0.2 260deg);
}`;

@Component({
  selector: 'docs-button-page',
  imports: [
    ApiTableComponent,
    ButtonBadgeExampleComponent,
    ButtonDisabledExampleComponent,
    ButtonIconOnlyExampleComponent,
    ButtonIconsExampleComponent,
    ButtonLinkExampleComponent,
    ButtonRippleExampleComponent,
    ButtonSizesExampleComponent,
    ButtonVariantsExampleComponent,
    CodeBlockComponent,
    DocsSectionComponent,
    DocsTableComponent,
    ExampleComponent,
    RouterLink,
    TokenTableComponent,
  ],
  templateUrl: './button-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class ButtonPageComponent {
  protected readonly importCode = IMPORT_CODE;
  protected readonly themeCode = THEME_CODE;
  protected readonly overrideCode = OVERRIDE_CODE;

  protected readonly variants = { html: variantsHtml, ts: variantsTs, css: variantsCss };
  protected readonly disabled = { html: disabledHtml, ts: disabledTs, css: disabledCss };
  protected readonly sizes = { html: sizesHtml, ts: sizesTs, css: sizesCss };
  protected readonly icons = { html: iconsHtml, ts: iconsTs, css: iconsCss };
  protected readonly iconOnly = { html: iconOnlyHtml, ts: iconOnlyTs, css: iconOnlyCss };
  protected readonly link = { html: linkHtml, ts: linkTs, css: linkCss };
  protected readonly badge = { html: badgeHtml, ts: badgeTs, css: badgeCss };
  protected readonly ripple = { html: rippleHtml, ts: rippleTs, css: rippleCss };

  protected readonly inputs: DocsApiTable = { kind: 'inputs', rows: BUTTON_INPUTS };
  protected readonly slots: DocsApiTable = { kind: 'slots', rows: BUTTON_SLOTS };
  protected readonly keys = BUTTON_KEYS;
  protected readonly sizeTokens = BUTTON_SIZE_TOKENS;
  protected readonly colorTokens = BUTTON_COLOR_TOKENS;
}
