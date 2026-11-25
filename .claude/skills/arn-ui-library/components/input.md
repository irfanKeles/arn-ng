# input (`arnInput`)

<!-- En fazla 150 satır. Kurallar: ../rules/component-files.md. Karar: ../decisions/2026-11.md "arnInput ölçüm spike'ı". Durum: tasarım özeti; kod yok, input PR'ında güncellenir. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `input[arnInput]`, `textarea[arnInput]` (element yüzü yok) |
| Entry point | `@arn-ng/ui/input` (öneri) |
| Tür | directive (attribute seçicili `@Component`) |
| Sınıf adları | `ArnInput`; CSS `.arn-input`, öznitelik `data-size` |
| Kapsam | `type` text, email, password, search ve `<textarea>`. Kapsam dışı: number / date / file (ayrı tasarım), ikon / prefix / suffix (`arn-input-group`), etiket / ipucu / hata (`arn-field`) |
| Dosya yolları | `projects/ui/input/src/` (input PR'ında) |

## 2. Mimari ve CDK

- **Neden `@Component`:** stil `styleUrl` + `ViewEncapsulation.None` ile taşınır (ArnButton deseni). `@Directive` `styleUrl` almaz (`TS2353`, ölçüldü). Native eleman kalır: `type`, `name`, `autocomplete`, `required`, `aria-*` kendiliğinden çalışır.
- **Şablon `<ng-content />`:** boş şablonlu `@Component` `<textarea>` statik içeriğini siler (ölçüldü). `<ng-content />`'in koruduğu ÖLÇÜLMEDİ; input PR'ının ilk adımı, korumazsa belgelenir + kilit testi.
- **Config:** `injectArnConfig('size', this.inputSize)` → `data-size` (varsayılan `md`). Girdi adı `inputSize`: `size` yerel özniteliği gölgeler (`size="20"` `TS2322`, `size="xs"` DOM'da geçersiz öznitelik bırakır). `inputSize` yerel `size`'ı bozmaz (ölçüldü).
- **Yok:** `required` input'u (bağlamayı yutar, native öznitelik düşmez); `NgControl` enjeksiyonu; `aria-invalid` yazımı; CDK parçası. Durum gerekirse DOM'dan (MutationObserver) okunur.

## 3. Token'lar

Öneri; input PR'ında kesinleşir. Bileşen token'ı tanımlanmaz, yedekle okunur; seçiciler `:where()` içinde ([button.md](button.md) §3, `_TEMPLATE.md`).

| Ad | Yedek (öneri) | Bağlı anlamlı token |
|---|---|---|
| `--arn-input-height` | `max(var(--arn-control-min-size), calc(var(--arn-control-height-<boyut>) * var(--arn-density)))` | `--arn-control-*`, `--arn-density` |
| `--arn-input-padding-inline` | `calc(var(--arn-control-padding-inline-<boyut>) * var(--arn-density))` | aynı |
| `--arn-input-font-size` | `var(--arn-control-font-size-<boyut>)`; `@media (pointer: coarse)`'ta beş boyutta `1rem` | aynı |
| `--arn-input-radius` | `calc(var(--arn-radius) * 0.8)` | `--arn-radius` |
| `--arn-input-bg` | `transparent`; salt okunurda (`[readonly]`) `--arn-muted` (tasarım kararı) | `--arn-muted` |
| `--arn-input-fg` | `--arn-foreground` | |
| `--arn-input-border-color` | `--arn-input` (global anlamlı token; ad yakınlığı belgelenir) | `--arn-input` |
| `--arn-input-border-color-hover` | `color-mix(in oklab, var(--arn-input) 70%, var(--arn-foreground))`; yalnız hover yapabilen cihazda (`@media (hover: hover)`), devre dışı ve salt okunurda uygulanmaz | `--arn-input`, `--arn-foreground` |
| `--arn-input-placeholder-color` | `--arn-muted-foreground` | |
| `--arn-input-ring-color` | `--arn-ring`; hata durumunda `--arn-destructive` | |
| `--arn-input-border-color-invalid` | `--arn-destructive` | |
| `--arn-input-min-block-size` | `4rem` (yalnız `<textarea>`, `field-sizing: content` ile) | |

## 4. Override rehberi

- **Global:** `:root { --arn-input-radius: …; }` ya da anlamlı token (`--arn-input`, `--arn-ring`).
- **Container:** `.form-dense { --arn-input-height: 2rem; }` (host'ta tanım olmadığı için içteki girdiler izler).
- **Tek örnek:** tek sınıf yeter; `:where()` sayesinde kütüphane kuralını yener.

## 5. Durumlar ve a11y

| Tuş | Davranış |
|---|---|
| Tab | Odak (native) |

- **Odak:** `:focus-visible` halkası (button gibi `box-shadow`). Metin input'unda `:focus-visible` fareyle odakta da eşleşir (üç motorda ölçüldü).
- **Hata görünümü:** `[aria-invalid=true], :user-invalid:not([aria-invalid=false])` (birleşim ÖLÇÜLMEDİ). `ng-*` sınıflarına dayanmaz (`[formField]`'da yok). `:user-invalid` yalnız yaz+sil+blur sonrası eşleşir, `aria-invalid` onu değiştirmez (ölçüldü). `aria-invalid`'i arnInput yazmaz; sahibi `arn-field` planında.
- **disabled / readonly:** native öznitelikler; formdan gelen disabled native `disabled` yazar (dört yolda ölçüldü).
- **Placeholder ve yüzen etiket:** "boş mu" yalnız CSS ile (`:placeholder-shown`, `placeholder=" "`); `input` olayı programatik yazımı kaçırır (ölçüldü).
- **Autofill:** `:autofill` ve `:-webkit-autofill` ayrı kural (üçü de parse oluyor; Firefox / WebKit `-webkit-` biçimini `:autofill`'e çevirir). Gerçek autofill davranışı ÖLÇÜLMEDİ.
- **Mobil:** yazı masaüstünde 14px, `@media (pointer: coarse)`'ta beş boyutun hepsi 16px (iOS Safari odak zoom'u). iOS'ta ÖLÇÜLMEDİ; xs yüksekliği 24px kalır, coarse'ta gözle kontrol edilecek.
- **textarea:** `field-sizing: content` + `min-block-size: 4rem`: boş 64px, 10 satırda 200px (üç motorda ölçüldü).

## 6. Form uyumu

Yerel eleman: CVA / FVC uygulanmaz, Angular'ın `DefaultValueAccessor`'ı kullanılır. Dört yolun ölçülmüş davranışı: [rules/forms-a11y.md](../rules/forms-a11y.md) "Yerel input/textarea direktifi". Doğrulama için yerel `required` özniteliği birincil yol (`Validators.required` DOM'a yazmaz). Peer `@angular/forms ^22.2.5` input PR'ında `projects/ui/package.json`'a eklenir.

## 7. Kısıtlar ve kararlar

- `aria-invalid` host bağlaması reddedildi: tüketicinin statik değerini ve bağlamasını ilk render'da ezer, `null` statik özniteliği siler (ölçüldü).
- `required` input'u reddedildi: `[required]` bağlaması native özniteliğe ulaşmaz (ölçüldü).
- `NgControl` enjekte edilmez: FESM'e `@angular/forms` import'u koyar (ölçüldü). Dört yolda okunabildiği ölçüldü; `arn-field` için karar orada.
- Reddedilen: `<arn-input>` elemanı (ArnButton ile aynı gerekçe: öznitelikleri iç elemana iletme riski).

## 8. Testler

Input PR'ında yazılır. Planlanan kilitler: dört form yolu (forms-a11y tablosu), `<textarea>` statik içeriği, `required` input'u yok, `aria-invalid` yazılmaz, FESM import'ları ↔ peer listesi, coarse'ta 16px, axe, üç motor.

## 9. Bağlantılar

- Kod: `projects/ui/input/src/` (input PR'ında), `projects/ui/theme.css`
- İlgili: `arn-input-group`, `arn-field` (ROADMAP Faz 4)
