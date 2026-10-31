# docs-site-pages (3c sayfaları ve doğrulama yardımcıları)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Ana dosya: docs-site.md; tablolar: docs-site-toc-api.md. Kurallar: ../SKILL.md §13, §16, §18. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-ripple-page`; örnekler `docs-ripple-{basic,config,color,centered}-example` |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (sayfalar + spec yardımcıları + tablo türü) |
| Sınıf adları | `RipplePageComponent`, `Ripple{Basic,Config,Color,Centered}ExampleComponent`; veri `RIPPLE_INPUTS`, `RIPPLE_TOKENS`; yardımcılar `apiMismatches` (directive desteğiyle), `directiveTemplateNames`, `scanTokens`, `tokenMismatches`, `themeStyleSheet`, `unknownInternalLinks`, `docsPaths`; tablo türü `properties` |
| Dosya yolları | `projects/docs/src/app/pages/ripple/`, `api/testing/` (`expect-api.ts`, `token-mismatches.ts`, `theme-source.ts`), `testing/links.ts`, `api/docs-api.ts`, `api/docs-table.ts` |

3c-1b yardımcıları yalnız spec'lerde kullanılır (`properties` bir tablo türü); üretim paketine girmez. Sayfalar §2'nin sonunda.

## 2. Mimari ve CDK

### API karşılaştırması: bileşen ve directive

`apiMismatches(type, { inputs, outputs })` önce `reflectComponentType` (public, 19'da kararlı) dener; `null` gelirse (directive) `directiveTemplateNames`'e düşer.

| Parça | Davranış |
|---|---|
| `directiveTemplateNames(type)` | `Reflect.get(type, 'ɵdir')` → `inputs` / `outputs` haritalarının ANAHTARLARI (template adları). Yalnız ad kullanılır; değerler (küçültülmüş ad, bayrak, transform) karşılaştırmaya girmez |
| Şekil denetimi | Harita bir nesne (dizi değil) ve her değer ya string ya boş olmayan dizi olmalı; değilse `null` → "cannot be read" satırı. Yanlış cevap yerine sesli düşme |
| `any` yok | Tanım `unknown` olarak alınır, `typeof` / `Array.isArray` ile daraltılır |
| Mesajlar | "the code has it, the table does not" / "the table has it, the code does not" (bileşen ve directive için aynı) |

Angular 19'da ɵdir: `inputs: { arnRipple: ['arnRipple', 1, null], … }`, `outputs: { ad: 'ad' }`. Signal input'ta `transform` signal'in içindedir; üçüncü eleman `null` kalır (`transform: booleanAttribute` olsa da).

**Neden ɵ:** directive'in girdilerini okuyan public API yok. B (bilinen girdiyi şablonda bağlamak) belgelenmemiş girdiyi yakalamaz; C (`.d.ts` metnini ayrıştırmak) `dist`'e bağlanır. ɵ yalnız test kodunda; kütüphaneye GİRMEZ (SKILL §16).

### Token karşılaştırması: `tokenMismatches`

| Parça | Davranış |
|---|---|
| `themeStyleSheet()` | `projects/ui/theme.css`'i `?source` ile metin olarak alır, `new CSSStyleSheet().replaceSync()` ile ayrıştırır. `document.styleSheets` KULLANILMAZ: spec'te render edilen bileşen stilleri ölçümü kirletirdi |
| `scanTokens(sheet)` | Kuralları özyinelemeli dolaşır: `@layer`, `@media`, `@supports`, `@container`, iç içe stil kuralları (`cssRules` taşıyan her kural), `@import` (`styleSheet`). Yalnız `--arn-*`; `--docs-*` ve sıradan özellikler atlanır |
| `:root` ayrımı | Seçici listesinde `:root` geçen kural (`:root, .x` dahil, hangi derinlikte olursa) → `root`; diğerleri `elsewhere` (ad → seçiciler) |
| `tokenMismatches(rows, scan, inScope)` | İki yönlü, yalnız `inScope(ad)` olanlar (ör. `--arn-ripple-` öneki): eksik, bilinmeyen, tekrar eden, kapsam dışı, `--arn-` olmayan satır; yalnız `:root` dışında tanımlı ad seçicileriyle raporlanır. Boş liste = uyumlu |

`theme.css`'te `:root` dışında tanımlı tek `--arn-*`: `--arn-density` (`[data-density="comfortable"]`, `[data-density="compact"]`; `:root`'ta da var). Spec bunu sabitler: başka bir `:root` dışı tanım eklenirse test düşer ve karar gerekir.

### Tablo türü `properties`

`DocsApiTable`'a `{ kind: 'properties'; rows: readonly DocsApiInput[] }`: sütunlar `inputs` ile aynı (Name, Type, Default, Description), başlık "Properties". Şablon girdisi olmayan alanlar için (Configuration sayfasında `ArnConfig`). Satırların `Record<keyof ArnConfig, …>` ile anahtarlanması sayfanın işidir (3c Configuration).

### İç bağlantılar: `unknownInternalLinks`

`testing/links.ts`: kökün altındaki her `a[href]`'i `DOCS_NAV` yollarıyla (`/`, `/<slug>`) karşılaştırır; sorgu ve fragment atılır, `http(s):` / `mailto:` atlanır, çıplak `#fragment` HATADIR (`<base href>` ana sayfaya götürür). Her sayfa spec'i boş liste bekler: var olmayan sayfaya bağlantı verilmez.

### Sayfa: Ripple (`/ripple`, kategori Directives)

Bölümler (`docs-section`, sırayla): `import`, `basic`, `turning-it-on`, `color`, `centered`, `accessibility`, `api`, `styling`. İçerik kaynağı [ripple.md](ripple.md) §1-5.

| Konu | Karar |
|---|---|
| Örnekler | `pages/ripple/examples/<ad>.example.{ts,html,css}`, dört örnek; demo yerel `<button>`. Her CSS `position: relative` taşır ve CSS sekmesinde görünür (kopyalanınca çalışır; sayfa spec'i dört kaynakta da arar). Ortak düğme stili her dosyada tekrarlanır: her örnek tek başına kopyalanabilsin |
| Tuzak | "An empty attribute is always on": boş attribute `true`'dur, eleman girdisi config'i ezer; yalnız `undefined` config'i izler. `config` örneği üç düğmeyle gösterir: `[arnRipple]="followConfig"` (`undefined`), `arnRipple`, `[arnRipple]="false"`; bölüm `[arnConfig] [ripple]` onay kutusuyla değişir |
| Ad | Metinli düğmeler görünür metinle; ikon düğmesi `aria-label="Add item"`, SVG `aria-hidden` |
| Renk | `arnRippleColor="color-mix(in oklch, var(--arn-primary) 30%, transparent)"` (token'dan, sabit renk yok) |
| API | `ripple.api.ts` → `docs-api-table` (Inputs). Doğrulama `expectApiMatchesComponent(ArnRippleDirective, …)` (ɵdir yolu) |
| Styling | `docs-token-table` (CSS tokens). Doğrulama `tokenMismatches(…, scanTokens(themeStyleSheet()), ad => ad.startsWith('--arn-ripple-'))`; varsayılanlar `theme.css` metninde `<ad>: <değer>;` olarak aranır |
| Bağlantı | Yok (Configuration / Theming henüz yok); `provideArn` ve tema kod bloklarıyla anlatılır |

### Sayfa: Installation (`/installation`, kategori Getting started)

Bölümler: `requirements`, `install`, `theme`, `configuration`, `imports`. Örnek yok, yalnız kod blokları (shell `shellscript`).

| Konu | Karar |
|---|---|
| Durum notu | `h1`'in hemen ardından `<p class="docs-note" role="note">` "Not on npm yet … 0.1.0". Overview'daki cümleye dokunulmadı; ikisi de 0.1.0'da güncellenir (ROADMAP Faz 5, iki madde). `.docs-note` global (`styles.css`): kenar + ton, yalnız renk değil |
| Gereksinimler | `installation.data.ts` `projects/ui/package.json`'ı `?source` ile alır; `peerDependencies(metin)` `unknown` → daraltma ile ayrıştırır (string olmayan aralık atılır). Sayfadaki liste ve spec aynı dosyadan: elle yazılmış sürüm yok |
| Adımlar | `local-package-test.md` çalıştırmalarında denenenler: `npm install @arn-ng/ui` (npm CDK peer'ını kendiliğinden kurar; 5. çalıştırma), `src/styles.css`'e `@import '@arn-ng/ui/theme.css';` (2.), `provideArn` (3.), `ARN_MESSAGES_TR` (4.), `@arn-ng/ui/ripple` (7.). Denenmeyenler yazılmadı: `angular.json` `styles`, başka paket yöneticileri ("not tried yet") |
| Entry point'ler | core, ripple, locales/tr, theme.css. Kök `@arn-ng/ui` boş (`export {};`), iç yollar çözülmez (7. çalıştırma). Boş pilot `@arn-ng/ui/button` listelenmez |
| Bağlantı | Yok: Configuration / Theming henüz yok |

**axe ile bulunan kusur:** `.docs-lead` içindeki satır içi kod rozeti açık temada `--arn-muted` üstünde ≈4.3:1 idi. Rozet artık kendi rengini taşır (`--arn-foreground`; `styles.css`, [docs-site.md](docs-site.md) §3); `styles.spec.ts` sabitler.

## 3. Token'lar

Yok.

## 4. Override rehberi

Yok (uygulama).

## 5. Davranış ve a11y

Yok (yalnız spec yardımcıları; `properties` mevcut tablonun a11y'sini kullanır, docs-site-toc-api.md §5).

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- ɵdir okuması Angular güncellemesinde bozulabilir; şekil spec'i (`expect-api.spec.ts`) bunu ilk yakalayan yerdir.
- `apiMismatches` tipleri, varsayılanları ve açıklamaları DENETLEMEZ; yalnız adlar.
- `tokenMismatches` varsayılan değeri denetlemez; tablodaki varsayılan elle tutulur.
- CSSOM seçiciyi yeniden yazar (öznitelik değerleri çift tırnakla); `elsewhere` seçicileri kaynaktaki yazımla birebir değildir.
- Fixture sınıflarına örnek alanı eklendi (`no-extraneous-class` kapatılmadı).
- **Bundle (prod, ölçüldü):** 3c-1b'de değişmedi. Ripple sayfasıyla initial 252.54 → 259.19 kB ham (69.87 → 73.17 kB aktarım); `main` 26.24 → 18.55 kB, yeni ortak initial parçalar (biri CDK `LiveAnnouncer`). Initial'da sayfa kodu, örnek metni ve Shiki YOK (grep'le doğrulandı): esbuild'in ana paketle sayfa arasında paylaşılan bağımlılıkları ortak parçaya ayırması (3b-1 önizlemesindeki örüntü). Sayfa parçası `ripple-page-component` 34.01 kB ham / 8.22 kB aktarım; `docs-highlight` ilk "Show code"da yüklenir (677.55 kB ham / 87.69 kB aktarım). Bütçe uyarısı yok. Installation ile initial 259.19 → 259.56 kB ham: yalnız `main` (+0.13, nav satırı) ve `styles` (+0.24, `.docs-note`); diğer initial parçalar hash'iyle aynı. Kod bloğu iki sayfanın ortak tembel parçasına çıktı (3.15 kB; Ripple parçası 34.01 → 31.11 kB), Installation parçası 6.24 kB.

## 8. Testler

| Spec | Kapsam |
|---|---|
| `api/testing/expect-api.spec.ts` | Bileşen grubu (önceki); directive: uyumlu → boş; eksik girdi, fazla girdi, eksik output → dolu liste; `ArnRippleDirective` adları; ɵdir şekli (`[string, number, null]` ve output haritası) sabit; bilinmeyen şekil ve Angular dışı sınıf → "cannot be read"; sarmalayıcı directive'te geçer |
| `api/testing/token-mismatches.spec.ts` | Fixture CSS: `@layer`, `@media` içinde `@supports`, seçici listesi, iç içe kural, `:root` dışı tanım, `--docs-*` atlanır; karşılaştırma: uyumlu, sıra, eksik, bilinmeyen, tekrar / kapsam dışı / `--arn-` olmayan, yalnız `:root` dışı, hem `:root` hem dışı; gerçek `theme.css`: metin okunur, ripple token'ları uyumlu, `:root` dışı yalnız `--arn-density` |
| `api/docs-table.spec.ts` | `properties`: başlık "Properties", sütun ve satırlar `inputs` ile aynı |
| `testing/links.spec.ts` | Slug → yol; gerçek gezinti; var olan sayfa (fragment / sorgu ile) kabul; dış bağlantı atlanır; olmayan sayfa, çıplak fragment ve göreli yol → dolu liste |
| `pages/ripple/ripple-page.component.spec.ts` | Tek `h1`, sayfa sınıfı; bölüm sırası (TOC); iç bağlantılar; tuzak metni; dört örnek ve her birinde HTML / TS / CSS sekmeleri; dört CSS'te `position: relative`; API directive ile, token'lar tema ile eşleşir, varsayılanlar temadaki değer; iki tablo başlığı ve satır adları; axe light / dark / RTL / compact |
| `pages/ripple/examples/*.example.spec.ts` | basic: yerel düğme ve ad, `position: relative`, basışta düğmenin içinde dalga, klavyede (Enter, Space, `click()`) dalga yok; config: etiketler, bölüm açıkken izleyen + her zaman açık dalgalanır, kapalıyken yalnız boş attribute; color: container'da verilen değer, dalga rengi aynı ifadeyle çözülür; centered: `aria-label`, SVG gizli, dalga merkezde (±1px), compact'ta ≥24px; hepsinde axe dört mod (dalgalı) |
| `pages/installation/installation-page.component.spec.ts` | Tek `h1`; durum notu `h1`'in ardında, "Not on npm yet" + 0.1.0; bölüm sırası; iç bağlantılar; örnek yok, beş kod bloğu; peer'lar `package.json`'la birebir ve sayfada adıyla / aralığıyla; ayrıştırıcı peer'sız ve string olmayan aralıkta; diller (`shellscript`, `css`, 3 × `typescript`); komutlar Verdaccio adımlarıyla aynı; adı geçen entry point'ler çözülür; axe dört mod |
| `src/styles.spec.ts` | Rozet silik metinde `--arn-foreground` taşır; `.docs-note` başlangıç kenarı + ton |

Boşluklar: gerçek `prefers-reduced-motion` ve gerçek dokunmatik basış tarayıcıda elle sınanır (directive'in kendi spec'i reduced-motion dalını sahte okuyucuyla kapsar, ripple.md §8).

## 9. Bağlantılar

- Kod: `projects/docs/src/app/api/testing/`, `projects/docs/src/app/api/docs-api.ts`, `api/docs-table.ts`
- İlgili: [docs-site-toc-api.md](docs-site-toc-api.md), [docs-site.md](docs-site.md), [ripple.md](ripple.md), [tokens.md](tokens.md)
