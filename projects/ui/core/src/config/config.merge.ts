import type { ArnConfig, ArnDeepPartial } from './config.types';
import { devWarn } from './dev-mode';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeRecords(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...base };

  for (const key of Object.keys(patch)) {
    const value = patch[key];

    // Keep `__proto__` in a config parsed from JSON from changing the prototype
    if (value === undefined || key === '__proto__') {
      continue;
    }

    const current = result[key];
    result[key] =
      isPlainObject(current) && isPlainObject(value) ? mergeRecords(current, value) : value;
  }

  return result;
}

/**
 * Deep-merges `patch` onto `base`. Plain objects merge recursively; arrays and primitives
 * overwrite; `undefined` is skipped. The inputs are not mutated.
 */
export function deepMerge<T extends object>(base: T, patch: ArnDeepPartial<T> | undefined): T {
  if (patch === undefined) {
    return base;
  }

  return mergeRecords(base as Record<string, unknown>, patch as Record<string, unknown>) as T;
}

const oneOf =
  (allowed: readonly unknown[]) =>
  (value: unknown): boolean =>
    allowed.includes(value);

const formErrorTrigger = oneOf(['touched', 'dirty', 'submitted']);

// Thanks to `satisfies`, adding a field to ArnConfig without adding it here fails the build.
const validators = {
  size: oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  density: oneOf(['comfortable', 'compact']),
  colorScheme: oneOf(['light', 'dark', 'system']),
  direction: oneOf(['ltr', 'rtl', 'auto']),
  ripple: (value) => typeof value === 'boolean',
  locale: (value) => typeof value === 'string',
  messages: isPlainObject,
  forms: (value) =>
    isPlainObject(value) &&
    (value['showErrorsOn'] === undefined || formErrorTrigger(value['showErrorsOn'])),
} satisfies Record<keyof ArnConfig, (value: unknown) => boolean>;

function validatorOf(key: string): ((value: unknown) => boolean) | undefined {
  return Object.hasOwn(validators, key) ? validators[key as keyof ArnConfig] : undefined;
}

/**
 * Drops unknown fields and invalid values that bypassed the type system (JS, JSON, `as`); in
 * development mode it warns for each one. A dropped field resolves from the next lower level.
 */
export function sanitizeConfig(config: ArnConfig, source: string): ArnConfig {
  const input: Record<string, unknown> = { ...config };
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(input)) {
    const value = input[key];
    const validate = validatorOf(key);

    if (value === undefined) {
      continue;
    }

    if (!validate) {
      devWarn(`${source}: unknown config key "${key}" was ignored.`);
    } else if (!validate(value)) {
      devWarn(`${source}: invalid value ${JSON.stringify(value)} for "${key}" was ignored.`);
    } else {
      result[key] = value;
    }
  }

  return result;
}
