import { reflectComponentType, type Type } from '@angular/core';

// Used in specs only: keeps a page's hand-written API tables in step with the component or directive.

/** The documented names; only `name` is compared. */
export interface DocsApiNames {
  readonly inputs?: readonly { readonly name: string }[];
  readonly outputs?: readonly { readonly name: string }[];
}

function compare(
  kind: 'input' | 'output',
  actual: readonly string[],
  documented: readonly string[],
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const name of documented) {
    if (seen.has(name)) {
      problems.push(`Duplicate ${kind} "${name}" in the table`);
    }
    seen.add(name);
  }

  for (const name of actual) {
    if (!seen.has(name)) {
      problems.push(`Missing ${kind} "${name}": the code has it, the table does not`);
    }
  }

  for (const name of seen) {
    if (!actual.includes(name)) {
      problems.push(`Unknown ${kind} "${name}": the table has it, the code does not`);
    }
  }

  return problems;
}

/** The public (template) names of a component's or directive's inputs and outputs. */
export interface DocsApiTemplateNames {
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
}

/** The keys of a definition map, if every value has a shape Angular is known to emit. */
function definitionKeys(map: unknown): string[] | null {
  if (typeof map !== 'object' || map === null || Array.isArray(map)) {
    return null;
  }

  const entries = Object.entries(map);

  // Inputs: `[minifiedName, flags, transform | null]` (Angular 17+) or a plain name; outputs: a name.
  const known = entries.every(
    ([, value]) => typeof value === 'string' || (Array.isArray(value) && value.length > 0),
  );

  return known ? entries.map(([name]) => name) : null;
}

/**
 * Reads a directive's names from its compiled definition (`ɵdir`). Angular has no public API for
 * this (`reflectComponentType` reads components only), so the shape is checked and anything
 * unexpected gives `null` instead of a silently wrong answer. Specs only: never in the library.
 */
export function directiveTemplateNames(type: Type<unknown>): DocsApiTemplateNames | null {
  const definition: unknown = Reflect.get(type, 'ɵdir');

  if (typeof definition !== 'object' || definition === null) {
    return null;
  }

  const inputs = definitionKeys(Reflect.get(definition, 'inputs'));
  const outputs = definitionKeys(Reflect.get(definition, 'outputs'));

  return inputs && outputs ? { inputs, outputs } : null;
}

/** The names of a component (public API) or, failing that, of a directive (`ɵdir`). */
function templateNames(type: Type<unknown>): DocsApiTemplateNames | null {
  const mirror = reflectComponentType(type);

  if (mirror) {
    return {
      inputs: mirror.inputs.map((input) => input.templateName),
      outputs: mirror.outputs.map((output) => output.templateName),
    };
  }

  return directiveTemplateNames(type);
}

/**
 * Compares the documented inputs and outputs with the component's or directive's own, by template
 * name (aliases, and the `<name>Change` output of a `model()`, included). Only names are compared.
 * Returns one line per problem; an empty list means the tables match.
 */
export function apiMismatches(type: Type<unknown>, api: DocsApiNames): string[] {
  const names = templateNames(type);

  if (!names) {
    return [
      `The API of ${type.name} cannot be read: neither a component nor a known directive shape`,
    ];
  }

  return [
    ...compare(
      'input',
      names.inputs,
      (api.inputs ?? []).map((row) => row.name),
    ),
    ...compare(
      'output',
      names.outputs,
      (api.outputs ?? []).map((row) => row.name),
    ),
  ];
}

/** Fails the spec, listing every problem, unless the tables match the component or directive. */
export function expectApiMatchesComponent(type: Type<unknown>, api: DocsApiNames): void {
  expect(apiMismatches(type, api)).toEqual([]);
}
