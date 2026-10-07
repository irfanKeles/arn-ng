# overlay (`ArnOverlayService`, `ArnOverlayRef`)

<!-- En fazla 150 satır. Aşarsa preset ayrıntıları overlay-presets.md'ye taşınır. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | Yok (servis). CSS: `.arn-overlay-host`, `.arn-overlay-backdrop`, `.arn-overlay-pane` (+ `-<katman>`) |
| Entry point | `@arn-ng/ui/core`, `@arn-ng/ui/theme.css` |
| Tür | servis + ortak yapı |
| Sınıf adları | `ArnOverlayService`, `ArnOverlayRef` (abstract, DI token'ı); iç: `OverlayRefImpl` |
| Dosya yolları | `projects/ui/core/src/overlay/`, `projects/ui/theme.css`, test yardımcıları `projects/ui/testing/overlay.ts` |

Dışa açılanlar: `ArnOverlayService`, `ArnOverlayRef`, tipler `ArnOverlayConfig`, `ArnOverlayLayer`, `ArnOverlayPreset`, `ArnOverlayState`, `ArnOverlaySide`, `ArnOverlayAlign`. CDK tipleri ve iç token'lar (`ARN_REDUCED_MOTION`) dışa AÇILMAZ.

```ts
const ref = this.overlay.open<string>(this.panel(), {
  preset: 'popover', injector: this.injector, origin: this.trigger(), viewContainerRef: this.vcr,
});
const result = await ref.closed;      // içerik: inject(ArnOverlayRef).close('x')
```

`ArnOverlayRef`: `state` (signal: `open` → `closing` → `closed`), `closed` (`Promise<R | undefined>`), `close(result?)`, `updatePosition()`.

### `ArnOverlayConfig`

| Alan | Not |
|---|---|
| `preset` (zorunlu) | `modal` \| `popover` \| `dropdown` \| `tooltip` |
| `injector` (zorunlu) | Açan bileşenin `inject(Injector)`'ı: içerik bununla oluşur, açan yok olunca overlay kalkar |
| `layer` | Varsayılan preset adı. `toast` yalnız açıkça verilir (preset'i Faz 6) |
| `origin` | Modal dışında zorunlu (yoksa hata). Ayarlar bu elemandan okunur |
| `viewContainerRef` | İçerik `TemplateRef` ise zorunlu (yoksa hata, DOM'a dokunmadan) |
| `side`, `align`, `offset` | Yalnız bağlı preset'lerde; modal'da geliştirme modunda uyarı. `offset` varsayılanı 4 px (shadcn `sideOffset`) |
| `closeOnEscape`, `closeOnOutsideClick`, `autoFocus`, `restoreFocus`, `panelClass` | Varsayılanlar §5 tablosunda |

## 2. Mimari ve CDK

`@angular/cdk/overlay` (`Overlay`, konum ve scroll stratejileri), `@angular/cdk/portal`, `@angular/cdk/a11y` (`FocusTrapFactory`), `@angular/cdk/bidi`. CDK'nın alt çizgili yardımcıları kullanılmaz (aktif eleman ve olay hedefi elle okunur).

- **CDK yapısal CSS'i:** CDK 19.0.0+ `Overlay.create()` içinde kendisi yükler (`_CdkPrivateStyleLoader`); tüketici `overlay-prebuilt.css` EKLEMEZ. Kaynaktan doğrulandı (19.0.0, 19.1.0, 19.2.19).
- **DOM:** `.cdk-overlay-container` > [`backdrop`] + `host` > `pane` > içerik. Host (`overlayRef.hostElement`) kendi stacking context'ini kurar; sırayı host ve backdrop z-index'i belirler, pane'inki belirlemez.
- **Ayar mirası** (overlay `<body>` sonunda, `[arnConfig]` bölümünün dışında render edilir):

| Ayar | Kaynak | Hedef | Açıkken |
|---|---|---|---|
| Yön | `injector.get(Directionality)` | CDK `direction` → host `dir` | Canlı (`change` → `setDirection` + konumlar yeniden kurulur) |
| `.dark` / `.light` | Kaynak elemandan `closest('.dark, .light')` | pane sınıfı | Anlık görüntü |
| `data-density` | `closest('[data-density]')` | pane özniteliği | Anlık görüntü |
| `size`, `messages`… | İçerik injector'ı (`parent: config.injector`) | `injectArnConfig()` | Canlı (signal) |

  Kaynak eleman: `origin`, yoksa açanın `ElementRef`'i. Eşleşen `<html>` ise YAZILMAZ (pane zaten miras alır, `applyToDocument` değişimini kendiliğinden izler). DOM'dan okunduğu için `[arnConfig]`, elle yazılmış `class="dark"` ve üst overlay'in pane'i aynı yoldan çalışır.
- **İç içe z-index:** kaynak eleman başka bir `.arn-overlay-host` içindeyse ve üstün hesaplanmış z-index'i daha büyükse, host ve backdrop'a satır içi z-index olarak üstün değeri yazılır (dialog içindeki dropdown). Eşit değer + DOM sırası üstte tutar.
- **Kapanma** (`overlay-ref.ts`, `overlay.motion.ts`): `close()` → `closing`; Esc/dışa tıklama abonelikleri bırakılır; pane ve backdrop `data-state="closed"`; `detachBackdrop()`; çıkış beklenir; sonra odak kararı, abonelikler, `dispose()`, odağı geri verme, `closed` çözülür. Çıkış: `data-state` değişiminden önce ve sonra `pane.getAnimations({ subtree: true })`; yalnız YENİ ve sonlu olanlar beklenir (`allSettled(finished)` + en uzun süre + 50 ms yedek zamanlayıcı). Liste boşsa, `prefers-reduced-motion` varsa ya da API yoksa (SSR) kaldırma SENKRONDUR.
- **Dış kapanma:** CDK `detachments()` (navigasyon, şablon view'ı yok oldu) ve açanın `DestroyRef`'i → animasyonsuz `destroy()`.

## 3. Token'lar

| Ad | Varsayılan | Kullanım |
|---|---|---|
| `--arn-z-dropdown` / `-popover` / `-modal` / `-toast` / `-tooltip` | 1000 / 1100 / 1200 / 1300 / 1400 | `.arn-overlay-host.arn-overlay-host-<katman>` ve `.arn-overlay-backdrop.arn-overlay-backdrop-<katman>` (`theme.css`) |

Pane'deki sözleşme öznitelikleri (bileşen animasyonu bunlara asılır): `data-state="open|closed"`, bağlı preset'lerde `data-side`, `data-align` (CDK başka konuma çevirince güncellenir).

## 4. Override rehberi

- **Global:** `:root { --arn-z-modal: 2000; }`.
- **Sayfaya göre yükseklik:** tüm overlay'ler `.cdk-overlay-container` içindedir (CDK: z-index 1000). Token'lar yalnız overlay'ler ARASI sırayı verir; sayfada daha yüksek eleman varsa `.cdk-overlay-container { z-index: … }` yazılır.
- **Tek örnek:** `panelClass` + bileşenin kendi token'ı.

## 5. Davranış ve a11y

| | modal | popover | dropdown | tooltip |
|---|---|---|---|---|
| Konum | viewport ortası | origin'e bağlı | bağlı | bağlı |
| side / align | — | bottom / center | bottom / start | top / center |
| Scroll | `block` | `reposition` | `reposition` | `reposition` |
| Backdrop | var | yok | yok | yok |
| Esc | kapatır | kapatır | kapatır | abone değil |
| Dışa tıklama | backdrop tıklaması | kapatır (origin hariç) | kapatır (origin hariç) | abone değil |
| Odak | tuzak + ilk odak | içeri taşır, tuzak yok | taşımaz | dokunmaz |
| Odağı geri verme | var | var | var | yok |

- Konum listesi: istenen, karşı taraf, sonra hizası çevrilmişler; `withPush(true)`, `withFlexibleDimensions(false)`, viewport payı 8 px. `start` / `end` mantıksaldır (CDK RTL'de aynalar); `offsetX` işaretini CDK çevirmez, biz çeviririz.
- Esc en üstteki ABONE overlay'e gider (CDK dispatcher); tooltip abone olmadığı için alttakinin Esc'ini yutmaz. Değiştirici tuşlu Esc yok sayılır.
- Odak geri yalnız kaybolacaksa verilir (odak pane içinde ya da `body`'de); kullanıcı başka yere geçtiyse dokunulmaz. İçerikte odaklanabilir yoksa pane (`tabindex="-1"`) odaklanır.
- Servis `role` / `aria-*` YAZMAZ: dialog `role="dialog"` + `aria-modal` + etiketi, tooltip `role="tooltip"` + tetikleyicide `aria-describedby` ve Esc'i kendi koyar (Faz 4). Tooltip pane'i işaretçi olaylarını alır (WCAG 1.4.13).

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **Servis adı `ArnOverlayService`:** eksiz ad element sınıfıdır (SKILL §2); `<arn-dialog>` → `ArnDialog`, servisi `ArnDialogService`.
- **`closed` Promise'tir, RxJS değil:** tek seferlik, sızıntı yok, public tipe rxjs girmez (peer değil). Durum için `state` signal'i.
- **Tema/density DOM'dan okunur, DI'dan değil:** çözülmüş config her zaman değer taşır ("yalnız verilmişse yaz" ayırt edilemez) ve `applyToDocument`'sız `provideArn({ density })` overlay'i sayfadan farklı boyardı.
- **Katman kuralları `theme.css`'te:** ayrı dosya ve çalışma zamanında stil enjeksiyonu reddedildi. İki sınıflı seçici: CDK'nın `@layer cdk-overlay`'ini ve (yüklenmişse) `overlay-prebuilt.css`'i yener; tek sınıf tek başına etkisizdir.
- **Container z-index'ine dokunulmaz:** CDK'yı kullanan diğer kütüphanelerle paylaşılır (§4).
- **shadcn/Radix sapması:** `side` `left` / `right` yerine `start` / `end` (RTL).
- Modal backdrop'u şimdilik CDK'nın `cdk-overlay-dark-backdrop` rengini taşır; token dialog ile Faz 4'te.

### Bilinen sınırlar

| Durum | Sonuç |
|---|---|
| Overlay açıkken BÖLÜM düzeyinde `colorScheme` / `density` değişir | Pane açılıştaki değerde kalır (`effect()` / `MutationObserver` yok). `<html>` düzeyi kendiliğinden izlenir |
| Origin viewport'un sağ kenarına yapışık | CDK viewport payını sağda iki kez uygular (16 px içeri iter) |
| İçerikte 'closed' ile başlayan sonsuz animasyon | Beklenmez, hemen kaldırılır |
| Üst overlay z-index'i açılıştan sonra değişir | İç içe yükseltme anlık değerdir |
| `ComponentPortal` içerik `viewContainerRef`'siz | `ApplicationRef`'e bağlanır; DI yine `config.injector`'dan |

## 8. Testler

`projects/ui/core/src/overlay/*.spec.ts` (zoneless; probe bileşenleri `testing/overlay.ts`).

| Spec | Kapsam |
|---|---|
| `overlay.layers.spec.ts` | Katman başına host + backdrop z-index = token; token değişimini izleme; backdrop/panel ve aynı katman sırası; dialog içi dropdown ve modal yükseltme; yüksek katman dokunulmaz |
| `overlay.inherit.spec.ts` | Bölüm içi/dışı; `theme.css` etkisi; component ve template içerikte `injectArnConfig` + `Directionality`; origin'siz modal; `<html>` yazılmaz; elle `.dark` / `.light`; iç içe; canlı yön ve `size`; anlık görüntü sınırı |
| `overlay.presets.spec.ts` | Modal: ortalama, odak, tuzak, geri verme, kaydırma kilidi, Esc, backdrop, axe. Popover/dropdown: konum, RTL `start` / `end`, çevirme + `data-side`, dışa tıklama, Esc sırası. Tooltip: odak ve abonelik yok. Hatalı kullanım |
| `overlay.close.spec.ts` | Animasyonsuz senkron; animasyon, transition ve alt eleman animasyonu beklenir; reduced-motion; sonsuz animasyon; çift `close`; sonuç; açan yok olunca |
| `testing/theme.spec.ts` | Token değerleri; tek sınıf etkisiz |

Boşluklar: SSR'da çalıştırma yok; `disposeOnNavigation` yolu sınanmadı; gerçek bileşenle sınama Faz 4.

## 9. Bağlantılar

- Kod: `projects/ui/core/src/overlay/`, `projects/ui/theme.css`
- İlgili: [tokens.md](tokens.md), [config.md](config.md), [config-direction.md](config-direction.md)
- CDK kaynağı (19.2.x): `src/cdk/overlay/overlay.ts`, `overlay-ref.ts`, `position/flexible-connected-position-strategy.ts`, `src/cdk/a11y/focus-trap/`
- Doküman sayfası: Faz 3
