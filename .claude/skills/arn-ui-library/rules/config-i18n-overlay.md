# Ayar, i18n, RTL ve overlay

## Merkezi ayar (eski §6)

- Davranışsal ayar tek arayüzdür: `ArnConfig` (`@arn-ng/ui/core`). Alanlar: `size`, `density`, `colorScheme`, `direction`, `ripple`, `locale`, `messages`, `forms`. Hepsi opsiyonel, literal union tipli, index signature YOK. Yeni alan ancak karar günlüğüyle eklenir.
- Görsel ayar (renk, font, kenarlık, radius): CSS değişkenleri. `ArnConfig`'e taşınmaz.
- **Öncelik sırası (yukarıdan aşağıya güçlüden zayıfa):**
  1. Bileşenin kendi input'u (`size="sm"`)
  2. En yakın `[arnConfig]` bölümü (`<div arnConfig size="sm" density="compact">`, hiyerarşik DI, iç içe olabilir)
  3. Global `provideArn()` (çalışma zamanında `ArnConfigService`)
  4. Kütüphane varsayılanı
- Üç seviye de signal'dir ve çalışma zamanında değişebilir. `undefined` "bir alttakini kullan" demektir.
- Bileşen ayarı YALNIZCA `injectArnConfig` ile okur (`injectArnConfig('size', this.size)`); servisi veya token'ı doğrudan inject etmez, önceliği kendi yazmaz. Bu yüzden devralınan input'un varsayılanı `undefined`'dır (`input<ArnSize>()`).
- DOM'a yazma otomatik değildir: `<html>` yalnızca `applyToDocument()` veya `provideArn({ applyToDocument: true })` ile güncellenir. `[arnConfig]` yalnızca kendi elemanına ve yalnızca verilen `density` / `colorScheme` / açık `direction` (`dir`) için yazar. `<html lang>` hiç yazılmaz.
- İki alanın varsayılanı ortamdan gelir: `locale` → Angular `LOCALE_ID`; `direction` → en yakın CDK `Directionality` (`auto` = verilmemiş). `direction` okunurken her zaman `ltr` / `rtl`'dir. `[arnConfig]` ve `provideArn` `Directionality`'yi sağlar; CDK tabanlı parçalar aynı yönü görür. Ayrıntı: [components/config-direction.md](../components/config-direction.md).
- Bu sıra her bileşen dokümanında "Yapılandırma" bölümünde kısaca belirtilir. Ayrıntı: [components/config.md](../components/config.md).

## i18n ve RTL (eski §9)

- Bileşen içindeki tüm sabit metinler (örn. "Seç", "Temizle", "Sonuç yok", aria-label'lar) dışarıdan verilebilir bir locale/mesaj sistemiyle gelir. Metin koda gömülmez.
- Metinler `ArnConfig.messages`'tadır (`ArnMessages`, varsayılan İngilizce). Her bileşen kendi alt başlığını core'a İngilizce varsayılanıyla ekler; tüketici ve çeviri paketi yalnızca `ArnDeepPartial<ArnMessages>` verir, bu yüzden anahtar eklemek kırıcı değildir, silmek/yeniden adlandırmak kırıcıdır. Gün/ay adları `Intl` ile `locale`'den üretilir, override edilebilir. Şema: [components/config-messages.md](../components/config-messages.md).
- Çeviri paketi dil başına ayrı entry point'tir (`@arn-ng/ui/locales/tr` → `ARN_MESSAGES_TR`); İngilizce çekirdekte yerleşiktir. Paket otomatik yüklenmez, `provideArn({ locale, messages })` ile açıkça verilir. Yalnızca anadili konuşanın yazdığı/gözden geçirdiği çeviri yayınlanır; çeviri UYDURULMAZ, yeni anahtarın Türkçesi kullanıcıya sorulur. Rehber: [components/locales.md](../components/locales.md).
- Her bileşen RTL'de test edilir (`<div arnConfig direction="rtl">`). Yön `injectArnConfig().direction` ile okunur; CDK parçasına `Directionality` kendiliğinden ulaşır.
- İkon ve ok yönleri RTL'de aynalanır: yön bildiren ikona `arn-rtl-mirror` sınıfı (`theme.css`, `:dir(rtl)` + `scale: -1 1`). Bileşen kendi aynalama kuralını yazmaz.
- Tarih/sayı formatı locale'e göre.

## Overlay (eski §10)

- Dropdown, popover, tooltip, dialog, menu hep tek ortak overlay altyapısından geçer: `ArnOverlayService.open()` (`@arn-ng/ui/core`, CDK Overlay üstünde). Bileşen CDK `Overlay`'i doğrudan kullanmaz; kendi z-index/portal/odak/kapanma çözümünü yazmaz. Ayrıntı: [components/overlay.md](../components/overlay.md).
- **Top layer kullanılmaz:** CDK 21+ overlay'leri varsayılan olarak tarayıcının top layer'ına koyar (host `popover="manual"`); orada z-index işlemez ve `--arn-z-*` katmanları çalışmaz. `ArnOverlayService` yalnız kendi overlay'leri için `usePopover: false` verir (`projects/ui/core/src/overlay/overlay.service.ts`); global `OVERLAY_DEFAULT_CONFIG` VERİLMEZ, tüketicinin diğer CDK overlay'leri CDK varsayılanında kalır. `overlay.layers.spec.ts` hiçbir overlay host'unda `popover` özniteliği olmadığını sabitler. Bilinen sınır: [components/overlay.md](../components/overlay.md).
- Hazır ayarlar: `modal`, `popover`, `dropdown`, `tooltip`. Katmanlar ve token'ları (`theme.css`, alttan üste): `--arn-z-dropdown` 1000, `--arn-z-popover` 1100, `--arn-z-modal` 1200, `--arn-z-toast` 1300, `--arn-z-tooltip` 1400.
- Overlay açanın ayarlarını miras alır: içerik açanın injector'ıyla oluşur (`injectArnConfig()` içeride doğru okur), `dir` / `.dark` / `.light` / `data-density` panele yazılır. Bu yüzden `open()`'a hep açan bileşenin `Injector`'ı verilir.
- Animasyon sözleşmesi: panel `data-state="open|closed"` (bağlı olanlarda `data-side`, `data-align`) taşır; `close()` çıkış animasyonu bitince, animasyon yoksa ya da `prefers-reduced-motion` varsa hemen kaldırır. Bileşen animasyonunu yalnız bu özniteliklere bağlar (`:host-context([data-state='closed'])`), süre/zamanlayıcı kodu yazmaz. Sözleşmeyi değiştirmek kırıcıdır.
- `role` ve `aria-*` servisin değil bileşenin işidir (dialog: `role="dialog"` + `aria-modal` + etiket).
