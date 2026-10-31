import { THEME_CSS, themeStyleSheet } from './theme-source';
import { scanTokens, tokenMismatches, type DocsTokenScan } from './token-mismatches';

function sheet(css: string): CSSStyleSheet {
  const result = new CSSStyleSheet();

  result.replaceSync(css);

  return result;
}

const FIXTURE = `
  :root {
    --arn-ripple-color: red;
    --docs-gutter: 1rem;
    color: black;
  }

  @layer theme {
    :root { --arn-ripple-duration: 450ms; }
  }

  @media (prefers-reduced-motion: no-preference) {
    @supports (scale: 1) {
      :root, .other { --arn-ripple-easing: ease-out; }
    }
  }

  .card {
    --arn-card-radius: 4px;
    --docs-card: 1;

    &:hover { --arn-card-shadow: none; }
  }

  [data-density='compact'] { --arn-density: 0.875; }
  :root { --arn-density: 1; }
`;

const ripple = (name: string): boolean => name.startsWith('--arn-ripple-');
const card = (name: string): boolean => name.startsWith('--arn-card-');

describe('scanTokens', () => {
  let scan: DocsTokenScan;

  beforeEach(() => {
    scan = scanTokens(sheet(FIXTURE));
  });

  it('finds :root tokens inside @layer, @media and @supports, and in selector lists', () => {
    expect([...scan.root].sort()).toEqual([
      '--arn-density',
      '--arn-ripple-color',
      '--arn-ripple-duration',
      '--arn-ripple-easing',
    ]);
  });

  it('lists the other selectors that define an --arn-* token, nested rules included', () => {
    expect(Object.fromEntries(scan.elsewhere)).toEqual({
      '--arn-card-radius': ['.card'],
      '--arn-card-shadow': ['&:hover'],
      // The CSSOM serializes attribute values with double quotes
      '--arn-density': ['[data-density="compact"]'],
    });
  });

  it('ignores --docs-* and ordinary properties', () => {
    const all = [...scan.root, ...scan.elsewhere.keys()];

    expect(all.every((name) => name.startsWith('--arn-'))).toBe(true);
  });
});

describe('tokenMismatches', () => {
  const scan = (): DocsTokenScan => scanTokens(sheet(FIXTURE));
  const RIPPLE = [
    { name: '--arn-ripple-color' },
    { name: '--arn-ripple-duration' },
    { name: '--arn-ripple-easing' },
  ];

  it('returns an empty list when the table lists exactly the tokens in scope', () => {
    expect(tokenMismatches(RIPPLE, scan(), ripple)).toEqual([]);
  });

  it('does not depend on the order of the rows', () => {
    expect(tokenMismatches([...RIPPLE].reverse(), scan(), ripple)).toEqual([]);
  });

  it('returns a filled list for a token the table misses', () => {
    expect(tokenMismatches(RIPPLE.slice(0, 2), scan(), ripple)).toEqual([
      'Missing token "--arn-ripple-easing": the theme defines it, the table does not',
    ]);
  });

  it('returns a filled list for a token the theme does not define', () => {
    expect(tokenMismatches([...RIPPLE, { name: '--arn-ripple-size' }], scan(), ripple)).toEqual([
      'Unknown token "--arn-ripple-size": the table has it, the theme does not',
    ]);
  });

  it('returns a filled list for a duplicate, an out-of-scope and a non-arn row', () => {
    expect(
      tokenMismatches(
        [
          ...RIPPLE,
          { name: '--arn-ripple-color' },
          { name: '--arn-radius' },
          { name: '--docs-gutter' },
        ],
        scan(),
        ripple,
      ),
    ).toEqual([
      'Duplicate token "--arn-ripple-color" in the table',
      '"--arn-radius" is outside the scope of this table',
      '"--docs-gutter" is not an --arn-* token',
    ]);
  });

  it('says where a token is defined when it is defined only outside :root', () => {
    expect(tokenMismatches([{ name: '--arn-card-radius' }], scan(), card)).toEqual([
      'Token "--arn-card-radius" is defined only outside :root (.card)',
    ]);
  });

  it('accepts a token defined on :root and also elsewhere', () => {
    expect(
      tokenMismatches([{ name: '--arn-density' }], scan(), (name) => name === '--arn-density'),
    ).toEqual([]);
  });
});

describe('the shipped theme file', () => {
  it('is read as text and parsed on its own', () => {
    expect(THEME_CSS).toContain('--arn-ring:');
    expect(scanTokens(themeStyleSheet()).root.has('--arn-ring')).toBe(true);
  });

  it('defines the ripple tokens on :root', () => {
    expect(tokenMismatches(RIPPLE_TOKENS, scanTokens(themeStyleSheet()), ripple)).toEqual([]);
  });

  it('defines --arn-* outside :root only for the density factor', () => {
    const elsewhere = scanTokens(themeStyleSheet()).elsewhere;

    expect(Object.fromEntries(elsewhere)).toEqual({
      '--arn-density': ['[data-density="comfortable"]', '[data-density="compact"]'],
    });
  });
});

const RIPPLE_TOKENS = [
  { name: '--arn-ripple-color' },
  { name: '--arn-ripple-duration' },
  { name: '--arn-ripple-easing' },
];
