# docs-site-pages-guides (3c sayfaları: Ripple, Installation, Configuration, Theming)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Spec yardımcıları: docs-site-pages.md. Ana dosya: docs-site.md. Kurallar: ../SKILL.md §13, §16, §18. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-ripple-page`, `docs-installation-page`, `docs-configuration-page`, `docs-theming-page`; örnekler `docs-ripple-{basic,config,color,centered}-example`, `docs-configuration-{locale,sections}-example`, `docs-theming-{dark-mode,sizes,density,override}-example` |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (sayfalar) |
| Sınıf adları | `RipplePageComponent`, `InstallationPageComponent`, `ConfigurationPageComponent`, `ThemingPageComponent`, örnek bileşenleri; veri `RIPPLE_INPUTS`, `RIPPLE_TOKENS`, `LIBRARY_PEERS`, `CONFIG_PROPERTIES`, `CONFIG_SERVICE_METHODS`, `THEMING_TOKEN_GROUPS` |
| Dosya yolları | `projects/docs/src/app/pages/{ripple,installation,configuration,theming}/` (sayfa + `examples/` + `*.api.ts` / `*.data.ts` / `*.tokens.ts`), `pages/token-coverage.spec.ts` |

Gezinti: Getting started → Overview, Installation; Guides → Configuration, Theming; Directives → Ripple. Her sayfa spec'i 320px'te belge taşmasını sınar (`expectNoPageOverflow`, [docs-site-pages.md](docs-site-pages.md)). Örnek kalıbı `pages/<sayfa>/examples/<ad>.example.{ts,html,css}` + `?source` ([docs-site-examples.md](docs-site-examples.md)); her örneğin kendi spec'i ve axe testi var.

## 2. Mimari ve CDK

### Ripple (`/ripple`)

Bölümler: `import`, `basic`, `turning-it-on`, `color`, `centered`, `accessibility`, `api`, `styling`. Kaynak [ripple.md](ripple.md) §1-5.

| Konu | Karar |
|---|---|
| Örnekler | Dört örnek, yerel `<button>`; her CSS `position: relative` taşır ve CSS sekmesinde görünür (spec dört kaynakta arar). Düğme stili her dosyada tekrarlanır: tek başına kopyalanabilsin |
| Tuzak | "An empty attribute is always on": boş attribute `true`'dur ve config'i ezer; yalnız `undefined` izler. `config` örneği: `[arnRipple]="followConfig"`, `arnRipple`, `[arnRipple]="false"`, bölüm onay kutusuyla |
| Ad / renk | İkon düğmesi `aria-label="Add item"`, SVG `aria-hidden`; `arnRippleColor` `--arn-primary`'den `color-mix` |
| Tablolar | Inputs `expectApiMatchesComponent(ArnRippleDirective, …)`; CSS tokens `tokenMismatches(… '--arn-ripple-')` + varsayılanlar `theme.css` metninde |
| Bağlantı | "Turning it on" → `/configuration` |

### Installation (`/installation`)

Bölümler: `requirements`, `install`, `theme`, `configuration`, `imports`. Örnek yok, beş kod bloğu (shell `shellscript`).

| Konu | Karar |
|---|---|
| Durum notu | `h1`'in ardından `<p class="docs-note" role="note">` "Not on npm yet … 0.1.0"; Overview'a dokunulmadı; ikisi 0.1.0'da (ROADMAP Faz 5, iki madde). `.docs-note` global: kenar + ton |
| Gereksinimler | `installation.data.ts` `projects/ui/package.json`'ı `?source` ile alır, `peerDependencies` derleme anında okunur; elle yazılmış sürüm yok |
| Adımlar | Yalnız Verdaccio çalıştırmalarında denenenler (`local-package-test.md` 2.-7.); `angular.json` `styles` ve başka paket yöneticileri yazılmadı |
| Entry point'ler | core, ripple, locales/tr, theme.css; kök boş, iç yollar çözülmez; boş `button` pilotu listelenmez |
| Bağlantı | "Provide the configuration" → `/configuration` |

### Configuration (`/configuration`)

Bölümler: `precedence`, `global`, `sections`, `runtime`, `own-code`, `locale-and-messages`, `direction`. Kaynak kod (`config.types.ts`, `config.defaults.ts`, `config.directive.ts`, `config.service.ts`) ve [config.md](config.md), [config-messages.md](config-messages.md), [config-direction.md](config-direction.md), [locales.md](locales.md). SKILL §13'ün "RTL ve i18n" başlığı bu sayfanın iki bölümüdür.

| Konu | Karar |
|---|---|
| Alan tablosu | `configuration.api.ts`: `Record<keyof ArnConfig, Omit<DocsApiInput, 'name'>>` → `CONFIG_PROPERTIES`, `properties` tablosu. Alan eklenince derleme kırılır. Spec: `apiMismatches(ArnConfigDirective, …)` (sekiz girdi = sekiz alan); sabit varsayılanlar taze servisten okunanla aynı. `applyToDocument` kök seçeneğidir, tabloda değil metinde ve kodda |
| Servis tablosu | `CONFIG_SERVICE_METHODS` (`methods`). Spec prototipi karşılaştırır: fazlalık yalnız bilinen `private` (`writeToDocument`); yeni public metot belgelenene kadar düşer |
| Tuzak | Density / colorScheme / direction CSS ile çalışır: `applyToDocument` ya da bölüm olmadan görsel etki yok; `<html lang>` yazılmaz |
| Dil örneği | `locale.example`: `injectArnConfig()` → `locale()`, `messages().common` (ok, cancel, confirm), `datePicker.monthNames` / `dayNamesShort`. Başlıktaki Language Türkçe'ye geçince anında değişir (docs-site.md §7'deki boşluk kapandı) |
| Bölüm örneği | `sections.example` önceki örneğin bileşenini üç yerde kullanır (bölümün içinde okumak için bileşen gerekir; TS sekmesi bunu söyler): uygulama, yalnız `locale="de-DE"` (adlar Almanca, metinler UYGULAMANINKİ), `locale="tr-TR"` + `ARN_MESSAGES_TR` (her zaman Türkçe) |
| Bağlantılar | `/installation`, `/ripple`, `/theming`; Accessibility henüz yok |

### Theming (`/theming`)

Bölümler: `theme-file`, `color-tokens`, `dark-mode`, `sizes`, `density`, `overriding`. Kaynak `theme.css`, [tokens.md](tokens.md), [tokens-sizes.md](tokens-sizes.md). SKILL §13'ün "Yoğunluk" başlığı bu sayfanın bölümüdür.

| Konu | Karar |
|---|---|
| Tablolar | `theming.tokens.ts`: yedi grup (palet, anlamlı renk, radius, tipografi, boşluk ve çizgi, kontrol boyutları, density), her biri kendi başlığıyla (`docs-token-table`'a `caption` girdisi; varsayılan "CSS tokens", Ripple değişmedi). Palet / radius / tipografi / boşluk "The theme file"da: altı bölümde yerleri yoktu, belgesiz bırakılmadı |
| Doğrulama | Her grup `tokenMismatches(rows, scan, inScope)`; kapsamlar `:root`'u böler (renk = başka grubun ve sayfanın kapsamadığı her şey). Varsayılanlar boşluğu sadeleştirilmiş `theme.css` metninde `<ad>: <değer>;` (font yığınları çok satırlı) |
| Dark mode örneği | İki bölüm, `colorScheme="light"` ve `"dark"`; her biri kendini token'larla boyar (tema boyamaz), anlamlı renk kutucukları |
| Sizes örneği | Sahte bileşen YOK: her boyut için host formülüyle boyutlanan kesik kenarlı kutu ve `ResizeObserver` ile ölçülen gerçek yükseklik (`ngAfterViewInit` + `DestroyRef`; `afterNextRender` yok). `box-sizing: border-box` (yoksa kenarlık 2px ekliyordu; host kod örneğinde de var: Faz 4 kenarlıklı bileşen notu) |
| Density örneği | Önceki örneğin bileşeni `density="comfortable"` ve `"compact"` bölümlerinde; ölçü canlı, başlıktaki Density de anında yansır |
| Override örneği | `.brand` `--arn-primary` ve `--arn-radius`'ı ezer (`!important` / `::ng-deep` yok; spec CSS metninde arar). Tuzak görünür: `calc(var(--arn-radius) * 0.8)` izler, `--arn-radius-md` izlemez |
| Bağlantılar | `/configuration`; Configuration ve Installation'dan Theming'e |

**Token kapsamı değişmezi** (`pages/token-coverage.spec.ts`): `:root`'taki her `--arn-*` bir sayfanın Styling tablosunda ya da açık izin listesinde (nerede belgelendiği notuyla) olmalı; token tek sayfada belgelenir; listedeki her ad temada var ve hiçbir sayfada yok. Bugün listede yalnız `--arn-z-*` (Overlay sayfası gelene kadar, tokens.md §3). Yeni sayfanın tabloları `DOCUMENTED`'a eklenir.

### axe ile bulunan kusur (Ripple)

`.docs-lead` içindeki satır içi kod rozeti açık temada `--arn-muted` üstünde ≈4.3:1 idi; rozet artık `--arn-foreground` taşır ([docs-site.md](docs-site.md) §3).

## 3. Token'lar

Yok. Örnek CSS'leri yalnız `--arn-*` kullanır.

## 4. Override rehberi

Yok (uygulama).

## 5. Davranış ve a11y

Her sayfa: tek `h1`, bölümler `docs-section` (`h2`), iç bağlantılar `routerLink`. Örnek içi başlıklar `h3` ve bölümler `aria-labelledby` (sections örneği). Tablolar ve örnek bloğu kendi a11y'lerini taşır ([docs-site-toc-api.md](docs-site-toc-api.md), [docs-site-examples.md](docs-site-examples.md)).

## 6. Form uyumu

Yok. Ripple `config` örneğinde yerel onay kutusu (etiketli).

## 7. Kısıtlar ve kararlar

- Sayfa metni yalnız koddan doğrulanan iddiaları taşır (ör. "kök entry point boş": `public-api.ts`; "provideArn'sız varsayılan": `ARN_ROOT_CONFIG` `optional`).
- **Bundle (prod, ölçüldü):** Ripple ile initial 252.54 → 259.19 kB (ortak bağımlılıklar initial parçalara ayrıldı; sayfa kodu, örnek metni, Shiki initial'da yok). Installation +0.37 kB (`main` nav, `styles` `.docs-note`). Configuration ile 259.56 → 259.90 kB ham (73.23 → 72.96 kB aktarım): esbuild ortak parçaları yeniden böldü (iki parça birleşti, 294 B yeni parça, `main` −0.11); tembelde örnek bloğu ve tablolar Ripple ile Configuration'ın ortak parçasına çıktı (9.85 kB; Ripple 31.11 → 21.69 kB), Configuration 17.99 kB. Theming ile 259.90 → 260.09 kB ham (72.96 → 73.02 kB aktarım; `main` +0.11 nav, ortak parça +0.08); Theming parçası 32.83 kB ham / 7.56 kB aktarım. `docs-highlight` ilk "Show code"da (677.55 kB ham / 87.69 kB aktarım).

## 8. Testler

| Spec | Kapsam |
|---|---|
| `pages/ripple/ripple-page.component.spec.ts` | `h1`, sayfa sınıfı, bölüm sırası, iç bağlantılar + `/configuration`, tuzak metni, dört örnek × HTML / TS / CSS, `position: relative`, API / token / varsayılan eşleşmesi, tablo başlıkları, axe dört mod |
| `pages/ripple/examples/*.example.spec.ts` | basic: ad, konum, basışta dalga, klavyede yok; config: bölüm açık / kapalı; color: verilen renk; centered: `aria-label`, merkez, compact ≥24px; axe dört mod |
| `pages/installation/installation-page.component.spec.ts` | `h1`, durum notu, bölüm sırası, iç bağlantılar + `/configuration`, beş kod bloğu, peer'lar `package.json`'la, diller, Verdaccio adımları, entry point'ler, axe |
| `pages/configuration/configuration-page.component.spec.ts` | `h1`, bölüm sırası, bağlantılar (`/installation`, `/ripple`), dört öncelik seviyesi, CSS tuzağı; alanlar = `ArnConfigDirective` girdileri, varsayılanlar, servis metotları; Properties + Methods; iki örnek; axe dört mod |
| `pages/configuration/examples/locale.example.spec.ts` | İngilizce varsayılan; Türkçe'ye anında geçiş (Tamam · Vazgeç · Onayla, Ocak, Paz); yalnız `de-DE` adları değiştirir; axe |
| `pages/configuration/examples/sections.example.spec.ts` | Bölüm başlıkla adlı; üç sütun; uygulama Türkçe olunca `de-DE` metinleri miras alır, `tr-TR` sabit; axe |
| `pages/theming/theming-page.component.spec.ts` | `h1`, bölüm sırası, bağlantılar + `/configuration`, dört örnek, tuzak metni; yedi grup × (`tokenMismatches` + temadaki varsayılan); yedi ayrı başlık; 320px; axe dört mod |
| `pages/theming/examples/*.example.spec.ts` | sizes: beş kutu, yükseklik token'a eşit ve gösterilen, density canlı (compact md 31.5, xs 24); density: iki bölüm, 24/32/36/40/48 ve 24/28/31.5/35/42, yazı aynı; dark-mode: `.light` / `.dark`, bölüm ve primary kutucuğu kendi şemasında, sayfa koyuyken de; override: sınıf, `!important` / `::ng-deep` yok, primary yalnız `.brand`'de, `calc` köşesi izler, `-md` izlemez; hepsinde axe |
| `pages/token-coverage.spec.ts` | `:root`'taki her `--arn-*` bir tabloda ya da izin listesinde; tek sayfada; liste dürüst |
| Sayfa spec'leri (dördü) | 320px'te belge taşmaz (`expectNoPageOverflow`) |
| `src/styles.spec.ts` | Rozet silik metinde `--arn-foreground`; `.docs-note` kenar + ton |
| `app.component.spec.ts` | Dört sayfa sidebar'da; açık çekmece EN AZ gövde boyu (üç kategoriyle kısa sayfadan uzun: eşitlik varsayımı düzeltildi) |

Boşluklar: gerçek `prefers-reduced-motion`, dokunmatik basış ve başlıktaki Language seçicisinin tarayıcıda örneği değiştirmesi elle sınanır (spec `ArnConfigService`'i doğrudan çağırır).

## 9. Bağlantılar

- Kod: `projects/docs/src/app/pages/`
- İlgili: [docs-site-pages.md](docs-site-pages.md), [docs-site.md](docs-site.md), [ripple.md](ripple.md), [config.md](config.md), [locales.md](locales.md)
