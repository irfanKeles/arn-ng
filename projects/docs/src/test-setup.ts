import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// Unit-test builder'ı TestBed ortamını (errorOnUnknownElements ve errorOnUnknownProperties açık)
// bu dosyadan önce kurar; burada yalnız her teste eklenen provider'lar var.

// Vitest'in tester sayfası `<html lang="en">` ile gelir, Karma'nınkinde lang yoktu. Belgenin
// özniteliklerini spec'ler yönetir; önceki gibi çıplak `<html>` ile başlarlar.
// eslint-disable-next-line no-restricted-globals -- test ortamı, kütüphane kodu değil
document.documentElement.removeAttribute('lang');

// Tüm testler zoneless koşar: zone.js test ortamına yüklenmez (SKILL §4).
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
});
