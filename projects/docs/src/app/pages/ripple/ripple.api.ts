import type { DocsApiInput, DocsApiToken } from '../../api/docs-api';

// The API and Styling tables of the Ripple page. The page spec checks them against
// ArnRippleDirective (apiMismatches) and theme.css (tokenMismatches).

export const RIPPLE_INPUTS: readonly DocsApiInput[] = [
  {
    name: 'arnRipple',
    type: 'boolean',
    default: 'undefined',
    description:
      'An empty attribute or true turns the ripple on, false turns it off. Not given (undefined), it follows the ripple configuration, which is off by default.',
  },
  {
    name: 'arnRippleColor',
    type: 'string',
    description:
      'The color of the wave, used as given: bring your own transparency. Without it, --arn-ripple-color applies.',
  },
  {
    name: 'arnRippleCentered',
    type: 'boolean',
    default: 'false',
    description: 'Starts the wave from the center of the element instead of the pointer.',
  },
];

export const RIPPLE_TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-ripple-color',
    default: 'color-mix(in oklch, currentcolor 12%, transparent)',
    description:
      'The color of the wave. currentcolor is the text color of the element, so it fits light and dark themes.',
  },
  {
    name: '--arn-ripple-duration',
    default: '450ms',
    description: 'How long the wave grows, and how long it fades. A plain ms or s value.',
  },
  {
    name: '--arn-ripple-easing',
    default: 'cubic-bezier(0, 0, 0.2, 1)',
    description: 'The easing of the growth; the fade is linear.',
  },
];
