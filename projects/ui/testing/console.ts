// Used in tests only; not exported from any entry point.

/** Collects the messages written to `console.warn` during `run`; does not print them. */
export function captureWarnings(run: () => void): string[] {
  const original = console.warn;
  const messages: string[] = [];

  console.warn = (...args: unknown[]): void => {
    messages.push(args.map(String).join(' '));
  };

  try {
    run();
  } finally {
    console.warn = original;
  }

  return messages;
}
