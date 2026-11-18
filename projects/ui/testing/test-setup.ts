import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// The unit-test builder initializes the TestBed environment (errorOnUnknownElements and
// errorOnUnknownProperties on) before this file runs, so it only adds the per-test providers.

// Vitest's tester page ships `<html lang="en">`; Karma's had no lang. The specs own the document's
// attributes, so they start from a bare `<html>` as before.
// eslint-disable-next-line no-restricted-globals -- test environment, not library code
document.documentElement.removeAttribute('lang');

// All tests run zoneless: zone.js is not loaded into the test environment (SKILL §4).
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
});
