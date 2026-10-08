// The only file that imports Shiki. It is loaded on demand (see `DOCS_HIGHLIGHT_LOADER`), so the
// highlighter and its grammars stay out of the initial bundle.
import { createCssVariablesTheme, createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import css from 'shiki/langs/css.mjs';
import html from 'shiki/langs/html.mjs';
import typescript from 'shiki/langs/typescript.mjs';
import type { DocsCodeToken, DocsHighlight } from './docs-code';

const THEME = 'docs';
// Bits of the TextMate font style.
const ITALIC = 1;
const BOLD = 2;
const LINE_BREAK: DocsCodeToken = { content: '\n', color: undefined, italic: false, bold: false };

let highlight: Promise<DocsHighlight> | undefined;

async function create(): Promise<DocsHighlight> {
  const highlighter = await createHighlighterCore({
    // Colors are CSS variables (`--docs-code-*`, defined in styles.css), not values.
    themes: [createCssVariablesTheme({ name: THEME, variablePrefix: '--docs-code-' })],
    langs: [html, typescript, css],
    engine: createJavaScriptRegexEngine(),
  });

  return (code, language) => {
    const tokens: DocsCodeToken[] = [];

    highlighter.codeToTokensBase(code, { lang: language, theme: THEME }).forEach((line, index) => {
      if (index > 0) {
        tokens.push(LINE_BREAK);
      }

      for (const token of line) {
        // A style that is not set is negative.
        const style = Math.max(token.fontStyle ?? 0, 0);

        tokens.push({
          content: token.content,
          color: token.color,
          italic: (style & ITALIC) !== 0,
          bold: (style & BOLD) !== 0,
        });
      }
    });

    return tokens;
  };
}

/** The one highlighter of the page; created on the first call. */
export function loadDocsHighlight(): Promise<DocsHighlight> {
  highlight ??= create();

  return highlight;
}
