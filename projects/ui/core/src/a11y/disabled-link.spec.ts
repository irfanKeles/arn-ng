import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  inject,
  input,
  booleanAttribute,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabledLink } from './disabled-link';

/** A bare directive that only uses the helper: no styles, no aria-disabled. */
@Directive({ selector: 'a[arnProbeLink]' })
class ProbeLink {
  readonly disabled = input(false, { transform: booleanAttribute });

  constructor() {
    disabledLink(inject<ElementRef<HTMLElement>>(ElementRef).nativeElement, this.disabled);
  }
}

// The ancestor listener is added on the fixture root in render()
@Component({
  selector: 'arn-disabled-link-host',
  imports: [ProbeLink],
  template: `@if (shown()) {
    <a arnProbeLink href="#x" tabindex="2" [disabled]="disabled()" (click)="count()">Link</a>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly disabled = signal(false);
  readonly shown = signal(true);
  clicks = 0;

  count(): void {
    this.clicks++;
  }
}

function click(element: HTMLElement): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });

  element.dispatchEvent(event);

  return event;
}

describe('disabledLink (internal)', () => {
  async function render(): Promise<{
    host: Host;
    link: () => HTMLElement;
    stable: () => Promise<void>;
  }> {
    const fixture = TestBed.createComponent(Host);

    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;

    // An ancestor listener, like a (click) of the consumer on a parent
    root.addEventListener('click', () => {
      fixture.componentInstance.count();
    });

    const link = (): HTMLElement => {
      const found = root.querySelector<HTMLElement>('a');

      if (!found) {
        throw new Error('Expected the link');
      }

      return found;
    };

    return { host: fixture.componentInstance, link, stable: () => fixture.whenStable() };
  }

  it('leaves an enabled link alone', async () => {
    const { host, link } = await render();
    const event = click(link());

    expect(event.defaultPrevented).toBe(false);
    expect(host.clicks).toBe(2);
    expect(link().getAttribute('tabindex')).toBe('2');
  });

  it('cancels the click and stops the listeners of the element and its ancestors', async () => {
    const { host, link, stable } = await render();

    host.disabled.set(true);
    await stable();

    const event = click(link());

    expect(event.defaultPrevented).toBe(true);
    expect(host.clicks).toBe(0);
  });

  it("takes the link out of the tab order and restores the consumer's tabindex", async () => {
    const { host, link, stable } = await render();

    host.disabled.set(true);
    await stable();

    expect(link().getAttribute('tabindex')).toBe('-1');

    host.disabled.set(false);
    await stable();

    expect(link().getAttribute('tabindex')).toBe('2');
  });

  it('writes no aria-disabled: that stays with the component', async () => {
    const { host, link, stable } = await render();

    host.disabled.set(true);
    await stable();

    expect(link().hasAttribute('aria-disabled')).toBe(false);
  });

  it('removes its click listener when the link is destroyed', async () => {
    const { host, link, stable } = await render();
    const element = link();
    const removed = vi.spyOn(element, 'removeEventListener');

    host.shown.set(false);
    await stable();

    expect(removed).toHaveBeenCalledWith('click', expect.any(Function), { capture: true });
  });
});
