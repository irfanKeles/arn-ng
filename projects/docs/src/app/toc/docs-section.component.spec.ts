import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { query, text } from '../testing/dom';
import { DocsSectionComponent } from './docs-section.component';
import { DocsTocService } from './docs-toc.service';

@Component({
  selector: 'docs-section-host',
  imports: [DocsSectionComponent],
  template: `
    <div class="docs-page">
      <docs-section sectionId="first" heading="First"><p>One</p></docs-section>
      @if (second()) {
        <docs-section sectionId="second" [heading]="secondHeading()"><p>Two</p></docs-section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SectionHostComponent {
  readonly second = signal(true);
  readonly secondHeading = signal('Second');
}

describe('DocsSectionComponent', () => {
  interface Setup {
    fixture: ComponentFixture<SectionHostComponent>;
    element: HTMLElement;
    host: SectionHostComponent;
  }

  async function setup(): Promise<Setup> {
    const fixture = TestBed.createComponent(SectionHostComponent);

    await fixture.whenStable();

    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      host: fixture.componentInstance,
    };
  }

  function listed(): string[] {
    return TestBed.inject(DocsTocService)
      .sections()
      .map((section) => `${section.id()}:${section.heading()}`);
  }

  it('renders a section with a level-two heading and the projected content', async () => {
    const { element } = await setup();
    const heading = query(element, 'docs-section > section > h2');

    expect(heading.id).toBe('first');
    expect(text(heading)).toBe('First');
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(text(query(element, 'docs-section > section > p'))).toBe('One');
  });

  it('is a block, so the page spacing applies', async () => {
    const { element } = await setup();

    expect(getComputedStyle(query(element, 'docs-section')).display).toBe('block');
  });

  it('registers in page order and follows input changes', async () => {
    const { fixture, host } = await setup();

    expect(listed()).toEqual(['first:First', 'second:Second']);

    host.secondHeading.set('Renamed');
    await fixture.whenStable();

    expect(listed()).toEqual(['first:First', 'second:Renamed']);
  });

  it('leaves the list when it is destroyed', async () => {
    const { fixture, host } = await setup();

    host.second.set(false);
    await fixture.whenStable();

    expect(listed()).toEqual(['first:First']);

    fixture.destroy();

    expect(listed()).toEqual([]);
  });

  it('has no accessibility violations', async () => {
    const { element } = await setup();

    await expectNoA11yViolations(element);
  });
});
