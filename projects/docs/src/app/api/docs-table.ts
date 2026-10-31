import type { DocsApiInput, DocsApiTable, DocsApiToken } from './docs-api';

/** A cell: code is set in monospace and read left to right; empty text means "none". */
export interface DocsTableCell {
  readonly text: string;
  readonly code: boolean;
}

/** A row: the name is its header cell. */
export interface DocsTableRow {
  readonly name: string;
  readonly cells: readonly DocsTableCell[];
}

/** What the table renders; `columns` starts with the name column. */
export interface DocsTableView {
  readonly caption: string;
  readonly columns: readonly string[];
  readonly rows: readonly DocsTableRow[];
}

function code(text: string | undefined): DocsTableCell {
  return { text: text ?? '', code: true };
}

function prose(text: string): DocsTableCell {
  return { text, code: false };
}

/** Inputs and properties: name, type, default and description. */
function typedView(caption: string, rows: readonly DocsApiInput[]): DocsTableView {
  return {
    caption,
    columns: ['Name', 'Type', 'Default', 'Description'],
    rows: rows.map((row) => ({
      name: row.name,
      cells: [code(row.type), code(row.default), prose(row.description)],
    })),
  };
}

/** The view of an API table (inputs, properties, outputs, methods or slots). */
export function apiTableView(table: DocsApiTable): DocsTableView {
  switch (table.kind) {
    case 'inputs':
      return typedView('Inputs', table.rows);
    case 'properties':
      return typedView('Properties', table.rows);
    case 'outputs':
      return {
        caption: 'Outputs',
        columns: ['Name', 'Type', 'Description'],
        rows: table.rows.map((row) => ({
          name: row.name,
          cells: [code(row.type), prose(row.description)],
        })),
      };
    case 'methods':
      return {
        caption: 'Methods',
        columns: ['Name', 'Signature', 'Description'],
        rows: table.rows.map((row) => ({
          name: row.name,
          cells: [code(row.signature), prose(row.description)],
        })),
      };
    case 'slots':
      return {
        caption: 'Templates',
        columns: ['Name', 'Description'],
        rows: table.rows.map((row) => ({ name: row.name, cells: [prose(row.description)] })),
      };
  }
}

/** The view of a Styling table: CSS tokens, under a caption that tells several tables apart. */
export function tokenTableView(
  rows: readonly DocsApiToken[],
  caption = 'CSS tokens',
): DocsTableView {
  return {
    caption,
    columns: ['Name', 'Default', 'Description'],
    rows: rows.map((row) => ({
      name: row.name,
      cells: [code(row.default), prose(row.description)],
    })),
  };
}
