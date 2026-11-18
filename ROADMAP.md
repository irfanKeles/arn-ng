# @arn-ng/ui — Yol Haritası

Kurallar için `.claude/skills/arn-ui-library/SKILL.md` (doküman sitesi: `.claude/skills/arn-docs-site/SKILL.md`) dosyasına bak. Bu dosya fazları ve ilerlemeyi takip eder. Bir faz bitmeden sonrakine geçme. Yeni karar çıkarsa `.claude/skills/arn-ui-library/decisions/` altında ilgili ayın dosyasına yeni madde olarak yaz (SKILL.md'de karar günlüğü yok). Biten fazların ayrıntısı `decisions/` ve git geçmişindedir.

## Faz 0 — Hazırlık (bitti)
- [x] npm kapsamı `@arn-ng` (`@arn` doluydu), GitHub repo + MIT `LICENSE`, kural ve yol haritası dosyaları repoda, npm 2FA ve yayın politikası duyurusu okundu

## Faz 1 — Altyapı (bitti)
- [x] Angular workspace (npm), `projects/ui` + `projects/docs`, secondary entry point yapısı, lint / format / strict TypeScript, birim test + axe yardımcısı, CI ve Dependabot, Changesets, Verdaccio ile yerel paket testi ve yayın metadata'sı

## Faz 2 — Çekirdek (`@arn-ng/ui/core`) (bitti)
- [x] Token ve tema (`theme.css`, `light-dark()`), boyut ve density, `provideArn` / `[arnConfig]` / `ArnConfigService` / `injectArnConfig`, i18n mesaj sistemi + `locales/tr` + RTL, overlay altyapısı (`ArnOverlayService`, `--arn-z-*`), `arnRipple`, token kataloğu referans dosyaları

## Faz 3 — Doküman sitesi iskeleti (bitti)
- [x] Kabuk ve kategorili sidebar, "On this page", sidebar araması, değiştiriciler, örnek bloğu, API ve Styling tabloları, Ripple sayfası, giriş sayfaları (Installation, Configuration, Theming, Accessibility), CI `ubuntu-24.04`, axe yardımcısında `expect`. Zoneless değerlendirmesi (3e) kapatıldı: provider kararlı, docs zoneless çalışıyor. Kalan cila: "Docs backlog"

## Faz 3.5 — Platform yükseltmesi (bitti)
- [x] Angular 19 → 22 (birer majör), TypeScript 6, Node `^22.22.3`, peer `^22.0.0` (PR #1)
- [x] Builder'lar `@angular/build`, Karma + Jasmine → Vitest browser mode (Playwright Chromium) (PR #2)

## Faz 4 — İlk bileşenler (her biri "Bitti" tanımıyla)

### Ön kararlar
Her karar, yanında yazan bileşenlere başlamadan ÖNCE verilir. button bu kararların hiçbirine bağlı DEĞİL; kararlar beklerken button yapılabilir.

- [x] Karar: `--arn-input` kontrastı (eski ölçüm açık temada 1.26:1; WCAG 1.4.11 3:1 ister). Verildi: input, checkbox ve select kenarlığı için `--arn-input` artık iki temada ≥3:1 (açık `oklch(65% 0 0deg)`, koyu beyaz %40; decisions 2026-11)
- [x] Karar: Signal forms stratejisi. Verildi: kontroller yalnız `FormValueControl` / `FormCheckboxControl` uygular, CVA yok; peer `^22.2.5` (decisions 2026-11)
- [x] `ArnConfig` `forms.showErrorsOn: 'submitted'` kaldırma (ayrı kod PR'ı, input'tan önce; Signal Forms'ta karşılığı yok, decisions 2026-11 "Signal Forms stratejisi" (3))
- [ ] Karar: top layer yeniden değerlendirme (dialog, tooltip ile). Önce gelir: dialog, tooltip

### Bileşenler ve doğrulama
- [ ] button (directive + element). Not: host `box-sizing: border-box` yazar (tokens-sizes.md); bileşen token katmanı ve `[ripple]` girdisi (`hostDirectives`) bununla gelir
- [ ] input (directive + element). Not: host `box-sizing: border-box` yazar (tokens-sizes.md). Kenarlık `--arn-input` (≥3:1, karar verildi). Docs araması yerel `<input>`'tan `arnInput`'a geçer; geçerken kenarlığı `--arn-muted-foreground`'dan `--arn-input`'a geçer. Form test matrisi: `ngModel`, `formControl`, `formControlName`, `[formField]`; bilinen boşluklar (`ngModel`'de `required`; reactive'de `readonly` / `name` / `min` / `max`; blur'da `touch`) testle kilitlenir (decisions 2026-11 "Signal Forms stratejisi" (5))
- [ ] checkbox
- [ ] select
- [ ] dialog. Not: modal backdrop renk token'ı bununla gelir (bugün CDK'nın `cdk-overlay-dark-backdrop` rengi)
- [ ] tooltip. Not: Esc ile kapanma, üzerine gelince içerik hover'da kalabilmeli (WCAG 1.4.13), `role="tooltip"` ve tetikleyicide `aria-describedby`. Overlay katmanı bunları bilerek yapmaz, bileşenin işidir
- [ ] Tüketici uyumluluk testi: `npm pack` ile paketlenen kütüphaneyi Angular 22 (peer aralığındaki majörler) ve en güncel Angular uygulamasında kurup derle (ilk bileşenle birlikte; `local-package-test.md` akışı temel alınır). Geçen her Angular/CDK majörünü `projects/ui/package.json` peer aralığına ekle (şu an `@angular/core` / `@angular/common` `^22.2.5`, `@angular/cdk` `^22.0.0`; `rules/architecture.md`)
- [ ] Playwright ile çoklu tarayıcı testi (Chromium, Firefox, WebKit). Not: altyapı hazır, Vitest `browsers`'a `firefox` / `webkit` eklemek (`angular.json`)

## Faz 5 — İlk yayın
- [ ] README, kurulum rehberi (`projects/ui/README.md` hâlâ CLI'ın jenerik metni ve pakete giriyor)
- [ ] `0.1.0` npm'e yayın
  - Yayın "trusted publishing (OIDC)" ile yapılacak, saklı npm token kullanılmayacak. Gerekçe: npm 31 Temmuz 2026'dan itibaren hassas işlemlerde etkileşimli 2FA istiyor, Ocak 2027'de 2FA-bypass token'lar doğrudan yayın yetkisini kaybedecek.
- [ ] Docs Installation sayfasının başındaki "Not on npm yet … 0.1.0" durum notunu 0.1.0 yayınıyla kaldır ya da güncelle (`projects/docs/src/app/pages/installation/`)
- [ ] Docs Overview sayfasındaki yayın durumu ifadesini güncelle ("has not been published to npm yet" 0.1.0 yayınıyla yanlış olur; `projects/docs/src/app/pages/overview/`)
- [ ] PR'larda changeset kontrolünü CI'a ekle (0.1.0'dan sonra)
- [ ] Gerçek bir projede npm'den kurup kullanma
- [ ] Geri bildirim ve düzeltmeler

## Faz 6 — Genişleme
- [ ] mask input, date picker, table, toast (overlay'e toast preset'i bununla gelir) ve diğerleri (önceliği ihtiyaçla belirle)

## Docs backlog
- [ ] Çekmece açılış/kapanış animasyonu (RTL'de fiziksel translate sorunu ve prefers-reduced-motion düşünülmeli)
- [ ] Tema anahtarı / ayarlar açılır menüsü
- [ ] "On this page" için scrollspy (aktif bölüm vurgusu) ve dar ekranda sayfa üstü liste
- [ ] Sayfa içi gezintide `scroll-behavior: smooth` düşünülebilir; yalnız `prefers-reduced-motion: no-preference` altında ve yalnız fragment gezintisine uygulanmalı (sayfa değişiminde animasyon istenmiyor)
- [ ] Renkli sözdizimi paleti (gerekçeli karar günlüğü sapmasıyla ve axe kontrastıyla)

## Teknik backlog
- [ ] Test hijyeni: `overlay.presets.spec.ts:139-149` düğme temizliği `afterEach`'e taşınmalı
- [ ] CI: Ubuntu 26 imajında `npx playwright install --with-deps chromium` ve `test:ci` denemesi (24.04 imajının kaldırılma duyurusu gelirse öncelik kazanır)
- [ ] CI süresi izleme: PR koşusu bir kez 10m23s'ye çıktı, main 1m46s; 5 dakikanın üstü tekrar ederse adım sürelerini ölç
- [ ] Kök yapılandırma yorumlarının İngilizceye çevirisi (`eslint.config.mjs`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `projects/docs/src/test-setup.ts`) ve `eslint.config.mjs` mesajlarındaki `SKILL §N` atıflarının yeni kural dosyalarına çevrilmesi (`eslint.config.mjs:25` yorumu "Vitest'e geçişi kolaylaştırmak için" dahil)
- [ ] Bayat yorumlar: `.github/dependabot.yml` ("Angular 19"), `projects/docs/src/app/pages/installation/installation.data.ts:34` ("Angular 19.2"), `projects/ui/README.md` (CLI 19.2.0 jenerik metni; Faz 5 README maddesiyle birlikte)
- [ ] `config-direction`: `ambientDirection`'daki CDK 19 yedek dalını kaldır (peer `^22.0.0`)
- [ ] Kök `dependencies`'teki kullanılmayan `zone.js`'i kaldır
- [ ] Vitest çıktısında 7 "Pre-transform error" (`@arn-ng/ui` `./core` exports) uyarısı: kaynağını bul. Değişiklikten bağımsız, geri alınca da çıkıyor
- [ ] check-md betiğini repoya al (`tools/check-md.mjs`, bağımlılıksız: bağlantı + 150 satır limiti), npm script + CI adımı
- [ ] Yinelenen kontrast helper'larını tek paylaşımlı helper'da birleştir (docs `contrast.ts` alfa desteksiz, ui `testing/theme.spec.ts` helper'ı alfa destekli)
- [ ] button bileşeninde `-webkit-tap-highlight-color` + `:active` geri bildirimi kararı (ripple direktifi bunu kendisi yapmaz)

## Doğrulama bekleyenler
- `@ts-expect-error`'un Vitest `test-build` derlemesinde kullanılmayan direktifte derlemeyi düşürmesi (`config.types.spec.ts`)
- `dev-mode.ts`'teki yerel `ngDevMode` bildiriminin kaldırılabilirliği (Angular 22 global bildiriyor)
- CDK 22 `Dir`'e `[dir]` ile bağlanan ilk değerin bölümde doğru okunması (spec ile)
- Docs dokunma geri bildirimi (-webkit-tap-highlight-color kapalı + :active) gerçek Android ve iOS cihazda doğrulandı (sorun yok). Firefox ve Opera mobilde denenmedi.
- Material 21+ overlay'leriyle etkileşim (top layer'da üstte kalmaları)
- Vitest sayfasında `pageOverflow` tabanının gerekliliği ve gerçek tuşla kaydırmanın birim testte üretilemezliği
- Angular 19 ile ölçülmüş docs bundle boyutlarının yeniden ölçümü
- `@angular/aria`'nın Angular 22'deki durumu
- `toSignal`'in `.d.ts` etiketi (yalnız `ToSignalOptions` `@publicApi 20.0` okundu)

## Açık kararlar
- Angular Aria'ya geçiş değerlendirmesi (kararlı olunca, min. sürüm şartı 22'yi aşmıyorsa). `@angular/aria` repoda kurulu değil; 22'deki durumu doğrulanmadı.
- `chart-*`, `sidebar-*` ve `success` / `warning` / `info` token'ları: şimdilik yok, ihtiyaç duyan ilk bileşenle karar verilecek
- `ArnConfigService` ile verilen bir alanı "varsayılana dön" diye silme yolu (reset) yok; ilk ihtiyaçta karar ver.
