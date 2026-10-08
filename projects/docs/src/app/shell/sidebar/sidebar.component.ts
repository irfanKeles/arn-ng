import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { visibleCategories, type DocsNavCategory } from '../../nav/docs-nav';

/** The categorized page list. Categories without pages are not rendered. */
@Component({
  selector: 'docs-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly categories = input.required<readonly DocsNavCategory[]>();

  protected readonly visible = computed(() => visibleCategories(this.categories()));

  /** Moves focus to the first page link (used when the drawer opens). */
  focusFirstLink(): void {
    this.element.nativeElement.querySelector('a')?.focus();
  }
}
