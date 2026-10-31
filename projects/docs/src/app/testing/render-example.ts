import type { Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';

// Used in example and page specs only.

export interface RenderedExample<T> {
  readonly fixture: ComponentFixture<T>;
  readonly element: HTMLElement;
}

/** Renders an example the way the docs app does: theme on <html>, optional config applied. */
export async function renderExample<T>(
  type: Type<T>,
  config: ArnConfig = {},
): Promise<RenderedExample<T>> {
  TestBed.configureTestingModule({ providers: [provideArn({ applyToDocument: true })] });

  const fixture = TestBed.createComponent(type);

  TestBed.inject(ArnConfigService).update(config);
  await fixture.whenStable();

  return { fixture, element: fixture.nativeElement as HTMLElement };
}

export const A11Y_MODES: readonly { readonly name: string; readonly config: ArnConfig }[] = [
  { name: 'light', config: { colorScheme: 'light' } },
  { name: 'dark', config: { colorScheme: 'dark' } },
  { name: 'RTL', config: { direction: 'rtl' } },
  { name: 'compact', config: { density: 'compact' } },
];
