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
- [x] Karar: bileşen docs sayfası şablonu (bölüm sırası, "Components" kategorisi, örnek kartı, iki temada ≥4.5:1 kod renkleri; decisions 2026-11)
- [x] Örnek kartı yenilemesi, mevcut 10 örneğin geçişi ve renkli kod paleti (dal `docs/example-card`; decisions 2026-11 "Örnek kartı uygulaması")

### Bileşenler ve doğrulama
- [x] button (yalnız attribute: `button[arnButton]`, `a[arnButton]`, sınıf `ArnButton`; element ertelendi, bkz. Ertelenenler). Bitti (dal `feat/button`): docs "Components > Button", bileşen token'ları yedekle okunur, `[ripple]` `hostDirectives` ile, `components/button.md`, decisions 2026-11 "ArnButton uygulaması"
- [x] badge (`arn-badge` + `a[arnBadge]`, `ArnBadge`). Bitti (dal `feat/badge`: `@arn-ng/ui/badge`, sayaç / dot / ikon / loading / link / devre dışı link, devre dışı link mantığı core'da `ɵdisabledLink`, `components/badge.md`, decisions 2026-11 "ArnBadge uygulaması" ve "Devre dışı link yardımcısı"). Docs "Components > Badge" ve Button sayfasının gerçek rozete geçişi bitti (decisions 2026-11 "Badge docs sayfası"); Verdaccio onuncu çalıştırma geçti (`local-package-test.md`)
- [ ] input (directive + element). Not: host `box-sizing: border-box` yazar (tokens-sizes.md). Kenarlık `--arn-input` (≥3:1, karar verildi). Docs araması yerel `<input>`'tan `arnInput`'a geçer; geçerken kenarlığı `--arn-muted-foreground`'dan `--arn-input`'a geçer. Form test matrisi: `ngModel`, `formControl`, `formControlName`, `[formField]`; bilinen boşluklar (`ngModel`'de `required`; reactive'de `readonly` / `name` / `min` / `max`; blur'da `touch`) testle kilitlenir (decisions 2026-11 "Signal Forms stratejisi" (5))
- [ ] checkbox
- [ ] select
- [ ] dialog. Not: modal backdrop renk token'ı bununla gelir (bugün CDK'nın `cdk-overlay-dark-backdrop` rengi)
- [ ] tooltip. Not: Esc ile kapanma, üzerine gelince içerik hover'da kalabilmeli (WCAG 1.4.13), `role="tooltip"` ve tetikleyicide `aria-describedby`. Overlay katmanı bunları bilerek yapmaz, bileşenin işidir
- [ ] Tüketici uyumluluk testi: `npm pack` ile paketlenen kütüphaneyi Angular 22 (peer aralığındaki majörler) ve en güncel Angular uygulamasında kurup derle (ilk bileşenle birlikte; `local-package-test.md` akışı temel alınır). Not: ilk bileşenle Verdaccio dokuzuncu çalıştırma yapıldı (Angular 22, `@arn-ng/ui/button`), badge ile onuncu (Angular 22.3.0, `@arn-ng/ui/badge`); en güncel Angular ve peer aralığındaki diğer majörler kısmı açık. Geçen her Angular/CDK majörünü `projects/ui/package.json` peer aralığına ekle (şu an `@angular/core` / `@angular/common` `^22.2.5`, `@angular/cdk` `^22.0.0`; `rules/architecture.md`)
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
- [ ] Dar ekranda "On this page" listesi (sayfa üstünde)
- [x] "On this page" scrollspy (`aria-current="location"`) ve listeden tıklayınca yumuşak kaydırma (yalnız `prefers-reduced-motion: no-preference`; yalnız liste tıklaması, sayfa değişimi ve sidebar bölüm bağlantısı anında kalır). Bitti (dal `docs/page-polish`; decisions 2026-11 "On this page scrollspy ve tıklayınca kaydırma")
- [x] Tek başına duran kod bloklarında yüzey ve kopyala düğmesi; `pre` yalnız taşarken Tab durağı; bölüm başlığında odak halkası yok. Bitti (dal `docs/page-polish`; decisions 2026-11 "Tek başına duran kod bloğu: yüzey ve kopyala düğmesi" ve "Bölüm başlığında odak halkası yok")
- [x] Renkli sözdizimi paleti. Bitti: örnek kartı dalıyla (`docs/example-card`), iki temada ≥4.5:1 spec'te (decisions 2026-11 "Örnek kartı uygulaması" (6))

## Teknik backlog
- [ ] Test hijyeni: `overlay.presets.spec.ts:139-149` düğme temizliği `afterEach`'e taşınmalı
- [ ] CI: Ubuntu 26 imajında `npx playwright install --with-deps chromium` ve `test:ci` denemesi (24.04 imajının kaldırılma duyurusu gelirse öncelik kazanır). Güncelleme: `--with-deps` yavaşlığının kök nedeni bulundu (aşağıdaki madde); `ci/playwright-no-deps` PR'ı `--with-deps`'i kaldırıyor, böylece apt adımı imaj sürümüne bağlı olmaktan çıkıyor. PR CI'ında doğrulanacak; yeşil çıkarsa kapatılır.
- [ ] CI süresi izleme: PR koşusu bir kez 10m23s'ye çıktı, main 1m46s; 5 dakikanın üstü tekrar ederse adım sürelerini ölç. Güncelleme: ölçüldü, kök neden apt mirror hızı. "Playwright Chromium" adımı 12 dakikaya çıkabiliyor; `--with-deps` apt ile 32.1 MB font/mesa paketini (fonts-ipafont-gothic, fonts-freefont-ttf, fonts-wqy-zenhei, fonts-unifont, xfonts-*, mesa güncellemeleri) yavaş bir Ubuntu mirror'ından çekiyor (bir koşuda 9m55s, 54 kB/s). Chromium'un asıl kütüphaneleri (libasound2, libnss3, libx11, libgbm1, libcairo2, libpango…) ubuntu-24.04 imajında zaten kurulu, tarayıcı indirmesi ~7 sn. Çözüm: `ci/playwright-no-deps` PR'ı (`npx playwright install chromium`, `timeout-minutes` 15 → 10). PR CI'ında doğrulanacak: toplam süre, Playwright adımının süresi, 755 test, Chromium başlıyor mu. Yeşil ve hızlı çıkarsa iki madde de kapatılır; Chromium eksik kütüphane hatasıyla düşerse yalnız eksik paket `apt-get install` ile tek tek kurulur.
- [ ] Kök yapılandırma yorumlarının İngilizceye çevirisi (`eslint.config.mjs`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, `projects/docs/src/test-setup.ts`) ve `eslint.config.mjs` mesajlarındaki `SKILL §N` atıflarının yeni kural dosyalarına çevrilmesi (`eslint.config.mjs:25` yorumu "Vitest'e geçişi kolaylaştırmak için" dahil)
- [ ] Bayat yorumlar: `.github/dependabot.yml` ("Angular 19"), `projects/docs/src/app/pages/installation/installation.data.ts:34` ("Angular 19.2"), `projects/ui/README.md` (CLI 19.2.0 jenerik metni; Faz 5 README maddesiyle birlikte)
- [ ] `config-direction`: `ambientDirection`'daki CDK 19 yedek dalını kaldır (peer `^22.0.0`)
- [ ] Kök `dependencies`'teki kullanılmayan `zone.js`'i kaldır
- [ ] Vitest çıktısında 7 "Pre-transform error" (`@arn-ng/ui` `./core` exports) uyarısı: kaynağını bul. Değişiklikten bağımsız, geri alınca da çıkıyor
  - Bulgu (`ci/playwright-no-deps` dalı): uyarılar `./core` ve `./locales/tr` export'larının çözümlenememesi; `node_modules/@arn-ng/ui` `projects/ui`'ya junction. `test:ci` çıkış kodu 0, testler geçiyor. Main'de ayrıca ölçülmedi, yalnız bu dalda gözlendi
- [ ] check-md betiğini repoya al (`tools/check-md.mjs`, bağımlılıksız: bağlantı + 150 satır limiti), npm script + CI adımı
- [x] Yinelenen kontrast helper'larını tek paylaşımlı helper'da birleştir. Bitti (dal `test/shared-contrast-helper`): `projects/ui/testing/contrast.ts`, kromatik ve alfalı oklch, gamut dışı kanal kırpılır; docs `testing/contrast.ts` kaldırıldı (decisions 2026-11 "Paylaşımlı kontrast helper'ı")
- [x] button bileşeninde `-webkit-tap-highlight-color` + `:active` geri bildirimi kararı. Bitti: tap highlight kapalı, `:active` token tabanlı (decisions 2026-11 "ArnButton uygulaması" (5))
- [ ] Ham nötr palet oklch hue'sunu `none` yazma (`oklch(L 0 none)`); etkisi ve kapsamı değerlendirilecek. Neden: Chromium `oklch(… 0 0deg)` nötrlerde `color-mix(in oklch, …)` karışımında hue'yu 0° alır, kromatik renkle karışım 0°'ye kayar (button destructive oranları; decisions 2026-11 "ArnButton uygulaması" (4)). Bakılacak: Stylelint `hue-degree-notation`, `theme.spec.ts` / docs Theming varsayılanları, button kontrast spec'indeki kilitli değerler

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
- Docs: Firefox ve WebKit'te bölüm başlığına taşınan odak (fareyle TOC tıklamasında halka çıkıyor mu; `h2:focus` kuralı orada da kapatıyor mu) ve `::selection` vurgusunun iki temada kod bloğunda ve sayfada görünürlüğü. Yalnız Chromium, Chrome ve Edge'de ölçüldü (decisions 2026-11 "Bölüm başlığında odak halkası yok")

## Ertelenenler
- `<arn-button>` elemanı (0.1.0'da yok; yalnız `button[arnButton]`, `a[arnButton]`). Gerekçe: sarmalayıcı `type` / `form` / `name` / `value` / `aria-*` / `href` / `disabled`'ı iç elemana iletmek zorunda kalır, bu da erişilebilirlik ve form riski taşır (decisions 2026-11). Yeniden değerlendirme koşulu: somut tüketici ihtiyacı, ayrıca iletilen öznitelik listesinin testle kilitlenmesi. Gelirse sınıf adı ayrı karar (directive `ArnButton` adını aldı)
- `ArnBadge` sonda spinner (`loading` yalnız başta spinner gösterir; sonda konum 0.1.0 sonrasına ertelendi). Yeniden değerlendirme koşulu: somut ihtiyaç; konum girdisi ve "başlangıç ikonu" sınırıyla birlikte ele alınır (decisions 2026-11 "ArnBadge uygulaması" (10))

## Açık kararlar
- Angular Aria'ya geçiş değerlendirmesi (kararlı olunca, min. sürüm şartı 22'yi aşmıyorsa). `@angular/aria` repoda kurulu değil; 22'deki durumu doğrulanmadı.
- `chart-*`, `sidebar-*` ve `success` / `warning` / `info` token'ları: şimdilik yok, ihtiyaç duyan ilk bileşenle karar verilecek
- `ArnConfigService` ile verilen bir alanı "varsayılana dön" diye silme yolu (reset) yok; ilk ihtiyaçta karar ver.
