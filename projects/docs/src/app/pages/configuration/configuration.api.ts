import type { ArnConfig } from '@arn-ng/ui/core';
import type { DocsApiInput, DocsApiMethod } from '../../api/docs-api';

// The tables of the Configuration page. Keyed by ArnConfig, so adding a field to ArnConfig breaks the
// build until it is documented; the page spec also checks them against ArnConfigDirective and
// ArnConfigService.

const FIELDS: Record<keyof ArnConfig, Omit<DocsApiInput, 'name'>> = {
  size: {
    type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    default: "'md'",
    description: 'The size of the components.',
  },
  density: {
    type: "'comfortable' | 'compact'",
    default: "'comfortable'",
    description:
      'Compact makes controls shorter and narrower, not their text smaller. Works through CSS: it needs data-density on an element (see applyToDocument and arnConfig).',
  },
  colorScheme: {
    type: "'light' | 'dark' | 'system'",
    default: "'system'",
    description:
      'system follows the operating system. Works through CSS: it needs the .dark or .light class on an element.',
  },
  direction: {
    type: "'ltr' | 'rtl' | 'auto'",
    default: "'auto'",
    description:
      'auto is the direction in effect at that place: the nearest section, else the document. Read back, it is always ltr or rtl.',
  },
  ripple: {
    type: 'boolean',
    default: 'false',
    description: 'Whether the ripple is on where an element does not set it.',
  },
  locale: {
    type: 'string',
    default: 'LOCALE_ID',
    description:
      'A BCP 47 tag such as tr-TR. Day and month names follow it; other texts come from messages.',
  },
  messages: {
    type: 'ArnDeepPartial<ArnMessages>',
    description: 'Texts of the components. Partial; whatever is missing stays English.',
  },
  forms: {
    type: "{ showErrorsOn?: 'touched' | 'dirty' | 'submitted' }",
    default: "{ showErrorsOn: 'touched' }",
    description: 'When an invalid form control shows its error.',
  },
};

export const CONFIG_PROPERTIES: readonly DocsApiInput[] = (
  Object.keys(FIELDS) as (keyof ArnConfig)[]
).map((name) => ({ name, ...FIELDS[name] }));

export const CONFIG_SERVICE_METHODS: readonly DocsApiMethod[] = [
  { name: 'setSize', signature: 'setSize(size: ArnSize): void', description: 'Sets size.' },
  {
    name: 'setDensity',
    signature: 'setDensity(density: ArnDensity): void',
    description: 'Sets density.',
  },
  {
    name: 'setColorScheme',
    signature: 'setColorScheme(colorScheme: ArnColorScheme): void',
    description: 'Sets colorScheme.',
  },
  {
    name: 'setDirection',
    signature: 'setDirection(direction: ArnDirection): void',
    description: 'Sets direction.',
  },
  { name: 'setRipple', signature: 'setRipple(ripple: boolean): void', description: 'Sets ripple.' },
  { name: 'setLocale', signature: 'setLocale(locale: string): void', description: 'Sets locale.' },
  {
    name: 'setMessages',
    signature: 'setMessages(messages: ArnDeepPartial<ArnMessages>): void',
    description: 'Merges texts into the current ones; it does not replace them.',
  },
  {
    name: 'setForms',
    signature: 'setForms(forms: ArnFormsConfig): void',
    description: 'Sets forms.',
  },
  {
    name: 'update',
    signature: 'update(config: ArnConfig): void',
    description: 'Sets several fields at once.',
  },
  {
    name: 'applyToDocument',
    signature: 'applyToDocument(): void',
    description:
      'Writes colorScheme, density and direction to <html> now and after every change. The same as provideArn({ applyToDocument: true }).',
  },
];
