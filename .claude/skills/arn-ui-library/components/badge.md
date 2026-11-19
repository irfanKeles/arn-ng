# badge (`ArnBadge`)

<!-- En fazla 150 satır. Kurallar: ../rules/component-files.md. Karar: ../decisions/2026-11.md "ArnBadge uygulaması". -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `arn-badge` (statik), `a[arnBadge]` (link) |
| Entry point | `@arn-ng/ui/badge` (`ArnBadge`, tip `ArnBadgeVariant`) |
| Tür | element + attribute, tek `@Component` (iki seçici, tek sınıf; sarmalayıcı yok) |
| Sınıf adları | `ArnBadge`; CSS `.arn-badge`, öznitelikler `data-variant`, `data-count`, `data-dot`, `data-hidden`, `data-loading`; iç sınıflar `.arn-badge-dot`, `.arn-badge-label`, `.arn-badge-spinner` |
| Dosya yolları | `projects/ui/badge/src/badge.ts`, `badge.html`, `badge.css`, `badge.types.ts`, `badge.spec.ts`, `badge.contrast.spec.ts` |

## 2. Mimari ve CDK

- **Neden tek sınıf, iki seçici:** iki yüz de aynı host'u boyar; `<a>` gerçek link kalır (`href`, `routerLink`, orta tık native). `rules/architecture.md`'deki "directive `Arn<Ad>Directive` + element `Arn<Ad>`" adlandırması sarmalayıcılı iki yüz içindir; badge'de sarmalayıcı yok (karar).
- **Şablon** (`badge.html`): `loading` ise spinner svg; sonra kipe göre biri: dot (`.arn-badge-dot` + `label` varsa gizli `.arn-badge-label`), count (`text()`), içerik (`<ng-content />`). Kip önceliği: `dot` > `count` > içerik.
- **Config:** yok (`size` / `density` yok, sabit metin yok). `messages` alt başlığı yok.
- **Core iç export'ları:** `ɵdevWarn`, `ɵdisabledLink` (devre dışı link; ArnButton ile ortak, [config.md](config.md) §7).
- **Köşe rozeti:** host `arnButtonBadge` özniteliğini taşıyorsa constructor'da `Renderer2` ile `aria-hidden="true"` yazılır (bağlama değil: bağlama tüketicinin kendi `aria-hidden`'ını da silerdi). Badge button'u import etmez; yerleşim ArnButton'ın `[arnButtonBadge]` CSS'idir.
- CDK parçası yok (etkileşimsiz; link native).

## 3. Token'lar

Hiçbiri tanımlanmaz, yedekle okunur ([../rules/styling.md](../rules/styling.md)); seçiciler `:where()` içinde. Yeni global token yok.

| Ad | Yedek | Not |
|---|---|---|
| `--arn-badge-height` | `calc(var(--arn-spacing) * 5 + var(--arn-border-width) * 2)` (22px) | `min-inline-size` de bu: tek hane daire |
| `--arn-badge-padding-inline` | `calc(var(--arn-spacing) * 2)`; count kipinde `* 1.5` | |
| `--arn-badge-font-size` | `var(--arn-text-xs)` | `font-weight-medium`, `line-height: 1` |
| `--arn-badge-icon-size` / `-gap` | `calc(var(--arn-spacing) * 3)` / `var(--arn-spacing)` | Yansıtılan `<svg>` ve spinner |
| `--arn-badge-radius` | `var(--arn-radius-full)` | |
| `--arn-badge-dot-size` | `calc(var(--arn-spacing) * 2)` | |
| `--arn-badge-bg` | default `--arn-primary`; secondary `--arn-secondary`; destructive `light-dark(--arn-destructive, mix(destructive 60%, background))`; outline `transparent`. Dot: secondary `--arn-muted-foreground`, destructive düz `--arn-destructive` | |
| `--arn-badge-fg` | `--arn-primary-foreground`; `--arn-secondary-foreground`; `--arn-destructive-foreground`; outline `--arn-foreground` | |
| `--arn-badge-border-color` | `transparent`; outline `--arn-border`; outline dot `--arn-muted-foreground` | |
| `--arn-badge-bg-hover` | (yalnız `a`) default `mix(primary 85%, background)`; secondary `mix(secondary 85%, foreground)`; destructive `light-dark(mix(destructive 92%, --arn-black), mix(destructive 50%, background))`; outline `--arn-muted` | |
| `--arn-badge-ring-color` | `--arn-ring`; destructive `--arn-destructive` | Kenarlık da bu renge döner |
| `--arn-badge-spinner-duration` | `1s`; reduced-motion'da `× 3` | |

## 4. Override rehberi

- **Global:** `:root { --arn-badge-radius: …; }` ya da anlamlı token.
- **Container:** `.toolbar { --arn-badge-height: 1.25rem; }` (host'ta tanım yok, içteki her rozet izler).
- **Tek örnek:** tek sınıf (`.brand { --arn-badge-bg: …; }` ya da doğrudan `background`); `:where()` sayesinde kazanır.

## 5. Davranış ve a11y

| Tuş | Davranış |
|---|---|
| Tab | `<arn-badge>` odak almaz; `a[arnBadge]` alır, devre dışıysa atlanır |
| Enter | Yalnız `a[arnBadge]`: gider (native) |

- **Sayaç:** `count` 0 → `data-hidden` (gizli), `showZero` "0" gösterir; `count > max` → `"{max}+"` (varsayılan 99). Geçersiz `count` (negatif, kesirli) gizli, `max < 1` → 99; ikisi de `ɵdevWarn`. Rakam düz `String`; RTL'de "99+" tarayıcıda "+99" görünür (kabul, karar).
- **Duyuru yok:** `aria-live` yok, girdi de yok. Köşe rozeti `aria-hidden` olduğu için içindeki live bölge zaten konuşmazdı; tüketici CDK `LiveAnnouncer` ile anlamlı cümleyi duyurur (docs Accessibility).
- **Dot:** metinsiz; adı `label` (görsel gizli span, yalnız dot kipinde). `label` yoksa ve köşe rozeti değilse `ɵdevWarn`. İç `.arn-badge-dot` span'i host'u `:empty` olmaktan çıkarır (ArnButton'ın `:empty` gizlemesi).
- **Gizlilik kendi kuralında:** `:where(.arn-badge[data-hidden])` ve `:where(.arn-badge:empty)` → `display: none`; ArnButton'ın `:empty` kuralıyla aynı özgüllükte olduğundan yükleme sırasına bırakılmadı. `hidden` özniteliği kullanılmaz (yazarın `display`'i ezer).
- **Yüklenme:** `loading` spinner'ı başa koyar, `.arn-badge-spinner + svg` gizlenir (başlangıç ikonu), yazı kalır, `aria-busy="true"`. Dot'ta yok sayılır ve uyarır.
- **Link:** hover yalnız `@media (hover: hover)`; `:focus-visible` 3px `box-shadow` halka + kenarlık halka rengi + forced-colors için saydam `outline`. `:active` yok, tap highlight açık kalır.
- **Devre dışı link:** `aria-disabled="true"`, `ɵdisabledLink` (tabindex −1 sakla / geri yükle, capture tıklama iptali), opaklık 0.5, hover yok. `<arn-badge disabled>` etkisiz, `ɵdevWarn`.
- **Kontrast** (paylaşımlı helper, açık / koyu): normal `--arn-background` üstünde default 17.16/14.22, secondary 16.42/14.48, destructive 4.76/6.94, outline 19.79/18.96 (`--arn-card`'da yalnız outline koyu 17.16). Link hover: default 11.96/9.77, secondary 11.19/9.73, destructive 5.73/8.74, outline 18.15/14.48. Dot zemine: default 17.91/15.72, secondary ve outline 4.73/7.63, destructive 4.76/6.84. Halka ≥3:1. Devre dışı muaf (1.4.3).

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **"Bitti" tanımından sapma:** tek boyut, density yok. Badge kontrol değil (hedef alanı yok, 24px tabanı gerekmez); `--arn-control-*` kullanılmaz.
- **shadcn sapmaları** (new-york-v4 `badge.tsx`, 2026-11-19): `ghost` / `link` varyantı yok (link = `a[arnBadge]`); hover formülleri (shadcn `/90` alfa ve outline `accent`); focus halkası tam renk (shadcn `ring/50`); sabit yükseklik 22px (shadcn yükseklik vermez, `py-0.5` + `text-xs` aynı 22px'i verir); count kipinde dar dolgu (6px; shadcn'de sayaç yok); dot, count, loading bizim eklerimiz; `aria-invalid` stili yok.
- **Başlangıç ikonu sınırı:** CSS metin düğümünü görmez; yalnız sonda ikonu olan rozette loading o ikonu gizler (spec kilitli, docs notu).
- **Uyarılar yalnız ilk render'da** (`afterNextRender` + `isPlatformBrowser`); sonradan geçersizleşen değer sessizce gizlenir.
- **İç içe etkileşim:** düğme içinde `a[arnBadge]` geçersiz HTML; yalnız docs notu.
- **Yönlü ikon:** RTL aynalama tüketicinin işi (`.arn-rtl-mirror`).

## 8. Testler

- `badge.spec.ts` (55): seçiciler, varyant renkleri, 22px / 8px / 12px / tam radius, tek hane daire, density etkisiz, token (host'ta tanım yok, container, eleman, tek sınıf), sayaç (0, `showZero`, max, 99+, statik öznitelik, geçersiz → uyarı), dot (8px, `:empty` değil, gizli label, uyarı, köşede uyarı yok), köşe `aria-hidden`, ikon (12px, gap, iki yan, RTL aynalama), loading (spinner, `aria-busy`, başlangıç ikonu, sonda ikon sınırı, reduced-motion 3s CDP `Emulation.setEmulatedMedia`, dot'ta yok sayma), link (hover yalnız `<a>`, outline `--arn-muted`, halka ve kenarlık, Tab elemanı atlar), devre dışı link (aria, tabindex, `(click)`, `RouterLink`, hover yok, elemanda uyarı), axe dört mod + devre dışı link iki temada, SSR.
- `badge.contrast.spec.ts` (39): 4 varyant × 2 tema × (`--arn-background`, `--arn-card`) normal, link hover (CDP gerçek fare), dot ≥3:1, halka ≥3:1, devre dışı muafiyet + opaklık.
- `button.spec.ts` sonundaki "ArnButton with an ArnBadge in the badge slot" (4): köşe yerleşimi + `aria-hidden` + axe, 0 gizli / dot görünür iki stil sırasında, rozet iconOnly adı sayılmaz, köşe dot'u uyarmaz.
- Not: Tab testleri önce `window.focus()` + `document.body.focus()` ister (test çerçevesi odakta değilse Tab dışarı gider).
- Boşluk: Firefox / WebKit, gerçek ekran okuyucu.

## 9. Bağlantılar

- Kod: `projects/ui/badge/src/`, `projects/ui/core/src/a11y/disabled-link.ts`
- Doküman sayfası: `/badge` (`projects/docs/src/app/pages/badge/`)
