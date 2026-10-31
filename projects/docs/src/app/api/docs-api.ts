// The data of a component page's API and Styling sections. Written by hand next to the page and
// checked against the component in its spec (see testing/expect-api.ts).

export interface DocsApiInput {
  /** The name used in templates (the alias, if there is one). */
  readonly name: string;
  readonly type: string;
  /** Omitted when there is none (shown as a dash). */
  readonly default?: string;
  readonly description: string;
}

export interface DocsApiOutput {
  readonly name: string;
  /** The type of the emitted value. */
  readonly type: string;
  readonly description: string;
}

export interface DocsApiMethod {
  readonly name: string;
  readonly signature: string;
  readonly description: string;
}

export interface DocsApiSlot {
  /** The content selector or template name. */
  readonly name: string;
  readonly description: string;
}

export interface DocsApiToken {
  /** The custom property, e.g. `--arn-button-radius`. */
  readonly name: string;
  /** The value computed on the host. */
  readonly default: string;
  readonly description: string;
}

/**
 * One API table; the kind decides the caption and the columns. `properties` has the columns of
 * `inputs`, for fields that are not template inputs (e.g. the `ArnConfig` object).
 */
export type DocsApiTable =
  | { readonly kind: 'inputs'; readonly rows: readonly DocsApiInput[] }
  | { readonly kind: 'properties'; readonly rows: readonly DocsApiInput[] }
  | { readonly kind: 'outputs'; readonly rows: readonly DocsApiOutput[] }
  | { readonly kind: 'methods'; readonly rows: readonly DocsApiMethod[] }
  | { readonly kind: 'slots'; readonly rows: readonly DocsApiSlot[] };
