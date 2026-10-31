import type { Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';

// Used in the ripple example specs only.

export interface RippleExample<T> {
  readonly fixture: ComponentFixture<T>;
  readonly element: HTMLElement;
}

/** Renders an example the way the docs app does: theme on <html>, optional config applied. */
export async function renderExample<T>(
  type: Type<T>,
  config: ArnConfig = {},
): Promise<RippleExample<T>> {
  TestBed.configureTestingModule({ providers: [provideArn({ applyToDocument: true })] });

  const fixture = TestBed.createComponent(type);

  TestBed.inject(ArnConfigService).update(config);
  await fixture.whenStable();

  return { fixture, element: fixture.nativeElement as HTMLElement };
}

/** A primary-button press at the given point inside the element (its top-left corner by default). */
export function pressAt(element: HTMLElement, offsetX = 4, offsetY = 4): void {
  const rect = element.getBoundingClientRect();

  element.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: rect.left + offsetX,
      clientY: rect.top + offsetY,
    }),
  );
}

export function waves(element: Element): HTMLElement[] {
  return Array.from(element.querySelectorAll<HTMLElement>('.arn-ripple-wave'));
}

/** Enter and Space as the browser sends them to a focused button. */
export function pressKeys(element: HTMLElement): void {
  for (const key of ['Enter', ' ']) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }
  element.click();
}

export const A11Y_MODES: readonly { readonly name: string; readonly config: ArnConfig }[] = [
  { name: 'light', config: { colorScheme: 'light' } },
  { name: 'dark', config: { colorScheme: 'dark' } },
  { name: 'RTL', config: { direction: 'rtl' } },
  { name: 'compact', config: { density: 'compact' } },
];
