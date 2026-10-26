import { Injectable, signal, type Signal } from '@angular/core';

/** A section of the current page, as listed under "On this page". */
export interface DocsTocEntry {
  /** The id of the section heading; also the URL fragment. */
  readonly id: Signal<string>;
  readonly heading: Signal<string>;
}

/**
 * The sections of the current page. Each `docs-section` registers itself when it is created and
 * leaves when it is destroyed, so the list follows the page without scanning the DOM.
 */
@Injectable({ providedIn: 'root' })
export class DocsTocService {
  private readonly entries = signal<readonly DocsTocEntry[]>([]);

  /** In registration order, which is the order of the sections in the page. */
  readonly sections = this.entries.asReadonly();

  register(entry: DocsTocEntry): void {
    this.entries.update((entries) => [...entries, entry]);
  }

  unregister(entry: DocsTocEntry): void {
    this.entries.update((entries) => entries.filter((current) => current !== entry));
  }
}
