import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChildren,
  type AfterViewInit,
} from '@angular/core';

/**
 * One box per size, sized with the control tokens the way a component sizes its host, and the
 * height the browser gives it. A ResizeObserver keeps the numbers right when density changes.
 */
@Component({
  selector: 'docs-theming-sizes-example',
  templateUrl: './sizes.example.html',
  styleUrl: './sizes.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemingSizesExampleComponent implements AfterViewInit {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly boxes = viewChildren<ElementRef<HTMLElement>>('box');

  protected readonly sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
  /** Measured height per size, in CSS pixels. */
  protected readonly heights = signal<Partial<Record<string, number>>>({});

  ngAfterViewInit(): void {
    if (!this.browser || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      this.measure();
    });

    for (const box of this.boxes()) {
      observer.observe(box.nativeElement);
    }
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
    });
  }

  private measure(): void {
    const heights: Record<string, number> = {};

    for (const box of this.boxes()) {
      const size = box.nativeElement.dataset['size'];

      if (size) {
        heights[size] = Math.round(box.nativeElement.getBoundingClientRect().height * 10) / 10;
      }
    }
    this.heights.set(heights);
  }
}
