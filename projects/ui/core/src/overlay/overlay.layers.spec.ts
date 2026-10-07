import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  at,
  NestedContent,
  overlayBackdrops,
  overlayContainer,
  overlayHosts,
  overlayProbes,
  OverlayTrigger,
  resetOverlayProbes,
  settle,
} from '../../../testing/overlay';
import type { ArnOverlayLayer } from './overlay.types';

@Component({
  imports: [OverlayTrigger],
  template: '<arn-overlay-trigger />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly trigger = viewChild.required(OverlayTrigger);
}

const layers: ArnOverlayLayer[] = ['dropdown', 'popover', 'modal', 'toast', 'tooltip'];

describe('ArnOverlayService: layers', () => {
  const root = document.documentElement;
  let fixture: ComponentFixture<Host>;
  let trigger: OverlayTrigger;

  const zIndexOf = (element: Element): string => getComputedStyle(element).zIndex;
  const token = (layer: ArnOverlayLayer): string =>
    getComputedStyle(root).getPropertyValue(`--arn-z-${layer}`).trim();

  /** The trigger rendered inside the content of the overlay opened last. */
  function innerTrigger(): OverlayTrigger {
    const inner = overlayProbes.triggers.at(-1);

    if (!inner || inner === trigger) {
      throw new Error('No trigger inside an overlay');
    }

    return inner;
  }

  beforeEach(() => {
    resetOverlayProbes();
    fixture = TestBed.createComponent(Host);
    trigger = fixture.componentInstance.trigger();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    root.style.removeProperty('--arn-z-modal');
    expect(overlayContainer().childElementCount).toBe(0);
  });

  it('the tokens are ordered dropdown < popover < modal < toast < tooltip', () => {
    expect(layers.map(token)).toEqual(['1000', '1100', '1200', '1300', '1400']);
  });

  for (const layer of layers) {
    it(`the host and the backdrop of the "${layer}" layer take --arn-z-${layer}`, () => {
      trigger.open('modal', { layer });

      expect(zIndexOf(at(overlayHosts(), 0))).toBe(token(layer));
      expect(zIndexOf(at(overlayBackdrops(), 0))).toBe(token(layer));
    });
  }

  it('each preset uses the layer named after it by default', () => {
    trigger.open('dropdown');
    trigger.open('popover');
    trigger.open('modal');
    trigger.open('tooltip');

    expect(overlayHosts().map(zIndexOf)).toEqual(['1000', '1100', '1200', '1400']);
  });

  it('follows the token when the consumer changes it', () => {
    root.style.setProperty('--arn-z-modal', '5000');
    trigger.open('modal');

    expect(zIndexOf(at(overlayHosts(), 0))).toBe('5000');
    expect(zIndexOf(at(overlayBackdrops(), 0))).toBe('5000');
  });

  it('the backdrop comes right before its own panel, so the panel is on top of it', () => {
    trigger.open('modal');

    const host = at(overlayHosts(), 0);

    expect(at(overlayBackdrops(), 0).nextElementSibling).toBe(host);
    expect(host.style.zIndex).toBe('');
  });

  it('of two overlays on the same layer the later one comes later in the DOM', () => {
    trigger.open('modal', { panelClass: 'first-modal' });
    trigger.open('modal', { panelClass: 'second-modal' });

    const [first, second] = overlayHosts();

    expect(first?.querySelector('.first-modal')).not.toBeNull();
    expect(second?.querySelector('.second-modal')).not.toBeNull();
  });

  it('a dropdown opened from inside a modal is raised to the modal and sits above it', async () => {
    trigger.open('modal', {}, NestedContent);
    await settle(fixture);
    innerTrigger().open('dropdown');

    const modal = at(overlayHosts(), 0);
    const dropdown = at(overlayHosts(), 1);

    expect(zIndexOf(modal)).toBe('1200');
    expect(zIndexOf(dropdown)).toBe('1200');
    expect(modal.compareDocumentPosition(dropdown)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('a modal opened from inside a modal raises its backdrop too', async () => {
    trigger.open('popover', { layer: 'tooltip' }, NestedContent);
    await settle(fixture);
    innerTrigger().open('modal');

    expect(zIndexOf(at(overlayHosts(), 1))).toBe('1400');
    expect(zIndexOf(at(overlayBackdrops(), 0))).toBe('1400');
  });

  it('an overlay on a higher layer than its parent keeps its own value', async () => {
    trigger.open('modal', {}, NestedContent);
    await settle(fixture);
    innerTrigger().open('tooltip');

    const tooltip = at(overlayHosts(), 1);

    expect(zIndexOf(tooltip)).toBe('1400');
    expect(tooltip.style.zIndex).toBe('');
  });

  it('an overlay opened from the page is not raised by an open modal', () => {
    trigger.open('modal');
    trigger.open('dropdown');

    const dropdown = at(overlayHosts(), 1);

    expect(zIndexOf(dropdown)).toBe('1000');
    expect(dropdown.style.zIndex).toBe('');
  });
});
