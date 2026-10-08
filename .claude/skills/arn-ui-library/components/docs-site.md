# docs-site (doküman sitesi kabuğu)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Kurallar: ../SKILL.md §13, §18. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-root` (kabuk), `docs-sidebar`, `docs-settings`, `docs-overview-page`, `docs-not-found-page` |
| Entry point | Yok (uygulama). Kütüphaneyi `@arn-ng/ui/core`, `@arn-ng/ui/locales/tr`, `@arn-ng/ui/theme.css` olarak tüketir |
| Tür | ortak yapı (Angular uygulaması, zoneless) |
| Sınıf adları | `AppComponent`, `SidebarComponent`, `SettingsComponent`, `DocsSettingsService`; token'lar `DOCS_STORAGE`, `DOCS_NARROW_VIEWPORT` |
| Dosya yolları | `projects/docs/src/app/` (`nav/`, `shell/`, `settings/`, `pages/`, `testing/`), `projects/docs/src/styles.css` |

Site dili İngilizce'dir (arayüz ve içerik); `<html lang="en">` sabittir. Faz 3 adımları: 3a kabuk (bu dosya), 3b doküman parçaları, 3c giriş sayfaları, 3d arama, 3e zoneless değerlendirmesi.

## 2. Mimari ve CDK

- **Tüketim:** build ve Karma kök `tsconfig.json` `paths` ile `dist/ui`'yi kullanır (gerçek tüketici gibi; önce `npm run build:ui`). `projects/docs/tsconfig.json` YALNIZ editör ve ESLint içindir, `@arn-ng/ui/*`'ı kaynağa çözer: CI'da lint build'den önce koşar, `dist` yokken tipler çözülmez ve `strictTypeChecked` düşer (doğrulandı: 29 hata).
- **Zoneless:** `provideExperimentalZonelessChangeDetection()` (19.2'de developer preview; SKILL §1'in "yalnız kararlı API" kuralı kütüphane içindir). `angular.json`'da docs `build.options.polyfills` (`zone.js`) kaldırıldı.
- **CDK:** yalnız `@angular/cdk/layout` `MediaMatcher`. Kütüphanenin overlay servisi KULLANILMAZ (çekmece düz CSS).

### Gezinti: `nav/docs-nav.ts`

Tek tipli veri hem sidebar'ı hem lazy route'ları üretir.

| Parça | Görev |
|---|---|
| `DocsNavCategory` `{ id, title, pages }`, `DocsNavPage` `{ slug, title, loadComponent }` | Sözleşme. `slug` site genelinde benzersiz, URL düz: `/<slug>`; boş slug ana sayfa |
| `DOCS_NAV` | Yalnız gerçekten var olan sayfalar (3a: Getting started → Overview) |
| `visibleCategories(nav)` | Sayfasız kategoriyi atar (başlığı gösterilmez) |
| `buildRoutes(nav)` | Sayfa başına `{ path, pathMatch: 'full', title, loadComponent }`; başlık `"<title> · arn-ng"` |
| `app.routes.ts` | `buildRoutes(DOCS_NAV)` + `**` → 404 (gezintide listelenmez) |

Yeni sayfa: bileşeni `pages/<ad>/` altına yaz (host `class: 'docs-page'`), `DOCS_NAV`'a satır ekle. Başka yere dokunulmaz.

### Kabuk: `AppComponent`

Sıra: skip link → `<header>` (çekmece düğmesi, site adı, `<docs-settings>`) → `.docs-body` (`<docs-sidebar>`, backdrop, `<main id="docs-main" tabindex="-1">`). Sağda "bu sayfada" alanı YOK (3b).

- **Dar/geniş modu CSS media query değil, TS belirler:** `DOCS_NARROW_VIEWPORT` (`Signal<boolean>`, `(width < 48rem)`, sunucuda `false`) → `.docs-body`'de `docs-narrow` / `docs-drawer-open` sınıfı. Kırılma noktası tek yerde (`shell/viewport.ts`); spec token'ı `signal` ile değiştirir (Karma penceresi 800px, media query ile çekmece sınanamazdı).
- **Sınıflar host'ta DEĞİL, şablondaki elemanda:** `ChangeDetectorRef.detectChanges()` bileşenin host binding'lerini yenilemez; odak taşımadan önce sınıfın yazılmış olması gerekir.
- **Ayırıcı `main`'dedir** (`border-inline-start`), sidebar'da değil: sidebar sticky için `align-self: start` taşır ve içeriği kadardır. Host flex sütun, `.docs-body` `flex-grow: 1` ile kalan yüksekliği doldurur. Dar modda çizgi yok; çekmece kendi kenarını taşır.
- `drawerVisible = computed(() => narrow() && drawerOpen())`: pencere genişleyince çekmece kendiliğinden kapalı sayılır (`effect()` yok).

### Değiştiriciler ve kalıcılık

`SettingsComponent`: dört yerel `<select>` (Theme, Direction, Density, Language). Seçili değer doğrudan `ArnConfigService` signal'lerinden okunur; değişiklik `DocsSettingsService` üzerinden gider. Kök `provideArn({ applyToDocument: true })` olduğu için `<html>`'e yansır ve kabuk da token'larla stillendiğinden anında değişir.

| Konu | Karar |
|---|---|
| Tipler | `ArnConfig` tipleri (`Pick<ArnConfig, 'colorScheme' \| 'direction' \| 'density' \| 'locale'>`); ayrı ayar tipi yok |
| Seçenekler | `settings/docs-settings.options.ts`; aynı listeler depodan okunan değerin allowlist'idir |
| Tema | `system` / `light` / `dark`; kayıt yoksa hiçbir şey ayarlanmaz → `system` (sistem tercihi) |
| Yön | `ltr` / `rtl` (`auto` sunulmaz; kayıt yoksa belgeden gelir) |
| Dil | Sitenin değil kütüphanenin yereli: `en-US`, `tr-TR` + `ARN_MESSAGES_TR` |
| Depo | `localStorage`, tek anahtar `arn-docs:settings`, yalnız AÇIKÇA seçilenler |
| Güvenlik | `DOCS_STORAGE` (`DOCUMENT.defaultView`, `isPlatformBrowser`; global `localStorage` yok). Tüm okuma/yazma try/catch; bozuk JSON, yanlış tip, listede olmayan değer alan alan atılır |
| Açılış | `provideAppInitializer(() => inject(DocsSettingsService).restore())`: `provideArn`'ın initializer'ından sonra, ilk render'dan önce (titreme yok) |

**İngilizce'ye dönüş (anlık görüntü):** `ArnConfigService.setMessages` derin birleştirir, reset yolu yoktur ve `DEFAULT_MESSAGES` dışa açık değildir. Servis oluşurken dil paketlerinin çevirdiği üst grupların (`common`, `dialog`, `toast`) İngilizcesini `config.messages()`'tan alır; dil değişince önce bunu, sonra paketi yazar. `datePicker` görüntüye girmez, gün/ay adları `locale`'i izlemeye devam eder.

## 3. Token'lar

Bileşen token'ı yok. Docs CSS'i yalnız `theme.css`'te tanımlı `--arn-*` token'larını kullanır (grep ile doğrulandı; tanımsız `var()` sessizce geçersiz kalır, Stylelint yakalamaz). Siteye özgü üç ölçü `styles.css` `:root`'unda: `--docs-sidebar-width`, `--docs-content-width`, `--docs-gutter` (`--arn-spacing`'ten `calc`). Düz CSS, Tailwind yok; mantıksal özellikler ve Stylelint kuralları docs'ta da geçerlidir.

Sayfa içeriği tipografisi globaldir (`styles.css`, `.docs-page …`): kabuğun kapsüllenmiş stili route bileşeninin içine ulaşamaz.

Satır içi kod rozeti (`.docs-page :not(pre) > code`; kod bloklarına uygulanmaz) `inline-block`'tur: satır sonunda bölünmez (inline iken tireden sonra kırılıyordu), kapsayıcıdan genişse kendi içinde sarılır (`max-inline-size: 100%` + `border-box` + `overflow-wrap: break-word`; `anywhere` min-content'i tek karaktere indirip tablo sütununu ezerdi). Dikey padding yok, yükseklik `--arn-text-sm-line-height`'tan (satırı büyütmesin). `direction: ltr` taşır (RTL'de `@` ve `/` yer değiştirmesin); `unicode-bidi` gerekmez, atomik kutu dış paragrafta tek nötr nesnedir.

## 4. Override rehberi

Yok (uygulama). Hedef yüksekliği her yerde aynı ifade: `max(var(--arn-control-min-size), calc(var(--arn-control-height-sm) * var(--arn-density)))`.

## 5. Davranış ve a11y

| Konu | Davranış |
|---|---|
| Skip link | İlk eleman, yalnız odakta görünür. `(click)` ile `preventDefault` + `<main>`'e odak (`<base href>` yüzünden çıplak `#fragment` ana sayfaya giderdi) |
| Landmark'lar | `header`, `nav[aria-label="Documentation"]`, `main` |
| Aktif sayfa | `routerLinkActive` + `ariaCurrentWhenActive="page"` (`exact`); arka plan + renk + kalınlık |
| Route değişimi | `NavigationEnd`'de odak `<main>`'e, başlık route `title`'ından. İlk gezintide ve yalnız fragment değişince odak taşınmaz. `<main>` kabukta hep vardır, bu yüzden senkron (`afterNextRender` yok) |
| Çekmece | Başlığın altında açılan disclosure (modal değil, odak tuzağı yok; başlık kullanılabilir kalır). Düğme `aria-expanded` + `aria-controls`; açılınca odak ilk bağlantıya, kapanınca düğmeye; Esc, backdrop ve gezinti kapatır; açıkken `<main>` `inert` |
| Odak halkası | Global `:focus-visible` (`--arn-ring-width`, `--arn-ring`) |
| RTL | Mantıksal CSS; yön bildiren tek simge (404 geri oku) `arn-rtl-mirror` taşır. Çekmecede kaydırma animasyonu yok (fiziksel `translate` gerektirirdi) |

`LiveAnnouncer` ile duyurup odağı sidebar'da bırakmak reddedildi: klavye kullanıcısı içeriğe ulaşmak için tüm sidebar'ı geçerdi.

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- `effect()`, `afterNextRender`, `rxjs-interop` kullanılmaz (kütüphaneyle aynı örüntü): router olaylarına elle abonelik + `DestroyRef`, odak öncesi `detectChanges()`.
- Backdrop tıklaması host `(click)` dinleyicisindedir (şablonda tıklanabilir `div` a11y lint'ine takılır; klavye karşılığı Esc).
- Dil değiştiricinin 3a'da GÖRÜNÜR etkisi yok: `messages` okuyan bileşen henüz yok.
- Dağıtım (barındırma, `base href`) Faz 5'e bırakıldı.
- `--arn-ring` (neutral-400) açık temada beyaz üstünde yaklaşık 2.5:1'dir; shadcn değeridir, docs'ta değiştirilmedi.

### 3b-3e için boşluklar

| Adım | Eksik |
|---|---|
| 3b | 3b-1 bitti: örnek bloğu ve kod renklendirme ([docs-site-examples.md](docs-site-examples.md)). 3b-2: API ve Styling tabloları, "bu sayfada" (sağ sütun; fragment gezintisinde odak taşınmaması hazır) |
| 3c | Giriş sayfaları (Installation, Configuration, Theming, Accessibility…) ve ripple sayfası; dil değiştiricinin etkisini gösteren ilk içerik |
| 3d | Arama (sidebar'da) |
| 3e | Zoneless değerlendirmesi: gerçek tarayıcıda gözlem, CDK tabanlı bileşenlerle davranış |
| Faz 5 | Overview'daki yayın durumu ifadesi ("has not been published to npm yet") 0.1.0 yayınıyla YANLIŞ olur; güncellenecek (ROADMAP Faz 5) |

## 8. Testler

`projects/docs/src/app/**/*.spec.ts` (Karma, zoneless, Jasmine'e özgü API yok). axe yardımcısı kütüphaneninkidir (`projects/ui/testing/a11y.ts`, göreli import). Yardımcılar: `testing/dom.ts` (`query`, `queryAs`, `text`, `resetDocument`, `nextTask`), `testing/fake-storage.ts`. Her spec `afterEach`'te `<html>` sınıflarını, `dir`, `data-density` ve depo anahtarını temizler.

| Spec | Kapsam |
|---|---|
| `nav/docs-nav.spec.ts` | Benzersiz slug ve kategori kimliği, her slug'a tek route, bileşenler çözülür, boş kategori yok; fixture ile `visibleCategories` / `buildRoutes` |
| `shell/sidebar/…spec.ts` | Fixture'dan başlıklar ve bağlantılar, boş kategori gizli, `aria-current`, `focusFirstLink`, axe |
| `shell/settings/…spec.ts` | Dört etiketli `<select>`; her biri servisi günceller ve `<html>`'e yansır; Türkçe ve İngilizce'ye dönüş (metinler + `Intl` adları); depoya yazım; listede olmayan değer; axe |
| `settings/docs-settings.service.spec.ts` | Yaz/oku, geri yükleme, geçersiz / yanlış tipli / bozuk kayıt, `getItem` ve `setItem` fırlatınca, depo yokken, sunucuda `DOCS_STORAGE`, `appConfig` ile açılışta uygulama |
| `shell/viewport.spec.ts` | Token tarayıcıda media query'yi, sunucuda `false` verir |
| `app.component.spec.ts` | Landmark'lar, skip link, gezintide odak ve başlık, çekmece (aç/kapa, Esc, backdrop, odak, `inert`, genişleyince kapanma), düzen (body kabuğun altına iner, ayırıcı `main`'de ve RTL'de sidebar tarafında, dar modda yok, çekmece tam yükseklik), hedef boyutu, axe: light / dark / RTL / compact × geniş, çekmece kapalı, çekmece açık |
| `pages/**/…spec.ts` | 404 bilinmeyen URL'de, dönüş bağlantısı, RTL'de ok `scale: -1 1`; Overview tek `h1`; axe |
| `src/styles.spec.ts` | Kod rozeti (düz DOM, 320px kapsayıcı): satır sonunda bölünmez, geniş rozet içinde sarılır ve kaydırma üretmez, tablo sütununu ezmez, satır yüksekliğini değiştirmez (±1px), RTL'de `ltr`, `pre > code` etkilenmez |

Boşluklar: tarayıcıda görsel doğrulama kullanıcı tarafından yapıldı (koyu tema; bulunan iki kusur 3a-fix'te giderildi: ayırıcı, kod rozeti). Kalan: gerçek pencere yeniden boyutlandırma ve gerçek SSR sınanmadı.

## 9. Bağlantılar

- Kod: `projects/docs/src/app/`, `projects/docs/src/styles.css`, `projects/docs/tsconfig.json`, `angular.json` (docs)
- İlgili: [docs-site-examples.md](docs-site-examples.md), [config.md](config.md), [config-direction.md](config-direction.md), [locales.md](locales.md), [tokens.md](tokens.md), [tokens-sizes.md](tokens-sizes.md)
- Yerelde: `npm run build:ui` ardından `npm run serve:docs`
