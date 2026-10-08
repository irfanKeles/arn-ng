import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCS_NARROW_QUERY, DOCS_NARROW_VIEWPORT } from './viewport';

describe('DOCS_NARROW_VIEWPORT', () => {
  it('reflects the media query in the browser', () => {
    expect(TestBed.inject(DOCS_NARROW_VIEWPORT)()).toBe(matchMedia(DOCS_NARROW_QUERY).matches);
  });

  it('is wide on the server', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    expect(TestBed.inject(DOCS_NARROW_VIEWPORT)()).toBe(false);
  });
});
