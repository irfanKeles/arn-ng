# locales (çeviri paketleri)

<!-- En fazla 150 satır. Mesaj şeması ve Intl: config-messages.md. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | Yok |
| Entry point | `@arn-ng/ui/locales/<dil>` (şu an yalnız `@arn-ng/ui/locales/tr`) |
| Tür | ortak yapı (dil başına bir secondary entry point) |
| Sınıf adları | Sabit: `ARN_MESSAGES_TR` (`ArnDeepPartial<ArnMessages>`) |
| Dosya yolları | `projects/ui/locales/tr/` (`ng-package.json`, `src/public-api.ts`, `src/messages.ts`, `src/messages.spec.ts`) |

```ts
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';
provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR });
```

İngilizce çekirdekte yerleşiktir (`DEFAULT_MESSAGES`), paketi yoktur.

## 2. Mimari ve CDK

- **İç içe secondary entry point:** ng-packagr `**/ng-package.json` arar; `projects/ui/locales/tr/` → `@arn-ng/ui/locales/tr`, FESM `fesm2022/arn-ng-ui-locales-tr.mjs`, `exports["./locales/tr"]`. `locales/` klasörünün kendi `ng-package.json`'ı YOKTUR; `@arn-ng/ui/locales` çözülmez.
- **Yalnız kullanılan dil pakete girer:** her dil ayrı FESM dosyasıdır. Paket core'dan yalnız `import type` yapar; derlenmiş dosya tek bir nesnedir, core'a çalışma zamanı bağımlılığı yoktur.
- **Otomatik yükleme yok:** `locale` (ya da `LOCALE_ID`) yalnız `Intl` gün/ay adlarını değiştirir. Metinler için paket açıkça verilir.
- **`datePicker` pakette yoktur:** gün ve ay adları `locale`'den `Intl` ile gelir ([config-messages.md](config-messages.md) §7).

## 3. Token'lar

Yok.

## 4. Override rehberi

- **Global:** `provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR })`.
- **Paketin bir metnini değiştirmek:** `messages: { ...ARN_MESSAGES_TR, common: { ...ARN_MESSAGES_TR.common, cancel: 'İptal' } }` ya da sonradan `ArnConfigService.setMessages({ common: { cancel: 'İptal' } })` (derin birleşir).
- **Container:** `<div arnConfig locale="tr-TR" [messages]="tr">` (`tr = ARN_MESSAGES_TR`).
- **Paketi olmayan dil:** tüketici kendi uygulamasında `messages` nesnesini yazar; paket beklemek gerekmez.

## 5. Davranış ve a11y

### Türkçe metinler (anadili gözden geçirmesinden geçti, 2026-10-07)

| Anahtar | English | Türkçe |
|---|---|---|
| `common.yes` | Yes | Evet |
| `common.no` | No | Hayır |
| `common.confirm` | Confirm | Onayla |
| `common.reject` | Reject | Reddet |
| `common.cancel` | Cancel | Vazgeç |
| `common.ok` | OK | Tamam |
| `dialog.confirmTitle` | Confirmation | Onay |
| `dialog.closeLabel` | Close | Kapat |
| `toast.successTitle` | Success | Başarılı |
| `toast.infoTitle` | Information | Bilgi |
| `toast.warningTitle` | Warning | Uyarı |
| `toast.errorTitle` | Error | Hata |
| `toast.closeLabel` | Close | Kapat |

`common.cancel` için "İptal" değil "Vazgeç" seçimi anadili kararıdır (kullanıcı, 2026-10-07); gerekçesiz değiştirilmez.

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **Yalnız anadili çeviri yayınlanır.** Anadili olmayan (makine ya da tahmin) çeviri pakete girmez; bu yüzden ilk sürümde tek ek dil Türkçe.
- **Tip `ArnDeepPartial<ArnMessages>`, tamlık derlemede zorlanmaz** (`satisfies` yok): core'a anahtar eklemek dil paketlerini kırmamalı, katkıyla gelen dilde kimse çeviri uydurmak zorunda kalmamalı. Eksik anahtar İngilizce kalır. Türkçe'nin tamlığını spec zorlar (bakımcının dili).
- **`ARN_CONFIG_TR` (`{ locale, messages }`) EKLENMEDİ:** dil başına ikinci public export; bölgeyi pakete gömer (`en-GB` / `ar-EG` gibi dillerde yanlış varsayım); `[messages]` kullanımında işe yaramaz. Sonradan eklemek kırıcı değildir.
- **Yeni anahtar eklenince:** bileşeni yazan `DEFAULT_MESSAGES`'a İngilizcesini ekler; Türkçe spec düşer ve Türkçesi kullanıcıya sorulur (uydurulmaz).

### Yeni dil ekleme rehberi

1. Çeviriyi o dilin anadili konuşanı yazar ya da gözden geçirir; PR'da kim olduğu belirtilir.
2. `projects/ui/locales/<dil>/` oluştur (`<dil>`: küçük harf BCP 47 dil kodu, ör. `de`; bölge gerekiyorsa `pt-br`). `tr/` klasörünü kopyala.
3. `ng-package.json` aynen kalır. `src/messages.ts`: sabit adı `ARN_MESSAGES_<DİL>` (`ARN_MESSAGES_DE`), tip `ArnDeepPartial<ArnMessages>`, `import type … from '@arn-ng/ui/core'` (göreli import YASAK). `datePicker` yazılmaz.
4. `src/messages.spec.ts`: `tr`'deki dört test uyarlanır. Kısmi paket kabul edilir; o zaman "her anahtar çevrildi" testi yerine "fazladan anahtar yok" testi kalır ve eksikler bu dosyaya yazılır.
5. Bu dosyaya metin tablosu, [INDEX.md](INDEX.md)'e satır, JSDoc'ta kullanım örneği.
6. `npm run lint` → `format:check` → `build:ui` → `test:ci`; `exports` değiştiği için `local-package-test.md` akışı (tüketicide import + `ng build`).
7. RTL dil (Arapça, İbranice, Farsça) yalnız metin getirir; yön ayrı ayardır ([config-direction.md](config-direction.md)).

## 8. Testler

`projects/ui/locales/tr/src/messages.spec.ts`: `DEFAULT_MESSAGES`'ın tüm yaprak anahtarları çevrilmiş, fazlası yok; `datePicker` yok; 13 metin tablodakiyle birebir; `provideArn` ile metinler paketten, ay/gün adları `Intl`'den. Paketlenmiş hali `local-package-test.md` dördüncü çalıştırmasında sınandı (import çözülüyor, bilinmeyen dil yolu build'i düşürüyor).

Spec core'u göreli yolla import eder; `messages.ts` içindeki `@arn-ng/ui/core` testte ve lint'te `projects/ui/tsconfig.json` `paths` ile KAYNAĞA çözülür (`dist` gerekmez).

## 9. Bağlantılar

- Kod: `projects/ui/locales/tr/`, `projects/ui/tsconfig.json`
- Şema: [config-messages.md](config-messages.md); ayar: [config.md](config.md)
- Doküman sayfası: Faz 3 (RTL ve i18n)
