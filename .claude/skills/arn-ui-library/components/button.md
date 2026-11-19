# button (`ArnButton`)

<!-- En fazla 150 satır. Kurallar: ../rules/component-files.md. Karar: ../decisions/2026-11.md "ArnButton uygulaması". -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `button[arnButton]`, `a[arnButton]` (element yüzü yok, ROADMAP "Ertelenenler") |
| Entry point | `@arn-ng/ui/button` (`ArnButton`, tip `ArnButtonVariant`) |
| Tür | directive (attribute seçicili `@Component`) |
| Sınıf adları | `ArnButton`; CSS `.arn-button`, öznitelikler `data-variant`, `data-size`, `data-icon-only`, `data-round`; yuva `[arnButtonBadge]` |
| Dosya yolları | `projects/ui/button/src/button.ts`, `button.css`, `button.types.ts`, `button.spec.ts`, `button.contrast.spec.ts`; test yardımcısı `projects/ui/testing/pointer.ts` |

## 2. Mimari ve CDK

- **Neden `@Component`:** stil (`styleUrl`, `ViewEncapsulation.None`) ve `<ng-content>` (rozet yuvası) directive'de olmaz. Seçici attribute: native eleman kalır, `type` / `form` / `href` / `aria-*` kendiliğinden çalışır (Material'ın attribute bileşen kalıbı). ESLint `component-selector` ui'de element (kebab) + attribute (camel) kabul eder.
- Şablon `<ng-content /><ng-content select="[arnButtonBadge]" />`: sarmalayıcı eleman yok, rozet her zaman sonda.
- **`hostDirectives`:** `ArnRippleDirective`, girdiler `arnRipple: ripple`, `arnRippleColor: rippleColor`, `arnRippleCentered: rippleCentered`. Host `position: relative` (ripple ister).
- **Config:** `injectArnConfig('size', this.size)` → `data-size` (varsayılan `md`). Density yalnız CSS (`--arn-density`). `messages` alt başlığı yok (sabit metin yok).
- CDK parçası yok: native eleman klavyeyi, odağı ve rolü kendisi taşır.
- **`ɵdevWarn`**, **`ɵdisabledLink`** (`@arn-ng/ui/core`'dan iç export'lar, [config.md](config.md) §7): adsız iconOnly uyarısı; devre dışı `<a>` davranışı (ArnBadge ile ortak).

## 3. Token'lar

Bileşen token'ları HOST'TA TANIMLANMAZ, yalnız yedekli okunur (`background: var(--arn-button-bg, var(--arn-primary))`). Gerekçe ve kuralı güncellediği yer: §7. Hepsi `:where()` içinde, özgüllük 0.

| Ad | Yedek (okunan değer) | Bağlı anlamlı token |
|---|---|---|
| `--arn-button-height` | `max(var(--arn-control-min-size), calc(var(--arn-control-height-<boyut>) * var(--arn-density)))` | `--arn-control-*`, `--arn-density` |
| `--arn-button-padding-inline` | `calc(var(--arn-control-padding-inline-<boyut>) * var(--arn-density))`; iconOnly'de 0 | aynı |
| `--arn-button-font-size` / `-icon-size` / `-gap` | `var(--arn-control-<özellik>-<boyut>)` (density yok) | aynı |
| `--arn-button-radius` | `calc(var(--arn-radius) * 0.8)`; round `--arn-radius-full` (token'sız) | `--arn-radius` |
| `--arn-button-bg` | default `--arn-primary`; secondary `--arn-secondary`; destructive `light-dark(--arn-destructive, mix(destructive 60%, background))`; outline `--arn-background`; ghost / link `transparent` | |
| `--arn-button-fg` | `--arn-primary-foreground`; `--arn-secondary-foreground`; `--arn-destructive-foreground`; outline / ghost `--arn-foreground`; link `--arn-primary` | |
| `--arn-button-border-color` | `transparent`; outline `--arn-border` | |
| `--arn-button-bg-hover` | default `primary` %90 alfa; secondary %80 alfa; destructive `light-dark(mix(destructive 92%, --arn-black), mix(destructive 50%, background))`; outline / ghost `--arn-accent` | |
| `--arn-button-bg-active` | default %80 alfa; secondary `mix(secondary, secondary-fg 10%)`; destructive %84 siyah / %40 background; outline / ghost `mix(accent, accent-fg 10%)` | |
| `--arn-button-ring-color` | `--arn-ring`; destructive `--arn-destructive` | |

Global token'lar (bu PR, `theme.css`): `--arn-black`, `--arn-destructive-foreground`, `--arn-shadow-xs` (outline), `--arn-radius-full` ([tokens.md](tokens.md)).

## 4. Override rehberi

- **Global:** `:root { --arn-button-radius: …; }` ya da anlamlı token (`--arn-primary`).
- **Container:** `.toolbar { --arn-button-height: 2rem; }`: içteki her button izler (host'ta tanım olmadığı için).
- **Tek örnek:** tek sınıf yeter (`.brand { --arn-button-bg: …; }` ya da doğrudan `background`); `:where()` sayesinde kütüphane kuralını yener.
- **Tuzak:** tüketicinin global reset'i (`button { … }`, `a { color: inherit }`) de kazanır. Docs bunu yaşadı: `.docs-page a` ve global `:focus-visible` `:not(.arn-button)` ile daraltıldı.

## 5. Davranış ve a11y

| Tuş | Davranış |
|---|---|
| Enter | `<button>` etkinleşir, `<a>` gider (native) |
| Space | Yalnız `<button>` (native; link tepki vermez) |
| Tab | Odak; devre dışı `<button>` ve `<a>` atlanır |

- **Odak:** `:focus-visible`'da 3px tam renk `box-shadow` (destructive `--arn-destructive`), kenarlık değişmez; `outline: 3px solid transparent` forced-colors içindir. %50 halo reddedildi (1.96:1 / 1.87:1).
- **Hover** yalnız `@media (hover: hover)`; **active** token tabanlı; `-webkit-tap-highlight-color: transparent`. Geçiş (`transition`) YOK (0.1.0, ertelendi).
- **Disabled `<button>`:** native `disabled` (`[attr.disabled]`); `fieldset[disabled]` içinde de `:disabled` stili.
- **Disabled `<a>`:** `aria-disabled="true"`; `ɵdisabledLink` (core): `tabindex` `effect()` + `Renderer2` ile `-1` (tüketicinin değeri saklanır, etkinleşince geri yazılır, yoksa öznitelik silinir); tıklama capture fazında `preventDefault` + `stopImmediatePropagation` (host listener şablon `(click)` ve `RouterLink`'ten SONRA kaydolduğu için geç kalıyordu). `href` kalır.
- Opaklık 0.5, `pointer-events` açık (karar).
- **iconOnly adı:** `afterNextRender` + `isPlatformBrowser`; `aria-label` / `aria-labelledby` / `title` / görünür metin (rozet ve `aria-hidden` hariç) yoksa `ɵdevWarn`. Yalnız ilk render'da bakar.
- **Kontrast** (`--arn-background` üstünde, açık / koyu; spec gerçek boyamayı CDP ile ölçer): default 17.16/14.22, hover 12.96/11.51, active 9.12/9.15; secondary 16.42/14.48, 16.72/15.52, 13.02/11.23; destructive 4.76/6.94, 5.73/8.74, 6.92/10.91; outline ve ghost 19.79/18.96, 16.42/14.48, 13.02/11.23; link 17.91/15.72 (üç durumda). Halka bg'ye karşı ≥3:1.
- Rozet: `inset-inline-end` + `translate: 35% -35%`, `:dir(rtl)` `-35% -35%`; hale `box-shadow 0 0 0 calc(--arn-border-width * 2) --arn-background`; `:empty` gizli (boşluk içeren eleman `:empty` değildir). Gerçek rozet `ArnBadge`'tir (`<arn-badge arnButtonBadge [count]>`, [badge.md](badge.md)): kendi `aria-hidden`'ını yazar, gizliliğini (0 sayısı) kendi kuralıyla yapar, dot iç span'iyle `:empty` olmaz; buton CSS'i değişmedi.

## 6. Form uyumu

Yok (form kontrolü değil). `type` / `form` / `name` / `value` native; varsayılan `type` YAZILMAZ (`<button>` formda submit eder, docs örnekleri `type="button"` yazar).

## 7. Kısıtlar ve kararlar

- **Token modeli sapması:** `rules/styling.md`'nin "bileşen token'ı host'ta hesaplanır" kuralı button için güncellendi (decisions 2026-11 "ArnButton uygulaması"): host'ta tanım, container'dan gelen değeri ezerdi; yedekli okumada anlamlı token'lar yine host'ta çözülür (tokens.md §4 tuzağı oluşmaz).
- **`effect()` gerekçesi** (2026-11 sonrası `ɵdisabledLink` içinde, davranış aynı) (`rules/angular.md`): `tabindex` host binding'le yazılsaydı tüketicinin değerini siler ya da ezerdi; sakla / geri yükle için bir yan etki gerekir. Bilinen sınır: devre dışıyken tüketici `tabindex`'i değiştirirse saklanan değer bayatlar.
- **Ripple kısıtı:** `pointer-events` açık; Chromium devre dışı `<button>`'a da `pointerdown` gönderir. Ripple açıksa devre dışı button ve link basışta dalga çizer (spec kilitli). Başka bir şey olmaz.
- **`stopImmediatePropagation` sınırı:** üst elemanlardaki capture dinleyicileri yine çalışır.
- **Destructive oranları:** Chromium `oklch(… 0 0deg)` nötrlerde (`--arn-black`, neutral-950) hue'yu 0° alır; karar ölçülen değerdir. Palet hue'sunu `none` yazmak: ROADMAP Teknik backlog.
- **shadcn sapmaları:** focus'ta kenarlık `--arn-ring`'e dönmez ve halka %50 değil tam renk; destructive koyu dolgu alfa değil `--arn-background` ile karışım, açık hover `/90` değil %92 siyah; active durumları (shadcn'de yok); `disabled:pointer-events-none` yok; outline koyuda `input/30` dolgu yerine `--arn-background`; `xl` boyutu; `destructive-foreground` token'ı.
- Reddedilen: `<arn-button>` (ertelendi), `[ripple]`'ı disabled'da kapatmak (host directive girdisi içeriden ezilemez; `pointerdown`'ı durdurmak tüketicinin dinleyicilerini bozardı).

## 8. Testler

- `button.spec.ts` (60): seçici, varyant, 1px kenarlık ve eşit yükseklik, beş boyut (px), density (compact, 24px tabanı, iç içe), config önceliği ve canlı değişim, token override (container, eleman, tek sınıf `:where`), host'ta token tanımı yok, iconOnly / round, ad uyarısı, disabled `<button>` (static, `fieldset`, gerçek basışta `:active` yok), disabled `<a>` (aria, tabindex döngüsü, `(click)` / ata / `RouterLink` durur), ripple alias'ları ve kısıt, rozet (LTR / RTL / boş), RTL, odak halkası (`userEvent.tab`), tap highlight, axe dört mod + disabled linkler iki temada, SSR.
- `button.spec.ts` sonu (4, ayrı describe): gerçek `ArnBadge` köşede (yerleşim, `aria-hidden`, iki stil sırasında 0 gizli / dot görünür, ad sayılmaz).
- `button.contrast.spec.ts` (41): 6 varyant × normal / hover / active × iki tema, `(hover: hover)`, halka ≥3:1. Hover ve active gerçek fare girdisiyle (`testing/pointer.ts`, CDP `Input.dispatchMouseEvent`).
- Boşluk: Firefox / WebKit (ROADMAP), gerçek dokunmatik cihaz.

## 9. Bağlantılar

- Kod: `projects/ui/button/src/`, `projects/ui/theme.css`
- Doküman sayfası: `/button` (`projects/docs/src/app/pages/button/`)
