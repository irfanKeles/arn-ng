import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import type { DocsNavCategory } from '../../nav/docs-nav';
import { query, text } from '../../testing/dom';
import { SidebarComponent } from './sidebar.component';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class EmptyPageComponent {}

const load = (): Promise<typeof EmptyPageComponent> => Promise.resolve(EmptyPageComponent);

const FIXTURE: readonly DocsNavCategory[] = [
  {
    id: 'start',
    title: 'Start',
    pages: [
      { slug: '', title: 'Home', loadComponent: load },
      { slug: 'install', title: 'Install', loadComponent: load },
    ],
  },
  { id: 'empty', title: 'Empty', pages: [] },
  { id: 'forms', title: 'Forms', pages: [{ slug: 'input', title: 'Input', loadComponent: load }] },
];

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let element: HTMLElement;

  async function navigate(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
  }

  function links(): HTMLAnchorElement[] {
    return Array.from(element.querySelectorAll('a'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', component: EmptyPageComponent },
          { path: 'install', component: EmptyPageComponent },
          { path: 'input', component: EmptyPageComponent },
        ]),
      ],
    });

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.componentRef.setInput('categories', FIXTURE);
    element = fixture.nativeElement as HTMLElement;
    await navigate('/');
  });

  it('renders a labelled navigation landmark', () => {
    expect(query(element, 'nav').getAttribute('aria-label')).toBe('Documentation');
  });

  it('renders the pages under their category headings', () => {
    const headings = Array.from(element.querySelectorAll('h2'));
    const lists = Array.from(element.querySelectorAll('ul'));

    expect(headings.map((heading) => heading.textContent)).toEqual(['Start', 'Forms']);
    expect(links().map((link) => text(link))).toEqual(['Home', 'Install', 'Input']);
    expect(links().map((link) => link.getAttribute('href'))).toEqual(['/', '/install', '/input']);
    expect(lists.map((list) => list.getAttribute('aria-labelledby'))).toEqual(
      headings.map((heading) => heading.id),
    );
  });

  it('does not render the heading of an empty category', () => {
    expect(element.textContent).not.toContain('Empty');
  });

  it('marks only the current page with aria-current', async () => {
    expect(links().map((link) => link.getAttribute('aria-current'))).toEqual(['page', null, null]);

    await navigate('/install');

    expect(links().map((link) => link.getAttribute('aria-current'))).toEqual([null, 'page', null]);
  });

  it('follows a change of the categories', async () => {
    fixture.componentRef.setInput('categories', FIXTURE.slice(2));
    await fixture.whenStable();

    expect(links().map((link) => text(link))).toEqual(['Input']);
  });

  it('moves focus to the first link', () => {
    fixture.componentInstance.focusFirstLink();

    expect(document.activeElement).toBe(links()[0] ?? null);
  });

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(element);
  });
});
