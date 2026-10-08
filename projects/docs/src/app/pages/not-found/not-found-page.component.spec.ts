import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { routes } from '../../app.routes';
import { query, queryAs, resetDocument, text } from '../../testing/dom';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  async function open(url: string): Promise<HTMLElement> {
    const harness = await RouterTestingHarness.create(url);

    if (!harness.routeNativeElement) {
      throw new Error('No route was activated.');
    }

    return harness.routeNativeElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
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

  it('has no accessibility violations', async () => {
    const fixture = TestBed.createComponent(NotFoundPageComponent);

    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement as HTMLElement);
  });
});
