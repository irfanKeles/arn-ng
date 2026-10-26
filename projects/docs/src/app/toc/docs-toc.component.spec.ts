import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { query, queryAs, resetDocument, text } from '../testing/dom';
import { DocsTocComponent } from './docs-toc.component';
import { DocsTocService } from './docs-toc.service';

@Component({
  selector: 'docs-toc-host',
  imports: [DocsTocComponent],
  template: `
    <docs-toc path="/guide" />
    <h2 id="intro" tabindex="-1">Intro</h2>
    <h2 id="usage" tabindex="-1">Usage</h2>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TocHostComponent {}

@Component({
  selector: 'docs-guide-page',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GuidePageComponent {}

describe('DocsTocComponent', () => {
  interface Setup {
    fixture: ComponentFixture<TocHostComponent>;
    element: HTMLElement;
  }

  async function setup(): Promise<Setup> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'guide', component: GuidePageComponent }]),
        provideArn({ applyToDocument: true }),
      ],
    });

    const toc = TestBed.inject(DocsTocService);

    toc.register({ id: signal('intro'), heading: signal('Intro') });
    toc.register({ id: signal('usage'), heading: signal('Usage') });

    const fixture = TestBed.createComponent(TocHostComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function links(element: HTMLElement): HTMLAnchorElement[] {
    return Array.from(element.querySelectorAll<HTMLAnchorElement>('nav a'));
  }

  afterEach(() => {
    resetDocument(document);
  });

  it('is a navigation landmark named by its visible label, which is not a heading', async () => {
    const { element } = await setup();
    const nav = query(element, 'nav');
    const label = query(element, `#${nav.getAttribute('aria-labelledby') ?? ''}`);

    expect(label.tagName).toBe('P');
    expect(text(label)).toBe('On this page');
    expect(nav.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('lists the registered sections in order, linking to their fragments on the page path', async () => {
    const { element } = await setup();

    expect(links(element).map((link) => text(link))).toEqual(['Intro', 'Usage']);
    expect(links(element).map((link) => link.getAttribute('href'))).toEqual([
      '/guide#intro',
      '/guide#usage',
    ]);
  });

  it('follows the list when a section leaves', async () => {
    const { fixture, element } = await setup();
    const toc = TestBed.inject(DocsTocService);
    const first = toc.sections()[0];

    if (first) {
      toc.unregister(first);
    }
    await fixture.whenStable();

    expect(links(element).map((link) => text(link))).toEqual(['Usage']);
  });

  it('navigates to the fragment and moves focus to the section heading', async () => {
    const { fixture, element } = await setup();
    const link = links(element)[1];

    link?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/guide#usage');
    expect(document.activeElement).toBe(query(element, '#usage'));
  });

  it('leaves focus alone on a modified click', async () => {
    const { element } = await setup();
    const link = queryAs(element, 'nav a', HTMLAnchorElement);
    // A synthetic Ctrl+click on a link still opens a new tab, which takes focus from the test
    // window and breaks later focus specs. Cancel the default action once the handlers have run.
    const cancel = (event: Event): void => {
      event.preventDefault();
    };

    element.addEventListener('click', cancel);
    link.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }),
    );
    element.removeEventListener('click', cancel);

    expect(document.activeElement).not.toBe(query(element, '#intro'));
  });

  it('keeps the links at least as tall as the minimum control size in compact mode', async () => {
    const { fixture, element } = await setup();

    TestBed.inject(ArnConfigService).setDensity('compact');
    await fixture.whenStable();

    for (const link of links(element)) {
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
  });

  describe('accessibility', () => {
    const modes: readonly { name: string; config: ArnConfig }[] = [
      { name: 'light', config: { colorScheme: 'light' } },
      { name: 'dark', config: { colorScheme: 'dark' } },
      { name: 'RTL', config: { direction: 'rtl' } },
      { name: 'compact', config: { density: 'compact' } },
    ];

    for (const mode of modes) {
      it(`has no violations in ${mode.name} mode`, async () => {
        const { fixture, element } = await setup();

        TestBed.inject(ArnConfigService).update(mode.config);
        await fixture.whenStable();

        await expectNoA11yViolations(query(element, 'docs-toc'));
      });
    }
  });
});
