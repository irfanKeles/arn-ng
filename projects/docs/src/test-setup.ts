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

// Tüm testler zoneless koşar: zone.js test ortamına yüklenmez (SKILL §4).
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideExperimentalZonelessChangeDetection()],
  });
});
