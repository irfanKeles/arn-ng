# ripple (`arnRipple`)

<!-- En fazla 150 satır. Kurallar: ../SKILL.md bölüm 18. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `[arnRipple]` |
| Entry point | `@arn-ng/ui/ripple` (stil ve token'lar `@arn-ng/ui/theme.css`) |
| Tür | directive |
| Sınıf adları | `ArnRippleDirective`; CSS: `.arn-ripple-container`, `.arn-ripple-wave` |
| Dosya yolları | `projects/ui/ripple/src/`, `projects/ui/theme.css` |

Dışa açılan yalnız `ArnRippleDirective`. `ARN_RIPPLE_REDUCED_MOTION`, `reducedMotionReader`, `parseDuration` içtir (`ripple.motion.ts`).

| Girdi | Tip | Davranış |
|---|---|---|
| `arnRipple` | `boolean`, boş attribute | Boş attribute / `true` açar, `false` kapatır, `undefined` config'e düşer |
| `arnRippleColor` | `string` | Dalga rengi, OLDUĞU GİBİ uygulanır (saydamlığı tüketici verir) |
| `arnRippleCentered` | `boolean` | Dalga işaretçiden değil kutunun ortasından başlar |

`arnRippleDisabled` YOK; kapatmak için `[arnRipple]="false"`.

## 2. Mimari ve CDK

CDK kullanmaz. Bağımlılık: `@angular/core`, `@angular/common` (`DOCUMENT`, `isPlatformBrowser`), `@arn-ng/ui/core` (`injectArnConfig`). Core ripple'a bağımlı DEĞİLDİR.

- **Config:** `injectArnConfig('ripple', this.arnRipple)`. Öncelik: eleman girdisi > en yakın `[arnConfig]` > `provideArn()` > `false`. Signal her `pointerdown`'da okunur, yani canlıdır.
- **Tuzak:** `<button arnRipple>` HER ZAMAN açıktır; boş attribute eleman girdisidir (`true`) ve config'i ezer. Config bu directive'in doğrudan kullanımını etkilemez; yalnız girdi `undefined` iken devreye girer, yani pratikte bileşenin `[ripple]` girdisi bağlanmadığında (aşağı).
- **Bileşende kullanım (Faz 4, button ile):** `hostDirectives` + takma ad. Girdi bağlanmayınca `undefined` kalır ve config'e düşer. Spec'teki `RippleProbe` bunu kanıtlar.

```ts
hostDirectives: [{
  directive: ArnRippleDirective,
  inputs: ['arnRipple: ripple', 'arnRippleColor: rippleColor', 'arnRippleCentered: rippleCentered'],
}],
```

- **Dinleyiciler:** constructor'da, yalnız tarayıcıda, `Renderer2.listen` ile (`host: {}` değil: her işaretçi olayında change detection tetiklenmesin). `pointerdown` başlatır; `pointerup` / `pointercancel` / `pointerleave` söndürür.
- **DOM:** host > `span.arn-ripple-container[aria-hidden]` > `span.arn-ripple-wave[aria-hidden]`. Container ilk dalgada oluşur, son dalga silinince kaldırılır: kapalıyken ve boştayken host'ta fazladan DOM yoktur. Host'a stil ve sınıf YAZILMAZ.
- **Dalga:** container'ın `getBoundingClientRect`'ine göre merkez ve en uzak köşeye yarıçap; `left` / `top` / `width` / `height` satır içi (fiziksel: koordinat işaretçiden gelir, RTL'de aynı). Sabit stiller sınıftan.
- **Animasyon (Web Animations API):** basışta `scale(0→1)`, `fill: forwards` (basılı tutulurken tam boyda bekler). Bırakınca HEMEN `opacity 1→0`, aynı süreyle; bu animasyonun `finished`'ı gelince dalga silinir. Süre ve easing dalga başına basış anında `getComputedStyle(container)` ile token'dan okunur.
- **En fazla 5 dalga:** altıncısı en eskiyi animasyonsuz kaldırır.
- **`ngOnDestroy`:** dinleyiciler bırakılır, tüm dalgalar iptal edilip silinir, container kaldırılır.

## 3. Token'lar

`theme.css` `:root`'unda dururlar (directive'in stil dosyası olamaz; SKILL §5 "bileşen katmanı bileşenin stilinde" kuralından bilinçli sapma). Hiçbiri başka token'dan `var()` ile türemez, container tuzağı yoktur.

| Ad | Varsayılan | Not |
|---|---|---|
| `--arn-ripple-color` | `color-mix(in oklch, currentcolor 12%, transparent)` | `currentcolor` dalgada çözülür: host'un metin rengini izler, dark mode için ayrı değer yok |
| `--arn-ripple-duration` | `450ms` | Büyüme ve sönme. Yalnız düz `ms` / `s` değeri (`calc()` ayrıştırılmaz → 450 ms). Tüketicinin CSS küçültücüsü `.45s` yapar; ikisi de ayrıştırılır |
| `--arn-ripple-easing` | `cubic-bezier(0, 0, 0.2, 1)` | Yalnız büyüme; sönme doğrusal. Geçersizse `ease-out` |

## 4. Override rehberi

- **Global:** `:root { --arn-ripple-color: oklch(60% 0.2 250deg / 20%); --arn-ripple-duration: 300ms; }`
- **Container / bileşen:** `.toolbar { --arn-ripple-duration: 200ms; }`; bileşen kendi `:host`'unda ezebilir.
- **Tek örnek:** `arnRippleColor="…"` (container'a `--arn-ripple-color` olarak yazılır) ya da elemanın kendi CSS'i.
- **Açma/kapama:** `provideArn({ ripple: true })`, `<div arnConfig [ripple]="false">`, `ArnConfigService.setRipple()`.

## 5. Davranış ve a11y

| Girdi | Davranış |
|---|---|
| Birincil düğme / dokunma / kalem `pointerdown` | Dalga başlar |
| Diğer fare düğmeleri | Yok sayılır (sağ tıkta `pointerup` gelmeyebilir) |
| Enter, Space, programatik `click()` | Ripple YOK (karar; odak halkası klavye geri bildirimidir) |
| `prefers-reduced-motion: reduce` | Çizilmez; her basışta `DOCUMENT.defaultView.matchMedia` ile okunur |
| Sunucu, `element.animate` yok | Sessizce atlanır |

Container ve dalgalar `aria-hidden="true"`, `pointer-events: none`; odak ve erişilebilir ad etkilenmez.

**Bileşenin işi (directive yapmaz):** host `position: relative` (yoksa container en yakın konumlu atayı kaplar); köşe kırpması host'un `border-radius`'undan (`inherit`); `disabled` iken `[ripple]="false"` (directive `disabled` bilmez). `theme.css` yüklü olmalı; değilse container ve dalga stilsiz kalır.

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **Ayrı entry point:** kullanmayan ödemez; core'a tek yönlü bağımlı.
- **`afterNextRender` KULLANILMAZ:** Angular 19.2'de `@developerPreview` (SKILL §1). Yerine `isPlatformBrowser(inject(PLATFORM_ID))`.
- **`effect()` yok:** config değişimine tepki verilmez, basışta okunur. Uçuştaki dalga config ya da reduced-motion değişince yarıda kesilmez.
- **`arnRippleColor` olduğu gibi:** %12'ye sarmak reddedildi (tüketici saydamlık veremezdi, girdi ile CSS token'ı farklı davranırdı).
- **Sönme bırakınca hemen:** "önce büyüme bitsin" (kısa dokunuş ~900 ms) ve ayrı sönme token'ı reddedildi.
- **DOM doğrudan `Document` ile kurulur** (`createElement`, `remove`), Renderer2 ile değil: yalnız tarayıcıda çalışır ve kaldırma senkron kalır. Dinleyiciler Renderer2 ile.
- **TS'te yedek değerler** (450 ms, `ease-out`): token okunamadığında; `theme.css` ile eşleşmelidir.
- **Reduced-motion token'ı kopyadır:** core'daki `ARN_REDUCED_MOTION` dışa açık değil.
- shadcn'de ripple yoktur; bizim ekimiz (SKILL §5).

## 8. Testler

`projects/ui/ripple/src/ripple.directive.spec.ts` (39 test, zoneless; şablon `ripple.directive.spec.host.html`). Süre testte 20 ms'ye çekilir, bitiş yoklamayla beklenir.

| Grup | Kapsam |
|---|---|
| precedence | 4 seviye, iki yönde; boş attribute; `[arnRipple]="false"` |
| host directive | `arnRipple: ripple` takma adı, bağlanmayınca config |
| canlı config | `ArnConfigService.setRipple`, değişen bölüm |
| DOM | kapalıyken hiçbir şey; tek container; basılıyken kalır; sönünce container dahil silinir; `pointercancel` / `pointerleave`; 5 dalga sınırı; birincil olmayan düğme |
| keyboard | Enter, Space, `click()` → DOM'a ekleme yok |
| renk ve konum | token rengi, `arnRippleColor` container'da ve host stilsiz, işaretçi / merkez / RTL |
| motion | süre ve easing token'dan, yedekler, reduced-motion canlı, `animate` yok |
| destroy, a11y | temizlik ve dinleyiciler; axe dalgalı ve dalgasız |
| sunucu | `PLATFORM_ID: 'server'` ile dinleyici kurulmaz, hata yok |
| yardımcılar | `reducedMotionReader` sahte `Document` ile, `parseDuration` |

Token ve sınıflar: `projects/ui/testing/theme.spec.ts` (`ripple` grubu, 6 test).

### Boşluklar

- Gerçek SSR çalıştırması yok (yalnız `PLATFORM_ID` dalı birim testte); tarayıcıda görsel doğrulama ve gerçek bileşenle kullanım Faz 4.
- Core'daki `ARN_REDUCED_MOTION` export edilince `ARN_RIPPLE_REDUCED_MOTION` onunla birleştirilecek.
- Dokunmatikte kaydırma başlangıcı `pointercancel` ile söner ama dalga yine de bir an görünür (gecikme yok).

## 9. Bağlantılar

- Kod: `projects/ui/ripple/src/`, `projects/ui/theme.css`
- İlgili: [config.md](config.md), [tokens.md](tokens.md)
- Doküman sayfası: Faz 3 / Faz 4 (button ile)
