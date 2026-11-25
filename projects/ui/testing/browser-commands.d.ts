// Types of the browser commands registered in projects/ui/vitest-base.config.mts.
import 'vitest/browser';

declare module 'vitest/browser' {
  interface BrowserCommands {
    arnMouse: (type: 'move' | 'down' | 'up', x: number, y: number) => Promise<void>;
    arnReducedMotion: (reduce: boolean) => Promise<void>;
    arnAriaSnapshot: (selector: string) => Promise<string>;
  }
}
