# tokens-sizes (boyut ve density token'ları)

<!-- En fazla 150 satır. tokens.md'nin devamıdır: renk, radius, yazı ölçeği ve tema orada. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | CSS: `[data-density='comfortable']`, `[data-density='compact']` |
| Entry point | `@arn-ng/ui/theme.css` (ayrı dosya değil) |
| Tür | ortak yapı |
| Sınıf adları | Yok |
| Dosya yolları | `projects/ui/theme.css`, `projects/ui/testing/theme.spec.ts` |

Kapsam yalnızca CSS'tir. `size` / `density` TS tipleri, input'ları ve DI `provideArn` ile gelir (ROADMAP Faz 2).

## 2. Mimari

- **Kontrol token'ları** (`--arn-control-*`) anlamlı katmandadır, `:root`'ta durur. "Bu boyutta bir kontrol ne kadardır" sorusunun paylaşılan cevabıdır: button, input, select tetikleyicisi aynı satırda hizalanır.
- **Sabit değerdir, `var()` içermez.** `--arn-control-font-size-sm: var(--arn-text-sm)` yazılsaydı tokens.md §4'teki tuzak oluşurdu. Sabit oldukları için container'da tek tek değiştirilebilirler.
- **Density uygulanmamış ham ölçüdür.** Çarpan ve taban bileşen host'unda uygulanır.
- **Sınır:** bileşen token'ı (`--arn-button-height`) bileşenin kendi host'unda, seçili boyutun kontrol token'ından hesaplanır. Bileşen CSS'i özelliklerde yalnızca kendi token'ını kullanır (`block-size: var(--arn-button-height)`).
- **Density:** `--arn-density` çarpanı. `:root`'ta 1; `[data-density='compact']` 0.875, `[data-density='comfortable']` 1 yapar. Kalıtımla iner, en yakın `data-density` geçerlidir, iç içe çalışır.
- **Kural sırası:** `[data-density]` kuralları `:root` bloğundan SONRA durur. İkisi aynı özgüllüktedir (0,1,0); `<html data-density="compact">` ancak bu sırayla çalışır. Spec sabitler.

### Host'ta hesaplama örüntüsü (SKILL §5)

```css
:host {
  --arn-button-height: max(
    var(--arn-control-min-size),
    calc(var(--arn-control-height-md) * var(--arn-density))
  );
  --arn-button-padding-inline: calc(var(--arn-control-padding-inline-md) * var(--arn-density));
  --arn-button-font-size: var(--arn-control-font-size-md);
  --arn-button-icon-size: var(--arn-control-icon-size-md);
  --arn-button-gap: var(--arn-control-gap-md);
  --arn-button-radius: calc(var(--arn-radius) * 0.8);
  block-size: var(--arn-button-height);
}
```

- Density yalnızca yükseklik ve `padding-inline`'a uygulanır. Yazı, ikon ve gap'e uygulanmaz.
- `--arn-<bileşen>-height` `max()`'li değeri taşır; taban yalnızca yüksekliğe uygulanır.
- Radius adımı host'ta `--arn-radius`'tan hesaplanır; `--arn-radius-md` KULLANILMAZ (container'da tabanı izlemez).

## 3. Token'lar

| Token | xs | sm | md | lg | xl |
|---|---|---|---|---|---|
| `--arn-control-height-<boyut>` | 1.5rem | 2rem | 2.25rem | 2.5rem | 3rem |
| `--arn-control-padding-inline-<boyut>` | 0.5rem | 0.75rem | 1rem | 1.5rem | 2rem |
| `--arn-control-font-size-<boyut>` | 0.75rem | 0.875rem | 0.875rem | 0.875rem | 1rem |
| `--arn-control-icon-size-<boyut>` | 0.75rem | 1rem | 1rem | 1rem | 1.25rem |
| `--arn-control-gap-<boyut>` | 0.25rem | 0.375rem | 0.5rem | 0.5rem | 0.5rem |

| Token | Varsayılan | Not |
|---|---|---|
| `--arn-control-min-size` | `1.5rem` | Density sonrası yükseklik tabanı: 24 CSS px, WCAG 2.2 SC 2.5.8 (Target Size, Minimum) |
| `--arn-density` | `1` | Birimsiz çarpan; compact `0.875` |

Varsayılan boyut `md`. Satır yüksekliği token'ı yok: kontrol sabit yükseklikte, içerik ortalanır.

### Host'ta çıkan yükseklik (kök 16px)

| Density | xs | sm | md | lg | xl |
|---|---|---|---|---|---|
| comfortable | 24px | 32px | 36px | 40px | 48px |
| compact | **24px** | 28px | 31.5px | 35px | 42px |

- Compact xs çarpanla 21px olurdu; taban 24px'te tutar. xs iki density'de aynı yüksekliktedir, yalnızca padding'i küçülür (8px → 7px).
- Compact md 31.5px kesirlidir; yuvarlama YOK (karar). Gerekirse bileşende `round()` ayrı karar.

## 4. Override rehberi

- **Global:** `:root { --arn-control-height-md: 2.5rem; }` ya da `<html data-density="compact">`.
- **Container:** `<section data-density="compact">`; ya da `.toolbar { --arn-control-height-sm: 1.75rem; }`. Host kalıtımla alır.
- **Tek örnek:** bileşen token'ı ile (`--arn-button-height`); bileşenin referans dosyasına bak.
- **Özel density:** `.dense { --arn-density: 0.8; }` çalışır ama desteklenen değerler comfortable ve compact'tır.
- **Uyarı:** `--arn-control-min-size`'ı 1.5rem'in altına indirmek SC 2.5.8'i bozar.

## 5. Davranış ve a11y

24 CSS px tabanı CSS'te `max()` ile zorlanır, bileşene bırakılmaz. Yazı boyutu density'den etkilenmez (okunabilirlik).

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

**shadcn karşılaştırması** (new-york-v4 `button.tsx`, 2026-10-07'de doğrulandı):

| shadcn | yükseklik | padding-x | yazı | gap | ikon |
|---|---|---|---|---|---|
| `xs` | `h-6` | `px-2` | `text-xs` | `gap-1` | `size-3` |
| `sm` | `h-8` | `px-3` | `text-sm` | `gap-1.5` | `size-4` |
| `default` (bizde `md`) | `h-9` | `px-4` | `text-sm` | `gap-2` | `size-4` |
| `lg` | `h-10` | `px-6` | `text-sm` | `gap-2` | `size-4` |

- xs-lg değerleri birebir shadcn. Ad sapması: `default` → `md`.
- **`xl` bizim ekimiz** (shadcn'de yok). Yükseklik 3rem (`h-12`). Padding 2rem: shadcn adımları 2 → 3 → 4 → 6, sıradaki 8; padding/yükseklik oranı 0.33 → 0.67 tekdüze artar. Yazı 1rem: 48px'te 14px küçük kalır. İkon 1.25rem: ikon/yükseklik oranı (0.42) md-lg bandında (0.44-0.40). Gap 0.5rem: shadcn `default`'tan sonra büyütmüyor.
- **Density bizim ekimiz**; shadcn'de yok.
- shadcn input'ta boyut varyantı yok (`h-9 px-3 text-base md:text-sm`). md'de input padding'i (0.75rem) kontrol token'ından (1rem) farklı; input kendi token'ında sapma olarak çözer (Faz 4).
- shadcn ikonlu butonda padding'i daraltır (`has-[>svg]:px-3`) ve `icon-*` boyutları var; button kararı (Faz 4).
- **Faz 4'e not:** `:host([data-size='sm'])` gibi boyut seçicisi tüketicinin tek sınıflı override'ından özgül olur; button yazılırken `:where()` ile ele alınacak.
- **Dosya yeri:** ayrı CSS dosyası reddedildi (ikinci `exports`/import, unutulursa sıfır yükseklik). `theme.css` içinde.
- **Tarayıcı:** `max()` / `calc()` evergreen; taban değişmedi.

## 8. Testler

`projects/ui/testing/theme.spec.ts`. Henüz bileşen yok; spec host'u taklit eden geçici bir deneme elemanı (`probe`) kullanır, örüntü §2'dekiyle aynıdır. Kapsanan: token'lar tanımlı ve beklenen rem'e çözülür; yükseklik xs → xl artar; density yokken çarpan 1; compact'ta yükseklik ve padding × 0.875, yazı ve ikon değişmez; compact xs 24px; `--arn-control-min-size` container'da değişir; iç içe density; kök elemanda `data-density`; container'da `--arn-radius` değişince host'ta hesaplanan token izler, `--arn-radius-md` izlemez; container'da kontrol token'ı değişince host izler. Boşluk: gerçek bileşenle sınama (Faz 4).

## 9. Bağlantılar

- Kod: `projects/ui/theme.css`
- Ana dosya: [tokens.md](tokens.md)
- Kaynaklar: https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx , https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/input.tsx , https://www.w3.org/TR/WCAG22/#target-size-minimum
- Doküman sayfası: Faz 3 (Yoğunluk, Tema ve token'lar)
