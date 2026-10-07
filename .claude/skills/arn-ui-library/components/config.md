# config (`provideArn`, `[arnConfig]`, `ArnConfigService`, `injectArnConfig`)

<!-- En fazla 150 satır. Mesaj şeması ve Intl ayrı dosyada: config-messages.md -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `[arnConfig]` |
| Entry point | `@arn-ng/ui/core` |
| Tür | ortak yapı (directive + servis + provider + inject yardımcısı) |
| Sınıf adları | `ArnConfigDirective`, `ArnConfigService`; fonksiyonlar `provideArn`, `injectArnConfig` |
| Dosya yolları | `projects/ui/core/src/config/` |

Dışa açılan tipler: `ArnConfig`, `ArnRootConfig`, `ArnResolvedConfig`, `ArnConfigRef`, `ArnSize`, `ArnDensity`, `ArnColorScheme`, `ArnDirection`, `ArnFormErrorTrigger`, `ArnFormsConfig`, `ArnDeepPartial`, `ArnMessages` ve alt arayüzleri. Injection token'lar dışa AÇILMAZ.

### Alanlar (`ArnConfig`, hepsi opsiyonel)

| Alan | Tip | Varsayılan |
|---|---|---|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `md` |
| `density` | `'comfortable' \| 'compact'` | `comfortable` |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `system` |
| `direction` | `'ltr' \| 'rtl' \| 'auto'` | `auto` |
| `ripple` | `boolean` | `false` (SKILL §5) |
| `locale` | `string` (BCP 47) | Angular `LOCALE_ID` (`en-US`) |
| `messages` | `ArnDeepPartial<ArnMessages>` | İngilizce + Intl ([config-messages.md](config-messages.md)) |
| `forms` | `{ showErrorsOn?: 'touched' \| 'dirty' \| 'submitted' }` | `touched` |

`ArnRootConfig` = `ArnConfig` + `applyToDocument?: boolean` (yalnızca `provideArn`). Görsel ayar (renk, font, kenarlık) buraya girmez, CSS token'ıdır.

## 2. Mimari ve CDK

CDK kullanılmaz; yalnızca `@angular/core` ve `@angular/common` (`DOCUMENT`).

### Öncelik sırası ve nerede uygulandığı

| Sıra | Seviye | Uygulandığı yer |
|---|---|---|
| 1 | Bileşenin kendi input'u | `injectArnConfig(key, own)` → `computed(() => own() ?? scope[key]())` |
| 2 | En yakın `[arnConfig]` | `createScope(directive, üstScope)` |
| 3 | `provideArn()` / `ArnConfigService` | `createScope(overrides, varsayılanlar)` (kök factory) |
| 4 | Kütüphane varsayılanı | `config.defaults.ts` (`DEFAULT_CONFIG`, tek yer) |

`undefined` her seviyede "bir alttakini kullan" demektir.

### DI zinciri (`config.scope.ts`)

- `createScope(own, parent)`: önceliğin TEK uygulandığı fonksiyon. Alan başına bir `computed` üretir (bir alan değişince yalnızca onu okuyan yeniden hesaplanır). Skalerler `??`, `forms` ve `messages` `deepMerge`.
- `ARN_ROOT_CONFIG`: `provideArn`'ın verdiği başlangıç objesi.
- `ARN_ROOT_OVERRIDES` (`providedIn: 'root'`): `WritableSignal<ArnConfig>`; servis çalışma zamanında bunu günceller.
- `ARN_CONFIG_SCOPE` (`providedIn: 'root'`): kök düğüm. Factory'si olduğu için `provideArn` çağrılmasa da vardır, `optional` gerekmez.
- `ArnConfigDirective` kendi elemanında `ARN_CONFIG_SCOPE`'u yeniden sağlar: `useFactory: () => createScope(inject(ArnConfigDirective), inject(ARN_CONFIG_SCOPE, { skipSelf: true }))`. Direktifin input signal'leri doğrudan `own` olur; direktifte gizli/iç üye yoktur. `skipSelf` üst bölümü ya da kökü bulur; iç içe bölümler bu zincirle çalışır.
- `ArnConfigService` kök scope'un signal'lerini aynen dışarı verir; ayrı bir hesap yapmaz.

### Parçalar

| Parça | Görev |
|---|---|
| `provideArn(config)` | `sanitizeConfig` → `ARN_ROOT_CONFIG`; `applyToDocument: true` ise `provideEnvironmentInitializer` ile servis çağrısı |
| `ArnConfigService` | Okunur signal'ler; `setSize`, `setDensity`, `setColorScheme`, `setDirection`, `setRipple`, `setLocale`, `setMessages`, `setForms`, `update`, `applyToDocument`. Hepsi `update` üzerinden geçer |
| `ArnConfigDirective` | Input'lar: 8 alanın hepsi, `input<T \| undefined>()`. `ripple` özel transform'lu (`booleanAttribute(undefined)` `false` verirdi, miras bozulurdu) |
| `injectArnConfig()` | `ArnConfigRef` döner; `injectArnConfig('size', this.size)` → `Signal<ArnSize>`. Anahtarlı biçim yalnızca skaler alanlar için |

### Bileşende kullanım

```ts
readonly size = input<ArnSize>();                                   // undefined = devral
protected readonly resolvedSize = injectArnConfig('size', this.size);
protected readonly messages = injectArnConfig().messages;           // messages().common.ok
```

### Direktifin host yansıması

Yalnızca input verilmişse yazar: `[attr.data-density]`, `[class.dark]`, `[class.light]`. Sınıf binding'i `false` yerine `null` verir, böylece verilmediğinde elemandaki statik `class="dark"` yerinde kalır (spec sabitler). `system` sınıf yazmaz. `direction` yansıtılmaz (adım d, `cdk/bidi`).

## 3. Token'lar

Yok. Yansıtılan `data-density` ve `.dark` / `.light`, `theme.css`'teki kuralları tetikler ([tokens-sizes.md](tokens-sizes.md), [tokens.md](tokens.md)).

## 4. Override rehberi

- **Global:** `provideArn({ size: 'sm' })`; çalışma zamanında `inject(ArnConfigService).setSize('lg')`.
- **Container:** `<div arnConfig size="sm" density="compact">`.
- **Tek örnek:** bileşenin kendi input'u (`size="xs"`).

## 5. Davranış ve a11y

### `applyToDocument`

- DOM'a yazma OTOMATİK DEĞİL. Yalnızca `service.applyToDocument()` ya da `provideArn({ applyToDocument: true })` ile.
- `<html>`'e yazar: `.dark` / `.light` (`system` → ikisi de kalkar), `data-density` (her zaman), `dir` (`auto` → dokunmaz; daha önce kendi yazdıysa kaldırır).
- Çağrıldıktan sonra her `set*` / `update` sonunda senkron yeniden yazar. Birden çok kez çağrılabilir.
- `<html>` üzerindeki `.dark` / `.light` ve `data-density`'yi sahiplenir (tüketicinin elle yazdığını ezer).
- SSR: `window`, `matchMedia`, global `document` yok; `system` CSS `color-scheme` ile çözülür. Sunucuda yazılan sınıf HTML'e serileşir.

**Tuzak:** density ve tema yalnızca CSS ile çalışır. `provideArn({ density: 'compact' })` ya da `{ colorScheme: 'dark' }`, `applyToDocument` olmadan GÖRSEL ETKİ YAPMAZ (yalnızca signal değeri değişir). `size` böyle değildir, bileşen kendi host'una uygular.

## 6. Form uyumu

`forms.showErrorsOn` yalnızca değeri taşır. Form elemanları Faz 4'te `injectArnConfig().forms` ile okur (SKILL §7).

## 7. Kısıtlar ve kararlar

- **`effect()` yok:** Angular 19'da developer preview (SKILL §1). Kök değerler yalnızca servis metotlarıyla değiştiği için DOM yazımı `update` içinde senkron yapılır; zone ve change detection'a bağlı değildir.
- **Bilinmeyen alan / geçersiz değer:** `sanitizeConfig` (`config.merge.ts`) `provideArn` ve `update` girişinde atar; atılan alan bir alt öncelikten çözülür. Atma her modda, `console.warn` yalnızca geliştirme modunda (`dev-mode.ts`, `ngDevMode`). Uyarı metinleri prod bundle'da kalır (küçük). `validators` tablosu `satisfies Record<keyof ArnConfig, …>`: arayüze alan eklenip tablo unutulursa derleme düşer. Direktif input'larını şablon derleyicisi denetler, orada çalışmaz.
- **`ngDevMode`** Angular 19'da global tip olarak bildirilmiyor; `dev-mode.ts` kendi `declare const`'unu taşır.
- **`provideArn` yalnızca kök içindir.** Route sağlayıcılarında çağrılırsa okunmaz; bölüm ayarı için `[arnConfig]`.
- **Geri alma yok:** servisle verilen bir alan "varsayılana dön" diye silinemez; açık değer verilir.
- **Reddedilenler:** direktifte tek obje input'u (`[arnConfig]="{…}"`; ayrı input'lar şablonda tip denetlenir ve tek tek değişir); token'ları dışa açmak; `ArnMessages` için module augmentation; servisin scope olması (iç üyeyi public yapardı).
- **Test şablonu ayrı dosyada:** `component-max-inline-declarations` satır içi şablonu 3 satırla sınırlar → `config.directive.spec.host.html`.

## 8. Testler

`projects/ui/core/src/config/*.spec.ts` (zoneless, Jasmine'e özgü API yok; `console.warn` `testing/console.ts` ile elle yakalanır).

| Spec | Kapsam |
|---|---|
| `config.merge.spec.ts` | Derin birleşme, dizi bütün değişir, `undefined` atlanır, mutasyon yok, `__proto__`; uyarı ve atma |
| `config.service.spec.ts` | Varsayılanlar, kısmi config, `set*` / `update`, `setMessages` derin birleşir; `applyToDocument` çağrılmadan `<html>` değişmez, çağrılınca yazar ve izler |
| `config.directive.spec.ts` | Dört basamaklı öncelik, üç seviye iç içe bölüm, `undefined`'a dönüş, servis değişimini izleme, host yansıması, `theme.css` ile `--arn-density`, axe; `injectArnConfig` context dışı hata |
| `messages.spec.ts` | [config-messages.md](config-messages.md) §8 |
| `config.types.spec.ts` | Derleme zamanı: 10 `@ts-expect-error` (Karma derlemesi kullanılmayan direktifte düşer; doğrulandı) |

Boşluklar: SSR'da çalıştırma yok; gerçek bileşenle sınama Faz 4; `dir` yansıması adım (d).

## 9. Bağlantılar

- Kod: `projects/ui/core/src/config/`, `projects/ui/core/src/public-api.ts`
- Devamı: [config-messages.md](config-messages.md)
- Doküman sayfası: Faz 3 (Yapılandırma)
