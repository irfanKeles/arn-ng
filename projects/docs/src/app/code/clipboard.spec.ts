import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCS_CLIPBOARD } from './clipboard';

describe('DOCS_CLIPBOARD', () => {
  it("is the browser's clipboard", () => {
    expect(TestBed.inject(DOCS_CLIPBOARD)).toBe(navigator.clipboard);
  });

  it('is null on the server', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

    expect(TestBed.inject(DOCS_CLIPBOARD)).toBeNull();
  });
});
