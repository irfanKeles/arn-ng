import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { query, queryAs, resetDocument } from '../../testing/dom';
import { expectNoPageOverflow } from '../../testing/page-overflow';
import { A11Y_MODES } from '../../testing/render-example';
import { DocsTocService } from '../../toc/docs-toc.service';
import { OverviewPageComponent } from './overview-page.component';

describe('OverviewPageComponent', () => {
  interface Page {
    fixture: ComponentFixture<OverviewPageComponent>;
    element: HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideArn({ applyToDocument: true })] });
  });

  afterEach(() => {
    resetDocument(document);
  });

  async function render(): Promise<Page> {
    const fixture = TestBed.createComponent(OverviewPageComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

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
