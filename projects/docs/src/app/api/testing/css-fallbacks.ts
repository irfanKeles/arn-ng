/** Whitespace-insensitive CSS text: line breaks inside var(…) do not matter. */
export const normalizeCss = (css: string): string =>
  css.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();

/**
 * Every fallback a stylesheet writes for a token: the text after `var(<name>,` up to its `)`, in
 * source order. The Styling tables' defaults are checked against it.
 */
export function cssFallbacks(css: string, name: string): string[] {
  const source = normalizeCss(css);
  const found: string[] = [];
  const opening = `var(${name},`;
  let from = source.indexOf(opening);

  while (from !== -1) {
    let depth = 1;
    let index = from + opening.length;

    while (index < source.length && depth > 0) {
      const char = source[index];

      depth += char === '(' ? 1 : char === ')' ? -1 : 0;
      index++;
    }

    found.push(source.slice(from + opening.length, index - 1).trim());
    from = source.indexOf(opening, index);
  }

  return found;
}
