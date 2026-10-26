import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { query, queryAs } from '../../testing/dom';
import { DocsTocService } from '../../toc/docs-toc.service';
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

  it('keeps a space between each bold title and what follows it', () => {
    const titles = Array.from(create().querySelectorAll('li > strong'));

    expect(titles.length).toBeGreaterThan(0);

    for (const title of titles) {
      expect(title.nextSibling?.textContent).toMatch(/^\s/);
    }
  });

  it('lists its three sections under "On this page", in order', () => {
    const element = create();
    const sections = TestBed.inject(DocsTocService)
      .sections()
      .map((section) => [section.id(), section.heading()]);

    expect(sections).toEqual([
      ['status', 'Status'],
      ['what-exists-today', 'What exists today'],
      ['try-the-settings', 'Try the settings'],
    ]);
    expect(Array.from(element.querySelectorAll('h2')).map((heading) => heading.id)).toEqual([
      'status',
      'what-exists-today',
      'try-the-settings',
    ]);
  });

  it('carries the page class', () => {
    expect(create().classList.contains('docs-page')).toBe(true);
  });

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(create());
  });
});
