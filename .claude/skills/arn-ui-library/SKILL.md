---
name: arn-ui-library
description: "@arn-ng/ui Angular bileşen kütüphanesi için kurallar. Bu kütüphanede bir bileşen yazarken, değiştirirken, incelerken veya dokümantasyon sayfasını hazırlarken MUTLAKA kullan. Mimari kararları, kodlama kurallarını, yasakları, token/tema yapısını ve doküman sayfası standardını içerir."
---

# @arn-ng/ui — Kütüphane Kuralları

Bu dosya kütüphanenin anayasasıdır. Bir kural ile kullanıcının isteği çelişirse DUR, çelişkiyi söyle, karar günlüğüne (en alttaki bölüm) yazılmadan kuralı çiğneme.

## 1. Değişmez kararlar

- Paket: `@arn-ng/ui`. Selector prefix: `arn`. Ücretsiz ve **açık kaynak** (npm'de public yayınlanır, lisans: MIT). Gerçek projelerde npm'den kurulup kullanılacak, bu yüzden public API kararlılığı ve semver baştan ciddiye alınır.
- Minimum Angular: **19**. Sadece Angular 19'da KARARLI olan API'leri kullan. Daha yeni sürümde gelen veya 19'da deneysel olan API'ye bağımlı olma (örn. signal forms, `linkedSignal`, `resource` yok).
- Headless katman: **Angular CDK**. Başka bir headless kütüphane (Spartan brain, ng-primitives vb.) EKLENMEZ. Eksik bileşenler CDK primitifleri (overlay, a11y, listbox, menu, dialog, bidi, scrolling) üzerine yazılır.
- Görsel ve bileşen dili referansı: **shadcn/ui** (Spartan UI gibi: headless taban CDK, üstüne stil). Yalnızca renk değil; bileşen kataloğu, varyant adları (button: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`), boyut adları ve ölçüler (radius, boşluk, focus ring) shadcn'i izler. Kod kopyalanmaz, referans alınır; kendi token'larımızla Angular'a çevrilir. Her sapma bileşenin referans dosyasına (bölüm 18) gerekçesiyle yazılır. Bizim eklerimiz: `xl` boyutu (xs-lg shadcn'de var), density, ileride mask vb.
- Hedef: PrimeNG kadar profesyonel, kararlı, tutarlı; kullanıcıya ve geliştiriciye sorun çıkarmayan bir kütüphane. Hız değil sağlamlık önceliklidir.
- Hedef tarayıcı: Angular'ın desteklediği güncel (evergreen) tarayıcılar, yaklaşık son 1 yıllık sürümler. `oklch` fallback'siz kullanılabilir.

## 2. Bileşen mimarisi

**Tek çekirdek, iki yüz.** Basit bileşenlerde davranış ve stil tek bir directive'de durur, element sarmalayıcı aynı directive'i kullanır. Davranış asla iki yerde ayrı yazılmaz.

| Bileşen türü | Kullanım şekli |
|---|---|
| Basit, native elemanı olanlar (button, input) | Hem attribute (`<button arnButton>`) hem element (`<arn-button label="..." icon="...">`) |
| Karmaşık (select, mask input, dialog, date picker, tooltip vb.) | SADECE element (`<arn-select>`) |

- Attribute kullanımda gerçek native eleman kalır (`type`, `form`, `aria-*` vb. native davranış bedavaya çalışır).
- Element sarmalayıcı içinde gerçek bir native eleman render eder (örn. `<arn-button>` içinde `<button>`). Dış `<arn-button>` etiketi tıklanabilir/odaklanabilir sahte bir kutu OLMAZ.
- Sınıf adları: directive `ArnButtonDirective`, element `ArnButton`, aynı kalıp her bileşende.

## 3. Paket ve import yapısı

- Her bileşen kendi secondary entry point'inde: `@arn-ng/ui/button`, `@arn-ng/ui/input`, `@arn-ng/ui/select`.
- Kök entry point (`@arn-ng/ui`) bileşen export etmez. Her şey secondary entry point'lerden import edilir.
- Klasör yapısı: her entry point `projects/ui/<ad>/` altında, kendi `ng-package.json` ve `src/public-api.ts` dosyasıyla.
- `angular.json`'da ui projesinin `sourceRoot`'u `projects/ui` (Karma spec'leri bulsun diye). Bileşen dosyaları `projects/ui/<entry-point>/src/` altında durur; `ng generate` kullanılırsa `--path` verilmeli.
- Her entry point sadece bileşeni ve ona ait tipleri/token'ları export eder. Kullanıcı sadece kullandığını import eder (`import { ArnButton } from '@arn-ng/ui/button'`).
- Tüm bileşenler standalone. NgModule YOK.
- `package.json`: `sideEffects: false`, `peerDependencies` içinde `@angular/core`, `@angular/cdk` aralığı açıkça yazılı (>=19).
- Yayın metadata'sı `projects/ui/package.json`'da durur (`description`, `keywords`, `license`, `author`, `homepage`, `repository`, `bugs`, `publishConfig.access: public`). `projects/ui/LICENSE` kök `LICENSE`'ın kopyasıdır (ng-packagr proje dışından dosya almaz); biri değişirse diğeri de güncellenir.
- Tema tek dosya: kaynak `projects/ui/theme.css`, ng-packagr `assets` ile `dist/ui/theme.css`'e kopyalanır, `projects/ui/package.json` `exports`'unda `./theme.css` olarak açılır (ng-packagr elle yazılan `exports`'u üretilenlerle birleştirir). Tüketici bir kez ekler: `@import '@arn-ng/ui/theme.css'`.
- Public API küçük tutulur. Dışarı açılan her şey söz verilmiş sayılır. İç detaylar export edilmez. Export etmeden önce gerekçe sor.
- Entry point'ler arası döngüsel bağımlılık YASAK. Ortak kod `@arn-ng/ui/core` altında.

## 4. Angular kodlama kuralları

- `input()`, `output()`, `model()`, `computed()`, `signal()` kullan. `@Input()/@Output()` decorator'ı YOK.
- `ChangeDetectionStrategy.OnPush` her bileşende zorunlu. Zoneless ile çalışmalı (zone.js'e bağımlı kod yazma).
- `inject()` kullan, constructor injection yok.
- Host binding/listener: `host: { ... }` metadata'sı. `@HostBinding/@HostListener` YOK.
- Şablonda yeni control flow: `@if`, `@for`, `@switch`. `*ngIf/*ngFor` YOK.
- `ViewEncapsulation`: bileşen stilleri CSS değişkenlerine dayanır. `::ng-deep` YASAK. Kullanıcının stil geçersiz kılması token'larla yapılabilmeli.
- `any` YASAK. Strict TypeScript. Public API'deki her tip export edilir.
- Doğrudan `window`, `document`, `localStorage` kullanma. `DOCUMENT`, `inject(PLATFORM_ID)`, `afterNextRender` kullan (SSR güvenliği).
- `innerHTML` ile kullanıcı verisi basma. Gerekirse sanitization açıkça yapılır.
- Her `subscribe` temizlenir (`takeUntilDestroyed`) veya hiç kullanılmaz (signal tercih edilir).
- Kaynak kodda JSDoc, yorum, test adı ve konsol mesajları İngilizce; `.claude/` ve `ROADMAP.md` Türkçe.

## 5. Token, tema, stil

- Üç katman: **ham** (`--arn-neutral-500`), **anlamlı** (`--arn-primary`, `--arn-border`, `--arn-radius`), **bileşen** (`--arn-button-bg`, `--arn-button-radius`). Bileşen token'ı anlamlı token'a bağlanır, kullanıcı ister global ister tek bileşen için değiştirir. Ham ve anlamlı katman `theme.css`'te, bileşen katmanı bileşenin kendi stilinde durur. Bileşen yalnızca token'a bakar, kendi renk değerini taşımaz. Tam liste: [components/tokens.md](components/tokens.md).
- İsimlendirme: `--arn-<bileşen>-<özellik>[-<durum>]`. Tutarlı, istisnasız. Anlamlı token adları shadcn adlarıdır (`--arn-background`, `--arn-muted-foreground`...).
- Renk formatı `oklch`, Stylelint'in istediği yazımla (`oklch(98.5% 0 0deg)`). Temel renk shadcn **neutral**.
- Dark mode: anlamlı renkler `light-dark(açık, koyu)` ile tek yerde tanımlanır. `:root` `color-scheme: light dark` taşır (sistem ayarına uyar); `.dark` / `.light` sınıfı zorlar, sistem tercihini ezer ve iç içe kullanılabilir. `theme.css` hiçbir elemanı boyamaz.
- **Mantıksal CSS özellikleri zorunlu** (RTL için): `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`. `margin-left/right`, `padding-left/right`, `left/right`, `text-align: left/right` YASAK (istisna gerekçesi yazılı olmalı).
- **Bileşen token'ı bileşenin kendi host'unda hesaplanır**, `:root`'ta değil (örn. host'ta `--arn-button-radius: calc(var(--arn-radius) * 0.8)`). Gerekçe: `var()` tanımlandığı elemanda çözülür; `:root`'ta türetilen adımlar (`--arn-radius-sm` vb.) container'da taban değişince güncellenmez. O adımlar yalnızca global değişir, tüketicinin kendi CSS'i için yardımcıdır, bileşende KULLANILMAZ.
- Boyutlar: `xs`, `sm`, `md`, `lg`, `xl` (5 boyut). Varsayılan `md`. Boyut yüksekliği, yatay padding'i, yazı boyutunu, ikon boyutunu ve gap'i birlikte belirler: `--arn-control-<özellik>-<boyut>` (sabit değerler, `theme.css`). Katalog ve örüntü: [components/tokens-sizes.md](components/tokens-sizes.md).
- Yoğunluk: `comfortable` (varsayılan) ve `compact`. Container'a (veya `<html>`'e) `data-density="compact"` verilince `--arn-density` çarpanı 0.875 olur; iç içe kullanılabilir. Çarpan yalnızca yükseklik ve yatay padding'e uygulanır, yazı boyutuna UYGULANMAZ. Bileşenlere tek tek dokunmak gerekmez.
- Kontrol yüksekliği host'ta `max(var(--arn-control-min-size), calc(var(--arn-control-height-<boyut>) * var(--arn-density)))` olarak yazılır ve `--arn-<bileşen>-height` bu değeri taşır. `--arn-control-min-size` 1.5rem'dir: density sonrası yükseklik 24 CSS px'in altına düşmez (WCAG 2.2 SC 2.5.8).
- Font, border, radius, boşluk gibi değerler merkezi token'lardan beslenir. Bileşende sabit px/renk değeri YASAK (token yoksa önce token tanımla).
- Animasyonlar `prefers-reduced-motion` ile kapatılabilir olmalı.
- **Ripple:** `arnRipple` directive'i (`@arn-ng/ui/ripple`) olarak sunulur. Başka bir kütüphaneye (Angular Material) bağımlı olmadan kendimiz yazarız. Varsayılan kapalı, `provideArn({ ripple: true })` ile global, bileşende `[ripple]` input'u ile tek tek açılır/kapanır. `prefers-reduced-motion` altında otomatik devre dışı. SSR'da güvenli, animasyon bitince DOM'dan temizlenir, rengi token'dan gelir (`--arn-ripple-color`).

## 6. Merkezi ayar

- Davranışsal ayar tek arayüzdür: `ArnConfig` (`@arn-ng/ui/core`). Alanlar: `size`, `density`, `colorScheme`, `direction`, `ripple`, `locale`, `messages`, `forms`. Hepsi opsiyonel, literal union tipli, index signature YOK. Yeni alan ancak karar günlüğüyle eklenir.
- Görsel ayar (renk, font, kenarlık, radius): CSS değişkenleri. `ArnConfig`'e taşınmaz.
- **Öncelik sırası (yukarıdan aşağıya güçlüden zayıfa):**
  1. Bileşenin kendi input'u (`size="sm"`)
  2. En yakın `[arnConfig]` bölümü (`<div arnConfig size="sm" density="compact">`, hiyerarşik DI, iç içe olabilir)
  3. Global `provideArn()` (çalışma zamanında `ArnConfigService`)
  4. Kütüphane varsayılanı
- Üç seviye de signal'dir ve çalışma zamanında değişebilir. `undefined` "bir alttakini kullan" demektir.
- Bileşen ayarı YALNIZCA `injectArnConfig` ile okur (`injectArnConfig('size', this.size)`); servisi veya token'ı doğrudan inject etmez, önceliği kendi yazmaz. Bu yüzden devralınan input'un varsayılanı `undefined`'dır (`input<ArnSize>()`).
- DOM'a yazma otomatik değildir: `<html>` yalnızca `applyToDocument()` veya `provideArn({ applyToDocument: true })` ile güncellenir. `[arnConfig]` yalnızca kendi elemanına ve yalnızca verilen `density` / `colorScheme` için yazar.
- Bu sıra her bileşen dokümanında "Yapılandırma" bölümünde kısaca belirtilir. Ayrıntı: [components/config.md](components/config.md).

## 7. Form uyumu

- Form elemanları `ControlValueAccessor` ile çalışır: `ngModel`, `formControl`, `formControlName` üçü de test edilir.
- Zorunlu durumlar: `disabled` (formdan ve input'tan), `invalid`, `touched`, `dirty`, `readonly`, `required`.
- Hata görünümü `ng-invalid` + `forms.showErrorsOn` (`touched` varsayılan, `dirty`, `submitted`; `ArnConfig`'ten) ile ve `invalid` input'u ile tetiklenebilir.
- `setDisabledState` doğru uygulanır.
- Signal forms'a bağımlılık YOK (19'da kararlı değil). Gelecekte eklenecekse ayrı karar.

## 8. Erişilebilirlik (a11y) — her bileşende zorunlu

- Tam klavye kullanımı: Tab/Shift+Tab, ok tuşları, Enter, Space, Escape, Home/End (bileşen türüne göre WAI-ARIA Authoring Practices kalıbına uy).
- Doğru `role` ve `aria-*` nitelikleri (`aria-expanded`, `aria-invalid`, `aria-describedby`, `aria-disabled`...).
- Focus yönetimi: overlay açılınca focus içeri, kapanınca tetikleyiciye döner. Focus trap (dialog). Görünür focus halkası.
- Sadece renkle bilgi verme. Kontrast yeterli.
- Ekran okuyucu için gizli metin/label mekanizması.
- A11y bir "sonra yaparız" değildir. A11y eksikse bileşen BİTMİŞ sayılmaz.
- CDK'nın a11y araçları (`FocusTrap`, `FocusMonitor`, `ListKeyManager`, `LiveAnnouncer`) tercih edilir, elle yazılmaz.

## 9. i18n ve RTL

- Bileşen içindeki tüm sabit metinler (örn. "Seç", "Temizle", "Sonuç yok", aria-label'lar) dışarıdan verilebilir bir locale/mesaj sistemiyle gelir. Metin koda gömülmez.
- Metinler `ArnConfig.messages`'tadır (`ArnMessages`, varsayılan İngilizce). Her bileşen kendi alt başlığını core'a İngilizce varsayılanıyla ekler; tüketici ve çeviri paketi yalnızca `ArnDeepPartial<ArnMessages>` verir, bu yüzden anahtar eklemek kırıcı değildir, silmek/yeniden adlandırmak kırıcıdır. Gün/ay adları `Intl` ile `locale`'den üretilir, override edilebilir. Şema: [components/config-messages.md](components/config-messages.md).
- Her bileşen RTL'de test edilir (`dir="rtl"`). Yön için `cdk/bidi` kullan.
- İkon ve ok yönleri RTL'de aynalanır.
- Tarih/sayı formatı locale'e göre.

## 10. Overlay

- Dropdown, popover, tooltip, dialog, menu hep tek ortak overlay altyapısından geçer (`@arn-ng/ui/core`, CDK Overlay üstünde). Her bileşen kendi z-index/portal çözümünü yazmaz.
- z-index değerleri token'lardan gelir (`--arn-z-dropdown`, `--arn-z-dialog`...).

## 11. İsimlendirme tutarlılığı

Ortak input isimleri tüm bileşenlerde aynıdır: `size`, `variant`, `disabled`, `invalid`, `readonly`, `required`, `label`, `icon`; ayar adları `ArnConfig` alanlarıdır (`density`, `colorScheme`, `direction`, `ripple`, `locale`). Aynı kavram için farklı isim icat etme. Yeni ortak kavram gerekiyorsa önce karar günlüğüne yaz.

## 12. Bileşen "Bitti" tanımı (Definition of Done)

Bir bileşen ancak hepsi tamamsa bitmiştir:

- [ ] Selector ve import kuralları (bölüm 2-3) uygulandı
- [ ] Token'lar tanımlı, hardcode değer yok, mantıksal CSS kullanıldı
- [ ] 5 boyut + iki yoğunluk çalışıyor
- [ ] Light + dark çalışıyor
- [ ] `ngModel` ve reactive forms ile çalışıyor (form elemanıysa), tüm durumlar test edildi
- [ ] Klavye + ekran okuyucu + focus yönetimi tamam, axe testi temiz
- [ ] RTL kontrol edildi, i18n metinleri dışarıdan
- [ ] SSR'da kırılmıyor
- [ ] Birim testleri yazıldı
- [ ] Doküman sayfası yazıldı (bölüm 13) ve örnekler çalışıyor
- [ ] `components/<ad>.md` yazıldı/güncellendi ve `INDEX.md`'ye eklendi (bölüm 18)
- [ ] Public API gözden geçirildi, gereksiz export yok

## 13. Doküman sayfası standardı (PrimeNG tarzı)

Doküman sitesi aynı workspace'te ayrı bir Angular uygulamasıdır ve kütüphaneyi gerçek bir kullanıcı gibi tüketir (böylece her örnek aynı zamanda gerçek kullanım testidir). Yeni bileşen, doküman sayfası olmadan merge edilmez.

**Site yapısı**
- Solda sidebar: bileşenler kategori başlıkları altında gruplanır (Form, Button, Overlay, Data...). Altında arama.
- Sağda sayfa içi başlık gezintisi ("bu sayfada").
- Üstte tema (light/dark), yön (LTR/RTL), yoğunluk (comfortable/compact) ve dil değiştiriciler. Bunlar tüm örnekleri anlık etkiler.
- Giriş bölümü: Kurulum, Yapılandırma (`provideArn`), Tema ve token'lar, Yoğunluk, RTL ve i18n, Erişilebilirlik.

**Her bileşen sayfasının bölümleri (bu sırayla)**
1. Kısa açıklama
2. **Import** (kopyalanabilir kod)
3. **Basic** (en basit kullanım)
4. **ngModel ile kullanım** (form elemanıysa)
5. **Reactive Forms ile kullanım** (form elemanıysa)
6. **Disabled**
7. **Invalid / Validation**
8. **Sizes** (xs-xl)
9. **Label, Icon varken / yokken** ve bileşene özgü tüm varyantlar
10. **Density** (gerekliyse)
11. Bileşene özgü örnekler (olay yönetimi, template ile özelleştirme...)
12. **Accessibility** (klavye tuşları tablosu, aria nitelikleri)
13. **API tabloları:** Inputs, Outputs, Templates/Slots, Methods
14. **Styling:** bu bileşenin tüm CSS token'ları (isim, varsayılan, açıklama)

**Her örneğin biçimi**
- Canlı çalışan demo, altında "Kodu göster" ile HTML + TS sekmeleri, kopyala düğmesi.
- Örnek kodu kopyalanıp yapıştırıldığında çalışmalı (import'lar dahil tam kod).
- API tabloları kod/yorumdan türetilir veya elle yazılıyorsa bileşen değişince aynı PR'da güncellenir. Eski doküman YASAK.
- Yalnızca gerçek, anlamlı örnekler. Dolgu örneği yok.

## 14. Yapılmaması gerekenler (özet)

- `::ng-deep`, `!important` ile stil zorlamak
- `@Input/@Output/@HostBinding` decorator'ları, `*ngIf/*ngFor`, NgModule
- `margin-left/right` gibi yön-bağımlı CSS
- Sabit renk/px/metin (token ve i18n dışında)
- CDK dışında ikinci bir headless kütüphane
- Doküman sayfası, test veya a11y olmadan bileşeni "bitti" saymak
- Native davranışı bozan sarmalayıcı (tıklanamayan buton, form'a bağlanmayan input)
- Aynı kavrama farklı isim vermek (`disabled` vs `isDisabled`)
- Angular 19'da kararlı olmayan API'ye bağımlı olmak
- Gereksiz public export, belirsiz kırıcı değişiklik (breaking change) yapmak. Kırıcı değişiklik gerekiyorsa önce söyle, versiyon ve migration notunu hazırla.

## 15. Sürümleme ve kalite

- Semver. Her değişiklik changelog'a yazılır. Kırıcı değişiklik major'a gider (1.0.0'dan sonra).
- Sürüm ve changelog: Changesets. Sürümün tek kaynağı `projects/ui/package.json`; kök `package.json` sürümü ilgisizdir. Akış: `npm run changeset` (değişikliği tarif et) → sürüm çıkarırken `npm run version-packages` (sürümü artırır, `projects/ui/CHANGELOG.md`'yi yazar) → `npm run build:ui` (sürüm ve changelog `dist/ui`'ye geçer). Durum: `npx changeset status`.
- 0.x kuralı: kırıcı değişiklik ve yeni özellik `minor`, düzeltme `patch`. `major` changeset YAZILMAZ (0.x'i doğrudan 1.0.0 yapar); 1.0.0 ayrı karardır. 0.1.0'a kadar changeset yazılmaz, ilk sürüm tek changeset'le çıkar.
- Dependabot PR'ları changeset istemez. İstisna: PR `projects/ui/package.json`'daki `dependencies`/`peerDependencies`'e dokunuyorsa changeset elle eklenir.
- Yayın `dist/ui`'den yapılır. `changeset publish` KULLANILMAZ (kaynak klasörü yayınlar).
- Yerel paket testi: Verdaccio ile, adımlar ve güvenlik kuralları [local-package-test.md](local-package-test.md)'de. `exports`, entry point veya `projects/ui/package.json` değişince ve her yayından önce çalıştırılır. Gerçek registry'ye asla deneme yayını yapılmaz.
- Node: 22 LTS (`.nvmrc`, `engines`). `engine-strict` kapalı.
- Lint: `npm run lint` = ESLint (flat config, `eslint.config.mjs`: angular-eslint + typescript-eslint `strictTypeChecked`, şablon a11y kuralları) + Stylelint (`.stylelintrc.json`: `::ng-deep`, `!important` ve yön-bağımlı CSS yasak, ui'da token adı `--arn-*`). Bölüm 4-5 kurallarının çoğu burada hata olarak zorlanır. Kural kapatmak veya `eslint-disable` yazmak karar günlüğüne gerekçe ister.
- Format: Prettier (`npm run format`, `npm run format:check`). Markdown ve `.claude/` kapsam dışı. Satır sonu LF (`.gitattributes`).
- Lint ile zorlanamayan, incelemede elle bakılan kurallar: `subscribe` temizliği, `innerHTML`, entry point'ler arası döngüsel bağımlılık, sabit renk/px.
- Birim test: Karma + Jasmine, Chrome. `npm test` (ui, izleme modu), `npm run test:docs`, `npm run test:ci` (tüm projeler, tek sefer, `ChromeHeadlessCI`, coverage → `coverage/`).
- Testler **zoneless** koşar: kurulum dosyası (`projects/ui/testing/test-setup.ts`) her teste `provideExperimentalZonelessChangeDetection()` verir ve zone.js test ortamına hiç yüklenmez. Zone'a yaslanan kod testte kırılır. Bu deneysel API yalnızca test kurulumunda kullanılır, kütüphane koduna girmez.
- **Her bileşen spec'inde axe testi zorunlu:** `await expectNoA11yViolations(fixture.nativeElement)` (`projects/ui/testing/a11y.ts`). Yardımcı public API'nin parçası değildir, entry point'lerden export edilmez; spec'ler göreli yolla import eder.
- Testler Jasmine'e özgü API kullanmaz (ileride Vitest'e geçiş için): yalnızca `describe/it/beforeEach/afterEach/expect` ve ortak matcher'lar. `jasmine.*`, `spyOn`, `expectAsync`, `fail`, `fit/fdescribe/xit/xdescribe`, `fakeAsync/waitForAsync/tick/flush` ESLint'te hatadır. Sahte fonksiyon gerekiyorsa elle yazılır.
- Spec dosyaları kaynağın yanında durur (`*.spec.ts`); `projects/ui` altındaki her klasör taranır.
- CI (`.github/workflows/ci.yml`): `main`'e push ve her PR'da, Node sürümü `.nvmrc`'den, sırayla `npm ci` → `npm run lint` → `format:check` → `build:ui` → `build:docs` → `test:ci` (axe testleri dahil). Yerelde aynı komutları aynı sırayla çalıştır; PR açmadan önce hepsi geçmeli.
- Dependabot (`.github/dependabot.yml`) haftalık. Angular, TypeScript ve ESLint ailesinde majör güncelleme kapalı (geliştirme Angular 19'da); minor/patch tek PR'da gruplanır.
- En güncel Angular'da derleme kontrolü tüketici uyumluluk testiyle gelecek (ROADMAP Faz 4).
- Yayın: npm trusted publishing (OIDC). Saklı npm token KULLANILMAZ. Workflow Faz 5'te yazılacak.
- Cross-browser görsel/etkileşim testleri (Playwright, Chromium + Firefox + WebKit).

## 16. Karar günlüğü

Yeni bir karar alındığında buraya tarihle eklenir. Bu bölüm bölüm 1-15'in önüne geçmez, onları günceller.

- 2026-10: Angular 19+, CDK, shadcn referansı, `@arn-ng/ui`, prefix `arn`, basit bileşenlerde attribute+element, karmaşıklarda sadece element, boyutlar xs-xl, density comfortable/compact, dark mode class + sistem.
- 2026-10: `@arn` npm kapsamı alınmış çıktı. Paket adı `@arn-ng/ui` oldu (npm org: `arn-ng`). Selector prefix (`arn`) ve CSS token öneki (`--arn-*`) değişmedi.
- 2026-10: Kütüphane açık kaynak olacak (MIT, public npm), monorepo kullanılacak, ripple isteğe bağlı directive olarak eklenecek.
- 2026-10: Monorepo aracı Angular workspace (Nx yok). Paket yöneticisi npm. Geliştirme Angular 19 / CLI 19 ile. Yapı: `projects/ui` (kütüphane, ng-packagr), `projects/docs` (standalone doküman uygulaması).
- 2026-10: Secondary entry point yapısı: `projects/ui/<ad>/` (`ng-package.json` + `src/public-api.ts`). Kök entry point (`@arn-ng/ui`) bileşen export etmez. Pilotlar: `core`, `button` (boş).
- 2026-10: Kalite araçları: ESLint 9 flat config + angular-eslint 19 + typescript-eslint (`strictTypeChecked`), Stylelint 17 + `stylelint-use-logical`, Prettier 3 (Markdown hariç). ESLint doğrudan çalışır, `angular.json`'da lint target'ı yok. Node 22 (`.nvmrc`, `engines: ^22.0.0`), satır sonu LF (`.gitattributes`).
- 2026-10: ui projesinde `@angular-eslint/component-class-suffix` kapalı (element sınıfı `ArnButton`, bölüm 2). Inline `styles` yasak (`component-max-inline-declarations`), stiller Stylelint'in görebildiği ayrı dosyada durur.
- 2026-10: tsconfig'e `noUncheckedIndexedAccess`, `strictStandalone`, `extendedDiagnostics.defaultCategory: error` eklendi. `exactOptionalPropertyTypes` ve `noUnusedLocals/Parameters` bilinçli olarak eklenmedi.
- 2026-10: Test altyapısı: Karma + Jasmine (CLI 19 varsayılanı), Chrome, CI için `ChromeHeadlessCI` (`--no-sandbox`). Testler zoneless koşar, zone.js test ortamına yüklenmez (`provideExperimentalZonelessChangeDetection` deneysel; yalnızca test kurulumunda, "zoneless uyumlu" kuralını zorlamak için). axe-core yardımcısı `projects/ui/testing/` altında, public API dışı. Jasmine'e özgü API yasak (Vitest'e geçişi kolaylaştırmak için). ui projesinin `sourceRoot`'u `projects/ui` (secondary entry point ve `testing/` altındaki spec'ler bulunsun diye).
- 2026-10: `no-autofocus` ve `no-input-rename` ESLint kuralları açık kalıyor. Gerekçe: `autofocus` erişilebilirlik için sakıncalı, odak yönetimi kodla yapılır; `no-input-rename` directive selector'ıyla aynı alias'a izin verir, `arnRipple` gibi durumlar sorunsuz.
- 2026-10: Bileşen referans dosyaları (bölüm 18): her bileşen/directive/servis/ortak yapı için `components/<ad>.md`, liste `components/INDEX.md`, iskelet `components/_TEMPLATE.md`. Bileşenle aynı değişiklikte yazılır/güncellenir. Satır limitleri: SKILL.md 300, bileşen dosyası 150, INDEX.md 150.
- 2026-10: CI: GitHub Actions, tek job (`ubuntu-latest`, imajdaki Chrome), `actions/checkout@v7` + `actions/setup-node@v7`, izin `contents: read`, aynı ref'te eski çalışma iptal. Dependabot haftalık; `@angular/*`, `@angular-devkit/*`, `ng-packagr`, `typescript` (minor dahil), `zone.js`, `rxjs`, `eslint`, `@eslint/js`, `angular-eslint` majörleri yoksayılır. Yayın trusted publishing (OIDC) ile yapılacak, saklı npm token yok.
- 2026-10: Sürümleme: Changesets 3 (`.changeset/config.json`: `baseBranch: main`, `access: public`, varsayılan changelog formatı). Changesets paketi bulabilsin diye kök `package.json`'da npm `workspaces: ["projects/ui"]` (yan etki: `node_modules/@arn-ng/ui` kaynağa bağlanır; derleme `tsconfig` `paths` ile `dist/ui`'yi kullanmaya devam eder). `projects/ui` sürümü `0.0.0`, ilk yayın 0.1.0. PR'larda changeset kontrolü CI'a 0.1.0'dan sonra eklenecek.
- 2026-10: Yerel paket testi Verdaccio ile (repoya bağımlılık eklenmeden, geçici klasörde; akış `local-package-test.md`). İlk çalıştırma geçti. Yayın metadata'sı ve `projects/ui/LICENSE` eklendi; lisans MIT, `publishConfig.access: public`.
- 2026-10: shadcn uyumu genişletildi: yalnızca palet değil bileşen kataloğu, varyant/boyut adları ve ölçüler de shadcn'i izler; sapmalar bileşen referans dosyasına gerekçeyle yazılır (bölüm 1).
- 2026-10: Tema (Faz 2 adım a): tek dosya `@arn-ng/ui/theme.css`, kaynağı `projects/ui/theme.css` (core altı değil: workspace symlink'i ve `dist` aynı göreli yolu görsün diye). Temel renk neutral; değerler `ui.shadcn.com/r/colors/neutral.json` ile doğrulandı. Dark mode `light-dark()` + `color-scheme` ile (shadcn'in `.dark` bloğunu yeniden tanımlama tekniğinden sapma; tüketici API'si aynı, değerler tek yerde). `.light` sınıfı eklendi, `data-theme` yok. oklch yazımı Stylelint'e uyar, kural kapatılmadı. `chart-*`, `sidebar-*` ve `success/warning/info` token'ları EKLENMEDİ (ihtiyaç duyan bileşenle ayrı karar). `--arn-destructive-foreground` yok (güncel shadcn'de kaldırılmış). Font yığını `system-ui` tabanlı.
- 2026-10: Boyut ve density (Faz 2 adım b, yalnızca CSS; `theme.css` içinde, ayrı dosya reddedildi, paket yapısı değişmedi). (1) Bileşen token'ı host'ta hesaplanır; `:root`'taki türetilmiş adımlar yalnızca global değişir ve bileşende kullanılmaz. (2) Kontrol token'ları `--arn-control-{height,padding-inline,font-size,icon-size,gap}-{xs…xl}`, sabit değer (`var()` yok), varsayılan `md`. xs-lg shadcn button değerleri (`button.tsx`, new-york-v4, web'den doğrulandı; shadcn'de artık `xs` var, `default` bizde `md`); `xl` bizim ekimiz (3rem / 2rem / 1rem / 1.25rem / 0.5rem). (3) Density `--arn-density` çarpanı (1 / 0.875), `[data-density]` ile; yalnızca yükseklik ve yatay padding. (4) `--arn-control-min-size: 1.5rem` ve host'ta `max()`: density sonrası yükseklik tabanı (SC 2.5.8); compact xs 24px kalır. (5) Compact'ta yuvarlama yok (md 31.5px).
- 2026-10: Ayar sistemi (Faz 2 adım c, `@arn-ng/ui/core`; ayrıntı `components/config.md`). (1) Tek `ArnConfig`; §6'daki eski `dir` → `direction`, `animations` alanı çıkarıldı, `colorScheme` / `ripple` / `messages` / `forms` eklendi; ripple varsayılanı `false` kaldı. (2) Bölüm ayarı `arnForm` değil `[arnConfig]` direktifi. (3) Öncelik tek fonksiyonda (`createScope`); bileşen `injectArnConfig` kullanır; token'lar dışa açılmaz. (4) `effect()` KULLANILMAZ (19'da developer preview): `applyToDocument` sonrası DOM yazımı servis `update`'inde senkrondur. (5) DOM'a yazma yalnızca açık çağrıyla; `[arnConfig]` kendi host'una `data-density` ve `.dark` / `.light` yansıtır, `dir` adım (d)'de. (6) Tip dışı alan/değer her modda atılır, geliştirme modunda `console.warn`. (7) Mesaj şeması v1: `common`, `dialog`, `toast`, `datePicker`; gün/ay adları `Intl` + override. (8) `forms.showErrorsOn`: `touched` | `dirty` | `submitted`.
- 2026-10: Kaynak kod dili İngilizce (§4): `projects/ui/` altındaki JSDoc, yorum, test adı ve konsol mesajları çevrildi (paket public, JSDoc tüketicinin IDE'sinde görünür). `.claude/` ve `ROADMAP.md` Türkçe kalır; testlerdeki Türkçe çeviri verisi (`'Tamam'`, `tr-TR` adları) test verisidir.
- İlk sürüm (v0.1) önerilen bileşenler: button, input, checkbox, select, dialog, tooltip (altyapıyı doğrulamak için). Kesinleşmedi.

## 17. Henüz açık kararlar

- Doküman sitesi için araç (özel Angular uygulaması önerilir) ve kod örneği vurgulama yöntemi
- i18n çeviri paketlerinin biçimi ve dağıtımı, RTL entegrasyonu (`cdk/bidi`, `direction`'ın DOM'a yansıması): Faz 2 adım (d). Mesaj şeması ve `messages` API'si kararlaştırıldı
- Angular Aria'ya geçiş değerlendirmesi (kararlı olunca, min. sürüm şartı 19'u aşmıyorsa)

## 18. Bileşen referans dosyaları (`components/`)

Her bileşen, directive, servis veya ortak yapı için `.claude/skills/arn-ui-library/components/<ad>.md` yazılır. Amaç: sonraki oturumlarda koda bakmadan bileşenin nasıl kurulduğunu anlamak. Kullanıcıya dönük doküman sayfasından (bölüm 13) farklıdır: orası "nasıl kullanılır", burası "nasıl yapıldı ve neden".

- Bileşen oluşturulurken veya değiştirilirken referans dosyası AYNI değişiklikte yazılır/güncellenir. Güncel değilse bileşen BİTMİŞ sayılmaz.
- Bir bileşeni değiştirmeden önce referans dosyasını oku.
- Tüm referans dosyalarının tek satırlık listesi: [components/INDEX.md](components/INDEX.md). Bu dosya (SKILL.md) sadece INDEX'e bağlanır, bileşen ayrıntısı buraya yazılmaz.
- Yeni dosya [components/_TEMPLATE.md](components/_TEMPLATE.md) kopyalanarak başlar.

**Şablon bölümleri (bu sırayla)**
1. **Özet:** selector, entry point, element/directive, sınıf adları, dosya yolları
2. **Mimari ve CDK:** neyden extend ediyor, hangi CDK parçalarını kullandı, neyi neden genişletti, `hostDirectives`
3. **Token'lar:** tablo (ad, host'taki hesap, bağlı anlamlı token)
4. **Override rehberi:** global, container, tek örnek
5. **Davranış ve a11y:** klavye, aria
6. **Form uyumu**
7. **Kısıtlar ve kararlar**
8. **Testler**
9. **Bağlantılar:** kod yolları, doküman sayfası

**Satır limitleri**
- SKILL.md en fazla 300 satır. Aşarsa bir bölüm ayrı dosyaya taşınır ve buradan referans verilir.
- Bileşen dosyası en fazla 150 satır. Aşarsa `<ad>.md` + `<ad>-<konu>.md` olarak bölünür, ana dosyadan bağlanır.
- INDEX.md en fazla 150 satır. Aşarsa kategori indekslerine bölünür.
- Dosyalar kısa olsun: tablo ve liste ağırlıklı, kod kopyalamak yerine dosya yolu ver.
