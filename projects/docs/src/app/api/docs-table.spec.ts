import { apiTableView, tokenTableView } from './docs-table';

describe('apiTableView', () => {
  it('lays out inputs with type, default and description; a missing default is empty', () => {
    const view = apiTableView({
      kind: 'inputs',
      rows: [
        { name: 'size', type: 'ArnSize', default: "'md'", description: 'The size.' },
        { name: 'label', type: 'string', description: 'The text.' },
      ],
    });

    expect(view.caption).toBe('Inputs');
    expect(view.columns).toEqual(['Name', 'Type', 'Default', 'Description']);
    expect(view.rows).toEqual([
      {
        name: 'size',
        cells: [
          { text: 'ArnSize', code: true },
          { text: "'md'", code: true },
          { text: 'The size.', code: false },
        ],
      },
      {
        name: 'label',
        cells: [
          { text: 'string', code: true },
          { text: '', code: true },
          { text: 'The text.', code: false },
        ],
      },
    ]);
  });

  it('gives each kind its caption and columns', () => {
    const outputs = apiTableView({
      kind: 'outputs',
      rows: [{ name: 'closed', type: 'void', description: 'After closing.' }],
    });
    const methods = apiTableView({
      kind: 'methods',
      rows: [{ name: 'focus', signature: 'focus(): void', description: 'Focuses.' }],
    });
    const slots = apiTableView({
      kind: 'slots',
      rows: [{ name: '[arnIcon]', description: 'An icon.' }],
    });

    expect([outputs.caption, methods.caption, slots.caption]).toEqual([
      'Outputs',
      'Methods',
      'Templates',
    ]);
    expect(outputs.columns).toEqual(['Name', 'Type', 'Description']);
    expect(methods.columns).toEqual(['Name', 'Signature', 'Description']);
    expect(slots.columns).toEqual(['Name', 'Description']);
    expect(methods.rows[0]?.cells[0]).toEqual({ text: 'focus(): void', code: true });
    expect(slots.rows[0]?.cells).toEqual([{ text: 'An icon.', code: false }]);
  });

  it('keeps one cell per column after the name', () => {
    const view = apiTableView({
      kind: 'outputs',
      rows: [{ name: 'closed', type: 'void', description: 'After closing.' }],
    });

    expect(view.rows[0]?.cells.length).toBe(view.columns.length - 1);
  });
});

describe('tokenTableView', () => {
  it('lists each token with its default and description', () => {
    const view = tokenTableView([
      {
        name: '--arn-button-radius',
        default: 'calc(var(--arn-radius) * 0.8)',
        description: 'Corner radius.',
      },
    ]);

    expect(view.caption).toBe('CSS tokens');
    expect(view.columns).toEqual(['Name', 'Default', 'Description']);
    expect(view.rows).toEqual([
      {
        name: '--arn-button-radius',
        cells: [
          { text: 'calc(var(--arn-radius) * 0.8)', code: true },
          { text: 'Corner radius.', code: false },
        ],
      },
    ]);
  });
});
