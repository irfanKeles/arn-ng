import { captureWarnings } from '../../../testing/console';
import { deepMerge, sanitizeConfig } from './config.merge';
import type { ArnConfig } from './config.types';

describe('deepMerge', () => {
  const base = {
    common: { yes: 'Yes', no: 'No' },
    names: ['a', 'b', 'c'] as readonly string[],
    flag: true,
  };

  it('merges nested objects and keeps keys that are not given', () => {
    expect(deepMerge(base, { common: { yes: 'Evet' } })).toEqual({
      common: { yes: 'Evet', no: 'No' },
      names: ['a', 'b', 'c'],
      flag: true,
    });
  });

  it('replaces an array as a whole instead of splitting it', () => {
    expect(deepMerge(base, { names: ['x'] }).names).toEqual(['x']);
  });

  it('skips undefined values', () => {
    expect(deepMerge(base, { flag: undefined, common: { no: undefined } })).toEqual(base);
  });

  it('returns base itself when there is no patch', () => {
    expect(deepMerge(base, undefined)).toBe(base);
  });

  it('does not mutate the inputs', () => {
    const patch = { common: { yes: 'Evet' } };
    const snapshot = JSON.stringify(base);

    const result = deepMerge(base, patch);

    expect(JSON.stringify(base)).toBe(snapshot);
    expect(patch).toEqual({ common: { yes: 'Evet' } });
    expect(result.common).not.toBe(base.common);
  });

  it('the __proto__ key does not change the prototype', () => {
    const patch = JSON.parse('{"__proto__": {"polluted": true}}') as Partial<typeof base>;
    const result = deepMerge(base, patch);

    expect('polluted' in result).toBe(false);
    expect('polluted' in {}).toBe(false);
  });
});

describe('sanitizeConfig', () => {
  /** Mimics a consumer that bypasses the type system (JS, JSON). */
  const untyped = (value: object): ArnConfig => value;

  it('passes a valid config through unchanged without warning', () => {
    const config: ArnConfig = {
      size: 'sm',
      density: 'compact',
      colorScheme: 'dark',
      direction: 'rtl',
      ripple: true,
      locale: 'tr-TR',
      messages: { common: { ok: 'Tamam' } },
      forms: { showErrorsOn: 'dirty' },
    };
    let result: ArnConfig = {};

    const warnings = captureWarnings(() => {
      result = sanitizeConfig(config, 'test');
    });

    expect(result).toEqual(config);
    expect(warnings).toEqual([]);
  });

  it('drops an unknown field and warns', () => {
    let result: ArnConfig = {};

    const warnings = captureWarnings(() => {
      result = sanitizeConfig(untyped({ sise: 'sm', size: 'lg' }), 'provideArn');
    });

    expect(result).toEqual({ size: 'lg' });
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('provideArn');
    expect(warnings[0]).toContain('"sise"');
  });

  it('drops an invalid value and warns', () => {
    let result: ArnConfig = {};

    const warnings = captureWarnings(() => {
      result = sanitizeConfig(
        untyped({
          size: 'huge',
          density: 'dense',
          ripple: 'yes',
          locale: 5,
          messages: 'x',
          forms: { showErrorsOn: 'blur' },
          colorScheme: 'dark',
        }),
        'test',
      );
    });

    expect(result).toEqual({ colorScheme: 'dark' });
    expect(warnings.length).toBe(6);
    expect(warnings[0]).toContain('"huge"');
    expect(warnings[0]).toContain('"size"');
  });

  it('silently skips an undefined field', () => {
    let result: ArnConfig = {};

    const warnings = captureWarnings(() => {
      result = sanitizeConfig({ size: undefined, density: 'compact' }, 'test');
    });

    expect(result).toEqual({ density: 'compact' });
    expect(warnings).toEqual([]);
  });

  it('does not treat a name from Object.prototype as a known field', () => {
    const warnings = captureWarnings(() => {
      expect(sanitizeConfig(untyped({ toString: 'x' }), 'test')).toEqual({});
    });

    expect(warnings.length).toBe(1);
  });
});
