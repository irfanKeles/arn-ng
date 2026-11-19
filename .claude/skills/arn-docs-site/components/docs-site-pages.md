# docs-site-pages (doküman sayfalarının doğrulama yardımcıları)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Sayfaların kendisi: docs-site-pages-guides.md. Ana dosya: docs-site.md; tablolar: docs-site-toc-api.md. Kurallar: ../SKILL.md, ../../arn-ui-library/rules/docs-page.md, ../../arn-ui-library/rules/component-files.md; kararlar: ../../arn-ui-library/decisions/. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | Yok |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (spec yardımcıları + tablo türü) |
| Sınıf adları | `apiMismatches` (directive desteğiyle), `directiveTemplateNames`, `scanTokens`, `tokenMismatches`, `scanTokenReferences`, `componentTokenMismatches`, `themeStyleSheet`, `unknownInternalLinks`, `docsPaths`, `renderExample`, `A11Y_MODES`, `pageOverflow`, `expectNoPageOverflow`; tipler `DocsApiTemplateNames`, `DocsTokenScan`, `RenderedExample`; tablo türü `properties` |
| Dosya yolları | `projects/docs/src/app/api/testing/` (`expect-api.ts`, `token-mismatches.ts`, `theme-source.ts`), `testing/links.ts`, `testing/render-example.ts`, `testing/page-overflow.ts`, `api/docs-api.ts`, `api/docs-table.ts` |

Adım 3c-1b ve sonrası. Yardımcılar yalnız spec'lerde kullanılır (`properties` bir tablo türü); üretim paketine girmez. Sayfalar (Ripple, Installation, Configuration…): [docs-site-pages-guides.md](docs-site-pages-guides.md).

## 2. Mimari ve CDK

### API karşılaştırması: bileşen ve directive

`apiMismatches(type, { inputs, outputs })` önce `reflectComponentType` (Angular 22'de `@publicApi`) dener; `null` gelirse (directive) `directiveTemplateNames`'e düşer.

| Parça | Davranış |
|---|---|
| `directiveTemplateNames(type)` | `Reflect.get(type, 'ɵdir')` → `inputs` / `outputs` haritalarının ANAHTARLARI (template adları). Yalnız ad kullanılır; değerler (küçültülmüş ad, bayrak, transform) karşılaştırmaya girmez |
| Şekil denetimi | Harita bir nesne (dizi değil) ve her değer ya string ya boş olmayan dizi olmalı; değilse `null` → "cannot be read" satırı. Yanlış cevap yerine sesli düşme |
| `any` yok | Tanım `unknown` olarak alınır, `typeof` / `Array.isArray` ile daraltılır |
| Mesajlar | "the code has it, the table does not" / "the table has it, the code does not" (bileşen ve directive için aynı) |

ɵdir şekli (Angular 19 ile yazıldı; Angular 22.2'de şekil spec'i `expect-api.spec.ts` geçiyor): `inputs: { arnRipple: ['arnRipple', 1, null], … }`, `outputs: { ad: 'ad' }`. Signal input'ta `transform` signal'in içindedir; üçüncü eleman `null` kalır (`transform: booleanAttribute` olsa da).

**Neden ɵ:** directive'in girdilerini okuyan public API yok. B (bilinen girdiyi şablonda bağlamak) belgelenmemiş girdiyi yakalamaz; C (`.d.ts` metnini ayrıştırmak) `dist`'e bağlanır. ɵ yalnız test kodunda; kütüphaneye GİRMEZ ([karar](../../arn-ui-library/decisions/2026-10.md)).

### Token karşılaştırması: `tokenMismatches`

| Parça | Davranış |
|---|---|
| `themeStyleSheet()` | `projects/ui/theme.css`'i (kaynak; `dist/ui`'deki kopyası aynı) `?source` ile metin olarak alır, `new CSSStyleSheet().replaceSync()` ile ayrıştırır. `document.styleSheets` KULLANILMAZ: spec'te render edilen bileşen stilleri ölçümü kirletirdi |
| `scanTokens(sheet)` | Kuralları özyinelemeli dolaşır: `@layer`, `@media`, `@supports`, `@container`, iç içe stil kuralları (`cssRules` taşıyan her kural), `@import` (`styleSheet`). Yalnız `--arn-*`; `--docs-*` ve sıradan özellikler atlanır |
| `:root` ayrımı | Seçici listesinde `:root` geçen kural (`:root, .x` dahil, hangi derinlikte olursa) → `root`; diğerleri `elsewhere` (ad → seçiciler) |
| `tokenMismatches(rows, scan, inScope)` | İki yönlü, yalnız `inScope(ad)` olanlar (ör. `--arn-ripple-` öneki): eksik, bilinmeyen, tekrar eden, kapsam dışı, `--arn-` olmayan satır; yalnız `:root` dışında tanımlı ad seçicileriyle raporlanır. Boş liste = uyumlu |

`theme.css`'te `:root` dışında tanımlı tek `--arn-*`: `--arn-density` (`[data-density="comfortable"]`, `[data-density="compact"]`; `:root`'ta da var). Spec bunu sabitler: başka bir `:root` dışı tanım eklenirse test düşer ve karar gerekir.

### Bileşen token'ları: `componentTokenMismatches`

Bileşen token'ı tanımlanmaz, yedekle okunur (`rules/styling.md`). `scanTokenReferences(sheet)` kural metninden (`style.cssText`: `var()`'lı shorthand'in longhand'leri CSSOM'da boş okunur) her `var(--arn-…` adını toplar, `@media` ve iç içe kurallar dahil. `componentTokenMismatches(rows, sheet, inScope)`: tablo = okunan adlar (eksik, bilinmeyen, tekrar, kapsam dışı) ve kapsamdaki hiçbir ad tanımlı değil (tanım bulunursa seçicisiyle). Bileşen CSS'i `?source` ile alınır (Button: `ui/button/src/button.css`). Host directive girdileri `reflectComponentType`'ta görünmez; Button sayfası ripple alias'larını AOT derlenen bir probe şablonuyla sınar.

### Tablo türü `properties`

`DocsApiTable`'a `{ kind: 'properties'; rows: readonly DocsApiInput[] }`: sütunlar `inputs` ile aynı (Name, Type, Default, Description), başlık "Properties". Şablon girdisi olmayan alanlar için. İlk kullanım Configuration sayfasında `ArnConfig` (satırlar `Record<keyof ArnConfig, …>` ile anahtarlı).

### İç bağlantılar: `unknownInternalLinks`

`testing/links.ts`: kökün altındaki her `a[href]`'i `DOCS_NAV` yollarıyla (`/`, `/<slug>`) karşılaştırır; sorgu ve fragment atılır, `http(s):` / `mailto:` atlanır, çıplak `#fragment` HATADIR (`<base href>` ana sayfaya götürür). Her sayfa spec'i boş liste bekler: var olmayan sayfaya bağlantı verilmez. Sayfalar arası bağlantı `routerLink` ile (tam sayfa yenilemesi yok); bu yüzden sayfa spec'leri `provideRouter([])` verir.

### Örnek render'ı: `renderExample`, `A11Y_MODES`

`testing/render-example.ts` (Configuration ile ortak oldu, önce Ripple klasöründeydi): `provideArn({ applyToDocument: true })` + isteğe bağlı config ile render; `A11Y_MODES` light / dark / RTL / compact. Ripple'a özgü işaretçi ve klavye yardımcıları `pages/ripple/examples/ripple-example.testing.ts`'te kalır (ortakları yeniden dışa açar).

### Sayfa taşması: `pageOverflow`, `expectNoPageOverflow`

`testing/page-overflow.ts`. Her sayfa spec'inde (ve bundan sonraki her sayfada) "320px'te sayfa taşmaz" testi. Eleman yerinden alınır, taban ölçülür (`max(scrollWidth, clientWidth)`: kodun yorumuna göre test çalıştırıcısının kendi sayfası pencereden birkaç px taşabilir; Karma'nın raporlayıcısı taşıyordu, Vitest'in sayfasında taşıp taşmadığı ölçülmedi, taban korunuyor), sonra **pencerenin sağ kenarına yaslı** 320px'lik kapsayıcıya konur ve `document.documentElement.scrollWidth`'in tabandan büyümediği ölçülür. Sağ kenara yaslamak şart: test penceresi 320px'ten geniş (Vitest `browserViewport: "800x600"`; Karma'da ~734px idi); ortada duran 320px kapsayıcıdan kaçan metin pencere içinde kalır ve belgeyi genişletmez (ilk sürüm 3c fix'teki hatayı bu yüzden kaçırdı; yaslı sürüm 63px yakaladı). `.docs-page.scrollWidth` ölçülmez: kaydırma kapsayıcısından kaçan mutlak eleman atalarını genişletmez. Yalnız LTR.

Örnek bloğuna önleyici `position: relative` VERİLMEZ (karar): konumsuz host, örnek CSS'inde eksik `position: relative`'i görünür kılar; konumlamak "kopyalanınca çalışır" kuralının ihlalini maskelerdi.

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
- Bir servisin public metotlarını karşılaştıran genel yardımcı YOK: TypeScript `private`'ı çalışma anında görünmez. Configuration sayfa spec'i bunu bilinen `private` listesiyle yapar ([docs-site-pages-guides.md](docs-site-pages-guides.md)).

## 8. Testler

| Spec | Kapsam |
|---|---|
| `api/testing/expect-api.spec.ts` | Bileşen grubu (önceki); directive: uyumlu → boş; eksik girdi, fazla girdi, eksik output → dolu liste; `ArnRippleDirective` adları; ɵdir şekli (`[string, number, null]` ve output haritası) sabit; bilinmeyen şekil ve Angular dışı sınıf → "cannot be read"; sarmalayıcı directive'te geçer |
| `api/testing/token-mismatches.spec.ts` | Fixture CSS: `@layer`, `@media` içinde `@supports`, seçici listesi, iç içe kural, `:root` dışı tanım, `--docs-*` atlanır; karşılaştırma: uyumlu, sıra, eksik, bilinmeyen, tekrar / kapsam dışı / `--arn-` olmayan, yalnız `:root` dışı, hem `:root` hem dışı; gerçek `theme.css`: metin okunur, ripple token'ları uyumlu, `:root` dışı yalnız `--arn-density`; `scanTokenReferences` (yedek, shorthand, `@media`, iç içe) ve `componentTokenMismatches` (uyumlu, eksik / bilinmeyen / tekrar / kapsam dışı, tanımlı token) |
| `api/docs-table.spec.ts` | `properties`: başlık "Properties", sütun ve satırlar `inputs` ile aynı |
| `testing/links.spec.ts` | Slug → yol; gerçek gezinti; var olan sayfa (fragment / sorgu ile) kabul; dış bağlantı atlanır; olmayan sayfa, çıplak fragment ve göreli yol → dolu liste |
| `testing/page-overflow.spec.ts` | Sarılan metin 0; kendi kapsayıcısında kayan geniş içerik 0; konumsuz kaydırma kapsayıcısından kaçan mutlak eleman > 0, kapsayıcı konumlanınca 0; eleman yerine döner |

## 9. Bağlantılar

- Kod: `projects/docs/src/app/api/testing/`, `projects/docs/src/app/testing/`, `api/docs-api.ts`, `api/docs-table.ts`
- İlgili: [docs-site-pages-guides.md](docs-site-pages-guides.md), [docs-site-toc-api.md](docs-site-toc-api.md), [docs-site.md](docs-site.md)
