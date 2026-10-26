import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  DOCS_NARROW_QUERY,
  DOCS_NARROW_VIEWPORT,
  DOCS_TOC_QUERY,
  DOCS_TOC_VIEWPORT,
} from './viewport';

describe('DOCS_NARROW_VIEWPORT', () => {
  it('reflects the media query in the browser', () => {
    expect(TestBed.inject(DOCS_NARROW_VIEWPORT)()).toBe(matchMedia(DOCS_NARROW_QUERY).matches);
  });

  it('is wide on the server', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    expect(TestBed.inject(DOCS_NARROW_VIEWPORT)()).toBe(false);
  });
});

describe('DOCS_TOC_VIEWPORT', () => {
  it('reflects the media query in the browser', () => {
    expect(TestBed.inject(DOCS_TOC_VIEWPORT)()).toBe(matchMedia(DOCS_TOC_QUERY).matches);
  });

  it('hides the list on the server', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    expect(TestBed.inject(DOCS_TOC_VIEWPORT)()).toBe(false);
  });

  it('never overlaps with the narrow (drawer) range', () => {
    const narrowBelow = Number(/< (\d+)rem/.exec(DOCS_NARROW_QUERY)?.[1]);
    const tocFrom = Number(/>= (\d+)rem/.exec(DOCS_TOC_QUERY)?.[1]);

    expect(tocFrom).toBeGreaterThan(narrowBelow);
  });
});
