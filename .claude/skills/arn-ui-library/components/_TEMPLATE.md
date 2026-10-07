# <ad>

<!-- En fazla 150 satır. Aşarsa <ad>-<konu>.md dosyasına böl ve buradan bağla. Tablo ve liste kullan; kod kopyalama, dosya yolu ver. Kurallar: ../SKILL.md bölüm 18. -->

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

## 3. Token'lar

<!--
Bileşen token'ı bileşenin kendi host'unda hesaplanır (SKILL §5), :root'ta değil. Örüntü (tokens-sizes.md §2):
  --arn-<ad>-height: max(var(--arn-control-min-size), calc(var(--arn-control-height-<boyut>) * var(--arn-density)));
  --arn-<ad>-padding-inline: calc(var(--arn-control-padding-inline-<boyut>) * var(--arn-density));
  --arn-<ad>-font-size: var(--arn-control-font-size-<boyut>);   (density uygulanmaz)
  --arn-<ad>-radius: calc(var(--arn-radius) * 0.8);             (--arn-radius-md KULLANILMAZ)
  block-size: var(--arn-<ad>-height);
Yükseklik token'ı max()'li değeri taşır (24px tabanı, WCAG 2.2 SC 2.5.8). :root'ta türetilen adımlar
(--arn-radius-sm vb.) bileşende kullanılmaz. "Hesap" sütununa host'taki ifadeyi yaz.
-->

| Ad | Hesap (host'ta) | Bağlı anlamlı token |
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

<!-- ControlValueAccessor, desteklenen durumlar. Form elemanı değilse "Yok". -->

## 7. Kısıtlar ve kararlar

<!-- Bilinen sınırlar, reddedilen alternatifler ve gerekçeleri. shadcn/ui'den her sapma (varyant, boyut, ölçü, davranış) burada gerekçesiyle yazılır (SKILL §1). -->

## 8. Testler

<!-- Spec dosya yolları, neyin kapsandığı (axe, klavye, RTL, form), bilinen boşluklar. -->

## 9. Bağlantılar

- Kod:
- Doküman sayfası:
