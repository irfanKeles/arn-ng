import { Directionality } from '@angular/cdk/bidi';
import { OverlayContainer } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  Injector,
  type TemplateRef,
  type Type,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { injectArnConfig } from '../core/src/config/inject-arn-config';
import { ArnOverlayRef } from '../core/src/overlay/overlay-ref';
import { ArnOverlayService } from '../core/src/overlay/overlay.service';
import type { ArnOverlayConfig, ArnOverlayPreset } from '../core/src/overlay/overlay.types';

// Used in tests only; not exported from any entry point.

/** Every probe created since the last `resetOverlayProbes()`, in creation order. */
export const overlayProbes: { contents: OverlayContent[]; triggers: OverlayTrigger[] } = {
  contents: [],
  triggers: [],
};

export function resetOverlayProbes(): void {
  overlayProbes.contents = [];
  overlayProbes.triggers = [];
}

/** Content of an overlay: two tabbable elements, and what a component would read inside. */
@Component({
  selector: 'arn-overlay-content',
  template: '<button type="button" class="first">First</button><a href="#" class="last">Last</a>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayContent {
  readonly ref = inject<ArnOverlayRef<string>>(ArnOverlayRef);
  readonly config = injectArnConfig();
  readonly directionality = inject(Directionality);

  constructor() {
    overlayProbes.contents.push(this);
  }
}

/** Mimics a component that opens overlays: a button as origin and its own injector. */
@Component({
  selector: 'arn-overlay-trigger',
  imports: [OverlayContent],
  templateUrl: './overlay-trigger.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayTrigger {
  private readonly overlay = inject(ArnOverlayService);
  readonly injector = inject(Injector);
  readonly viewContainerRef = inject(ViewContainerRef);
  readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');
  readonly panel = viewChild.required<TemplateRef<unknown>>('panel');

  constructor() {
    overlayProbes.triggers.push(this);
  }

  /** Opens a component (default `OverlayContent`) connected to the button. */
  open(
    preset: ArnOverlayPreset,
    options: Partial<ArnOverlayConfig> = {},
    content: Type<unknown> = OverlayContent,
  ): ArnOverlayRef<string> {
    return this.overlay.open<string>(content, {
      preset,
      injector: this.injector,
      origin: this.button(),
      ...options,
    });
  }

  /** Opens the trigger's own template. */
  openTemplate(
    preset: ArnOverlayPreset,
    options: Partial<ArnOverlayConfig> = {},
  ): ArnOverlayRef<string> {
    return this.overlay.open<string>(this.panel(), {
      preset,
      injector: this.injector,
      origin: this.button(),
      viewContainerRef: this.viewContainerRef,
      ...options,
    });
  }
}

/** Content with a trigger inside, for overlays opened from an overlay. */
@Component({
  selector: 'arn-overlay-nested-content',
  imports: [OverlayTrigger],
  template: '<arn-overlay-trigger />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NestedContent {}

export function overlayContainer(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

/** The host element (stacking context) of every overlay in the DOM, bottom to top. */
export function overlayHosts(): HTMLElement[] {
  return Array.from(overlayContainer().querySelectorAll<HTMLElement>('.arn-overlay-host'));
}

export function overlayPanes(): HTMLElement[] {
  return Array.from(overlayContainer().querySelectorAll<HTMLElement>('.arn-overlay-pane'));
}

export function overlayBackdrops(): HTMLElement[] {
  return Array.from(overlayContainer().querySelectorAll<HTMLElement>('.arn-overlay-backdrop'));
}

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/** Renders, then waits until the overlay is positioned and the initial focus has moved. */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await nextFrame();
}

/** `items.at(index)` that fails the test instead of returning `undefined`. */
export function at<T>(items: readonly T[], index: number): T {
  const item = items.at(index);

  if (item === undefined) {
    throw new Error(`No item at index ${String(index)} (length ${String(items.length)})`);
  }

  return item;
}

export function pressEscape(): void {
  overlayContainer().ownerDocument.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
}
