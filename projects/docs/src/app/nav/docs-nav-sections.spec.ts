import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideArn } from '@arn-ng/ui/core';
import { resetDocument } from '../testing/dom';
import { DocsTocService } from '../toc/docs-toc.service';
import { DOCS_NAV } from './docs-nav';

// The search reads the sections from DOCS_NAV; the pages declare them with docs-section. This spec
// renders every page and fails as soon as the two disagree.

describe('docs nav sections', () => {
  const pages = DOCS_NAV.flatMap((category) => category.pages);

  afterEach(() => {
    resetDocument(document);
  });

  for (const page of pages) {
    it(`lists the sections of /${page.slug} as the page renders them, in order`, async () => {
      TestBed.configureTestingModule({
        providers: [provideRouter([]), provideArn({ applyToDocument: true })],
      });

      const fixture = TestBed.createComponent(await page.loadComponent());

      await fixture.whenStable();

      const rendered = TestBed.inject(DocsTocService)
        .sections()
        .map((section) => ({ id: section.id(), heading: section.heading() }));

      expect(rendered).toEqual([...page.sections]);
    });

    it(`gives /${page.slug} unique section ids`, () => {
      const ids = page.sections.map((section) => section.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});
