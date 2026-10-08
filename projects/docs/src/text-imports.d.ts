/**
 * A file imported as text: `import source from './basic.example.ts?source' with { loader: 'text' }`.
 * The suffix keeps TypeScript from resolving the specifier to the file itself, so every such import
 * is typed here; the bundler drops the suffix and the `loader` attribute makes it inline the text.
 */
declare module '*?source' {
  const source: string;
  export default source;
}
