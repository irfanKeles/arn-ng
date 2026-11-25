import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiTableComponent } from '../../api/api-table.component';
import type { DocsApiTable } from '../../api/docs-api';
import { DocsTableComponent } from '../../api/docs-table.component';
import { TokenTableComponent } from '../../api/token-table.component';
import { CodeBlockComponent } from '../../code/code-block.component';
import { ExampleComponent } from '../../example/example.component';
import { DocsSectionComponent } from '../../toc/docs-section.component';
import { ButtonBadgeExampleComponent } from '../button/examples/badge.example';
import buttonBadgeCss from '../button/examples/badge.example.css?source' with { loader: 'text' };
import buttonBadgeHtml from '../button/examples/badge.example.html?source' with { loader: 'text' };
import buttonBadgeTs from '../button/examples/badge.example.ts?source' with { loader: 'text' };
import {
  BADGE_COLOR_TOKENS,
  BADGE_INPUTS,
  BADGE_KEYS,
  BADGE_MOTION_TOKENS,
  BADGE_SIZE_TOKENS,
  BADGE_SLOTS,
} from './badge.api';
import { BadgeCountExampleComponent } from './examples/count.example';
import countCss from './examples/count.example.css?source' with { loader: 'text' };
import countHtml from './examples/count.example.html?source' with { loader: 'text' };
import countTs from './examples/count.example.ts?source' with { loader: 'text' };
import { BadgeDisabledLinkExampleComponent } from './examples/disabled-link.example';
import disabledLinkCss from './examples/disabled-link.example.css?source' with { loader: 'text' };
import disabledLinkHtml from './examples/disabled-link.example.html?source' with { loader: 'text' };
import disabledLinkTs from './examples/disabled-link.example.ts?source' with { loader: 'text' };
import { BadgeDotExampleComponent } from './examples/dot.example';
import dotCss from './examples/dot.example.css?source' with { loader: 'text' };
import dotHtml from './examples/dot.example.html?source' with { loader: 'text' };
import dotTs from './examples/dot.example.ts?source' with { loader: 'text' };
import { BadgeIconsExampleComponent } from './examples/icons.example';
import iconsCss from './examples/icons.example.css?source' with { loader: 'text' };
import iconsHtml from './examples/icons.example.html?source' with { loader: 'text' };
import iconsTs from './examples/icons.example.ts?source' with { loader: 'text' };
import { BadgeLinkExampleComponent } from './examples/link.example';
import linkCss from './examples/link.example.css?source' with { loader: 'text' };
import linkHtml from './examples/link.example.html?source' with { loader: 'text' };
import linkTs from './examples/link.example.ts?source' with { loader: 'text' };
import { BadgeLoadingExampleComponent } from './examples/loading.example';
import loadingCss from './examples/loading.example.css?source' with { loader: 'text' };
import loadingHtml from './examples/loading.example.html?source' with { loader: 'text' };
import loadingTs from './examples/loading.example.ts?source' with { loader: 'text' };
import { BadgeVariantsExampleComponent } from './examples/variants.example';
import variantsCss from './examples/variants.example.css?source' with { loader: 'text' };
import variantsHtml from './examples/variants.example.html?source' with { loader: 'text' };
import variantsTs from './examples/variants.example.ts?source' with { loader: 'text' };

const IMPORT_CODE = `import { ArnBadge } from '@arn-ng/ui/badge';`;

const ANNOUNCE_CODE = `import { LiveAnnouncer } from '@angular/cdk/a11y';

// The badge shows the number; your code says what it means, when it matters
private readonly announcer = inject(LiveAnnouncer);

onNewMessages(unread: number): void {
  this.unread.set(unread);
  void this.announcer.announce(\`\${unread} unread messages\`, 'polite');
}`;

const OVERRIDE_CODE = `/* Every badge in a table */
.data-table {
  --arn-badge-height: 1.25rem;
  --arn-badge-font-size: 0.6875rem;
}

/* One badge: a single class wins over the library rules */
.beta-badge {
  --arn-badge-bg: oklch(55% 0.2 260deg);
  --arn-badge-fg: oklch(98% 0 0deg);
}`;

@Component({
  selector: 'docs-badge-page',
  imports: [
    ApiTableComponent,
    BadgeCountExampleComponent,
    BadgeDisabledLinkExampleComponent,
    BadgeDotExampleComponent,
    BadgeIconsExampleComponent,
    BadgeLinkExampleComponent,
    BadgeLoadingExampleComponent,
    BadgeVariantsExampleComponent,
    ButtonBadgeExampleComponent,
    CodeBlockComponent,
    DocsSectionComponent,
    DocsTableComponent,
    ExampleComponent,
    RouterLink,
    TokenTableComponent,
  ],
  templateUrl: './badge-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class BadgePageComponent {
  protected readonly importCode = IMPORT_CODE;
  protected readonly announceCode = ANNOUNCE_CODE;
  protected readonly overrideCode = OVERRIDE_CODE;

  protected readonly variants = { html: variantsHtml, ts: variantsTs, css: variantsCss };
  protected readonly count = { html: countHtml, ts: countTs, css: countCss };
  protected readonly dot = { html: dotHtml, ts: dotTs, css: dotCss };
  protected readonly icons = { html: iconsHtml, ts: iconsTs, css: iconsCss };
  protected readonly loading = { html: loadingHtml, ts: loadingTs, css: loadingCss };
  protected readonly link = { html: linkHtml, ts: linkTs, css: linkCss };
  protected readonly disabledLink = {
    html: disabledLinkHtml,
    ts: disabledLinkTs,
    css: disabledLinkCss,
  };
  protected readonly onAButton = { html: buttonBadgeHtml, ts: buttonBadgeTs, css: buttonBadgeCss };

  protected readonly inputs: DocsApiTable = { kind: 'inputs', rows: BADGE_INPUTS };
  protected readonly slots: DocsApiTable = { kind: 'slots', rows: BADGE_SLOTS };
  protected readonly keys = BADGE_KEYS;
  protected readonly sizeTokens = BADGE_SIZE_TOKENS;
  protected readonly colorTokens = BADGE_COLOR_TOKENS;
  protected readonly motionTokens = BADGE_MOTION_TOKENS;
}
