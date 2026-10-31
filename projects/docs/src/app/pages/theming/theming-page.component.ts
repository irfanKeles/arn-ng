import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TokenTableComponent } from '../../api/token-table.component';
import { CodeBlockComponent } from '../../code/code-block.component';
import { ExampleComponent } from '../../example/example.component';
import { DocsSectionComponent } from '../../toc/docs-section.component';
import { ThemingDarkModeExampleComponent } from './examples/dark-mode.example';
import darkCss from './examples/dark-mode.example.css?source' with { loader: 'text' };
import darkHtml from './examples/dark-mode.example.html?source' with { loader: 'text' };
import darkTs from './examples/dark-mode.example.ts?source' with { loader: 'text' };
import { ThemingDensityExampleComponent } from './examples/density.example';
import densityCss from './examples/density.example.css?source' with { loader: 'text' };
import densityHtml from './examples/density.example.html?source' with { loader: 'text' };
import densityTs from './examples/density.example.ts?source' with { loader: 'text' };
import { ThemingOverrideExampleComponent } from './examples/override.example';
import overrideCss from './examples/override.example.css?source' with { loader: 'text' };
import overrideHtml from './examples/override.example.html?source' with { loader: 'text' };
import overrideTs from './examples/override.example.ts?source' with { loader: 'text' };
import { ThemingSizesExampleComponent } from './examples/sizes.example';
import sizesCss from './examples/sizes.example.css?source' with { loader: 'text' };
import sizesHtml from './examples/sizes.example.html?source' with { loader: 'text' };
import sizesTs from './examples/sizes.example.ts?source' with { loader: 'text' };
import {
  COLOR_TOKENS,
  DENSITY_TOKENS,
  PALETTE_TOKENS,
  RADIUS_TOKENS,
  SIZE_TOKENS,
  SPACING_TOKENS,
  TYPOGRAPHY_TOKENS,
} from './theming.tokens';

const IMPORT_CODE = `/* src/styles.css */
@import '@arn-ng/ui/theme.css';

/* The theme paints nothing; paint the page with its tokens if you like */
body {
  background: var(--arn-background);
  color: var(--arn-foreground);
  font-family: var(--arn-font-sans);
}`;

const SCHEME_CODE = `/* What the theme does: one value per scheme, resolved where it is used */
:root {
  color-scheme: light dark;
  --arn-background: light-dark(var(--arn-white), var(--arn-neutral-950));
}

.dark { color-scheme: dark; }
.light { color-scheme: light; }`;

const HOST_CODE = `/* How a component sizes its host (md): density scales height and padding, not text */
:host {
  box-sizing: border-box; /* a border is part of the height */
  block-size: max(
    var(--arn-control-min-size),
    calc(var(--arn-control-height-md) * var(--arn-density))
  );
  padding-inline: calc(var(--arn-control-padding-inline-md) * var(--arn-density));
  font-size: var(--arn-control-font-size-md);
}`;

const OVERRIDE_CODE = `/* After the theme import: same specificity, so the later rule wins */
:root {
  --arn-primary: light-dark(oklch(45% 0.18 265deg), oklch(78% 0.12 265deg));
  --arn-radius: 0.5rem;
}

/* Only the dark scheme forced with .dark (not the system's dark: use light-dark() for that) */
.dark {
  --arn-ring: var(--arn-neutral-400);
}`;

@Component({
  selector: 'docs-theming-page',
  imports: [
    CodeBlockComponent,
    DocsSectionComponent,
    ExampleComponent,
    RouterLink,
    ThemingDarkModeExampleComponent,
    ThemingDensityExampleComponent,
    ThemingOverrideExampleComponent,
    ThemingSizesExampleComponent,
    TokenTableComponent,
  ],
  templateUrl: './theming-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class ThemingPageComponent {
  protected readonly importCode = IMPORT_CODE;
  protected readonly schemeCode = SCHEME_CODE;
  protected readonly hostCode = HOST_CODE;
  protected readonly overrideCode = OVERRIDE_CODE;

  protected readonly dark = { html: darkHtml, ts: darkTs, css: darkCss };
  protected readonly sizes = { html: sizesHtml, ts: sizesTs, css: sizesCss };
  protected readonly density = { html: densityHtml, ts: densityTs, css: densityCss };
  protected readonly override = { html: overrideHtml, ts: overrideTs, css: overrideCss };

  protected readonly paletteTokens = PALETTE_TOKENS;
  protected readonly colorTokens = COLOR_TOKENS;
  protected readonly radiusTokens = RADIUS_TOKENS;
  protected readonly typographyTokens = TYPOGRAPHY_TOKENS;
  protected readonly spacingTokens = SPACING_TOKENS;
  protected readonly sizeTokens = SIZE_TOKENS;
  protected readonly densityTokens = DENSITY_TOKENS;
}
