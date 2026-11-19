import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { DocsTocService, type DocsTocEntry } from './docs-toc.service';

/**
 * A page section with a level-two heading, listed under "On this page". The heading can take focus
 * (`tabindex="-1"`), so a link to the section moves keyboard focus there.
 */
@Component({
  selector: 'docs-section',
  templateUrl: './docs-section.component.html',
  styleUrl: './docs-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsSectionComponent {
  /** The id of the heading; also the URL fragment. Unique on the page. */
  readonly sectionId = input.required<string>();
  readonly heading = input.required<string>();

  private readonly headingElement = viewChild<ElementRef<HTMLElement>>('title');

  constructor() {
    const toc = inject(DocsTocService);
    // The signals are read later, by the list: the inputs are not set yet, nor is the view.
    const entry: DocsTocEntry = {
      id: this.sectionId,
      heading: this.heading,
      element: computed(() => this.headingElement()?.nativeElement),
    };

    toc.register(entry);
    inject(DestroyRef).onDestroy(() => {
      toc.unregister(entry);
    });
  }
}
