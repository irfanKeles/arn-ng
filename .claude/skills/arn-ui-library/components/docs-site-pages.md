# docs-site-pages (3c sayfaları ve doğrulama yardımcıları)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Ana dosya: docs-site.md; tablolar: docs-site-toc-api.md. Kurallar: ../SKILL.md §13, §16, §18. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | Yok (bu adımda sayfa yok; sayfalar 3c'nin sonraki commit'lerinde bu dosyaya eklenir) |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (spec yardımcıları + tablo türü) |
| Sınıf adları | Fonksiyonlar `apiMismatches` (directive desteğiyle), `directiveTemplateNames`, `scanTokens`, `tokenMismatches`, `themeStyleSheet`; tipler `DocsApiTemplateNames`, `DocsTokenScan`; tablo türü `properties` |
| Dosya yolları | `projects/docs/src/app/api/testing/` (`expect-api.ts`, `token-mismatches.ts`, `theme-source.ts`), `api/docs-api.ts`, `api/docs-table.ts` |

Adım 3c-1b. Hepsi yalnız spec'lerde kullanılır (`properties` hariç: o bir tablo türü); üretim paketine girmez.

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
- **Bundle:** değişmedi (yardımcılar spec'te, `properties` kullanılmıyor); initial 252.54 kB, dosya adları önceki commit'le aynı.

## 8. Testler

| Spec | Kapsam |
|---|---|
| `api/testing/expect-api.spec.ts` | Bileşen grubu (önceki); directive: uyumlu → boş; eksik girdi, fazla girdi, eksik output → dolu liste; `ArnRippleDirective` adları; ɵdir şekli (`[string, number, null]` ve output haritası) sabit; bilinmeyen şekil ve Angular dışı sınıf → "cannot be read"; sarmalayıcı directive'te geçer |
| `api/testing/token-mismatches.spec.ts` | Fixture CSS: `@layer`, `@media` içinde `@supports`, seçici listesi, iç içe kural, `:root` dışı tanım, `--docs-*` atlanır; karşılaştırma: uyumlu, sıra, eksik, bilinmeyen, tekrar / kapsam dışı / `--arn-` olmayan, yalnız `:root` dışı, hem `:root` hem dışı; gerçek `theme.css`: metin okunur, ripple token'ları uyumlu, `:root` dışı yalnız `--arn-density` |
| `api/docs-table.spec.ts` | `properties`: başlık "Properties", sütun ve satırlar `inputs` ile aynı |

## 9. Bağlantılar

- Kod: `projects/docs/src/app/api/testing/`, `projects/docs/src/app/api/docs-api.ts`, `api/docs-table.ts`
- İlgili: [docs-site-toc-api.md](docs-site-toc-api.md), [docs-site.md](docs-site.md), [ripple.md](ripple.md), [tokens.md](tokens.md)
