import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { query, queryAs } from '../../testing/dom';
import { OverviewPageComponent } from './overview-page.component';

describe('OverviewPageComponent', () => {
  function create(): HTMLElement {
    const fixture = TestBed.createComponent(OverviewPageComponent);

    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('has a single top-level heading', () => {
    const element = create();

    expect(element.querySelectorAll('h1').length).toBe(1);
    expect(query(element, 'h1').textContent).toBe('arn-ng');
  });

  it('names the package and links to the source', () => {
    const element = create();

    expect(element.textContent).toContain('@arn-ng/ui');
    expect(queryAs(element, 'a', HTMLAnchorElement).href).toBe(
      'https://github.com/irfanKeles/arn-ng',
    );
  });

  it('carries the page class', () => {
    expect(create().classList.contains('docs-page')).toBe(true);
  });

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(create());
  });
});
