import { DestroyRef, effect, inject, Renderer2, type Signal } from '@angular/core';

/**
 * Turns a link (`<a>`) off while `disabled()` is true: its clicks are cancelled and it leaves the
 * tab order. Call it in an injection context (a constructor). `aria-disabled` and the look stay
 * with the component (a host binding and its stylesheet).
 *
 * - A host listener runs too late: the template's `(click)` and `RouterLink` are registered on the
 *   element before it. A capture listener on the target runs before the bubbling ones on the same
 *   element, so `stopImmediatePropagation` stops them.
 * - A host binding would replace the consumer's `tabindex`; this keeps it while disabled and puts
 *   it back once enabled (or removes the `-1` it added when there was none).
 */
export function disabledLink(host: HTMLElement, disabled: Signal<boolean>): void {
  const renderer = inject(Renderer2);

  const cancel = (event: Event): void => {
    if (disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  host.addEventListener('click', cancel, { capture: true });
  inject(DestroyRef).onDestroy(() => {
    host.removeEventListener('click', cancel, { capture: true });
  });

  /** The consumer's own `tabindex`, kept while disabled; `undefined` = none kept. */
  let kept: string | null | undefined;

  effect(() => {
    if (disabled()) {
      if (kept === undefined) {
        kept = host.getAttribute('tabindex');
      }
      renderer.setAttribute(host, 'tabindex', '-1');
    } else if (kept !== undefined) {
      if (kept === null) {
        renderer.removeAttribute(host, 'tabindex');
      } else {
        renderer.setAttribute(host, 'tabindex', kept);
      }
      kept = undefined;
    }
  });
}
