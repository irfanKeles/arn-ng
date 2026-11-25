import type { DocsApiInput, DocsApiSlot, DocsApiToken } from '../../api/docs-api';
import type { DocsTableView } from '../../api/docs-table';

// The API and Styling tables of the Badge page. The page spec checks them against ArnBadge
// (apiMismatches) and against the badge's stylesheet: the names (componentTokenMismatches) and
// the defaults, which must be the fallbacks the stylesheet writes.

export const BADGE_INPUTS: readonly DocsApiInput[] = [
  {
    name: 'variant',
    type: "'default' | 'secondary' | 'destructive' | 'outline'",
    default: "'default'",
    description: 'The look of the badge. A link is not a variant: put arnBadge on an <a>.',
  },
  {
    name: 'count',
    type: 'number | undefined',
    default: 'undefined',
    description:
      'A count shown instead of the content. Hidden while 0 (see showZero); above max it shows as max followed by "+". A negative or fractional count hides the badge.',
  },
  {
    name: 'max',
    type: 'number',
    default: '99',
    description: 'The largest count shown as is. A whole number of 1 or more; otherwise 99.',
  },
  {
    name: 'showZero',
    type: 'boolean',
    default: 'false',
    description: 'Shows a count of 0 instead of hiding the badge.',
  },
  {
    name: 'dot',
    type: 'boolean',
    default: 'false',
    description: 'A small dot without text; neither the content nor the count shows.',
  },
  {
    name: 'label',
    type: 'string',
    description:
      'The name of a dot for assistive technology, as visually hidden text. Used in dot mode only.',
  },
  {
    name: 'loading',
    type: 'boolean',
    default: 'false',
    description:
      'A spinner at the start, in place of the start icon; the text stays and aria-busy is set. Not on a dot.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description:
      'On a[arnBadge]: aria-disabled="true", out of the tab order, clicks cancelled. No effect on <arn-badge>.',
  },
];

export const BADGE_SLOTS: readonly DocsApiSlot[] = [
  {
    name: 'Default content',
    description: 'The text and icons, in order. An <svg> is 12px. Not shown with count or dot.',
  },
];

export const BADGE_SIZE_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-badge-height',
    default: 'calc(var(--arn-spacing) * 5 + var(--arn-border-width) * 2)',
    description:
      'The height, 22px; also the minimum width, so a single digit is a circle. One size: density does not apply.',
  },
  {
    name: '--arn-badge-padding-inline',
    default: 'calc(var(--arn-spacing) * 2)',
    description: 'The inline padding, 8px. With a count: calc(var(--arn-spacing) * 1.5), 6px.',
  },
  {
    name: '--arn-badge-font-size',
    default: 'var(--arn-text-xs)',
    description: 'The font size, 12px, in medium weight.',
  },
  {
    name: '--arn-badge-icon-size',
    default: 'calc(var(--arn-spacing) * 3)',
    description: 'The width and height of an <svg> and of the spinner, 12px.',
  },
  {
    name: '--arn-badge-gap',
    default: 'var(--arn-spacing)',
    description: 'The space between icon and text, 4px.',
  },
  {
    name: '--arn-badge-radius',
    default: 'var(--arn-radius-full)',
    description: 'The corner radius.',
  },
  {
    name: '--arn-badge-dot-size',
    default: 'calc(var(--arn-spacing) * 2)',
    description: 'The width and height of a dot, 8px.',
  },
];

export const BADGE_COLOR_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-badge-bg',
    default: 'var(--arn-primary)',
    description:
      'The fill. Per variant: secondary --arn-secondary; destructive --arn-destructive (dark: mixed 60% with the background); outline transparent. A dot: secondary --arn-muted-foreground, destructive --arn-destructive.',
  },
  {
    name: '--arn-badge-fg',
    default: 'var(--arn-primary-foreground)',
    description:
      'The text. Per variant: secondary --arn-secondary-foreground; destructive --arn-destructive-foreground; outline --arn-foreground.',
  },
  {
    name: '--arn-badge-border-color',
    default: 'transparent',
    description:
      'The 1px border every variant has. outline: --arn-border; an outline dot: --arn-muted-foreground.',
  },
  {
    name: '--arn-badge-bg-hover',
    default: 'color-mix(in oklch, var(--arn-primary) 85%, var(--arn-background))',
    description:
      'The fill of a link under a hovering pointer (only where the device can hover). secondary mixed 85% with --arn-foreground; destructive darker; outline --arn-muted.',
  },
  {
    name: '--arn-badge-ring-color',
    default: 'var(--arn-ring)',
    description:
      'The 3px focus ring of a link and its border while focused. destructive: --arn-destructive.',
  },
];

export const BADGE_MOTION_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-badge-spinner-duration',
    default: '1s',
    description:
      'One turn of the spinner. Under reduced motion it keeps turning, three times slower.',
  },
];

export const BADGE_KEYS: DocsTableView = {
  caption: 'Keyboard',
  columns: ['Key', 'Action'],
  rows: [
    {
      name: 'Tab',
      cells: [
        {
          text: 'Moves focus to a link badge. <arn-badge> is not focusable; a disabled link is skipped.',
          code: false,
        },
      ],
    },
    {
      name: 'Enter',
      cells: [{ text: 'Follows a link badge.', code: false }],
    },
  ],
};
