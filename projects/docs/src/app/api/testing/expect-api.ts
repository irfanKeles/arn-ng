import { reflectComponentType, type Type } from '@angular/core';

// Used in specs only: keeps a page's hand-written API tables in step with the component.

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
      problems.push(`Missing ${kind} "${name}": the component has it, the table does not`);
    }
  }

  for (const name of seen) {
    if (!actual.includes(name)) {
      problems.push(`Unknown ${kind} "${name}": the table has it, the component does not`);
    }
  }

  return problems;
}

/**
 * Compares the documented inputs and outputs with the component's own, by template name (aliases,
 * and the `<name>Change` output of a `model()`, included). Returns one line per problem; an empty
 * list means the tables match. A directive cannot be read this way and is reported as a problem.
 */
export function apiMismatches(type: Type<unknown>, api: DocsApiNames): string[] {
  const mirror = reflectComponentType(type);

  if (!mirror) {
    return [`${type.name} is not a component; its API cannot be read with reflectComponentType`];
  }

  return [
    ...compare(
      'input',
      mirror.inputs.map((input) => input.templateName),
      (api.inputs ?? []).map((row) => row.name),
    ),
    ...compare(
      'output',
      mirror.outputs.map((output) => output.templateName),
      (api.outputs ?? []).map((row) => row.name),
    ),
  ];
}

/** Fails the spec, listing every problem, unless the tables match the component. */
export function expectApiMatchesComponent(type: Type<unknown>, api: DocsApiNames): void {
  expect(apiMismatches(type, api)).toEqual([]);
}
