# config-messages (mesaj şeması ve Intl)

<!-- En fazla 150 satır. config.md'nin devamıdır: hiyerarşi, provideArn ve servis orada. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | Yok |
| Entry point | `@arn-ng/ui/core` |
| Tür | ortak yapı |
| Sınıf adları | Tipler: `ArnMessages`, `ArnCommonMessages`, `ArnDialogMessages`, `ArnToastMessages`, `ArnDatePickerMessages` |
| Dosya yolları | `projects/ui/core/src/config/messages.ts`, `date-names.ts` |

Bu adımda yalnızca ŞEKİL ve varsayılanlar var. Çeviri paketleri ve RTL adım (d)'dedir.

## 2. Mimari ve CDK

- Varsayılan dil İngilizce: `DEFAULT_MESSAGES` (`messages.ts`, dışa açılmaz). Gün/ay adları burada DEĞİL.
- `resolveMessages(locale, overrides)` = `deepMerge({ ...DEFAULT_MESSAGES, datePicker: dateNames(locale) }, overrides)`.
- **Scope'lar override taşır, çözülmüş mesaj taşımaz.** Her düğüm `messageOverrides = deepMerge(üst.messageOverrides, kendi messages)` hesaplar, sonra kendi `locale`'i ile çözer. Çözülmüş mesaj devralınsaydı yalnızca `locale` değiştiren alt bölüm, üstün Intl ile üretilmiş İngilizce adlarını "açık override" sanıp korurdu. Spec sabitler.
- Kısmi override her seviyede derin birleşir: `provideArn` → dıştaki `[arnConfig]` → içteki `[arnConfig]`. Diziler bütün olarak değişir.

## 3. Token'lar

Yok.

## 4. Override rehberi

- **Global:** `provideArn({ messages: { common: { ok: 'Tamam' } } })`; çalışma zamanında `ArnConfigService.setMessages(…)` (öncekiyle derin birleşir).
- **Container:** `<div arnConfig [messages]="…" locale="tr-TR">`.
- **Tek örnek:** bileşenin kendi metin input'u varsa o (bileşenin referans dosyasına bak).

## 5. Davranış ve a11y

`closeLabel` gibi anahtarlar erişilebilir addır (aria-label); metin koda gömülmez (SKILL §9).

### Şema (v1)

| Alt başlık | Anahtar | Varsayılan |
|---|---|---|
| `common` | `yes`, `no`, `confirm`, `reject`, `cancel`, `ok` | Yes, No, Confirm, Reject, Cancel, OK |
| `dialog` | `confirmTitle`, `closeLabel` | Confirmation, Close |
| `toast` | `successTitle`, `infoTitle`, `warningTitle`, `errorTitle`, `closeLabel` | Success, Information, Warning, Error, Close |
| `datePicker` | `monthNames`, `monthNamesShort` (12 eleman) | Intl: `month: 'long' \| 'short'` |
| `datePicker` | `dayNames`, `dayNamesShort`, `dayNamesMin` (7 eleman) | Intl: `weekday: 'long' \| 'short' \| 'narrow'` |

Gün dizilerinde indeks 0 Pazar'dır (`Date.prototype.getDay()` ile aynı). Haftanın ilk günü mesaj değildir; date picker'ın kararıdır (Faz 6).

### Genişleme kuralı

- Her bileşen `ArnMessages`'a kendi alt başlığını (`select`, `datePicker`…) core'daki `messages.ts`'e ekler ve `DEFAULT_MESSAGES`'a İngilizce varsayılanını yazar. Yeni anahtar varsayılansız eklenmez.
- Tüketici ve çeviri paketleri `ArnMessages`'ı tam uygulamaz, `ArnDeepPartial<ArnMessages>` verir. Bu yüzden anahtar veya alt başlık eklemek kırıcı DEĞİLDİR (minor); eksik çeviri İngilizce kalır.
- Anahtar silmek, yeniden adlandırmak ya da tipini değiştirmek kırıcıdır.
- Birden çok bileşenin kullandığı metin `common`'a girer; tek bileşene özgü olan o bileşenin alt başlığına.

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

### Intl (`date-names.ts`)

- `dateNames(locale)`: `Intl.DateTimeFormat(locale, { month | weekday, timeZone: 'UTC' })` ile sabit tarihlerden üretir (aylar 2024'ün her ayının 1'i; günler 7 Ocak 2024 Pazar'dan başlayarak). Yalnız `month` / `weekday` istendiği için tek başına (yalın) biçim gelir.
- Locale başına modül düzeyinde `Map` önbelleği; aynı locale için aynı nesne döner.
- Geçersiz etiket (`RangeError`) → `en-US` + geliştirme modunda uyarı. İyi biçimli ama bilinmeyen etiket (`zz`) hata vermez, çalışma ortamının varsayılanına düşer.
- Override: `messages.datePicker.dayNamesMin` gibi verilen dizi Intl'in önüne geçer; verilmeyenler Intl'den gelir.

**Artı:** her dil bedava, çeviri paketi dört dizi taşımaz, liste bakımı yok, Node'da da var (SSR).
**Eksi:** çıktı çalışma ortamının ICU sürümüne bağlıdır (sunucu ve tarayıcı nadiren farklı yazabilir); kısaltmalar dile göre noktalı gelebilir (`janv.`); beğenilmezse override gerekir. Testte locale sabit verilir.

## 8. Testler

`messages.spec.ts`: İngilizce varsayılanlar; `en-US` ve `tr-TR` adları (uzunluk, ilk/son eleman, indeks 0 Pazar); kısmi override derin birleşir; verilen dizi Intl'i ezer; önbellek; geçersiz locale. Hiyerarşideki birleşme ve locale değişimi `config.directive.spec.ts`'te.

## 9. Bağlantılar

- Kod: `projects/ui/core/src/config/messages.ts`, `date-names.ts`, `config.scope.ts` (`messageOverrides`)
- Ana dosya: [config.md](config.md)
- Devamı: çeviri paketleri ve RTL, ROADMAP Faz 2 (i18n maddesi)
