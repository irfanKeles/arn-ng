import type { ArnConfig, ArnResolvedConfig, ArnRootConfig } from './config.types';

/*
 * Compile-time test: each `@ts-expect-error` line expects the expression below it to be a type
 * error. If the type loosens (the error goes away) the unused directive fails the build and the test.
 */
describe('ArnConfig type', () => {
  const accept = (config: ArnRootConfig): ArnRootConfig => config;

  it('every field is optional; a partial object is accepted', () => {
    const configs: ArnConfig[] = [
      {},
      { size: 'sm' },
      { density: 'compact', colorScheme: 'dark', direction: 'rtl', ripple: true, locale: 'tr-TR' },
      { messages: { common: { ok: 'Tamam' } } },
      { messages: { datePicker: { monthNames: ['Ocak'] } } },
      { forms: { showErrorsOn: 'submitted' } },
    ];

    expect(configs.length).toBe(6);
    expect(accept({ size: 'xl', applyToDocument: true })).toEqual({
      size: 'xl',
      applyToDocument: true,
    });
  });

  it('fields and values outside the types do not compile', () => {
    const rejected = [
      // @ts-expect-error size can only be xs | sm | md | lg | xl
      accept({ size: 'huge' }),
      // @ts-expect-error an unknown field (typo) is rejected; there is no index signature
      accept({ sise: 'sm' }),
      // @ts-expect-error density can only be comfortable | compact
      accept({ density: 'dense' }),
      // @ts-expect-error colorScheme can only be light | dark | system
      accept({ colorScheme: 'auto' }),
      // @ts-expect-error direction can only be ltr | rtl | auto
      accept({ direction: 'left' }),
      // @ts-expect-error ripple must be a boolean
      accept({ ripple: 'yes' }),
      // @ts-expect-error an unknown key inside messages is rejected
      accept({ messages: { common: { okay: 'x' } } }),
      // @ts-expect-error an unknown group inside messages is rejected
      accept({ messages: { unknownGroup: {} } }),
      // @ts-expect-error a text must be a string
      accept({ messages: { common: { ok: 1 } } }),
      // @ts-expect-error forms.showErrorsOn can only be touched | dirty | submitted
      accept({ forms: { showErrorsOn: 'blur' } }),
    ];

    expect(rejected.length).toBe(10);
  });

  it('the resolved direction is never auto', () => {
    const resolved: ArnResolvedConfig['direction'][] = [
      'ltr',
      'rtl',
      // @ts-expect-error auto is an input value only; the resolved direction is ltr | rtl
      'auto',
    ];

    expect(resolved.length).toBe(3);
  });
});
