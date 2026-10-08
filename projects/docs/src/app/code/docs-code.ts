/** The languages the documentation highlights. */
export type DocsCodeLanguage = 'html' | 'typescript' | 'css';

/** A run of code with one style. Line breaks are tokens too, so the contents add up to the code. */
export interface DocsCodeToken {
  readonly content: string;
  /** A `var(--docs-code-*)` reference, never a color value. */
  readonly color: string | undefined;
  readonly italic: boolean;
  readonly bold: boolean;
}

/** Splits code into styled tokens. */
export type DocsHighlight = (code: string, language: DocsCodeLanguage) => readonly DocsCodeToken[];
