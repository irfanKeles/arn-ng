# Form uyumu ve erişilebilirlik

## Form uyumu (eski §7)

- Form elemanları yalnız `FormValueControl` / `FormCheckboxControl` (`@angular/forms`) uygular; `ControlValueAccessor` UYGULANMAZ (ikisi birden yasak: runtime'da CVA önce seçilir). Test matrisi: `ngModel`, `formControl`, `formControlName`, `[formField]` dördü de test edilir. Karar: [decisions/2026-11.md](../decisions/2026-11.md) "Signal Forms stratejisi".
- Zorunlu durumlar: `disabled` (formdan ve input'tan), `invalid`, `touched`, `dirty`, `readonly`, `required`.
- Hata görünümü bileşenin `invalid` / `touched` / `dirty` input'larından bileşenin kendisinde hesaplanır. `ng-*` sınıflarına (`ng-invalid` vb.) bağımlı olunmaz (Signal Forms onları varsayılan olarak uygulamaz); `errors` yalnız `kind` alanından okunur (klasik yolda ReactiveValidationError[], `[formField]`'da RequiredValidationError[] gibi; ikisinde de `kind` var); başka yapısal alan okunmaz.
- Hata, kontrol `invalid` iken `forms.showErrorsOn`'un (`ArnConfig`'ten) seçtiği durum gerçekleşince görünür; `invalid` input'u elle (formsuz) verilerek de tetiklenebilir.
- `disabled` doğru uygulanır: FVC'de `setDisabledState` yok, formdan gelen disabled `disabled` input'una bağlanır; formdan ve input'tan gelen iki yol da test edilir.
- `forms.showErrorsOn` değerleri: `touched` (varsayılan) ve `dirty`. `submitted` kaldırıldı (Signal Forms'ta karşılıksız, `FieldState`'te `submitted` yok): tipte derleme hatası, runtime'da `sanitizeConfig` `forms`'u atar ve dev modda uyarır.
- Ölçülmüş köprü davranışı (forms spike, Angular 22.2.6; karar: [decisions/2026-11.md](../decisions/2026-11.md) "Forms spike sonuçları"). Aşağıdakiler input'ta testle kilitlenir; Angular davranışı değişince test kırılır.

| Klasik yol (`ngModel`, `formControl`, `formControlName`) | Alanlar |
|---|---|
| Özel kontrole ulaşır | `value`, `disabled`, `touched`, `dirty`, `invalid`, `pending`, `errors` (`kind` alanı iki biçimde de var; mesaj eşlemesi yalnız `kind`'den yapılır) |
| Ulaşmaz | `readonly`, `hidden`, `name`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `disabledReasons` |
| Statik öznitelik / binding olarak verilirse | Bileşene doğrudan gelir; input'lar `booleanAttribute`, `numberAttribute`, string → `RegExp[]` transform'larıyla tanımlanır |

| # | Doğrulama kaynağı | Doğrulama | Bileşenin `required` input'u |
|---|---|---|---|
| 1 | Reaktif + TS'te `Validators.required` | Çalışır | Köprüyle `true` (ölçüldü) |
| 2 | Reaktif + `Validators.required` + elemanda `required` | Büyük olasılıkla (1) ile aynı; ÖLÇÜLMEDİ | Köprü `required`'ı form gerçeğine eşitler |
| 3 | Reaktif + yalnız elemanda statik `required` | YOK | Önce `""`, sonra `false`'a ezilir (ölçüldü) |
| 4 | Reaktif + `[required]="kosul"` binding, validator yok | YOK (çıkarım, ölçülmedi) | (3) ile aynı (çıkarım) |
| 5 | `ngModel` + `required` | YOK (`setupCustomControl` validator eklemez; pratik yol yok) | Statik değer gelir, doğrulama üretmez |
| 6 | `[formField]` + şemada `required(s)` | Çalışır | Şemadan |

- Kullanıcı şaşkınlığı riski (3), (4) ve (5)'te: native input'ta çalışan öznitelik burada sessizce işlemez. Belgeyle ve kilit testiyle sabitlenir.
- Bileşenin `required` input'u form doğrulaması üretmez. Formsuz bileşen-içi doğrulama modu input planında karara bağlanır.
- Formsuz kullanım: `[(value)]` model bağlama yeterlidir, forms gerekmez. Form kullanımında reaktif form ya da signal forms önerilir; `ngModel` desteklenir ama doğrulama yoktur.
- `[formField]` + statik öznitelik (`required`, `name`, `min`, `readonly`) derlenmez (`NG8022`); değer yalnız şemadan gelir.
- Klasik reset: bileşenin `reset()`'i çağrılmaz; `value` `null` gelir (nonNullable `FormControl` hariç, o başlangıç değerine döner; `ngModel`'de seçenek yok). Bileşen `value() ?? ''` ile normalize eder. `[formField]`'da `reset()` değeri değiştirmez, `reset({...})` değiştirir.
- `min` / `max` yalnız number / date kontrolünde (`FormValueControl<number>`); metin kontrolünde tanımlanmaz (`TS2416`, tipi `TValue`'ya bağlı). `valid` input'u tanımlanmaz (köprü yoksa sessizce atlar).
- Statik öznitelik adları büyük/küçük harfe duyarlıdır: `minLength` / `maxLength` yazılır; küçük harfli `maxlength` bileşene ulaşmaz.
- Focus: yalnız `[formField]` `focusBoundControl()` bileşenin `focus()`'unu çağırır; klasik yolda API yok.
- Checkbox'ta `required` + `false`: klasik yolda geçerli, signal forms'ta geçersiz; testle sabitlenir.
- `hidden(...)` true olan alan DOM'da kalırsa signal forms `NG01916` uyarısı verir; bileşen sayfası alanın `@if` ile kaldırılmasını belgeler.
- `NG_VALUE_ACCESSOR` sağlanmaz (koruma testi; sağlanırsa klasik yollar yalnız CVA'yı kullanır, `[formField]` karma çalışır). `NgControl` enjekte edilmez.
- Peer: `@angular/forms` `^22.2.5` zorunlu. `implements FormValueControl` `.d.ts`'te `@angular/forms` referansı bırakır; FESM'de import yok.
- Sözleşme (boşluk değil): kontrol blur'da `touch` output'unu emit eder; form kontrolü `touched` durumunu buradan alır. `touched` 22.0'dan beri `touched` input + `touch` output çiftidir.
- Minimum `@angular/forms` / `@angular/core`: `^22.2.5` (öncesinde `FormValueControl` + reactive `updateOn: 'blur'` / `'submit'` bozuk).

## Yerel input/textarea direktifi (`arnInput`)

Ölçüm: arnInput spike'ı (dal `docs/input-spike`, geçici probe, Angular 22.2.x; Chromium, Firefox, WebKit (Playwright)). Karar: [decisions/2026-11.md](../decisions/2026-11.md) "arnInput ölçüm spike'ı". Aşağıdaki her hücre üç motorda ve `<input>` / `<textarea>`'da aynı.

- Yukarıdaki doğrulama tablosunun satır 3 ve 5'i FVC (özel kontrol) içindir; arnInput için geçerli değil. Yerel elemanda klasik yollar `DefaultValueAccessor` üzerinden çalışır, statik doğrulayıcı öznitelikleri devreye girer.

| Hücre | `[formField]` | `[formControl]` | `formControlName` | `[(ngModel)]` |
|---|---|---|---|---|
| Değer gidiş-dönüş (model→DOM, yazma→model) | Çalışır | Çalışır | Çalışır | Çalışır |
| disabled (native `disabled` yazılır) | Şemada `disabled()` | `disable()` | `disable()` | `[disabled]` |
| blur'da touched | Evet | Evet | Evet | Evet |
| Host'ta `ng-*` sınıfları | Yok | Var | Var | Var |
| Host'ta `aria-invalid` | Yazılmaz | Yazılmaz | Yazılmaz | Yazılmaz |
| Statik `required` | Derlenmez (`NG8022`); şemadaki `required(s)` native `required`'ı yazar | Doğrulama üretir | Doğrulama üretir | Doğrulama üretir |
| `[required]` binding | Derlenmez (`NG8022`) | Doğrulama üretir (M3-A: `required` input'lu probe ile ölçüldü; boş direktifle ÖLÇÜLMEDİ) | ÖLÇÜLMEDİ | ÖLÇÜLMEDİ |

- Durum okuma (M3): direktif `required` input'u tanımlarsa `[required]` bağlamasını yutar, native `required` yazılmaz (`el.required` false); bu yüzden tanımlanmaz. `required` ve `aria-invalid` DOM'dan (MutationObserver) okunur: statik öznitelik, `[required]` ve `RequiredValidator`'ın yazdığı öznitelik görünür. TS'teki `Validators.required` DOM'a yazmaz (öznitelik yok, `el.required` false).
- "Boş mu" `input` olayıyla izlenemez: programatik yazımı (`setValue`, `[formField]` modeli, `ngModel`) kaçırır. `:placeholder-shown` (`placeholder=" "`) programatik yazımda da doğru sonuç verir.
- `aria-invalid` çakışması: direktif host'ta `[attr.aria-invalid]` bağlarsa ilk render'da tüketicinin statik değerini ve `[attr.aria-invalid]` bağlamasını ezer; sonra son yazan kazanır; direktif `null` verirse tüketicinin statik özniteliği silinir. arnInput `aria-invalid` yazmaz.
- `:user-invalid` (M5, `required` + boş): yalnız focus+blur eşleşmez; yaz+sil, odak içerideyken eşleşmez; yaz+sil+blur eşleşir. `aria-invalid` (`true` / `false`) sonucu değiştirmez. `Validators.required` ile eşleşmez (çıkarım: native `required` yok). `[aria-invalid=true], :user-invalid:not([aria-invalid=false])` birleşimi ÖLÇÜLMEDİ.
- NgControl (M6, yalnız ölçüm; "`NgControl` enjekte edilmez" geçerli): `inject(NgControl, {self, optional})` dört yolda gelir (`[formField]`'da `InteropNgControl`), `invalid` / `touched` / `errors` okunur. Import FESM'e `@angular/forms` import'u koyar; peer listesinde forms yokken ng-packagr uyarı vermez.

## Erişilebilirlik (a11y) — her bileşende zorunlu (eski §8)

- Tam klavye kullanımı: Tab/Shift+Tab, ok tuşları, Enter, Space, Escape, Home/End (bileşen türüne göre WAI-ARIA Authoring Practices kalıbına uy).
- Doğru `role` ve `aria-*` nitelikleri (`aria-expanded`, `aria-invalid`, `aria-describedby`, `aria-disabled`...).
- Focus yönetimi: overlay açılınca focus içeri, kapanınca tetikleyiciye döner. Focus trap (dialog). Görünür focus halkası.
- Sadece renkle bilgi verme. Kontrast yeterli.
- Ekran okuyucu için gizli metin/label mekanizması.
- A11y bir "sonra yaparız" değildir. A11y eksikse bileşen BİTMİŞ sayılmaz.
- CDK'nın a11y araçları (`FocusTrap`, `FocusMonitor`, `ListKeyManager`, `LiveAnnouncer`) tercih edilir, elle yazılmaz.
