import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn, type ArnConfig } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { query, resetDocument, text } from '../testing/dom';
import { ApiTableComponent } from './api-table.component';
import type { DocsApiTable } from './docs-api';

const INPUTS: DocsApiTable = {
  kind: 'inputs',
  rows: [
    {
      name: 'size',
      type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
      default: "'md'",
      description: 'The control size.',
    },
    { name: 'label', type: 'string', description: 'The visible text.' },
  ],
};

/** A table far wider than a phone: long names, types and defaults that do not wrap. */
const WIDE: DocsApiTable = {
  kind: 'inputs',
  rows: [
    {
      name: 'aVeryLongInputNameThatDoesNotWrapAnywhere',
      type: 'ArnSomeVeryLongGenericType<WithAnArgument, AndAnother>',
      default: "'a-long-default-value-without-spaces'",
      description: 'A description that wraps normally.',
    },
  ],
};

@Component({
  selector: 'docs-api-table-host',
  imports: [ApiTableComponent],
  template: `
    <div class="docs-page" [style.inline-size]="width()">
      <docs-api-table [table]="table()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ApiTableHostComponent {
  readonly table = signal<DocsApiTable>(INPUTS);
  readonly width = signal('auto');
}

describe('ApiTableComponent', () => {
  interface Setup {
    fixture: ComponentFixture<ApiTableHostComponent>;
    element: HTMLElement;
    host: ApiTableHostComponent;
  }

  async function setup(table: DocsApiTable = INPUTS, width = 'auto'): Promise<Setup> {
    TestBed.configureTestingModule({ providers: [provideArn({ applyToDocument: true })] });

    const fixture = TestBed.createComponent(ApiTableHostComponent);

    fixture.componentInstance.table.set(table);
    fixture.componentInstance.width.set(width);
    await fixture.whenStable();

    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      host: fixture.componentInstance,
    };
  }

  function region(element: HTMLElement): HTMLElement {
    return query(element, '[role="region"]');
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('structure', () => {
    it('has a visible caption that also names the region', async () => {
      const { element } = await setup();
      const caption = query(element, 'table > caption');

      expect(text(caption)).toBe('Inputs');
      expect(region(element).getAttribute('aria-labelledby')).toBe(caption.id);
    });

    it('has column headers with a column scope', async () => {
      const { element } = await setup();
      const headers = Array.from(element.querySelectorAll('thead th'));

      expect(headers.map((header) => text(header))).toEqual([
        'Name',
        'Type',
        'Default',
        'Description',
      ]);
      expect(headers.every((header) => header.getAttribute('scope') === 'col')).toBe(true);
    });

    it('makes each name a row header set as code', async () => {
      const { element } = await setup();
      const names = Array.from(element.querySelectorAll('tbody th'));

      expect(names.map((name) => name.getAttribute('scope'))).toEqual(['row', 'row']);
      expect(names.map((name) => text(query(name, 'code')))).toEqual(['size', 'label']);
    });

    it('sets the type and default as code and the description as text', async () => {
      const { element } = await setup();
      const cells = Array.from(element.querySelectorAll('tbody tr:first-child td'));

      expect(cells.map((cell) => cell.querySelector('code')?.textContent?.trim() ?? null)).toEqual([
        "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
        "'md'",
        null,
      ]);
      expect(text(cells[2] ?? document.createElement('td'))).toBe('The control size.');
    });

    it('shows a dash for a missing default and says "None" to assistive technology', async () => {
      const { element } = await setup();
      const cell = query(element, 'tbody tr:nth-child(2) td:nth-child(3)');

      expect(text(query(cell, '[aria-hidden="true"]'))).toBe('—');
      expect(text(query(cell, '.docs-visually-hidden'))).toBe('None');
      expect(cell.querySelector('code')).toBeNull();
    });

    it('follows a change of the table', async () => {
      const { fixture, element, host } = await setup();

      host.table.set({
        kind: 'outputs',
        rows: [{ name: 'closed', type: 'void', description: 'After closing.' }],
      });
      await fixture.whenStable();

      expect(text(query(element, 'caption'))).toBe('Outputs');
      expect(element.querySelectorAll('thead th').length).toBe(3);
    });

    it('gives each table its own caption id', async () => {
      const { element } = await setup();
      const second = TestBed.createComponent(ApiTableComponent);

      second.componentRef.setInput('table', INPUTS);
      await second.whenStable();

      expect(query(second.nativeElement as HTMLElement, 'caption').id).not.toBe(
        query(element, 'caption').id,
      );
    });
  });

  describe('narrow viewport (320px)', () => {
    it('does not widen the page: only the region overflows', async () => {
      const { element } = await setup(WIDE, '320px');
      const page = query(element, '.docs-page');

      expect(page.scrollWidth).toBeLessThanOrEqual(320);
      expect(region(element).scrollWidth).toBeGreaterThan(region(element).clientWidth);
      expect(getComputedStyle(region(element)).overflowX).toBe('auto');
    });

    it('is the scroll container, and keyboard users can focus it to scroll', async () => {
      const { element } = await setup(WIDE, '320px');
      const scroller = region(element);

      expect(scroller.tabIndex).toBe(0);

      scroller.focus();

      expect(document.activeElement).toBe(scroller);

      scroller.scrollLeft = 40;

      expect(scroller.scrollLeft).toBeGreaterThan(0);
      expect(query(element, '.docs-page').scrollLeft).toBe(0);
    });
  });

  describe('RTL', () => {
    it('keeps code left to right and aligns cells to the start', async () => {
      const { fixture, element } = await setup();

      TestBed.inject(ArnConfigService).update({ direction: 'rtl' });
      await fixture.whenStable();

      const code = query(element, 'tbody code');
      const cell = query(element, 'tbody td');

      expect(getComputedStyle(code).direction).toBe('ltr');
      expect(getComputedStyle(code).unicodeBidi).toBe('isolate');
      expect(getComputedStyle(cell).direction).toBe('rtl');
      expect(getComputedStyle(cell).textAlign).toBe('start');
    });
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

        await expectNoA11yViolations(element);
      });
    }

    it('has no violations when the region scrolls at 320px', async () => {
      const { element } = await setup(WIDE, '320px');

      await expectNoA11yViolations(element);
    });
  });
});
