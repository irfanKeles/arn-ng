# <ad>

<!-- En fazla 150 satır. Aşarsa <ad>-<konu>.md dosyasına böl ve buradan bağla. Tablo ve liste kullan; kod kopyalama, dosya yolu ver. Kurallar: ../rules/component-files.md. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector |  |
| Entry point |  |
| Tür | element / directive / element + directive / servis / ortak yapı |
| Sınıf adları |  |
| Dosya yolları |  |

## 2. Mimari ve CDK

<!-- Neyden extend ediyor, hangi CDK parçalarını kullanıyor, neyi neden genişletti, hostDirectives. -->
<!-- Config entegrasyonu: hangi alanlar injectArnConfig ile okunuyor (size, ripple…), hangi messages alt başlığı kullanılıyor (config.md §2, config-messages.md §5). -->
<!--
Overlay kullanan bileşen (overlay.md): CDK Overlay doğrudan kullanılmaz.
  inject(ArnOverlayService).open(içerik, { preset, injector: inject(Injector), origin, viewContainerRef })
Yaz: hangi preset ve katman, side/align/offset, autoFocus/restoreFocus sapmaları. z-index, portal, odak tuzağı,
Esc/dışa tıklama ve kapanma zamanlaması bileşende YAZILMAZ. Animasyon yalnız panelin özniteliklerine bağlanır:
  :host-context([data-state='open']) / ([data-state='closed']), yön için [data-side] / [data-align];
  prefers-reduced-motion'da animasyonu kapat (servis o durumda beklemeden kaldırır).
role ve aria-* bileşenin kendi elemanına yazılır (servis yazmaz). İçerik kendini inject(ArnOverlayRef).close(sonuç) ile kapatır.
-->

## 3. Token'lar

<!--
Bileşen token'ı TANIMLANMAZ (ne host'ta ne :root'ta), özellik onu yedekle okur (../rules/styling.md, örnek: button.md). Örüntü (tokens-sizes.md §2):
  block-size: var(--arn-<ad>-height, max(var(--arn-control-min-size), calc(var(--arn-control-height-<boyut>) * var(--arn-density))));
  padding-inline: var(--arn-<ad>-padding-inline, calc(var(--arn-control-padding-inline-<boyut>) * var(--arn-density)));
  font-size: var(--arn-<ad>-font-size, var(--arn-control-font-size-<boyut>));   (density uygulanmaz)
  border-radius: var(--arn-<ad>-radius, calc(var(--arn-radius) * 0.8));          (--arn-radius-md KULLANILMAZ)
Seçiciler :where() içinde. Yükseklik yedeği max()'lidir (24px tabanı, WCAG 2.2 SC 2.5.8). :root'ta türetilen adımlar
(--arn-radius-sm vb.) bileşende kullanılmaz. "Hesap" sütununa yedek ifadeyi yaz.
-->

| Ad | Hesap (yedek) | Bağlı anlamlı token |
|---|---|---|

## 4. Override rehberi

- **Global:**
- **Container:**
- **Tek örnek:**

## 5. Davranış ve a11y

| Tuş | Davranış |
|---|---|

<!-- role ve aria-* nitelikleri, focus yönetimi. -->

## 6. Form uyumu

<!-- FormValueControl / FormCheckboxControl, desteklenen durumlar, bilinen boşluklar (rules/forms-a11y.md). Form elemanı değilse "Yok". -->

## 7. Kısıtlar ve kararlar

<!-- Bilinen sınırlar, reddedilen alternatifler ve gerekçeleri. shadcn/ui'den her sapma (varyant, boyut, ölçü, davranış) burada gerekçesiyle yazılır (../SKILL.md, Değişmez kararlar). effect() kullanıldıysa gerekçesi de burada (../rules/angular.md). -->

## 8. Testler

<!-- Spec dosya yolları, neyin kapsandığı (axe, klavye, RTL, form), bilinen boşluklar. -->

## 9. Bağlantılar

- Kod:
- Doküman sayfası:
