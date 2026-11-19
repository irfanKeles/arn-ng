import type { DocsApiInput, DocsApiSlot, DocsApiToken } from '../../api/docs-api';
import type { DocsTableView } from '../../api/docs-table';

// The API and Styling tables of the Button page. The page spec checks them against ArnButton
// (apiMismatches) and against the button's stylesheet (componentTokenMismatches).

export const BUTTON_INPUTS: readonly DocsApiInput[] = [
  {
    name: 'variant',
    type: "'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'",
    default: "'default'",
    description:
      'The look of the button. link has no fill and is underlined only on hover and press: not a fit for a link inside running text.',
  },
  {
    name: 'size',
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    default: 'undefined',
    description:
      'Height, padding, font and icon size. Not given, it follows the size configuration, md by default.',
  },
  {
    name: 'iconOnly',
    type: 'boolean',
    default: 'false',
    description: 'A square button for a single icon. Give it a name with aria-label.',
  },
  {
    name: 'round',
    type: 'boolean',
    default: 'false',
    description: 'Fully round corners: a circle with iconOnly, a pill with a label.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description:
      'The native disabled attribute on <button>. On <a>: aria-disabled="true", out of the tab order, and clicks are cancelled.',
  },
  {
    name: 'ripple',
    type: 'boolean',
    default: 'undefined',
    description:
      'The arnRipple wave. An empty attribute or true turns it on, false off; not given, it follows the ripple configuration.',
  },
  {
    name: 'rippleColor',
    type: 'string',
    description: 'The color of the wave, used as given. Without it, --arn-ripple-color applies.',
  },
  {
    name: 'rippleCentered',
    type: 'boolean',
    default: 'false',
    description: 'Starts the wave from the center of the button instead of the pointer.',
  },
];

export const BUTTON_SLOTS: readonly DocsApiSlot[] = [
  {
    name: 'Default content',
    description: 'The label and icons, in order. An <svg> takes the icon size of the button.',
  },
  {
    name: '[arnButtonBadge]',
    description:
      'An element placed on the top inline-end corner, ringed with the background and hidden while empty. Its look is yours.',
  },
];

const height = (size: string): string =>
  `max(var(--arn-control-min-size), calc(var(--arn-control-height-${size}) * var(--arn-density)))`;

export const BUTTON_SIZE_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-button-height',
    default: height('<size>'),
    description: 'The height. Density applies; never below 24px.',
  },
  {
    name: '--arn-button-padding-inline',
    default: 'calc(var(--arn-control-padding-inline-<size>) * var(--arn-density))',
    description: 'The inline padding. Density applies; 0 with iconOnly.',
  },
  {
    name: '--arn-button-font-size',
    default: 'var(--arn-control-font-size-<size>)',
    description: 'The font size. Density does not apply.',
  },
  {
    name: '--arn-button-icon-size',
    default: 'var(--arn-control-icon-size-<size>)',
    description: 'The width and height of an <svg> inside the button.',
  },
  {
    name: '--arn-button-gap',
    default: 'var(--arn-control-gap-<size>)',
    description: 'The space between icon and label.',
  },
  {
    name: '--arn-button-radius',
    default: 'calc(var(--arn-radius) * 0.8)',
    description: 'The corner radius. round uses --arn-radius-full instead.',
  },
];

export const BUTTON_COLOR_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-button-bg',
    default: 'var(--arn-primary)',
    description:
      'The fill. Per variant: secondary --arn-secondary; destructive --arn-destructive (dark: mixed 60% with the background); outline --arn-background; ghost and link transparent.',
  },
  {
    name: '--arn-button-fg',
    default: 'var(--arn-primary-foreground)',
    description:
      'The text. Per variant: secondary --arn-secondary-foreground; destructive --arn-destructive-foreground; outline and ghost --arn-foreground; link --arn-primary.',
  },
  {
    name: '--arn-button-border-color',
    default: 'transparent',
    description: 'The 1px border every variant has. outline: --arn-border.',
  },
  {
    name: '--arn-button-bg-hover',
    default: 'color-mix(in oklch, var(--arn-primary) 90%, transparent)',
    description:
      'The fill under a hovering pointer (only where the device can hover). secondary 80%; destructive darker; outline and ghost --arn-accent.',
  },
  {
    name: '--arn-button-bg-active',
    default: 'color-mix(in oklch, var(--arn-primary) 80%, transparent)',
    description: 'The fill while pressed, with a pointer or by touch.',
  },
  {
    name: '--arn-button-ring-color',
    default: 'var(--arn-ring)',
    description: 'The 3px focus ring. destructive: --arn-destructive.',
  },
];

export const BUTTON_KEYS: DocsTableView = {
  caption: 'Keyboard',
  columns: ['Key', 'Action'],
  rows: [
    {
      name: 'Enter',
      cells: [{ text: 'Activates the button or follows the link.', code: false }],
    },
    {
      name: 'Space',
      cells: [{ text: 'Activates a <button>. A link does not react to Space.', code: false }],
    },
    {
      name: 'Tab',
      cells: [
        { text: 'Moves focus to the button. A disabled button or link is skipped.', code: false },
      ],
    },
  ],
};
