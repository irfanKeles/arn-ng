import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// All tests run zoneless: zone.js is not loaded into the test environment (SKILL §4).
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideExperimentalZonelessChangeDetection()],
  });
});
