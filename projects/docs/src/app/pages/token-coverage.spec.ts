import { themeStyleSheet } from '../api/testing/theme-source';
import { scanTokens } from '../api/testing/token-mismatches';
import { RIPPLE_TOKENS } from './ripple/ripple.api';
import { THEMING_TOKEN_GROUPS } from './theming/theming.tokens';

/**
 * Tokens defined on :root that no page documents yet, each with where it is documented today.
 * A token leaves this list when its page gets a Styling table.
 */
const NOT_ON_A_PAGE: Readonly<Record<string, string>> = {
  '--arn-z-dropdown': 'Overlay page (not written yet); components/tokens.md §3',
  '--arn-z-popover': 'Overlay page (not written yet); components/tokens.md §3',
  '--arn-z-modal': 'Overlay page (not written yet); components/tokens.md §3',
  '--arn-z-toast': 'Overlay page (not written yet); components/tokens.md §3',
  '--arn-z-tooltip': 'Overlay page (not written yet); components/tokens.md §3',
};

/** Every Styling table of the site, by page. Add a page's tables here when it gets them. */
const DOCUMENTED: Readonly<Record<string, readonly { readonly name: string }[]>> = {
  ripple: RIPPLE_TOKENS,
  theming: THEMING_TOKEN_GROUPS.flatMap((group) => group.rows),
};

describe('token coverage', () => {
  const root = [...scanTokens(themeStyleSheet()).root].sort();
  const documented = Object.entries(DOCUMENTED).flatMap(([page, rows]) =>
    rows.map((row) => ({ page, name: row.name })),
  );
  const names = new Set(documented.map((row) => row.name));

  it('documents every --arn-* token on :root in a Styling table or in the list above', () => {
    expect(root.filter((name) => !names.has(name) && !(name in NOT_ON_A_PAGE))).toEqual([]);
  });

  it('documents each token on one page only', () => {
    const pages = new Map<string, string[]>();

    for (const row of documented) {
      pages.set(row.name, [...(pages.get(row.name) ?? []), row.page]);
    }

    expect([...pages].filter(([, on]) => on.length > 1)).toEqual([]);
  });

  it('keeps the list honest: every entry exists in the theme and is on no page yet', () => {
    const listed = Object.keys(NOT_ON_A_PAGE);

    expect(listed.filter((name) => !root.includes(name))).toEqual([]);
    expect(listed.filter((name) => names.has(name))).toEqual([]);
  });
});
