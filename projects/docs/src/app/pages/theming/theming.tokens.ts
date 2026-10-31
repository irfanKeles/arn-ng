import type { DocsApiToken } from '../../api/docs-api';

// The Styling tables of the Theming page. Each group is checked against theme.css with
// tokenMismatches (its scope below) and each default is looked up in the theme file's text.

/** A table of the page and the tokens it is responsible for. */
export interface ThemingTokenGroup {
  readonly id: string;
  readonly rows: readonly DocsApiToken[];
  readonly inScope: (name: string) => boolean;
}

const palette = (name: string, value: string): DocsApiToken => ({
  name,
  default: value,
  description: 'Raw palette value. Components do not use it; semantic tokens point to it.',
});

export const PALETTE_TOKENS: readonly DocsApiToken[] = [
  palette('--arn-white', 'oklch(100% 0 0deg)'),
  palette('--arn-neutral-50', 'oklch(98.5% 0 0deg)'),
  palette('--arn-neutral-100', 'oklch(97% 0 0deg)'),
  palette('--arn-neutral-200', 'oklch(92.2% 0 0deg)'),
  palette('--arn-neutral-300', 'oklch(87% 0 0deg)'),
  palette('--arn-neutral-400', 'oklch(70.8% 0 0deg)'),
  palette('--arn-neutral-500', 'oklch(55.6% 0 0deg)'),
  palette('--arn-neutral-600', 'oklch(43.9% 0 0deg)'),
  palette('--arn-neutral-700', 'oklch(37.1% 0 0deg)'),
  palette('--arn-neutral-800', 'oklch(26.9% 0 0deg)'),
  palette('--arn-neutral-900', 'oklch(20.5% 0 0deg)'),
  palette('--arn-neutral-950', 'oklch(14.5% 0 0deg)'),
  palette('--arn-red-400', 'oklch(70.4% 0.191 22.216deg)'),
  palette('--arn-red-600', 'oklch(57.7% 0.245 27.325deg)'),
];

export const COLOR_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-background',
    default: 'light-dark(var(--arn-white), var(--arn-neutral-950))',
    description: 'The page and component surfaces.',
  },
  {
    name: '--arn-foreground',
    default: 'light-dark(var(--arn-neutral-950), var(--arn-neutral-50))',
    description: 'Text on the background.',
  },
  {
    name: '--arn-card',
    default: 'light-dark(var(--arn-white), var(--arn-neutral-900))',
    description: 'Raised surfaces such as cards.',
  },
  {
    name: '--arn-card-foreground',
    default: 'light-dark(var(--arn-neutral-950), var(--arn-neutral-50))',
    description: 'Text on a card.',
  },
  {
    name: '--arn-popover',
    default: 'light-dark(var(--arn-white), var(--arn-neutral-900))',
    description: 'Floating surfaces: menus, popovers, dialogs.',
  },
  {
    name: '--arn-popover-foreground',
    default: 'light-dark(var(--arn-neutral-950), var(--arn-neutral-50))',
    description: 'Text on a popover.',
  },
  {
    name: '--arn-primary',
    default: 'light-dark(var(--arn-neutral-900), var(--arn-neutral-200))',
    description: 'The main action.',
  },
  {
    name: '--arn-primary-foreground',
    default: 'light-dark(var(--arn-neutral-50), var(--arn-neutral-900))',
    description: 'Text on primary.',
  },
  {
    name: '--arn-secondary',
    default: 'light-dark(var(--arn-neutral-100), var(--arn-neutral-800))',
    description: 'A less prominent action.',
  },
  {
    name: '--arn-secondary-foreground',
    default: 'light-dark(var(--arn-neutral-900), var(--arn-neutral-50))',
    description: 'Text on secondary.',
  },
  {
    name: '--arn-muted',
    default: 'light-dark(var(--arn-neutral-100), var(--arn-neutral-800))',
    description: 'Subdued backgrounds, such as inline code.',
  },
  {
    name: '--arn-muted-foreground',
    default: 'light-dark(var(--arn-neutral-500), var(--arn-neutral-400))',
    description: 'Secondary text on the background.',
  },
  {
    name: '--arn-accent',
    default: 'light-dark(var(--arn-neutral-100), var(--arn-neutral-800))',
    description: 'Hover and highlighted items.',
  },
  {
    name: '--arn-accent-foreground',
    default: 'light-dark(var(--arn-neutral-900), var(--arn-neutral-50))',
    description: 'Text on accent.',
  },
  {
    name: '--arn-destructive',
    default: 'light-dark(var(--arn-red-600), var(--arn-red-400))',
    description: 'Dangerous actions and errors.',
  },
  {
    name: '--arn-border',
    default: 'light-dark(var(--arn-neutral-200), oklch(100% 0 0deg / 10%))',
    description: 'Borders and dividers.',
  },
  {
    name: '--arn-input',
    default: 'light-dark(var(--arn-neutral-200), oklch(100% 0 0deg / 15%))',
    description: 'The border of form controls.',
  },
  {
    name: '--arn-ring',
    default: 'light-dark(var(--arn-neutral-500), var(--arn-neutral-500))',
    description:
      'The focus ring: at least 3:1 against the background in both schemes (darker than shadcn in light).',
  },
];

const radiusStep = (step: string, factor: string): DocsApiToken => ({
  name: `--arn-radius-${step}`,
  default: factor === '1' ? 'var(--arn-radius)' : `calc(var(--arn-radius) * ${factor})`,
  description:
    'A step of the scale, for your own CSS. Follows --arn-radius only when that changes on :root.',
});

export const RADIUS_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-radius',
    default: '0.625rem',
    description: 'The base radius. Components compute their own corner from it.',
  },
  radiusStep('sm', '0.6'),
  radiusStep('md', '0.8'),
  radiusStep('lg', '1'),
  radiusStep('xl', '1.4'),
  radiusStep('2xl', '1.8'),
  radiusStep('3xl', '2.2'),
  radiusStep('4xl', '2.6'),
];

const text = (step: string, size: string, lineHeight: string): DocsApiToken[] => [
  { name: `--arn-text-${step}`, default: size, description: `Font size, step ${step}.` },
  {
    name: `--arn-text-${step}-line-height`,
    default: lineHeight,
    description: `Line height for --arn-text-${step} (unitless).`,
  },
];

export const TYPOGRAPHY_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-font-sans',
    default:
      "ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    description: 'The text font: the system font, no web font is loaded.',
  },
  {
    name: '--arn-font-mono',
    default:
      "ui-monospace, 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace",
    description: 'Code and other fixed-width text.',
  },
  ...text('xs', '0.75rem', 'calc(1 / 0.75)'),
  ...text('sm', '0.875rem', 'calc(1.25 / 0.875)'),
  ...text('base', '1rem', 'calc(1.5 / 1)'),
  ...text('lg', '1.125rem', 'calc(1.75 / 1.125)'),
  ...text('xl', '1.25rem', 'calc(1.75 / 1.25)'),
  { name: '--arn-font-weight-normal', default: '400', description: 'Regular text.' },
  { name: '--arn-font-weight-medium', default: '500', description: 'Labels and emphasis.' },
  { name: '--arn-font-weight-semibold', default: '600', description: 'Headings.' },
];

export const SPACING_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-spacing',
    default: '0.25rem',
    description: 'The spacing unit: components write calc(var(--arn-spacing) * n).',
  },
  { name: '--arn-border-width', default: '1px', description: 'Borders.' },
  { name: '--arn-ring-width', default: '3px', description: 'The focus ring.' },
];

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/** Control dimensions per size, as theme.css defines them. */
const CONTROL: Record<string, { readonly about: string; readonly values: readonly string[] }> = {
  height: { about: 'Height', values: ['1.5rem', '2rem', '2.25rem', '2.5rem', '3rem'] },
  'padding-inline': {
    about: 'Inline padding',
    values: ['0.5rem', '0.75rem', '1rem', '1.5rem', '2rem'],
  },
  'font-size': {
    about: 'Font size',
    values: ['0.75rem', '0.875rem', '0.875rem', '0.875rem', '1rem'],
  },
  'icon-size': { about: 'Icon size', values: ['0.75rem', '1rem', '1rem', '1rem', '1.25rem'] },
  gap: {
    about: 'Gap between icon and text',
    values: ['0.25rem', '0.375rem', '0.5rem', '0.5rem', '0.5rem'],
  },
};

export const SIZE_TOKENS: readonly DocsApiToken[] = [
  ...Object.entries(CONTROL).flatMap(([property, { about, values }]) =>
    SIZES.map((size, index) => ({
      name: `--arn-control-${property}-${size}`,
      default: values[index] ?? '',
      description: `${about} of a ${size} control${property === 'height' || property === 'padding-inline' ? ', before density' : ''}.`,
    })),
  ),
  {
    name: '--arn-control-min-size',
    default: '1.5rem',
    description:
      'The smallest height a control may get from density: 24px, the WCAG 2.2 minimum target size.',
  },
];

export const DENSITY_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-density',
    default: '1',
    description:
      'The density factor: 0.875 under data-density="compact". Applies to height and inline padding only.',
  },
];

const isPalette = (name: string): boolean => /^--arn-(white|neutral-\d+|red-\d+)$/.test(name);
const isRadius = (name: string): boolean => /^--arn-radius(-[a-z0-9]+)?$/.test(name);
const isTypography = (name: string): boolean => /^--arn-(font-|text-)/.test(name);
const isSpacing = (name: string): boolean =>
  ['--arn-spacing', '--arn-border-width', '--arn-ring-width'].includes(name);
const isSize = (name: string): boolean => name.startsWith('--arn-control-');
const isDensity = (name: string): boolean => name === '--arn-density';
const isOther = (name: string): boolean => /^--arn-(z|ripple)-/.test(name);

/** Semantic colors: every --arn-* token that no other group, and no other page, covers. */
const isColor = (name: string): boolean =>
  ![isPalette, isRadius, isTypography, isSpacing, isSize, isDensity, isOther].some((group) =>
    group(name),
  );

export const THEMING_TOKEN_GROUPS: readonly ThemingTokenGroup[] = [
  { id: 'palette', rows: PALETTE_TOKENS, inScope: isPalette },
  { id: 'colors', rows: COLOR_TOKENS, inScope: isColor },
  { id: 'radius', rows: RADIUS_TOKENS, inScope: isRadius },
  { id: 'typography', rows: TYPOGRAPHY_TOKENS, inScope: isTypography },
  { id: 'spacing', rows: SPACING_TOKENS, inScope: isSpacing },
  { id: 'sizes', rows: SIZE_TOKENS, inScope: isSize },
  { id: 'density', rows: DENSITY_TOKENS, inScope: isDensity },
];
