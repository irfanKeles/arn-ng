import { ChangeDetectionStrategy, Component, inject, input, DOCUMENT } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocsTocService } from './docs-toc.service';
import { focusSection, isPlainClick } from './focus-section';

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
    if (isPlainClick(event)) {
      focusSection(this.document, id);
    }
  }
}
