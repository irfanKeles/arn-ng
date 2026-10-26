import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocsTocService } from './docs-toc.service';

/**
 * "On this page": links to the sections of the current page. The shell decides when it is shown
 * and passes the page path (the list lives outside the routed page, so a relative link would
 * resolve against the root route).
 */
@Component({
  selector: 'docs-toc',
  imports: [RouterLink],
  templateUrl: './docs-toc.component.html',
  styleUrl: './docs-toc.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsTocComponent {
  private readonly document = inject(DOCUMENT);

  /** The path of the current page, without query or fragment. */
  readonly path = input.required<string>();

  protected readonly sections = inject(DocsTocService).sections;

  /**
   * Moves focus to the section heading, so keyboard users continue from there. Focusing also
   * scrolls, which covers a click on the fragment that is already in the URL (the router ignores it).
   */
  protected focusSection(event: MouseEvent, id: string): void {
    // A modified click opens the link elsewhere; the router ignores it too.
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    this.document.getElementById(id)?.focus();
  }
}
