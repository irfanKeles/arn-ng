// Used in specs only: keeps a page's hand-written Styling table in step with the theme file.

/** The `--arn-*` custom properties a stylesheet defines. `--docs-*` and other names are ignored. */
export interface DocsTokenScan {
  /** Defined in a `:root` rule (at any depth: inside `@layer`, `@media`, `@supports`…). */
  readonly root: ReadonlySet<string>;
  /** Defined in a rule whose selector is not `:root`, with those selectors. */
  readonly elsewhere: ReadonlyMap<string, readonly string[]>;
}

const PREFIX = '--arn-';

function isRoot(selector: string): boolean {
  return selector
    .split(',')
    .map((part) => part.trim())
    .includes(':root');
}

function walk(rules: CSSRuleList, root: Set<string>, elsewhere: Map<string, string[]>): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      for (const property of Array.from(rule.style)) {
        if (!property.startsWith(PREFIX)) {
          continue;
        }

        if (isRoot(rule.selectorText)) {
          root.add(property);
        } else {
          const selectors = elsewhere.get(property) ?? [];

          selectors.push(rule.selectorText);
          elsewhere.set(property, selectors);
        }
      }
    }

    if (rule instanceof CSSImportRule) {
      if (rule.styleSheet) {
        walk(rule.styleSheet.cssRules, root, elsewhere);
      }
    } else if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) {
      // @layer, @media, @supports, @container and nested style rules
      walk(rule.cssRules, root, elsewhere);
    }
  }
}

/** Collects every `--arn-*` definition of the sheet, walking into grouping and nested rules. */
export function scanTokens(sheet: CSSStyleSheet): DocsTokenScan {
  const root = new Set<string>();
  const elsewhere = new Map<string, string[]>();

  walk(sheet.cssRules, root, elsewhere);

  return { root, elsewhere };
}

/**
 * Compares a Styling table with the tokens the theme defines on `:root`, in both directions, for
 * the names `inScope` selects (for example every name starting with `--arn-ripple-`). Returns one
 * line per problem; an empty list means the table matches.
 */
export function tokenMismatches(
  documented: readonly { readonly name: string }[],
  scan: DocsTokenScan,
  inScope: (name: string) => boolean,
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const { name } of documented) {
    if (!name.startsWith(PREFIX)) {
      problems.push(`"${name}" is not an ${PREFIX}* token`);
    } else if (!inScope(name)) {
      problems.push(`"${name}" is outside the scope of this table`);
    } else if (seen.has(name)) {
      problems.push(`Duplicate token "${name}" in the table`);
    }
    seen.add(name);
  }

  for (const name of scan.root) {
    if (inScope(name) && !seen.has(name)) {
      problems.push(`Missing token "${name}": the theme defines it, the table does not`);
    }
  }

  for (const name of seen) {
    if (!name.startsWith(PREFIX) || !inScope(name) || scan.root.has(name)) {
      continue;
    }

    const selectors = scan.elsewhere.get(name);

    problems.push(
      selectors
        ? `Token "${name}" is defined only outside :root (${selectors.join(' | ')})`
        : `Unknown token "${name}": the table has it, the theme does not`,
    );
  }

  return problems;
}
