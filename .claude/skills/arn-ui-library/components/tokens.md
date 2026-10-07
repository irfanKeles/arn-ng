# tokens (tema ve global token'lar)

<!-- En fazla 150 satır. Boyut (xs-xl) ve density bölümü Faz 2 adım (b) ile eklenecek; sığmazsa tokens-<konu>.md olarak bölünür. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | Yok (CSS dosyası) |
| Entry point | `@arn-ng/ui/theme.css` (JS entry point değil; `exports`'ta `style` + `default` koşulu) |
| Tür | ortak yapı |
| Sınıf adları | CSS: `.dark`, `.light` |
| Dosya yolları | `projects/ui/theme.css`, `projects/ui/testing/theme.spec.ts` |

Tüketici bir kez ekler: `@import '@arn-ng/ui/theme.css';` (veya `angular.json` `styles`). Dosya yalnızca token ve `color-scheme` içerir; `body` dahil hiçbir elemanı boyamaz.

## 2. Mimari

- **Katmanlar:** ham (palet) → anlamlı, ikisi de `:root`'ta. Bileşen katmanı (`--arn-<bileşen>-<özellik>`) burada DEĞİL, bileşenin kendi stil dosyasında durur ve anlamlı token'a bağlanır.
- **Paketleme:** `projects/ui/ng-package.json` `assets` → `dist/ui/theme.css`; `projects/ui/package.json` `exports["./theme.css"]`. Kaynak proje kökünde durur çünkü `node_modules/@arn-ng/ui` workspace symlink'i kaynağı gösterir; aynı göreli yol kaynakta da `dist`'te de geçerli olur.
- **Dark mode:** her anlamlı renk `light-dark(açık, koyu)`. `:root { color-scheme: light dark }` sistem tercihini izler; `.dark { color-scheme: dark }`, `.light { color-scheme: light }` zorlar. `light-dark()` kullanıldığı elemanda çözülür, bu yüzden sınıflar iç içe çalışır ve native kontroller/scrollbar da uyar.
- **Öncelik:** en yakın `.dark` / `.light` sınıfı > sistem tercihi.

## 3. Token'lar

### Ham (palet)

Kaynak: Tailwind neutral / red. Yazım Stylelint'e göre (`oklch(L% C Hdeg)`); shadcn `oklch(0.985 0 0)` yazar, değer aynıdır.

| Ad | L | Ad | L |
|---|---|---|---|
| `--arn-white` | 100% | `--arn-neutral-500` | 55.6% |
| `--arn-neutral-50` | 98.5% | `--arn-neutral-600` | 43.9% |
| `--arn-neutral-100` | 97% | `--arn-neutral-700` | 37.1% |
| `--arn-neutral-200` | 92.2% | `--arn-neutral-800` | 26.9% |
| `--arn-neutral-300` | 87% | `--arn-neutral-900` | 20.5% |
| `--arn-neutral-400` | 70.8% | `--arn-neutral-950` | 14.5% |

`--arn-red-400`: `oklch(70.4% 0.191 22.216deg)`, `--arn-red-600`: `oklch(57.7% 0.245 27.325deg)`. Neutral'da C ve H sıfırdır.

### Anlamlı: renk

shadcn karşılığı: aynı ad, `--arn-` öneksiz (`--arn-primary` ↔ `--primary`).

| Ad | Açık | Koyu |
|---|---|---|
| `--arn-background` | white | neutral-950 |
| `--arn-foreground` | neutral-950 | neutral-50 |
| `--arn-card`, `--arn-popover` | white | neutral-900 |
| `--arn-card-foreground`, `--arn-popover-foreground` | neutral-950 | neutral-50 |
| `--arn-primary` | neutral-900 | neutral-200 |
| `--arn-primary-foreground` | neutral-50 | neutral-900 |
| `--arn-secondary`, `--arn-muted`, `--arn-accent` | neutral-100 | neutral-800 |
| `--arn-secondary-foreground`, `--arn-accent-foreground` | neutral-900 | neutral-50 |
| `--arn-muted-foreground` | neutral-500 | neutral-400 |
| `--arn-destructive` | red-600 | red-400 |
| `--arn-border` | neutral-200 | `oklch(100% 0 0deg / 10%)` |
| `--arn-input` | neutral-200 | `oklch(100% 0 0deg / 15%)` |
| `--arn-ring` | neutral-400 | neutral-500 |

### Anlamlı: ölçek

| Ad | Varsayılan | Not |
|---|---|---|
| `--arn-radius` | `0.625rem` | Taban |
| `--arn-radius-sm` / `-md` / `-lg` | taban × 0.6 / 0.8 / 1 | shadcn çarpanları |
| `--arn-radius-xl` / `-2xl` / `-3xl` / `-4xl` | taban × 1.4 / 1.8 / 2.2 / 2.6 | |
| `--arn-font-sans` | `ui-sans-serif, system-ui, sans-serif` + emoji fontları | shadcn font dayatmaz |
| `--arn-font-mono` | `ui-monospace, 'SFMono-Regular', 'Menlo'…` | |
| `--arn-text-xs` / `-sm` / `-base` / `-lg` / `-xl` | 0.75 / 0.875 / 1 / 1.125 / 1.25rem | Her biri için `--arn-text-<adım>-line-height` var |
| `--arn-font-weight-normal` / `-medium` / `-semibold` | 400 / 500 / 600 | |
| `--arn-spacing` | `0.25rem` | Bileşen `calc(var(--arn-spacing) * n)` yazar |
| `--arn-border-width` | `1px` | |
| `--arn-ring-width` | `3px` | shadcn focus ring kalınlığı |

`--arn-radius-sm` ve `--arn-text-sm` ölçeğin adımıdır; bileşen boyutu (`size="sm"`) DEĞİLDİR. Boyut → ölçek eşlemesi adım (b)'de gelir.

## 4. Override rehberi

Tüketicinin kuralı `theme.css` import'undan SONRA gelmelidir (aynı özgüllük, sıra belirler).

- **Global:** `:root { --arn-primary: light-dark(oklch(…), oklch(…)); --arn-radius: 0.5rem; }`
- **Yalnızca koyu:** `.dark { --arn-primary: oklch(…); }` Bu yalnızca sınıfla zorlanan koyuyu etkiler; sistem tercihiyle gelen koyuyu da kapsamak için `light-dark()` kullan.
- **Container:** `.panel { --arn-primary: …; }` anlamlı token'ı o alt ağaçta değiştirir.
- **Tek örnek:** bileşen token'ı ile (bileşenin referans dosyasına bak).
- **Sayfayı boyamak:** `body { background: var(--arn-background); color: var(--arn-foreground); font-family: var(--arn-font-sans); }` (örnek: `projects/docs/src/styles.css`).

**Tuzak (türetilmiş token'lar):** `var()` tanımlandığı elemanda (`:root`) çözülür. Bu yüzden bir container'da `--arn-radius` veya `--arn-neutral-900` değiştirmek, ondan türeyen `--arn-radius-sm` veya `--arn-primary`'yi DEĞİŞTİRMEZ. Tabanı `:root`'ta değiştir ya da container'da türetilmiş token'ı doğrudan yaz. (`light-dark()` bu kuralın dışındadır; kullanıldığı elemanda çözülür.) Spec bu davranışı sabitler.

## 5. Davranış ve a11y

Kontrast: `foreground`/`background`, `primary-foreground`/`primary` ve `muted-foreground`/`background` çiftleri shadcn değerleridir; bileşen spec'lerindeki axe testi `theme.css` yüklüyken koşar (`angular.json` → ui `test.options.styles`).

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **shadcn'den sapmalar:** (1) dark mode `.dark` bloğunda yeniden tanımlama yerine `light-dark()`; gerekçe: değerler tek yerde, iç içe tema ve sistem tercihi bedava. (2) `.light` sınıfı eklendi. (3) oklch yazımı (yüzde ve `deg`); gerekçe: Stylelint kuralı kapatmamak. (4) `--arn-` öneki.
- **Eklenmeyenler:** `chart-*`, `sidebar-*` (ilgili bileşen yok; iki resmi shadcn kaynağı chart için farklı değer veriyor), `success/warning/info` (shadcn'de yok), `destructive-foreground` (güncel shadcn'de yok). İhtiyaç duyan bileşenle ayrı karar.
- **Tarayıcı tabanı:** `light-dark()` → Chrome 123, Firefox 120, Safari 17.5. Fallback yok (SKILL §1 hedef tarayıcı).
- `sideEffects: false` kaldı; CSS, `styles` veya CSS `@import` ile eklenir, JS'ten import edilmez.
- Font adları büyük harf içeriyorsa tırnaklanır (Stylelint `value-keyword-case`); `-apple-system`/`BlinkMacSystemFont` yerine `system-ui`.
- Docs'ta `@import url('…')` yazımı Stylelint `import-notation` gereğidir.

## 8. Testler

`projects/ui/testing/theme.spec.ts`: tüm anlamlı token'lar tanımlı; sınıfsız durumda sistem tercihi; `.dark` / `.light` zorlaması; iç içe sınıflar; radius ölçeği ve türetilmiş token tuzağı. Paketlenmiş hali `local-package-test.md` akışıyla sınandı (2026-10: tüketici `@import` + `ng build`). Boşluk: gerçek tarayıcıda görsel karşılaştırma yok (docs tema sayfası Faz 3).

## 9. Bağlantılar

- Kod: `projects/ui/theme.css`, `projects/ui/ng-package.json`, `projects/ui/package.json`
- Kaynaklar: https://ui.shadcn.com/docs/theming , https://ui.shadcn.com/r/colors/neutral.json , Tailwind `packages/tailwindcss/theme.css`
- Doküman sayfası: Faz 3 (Tema ve token'lar)
