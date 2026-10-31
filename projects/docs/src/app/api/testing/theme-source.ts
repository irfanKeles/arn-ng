import theme from '../../../../../ui/theme.css?source' with { loader: 'text' };

// Used in specs only: the text of the library's theme file, as it is shipped.

export const THEME_CSS = theme;

/** The theme file parsed on its own, without the component styles a spec has in the document. */
export function themeStyleSheet(): CSSStyleSheet {
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(THEME_CSS);

  return sheet;
}
