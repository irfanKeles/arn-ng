import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { routes } from '../../app.routes';
import { query, queryAs, resetDocument, text } from '../../testing/dom';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { A11Y_MODES } from '../../testing/render-example';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  async function open(url: string): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create(url);

    if (!harness.routeNativeElement) {
      throw new Error('No route was activated.');
    }

    return harness.routeNativeElement;
  }

  async function render(): Promise<{
    fixture: ComponentFixture<NotFoundPageComponent>;
    element: HTMLElement;
  }> {
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideArn({ applyToDocument: true })],
    });
  });

  afterEach(() => {
    resetDocument(document);
  });

  it('is shown for an unknown URL', async () => {
    const element = await open('/no/such/page');

    expect(element.tagName.toLowerCase()).toBe('docs-not-found-page');
    expect(query(element, 'h1').textContent).toBe('Page not found');
    expect(document.title).toBe('Page not found · arn-ng');
  });

  it('is not shown for a known URL', async () => {
    const element = await open('/');

    expect(element.tagName.toLowerCase()).toBe('docs-overview-page');
  });

  it('links back to the overview', async () => {
    const link = queryAs(await open('/missing'), 'a', HTMLAnchorElement);

    expect(link.getAttribute('href')).toBe('/');
    expect(text(link)).toBe('Back to overview');
  });

  it('mirrors the arrow in RTL', async () => {
    const icon = queryAs(await open('/missing'), 'svg', SVGElement);

    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(icon).scale).toBe('none');

    document.documentElement.setAttribute('dir', 'rtl');

    expect(getComputedStyle(icon).scale).toBe('-1 1');
  });

  describe('layout', () => {
    it('does not make a 320px page scroll sideways', async () => {
      const { fixture, element } = await render();

      await expectNoPageOverflow(element, () => fixture.whenStable());
    });
  });

  describe('accessibility', () => {
    for (const mode of A11Y_MODES) {
      it(`has no violations in ${mode.name} mode`, async () => {
        const { fixture, element } = await render();

        TestBed.inject(ArnConfigService).update(mode.config);
        await fixture.whenStable();

        await expectNoA11yViolations(element);
      });
    }
  });
});
