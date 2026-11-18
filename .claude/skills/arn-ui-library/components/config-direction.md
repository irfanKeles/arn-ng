# config-direction (yön, RTL, `Directionality`, ikon yansıtma)

<!-- En fazla 150 satır. config.md'nin devamıdır: hiyerarşi, provideArn ve servis orada. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `[arnConfig]` (`direction` input'u); CSS: `.arn-rtl-mirror` |
| Entry point | `@arn-ng/ui/core`, `@arn-ng/ui/theme.css` |
| Tür | ortak yapı |
| Sınıf adları | İç (dışa açılmaz): `SignalDirectionality`, `ArnRootDirectionality`; fonksiyonlar `ambientDirection`, `explicitDirection`, `createSectionDirectionality` |
| Dosya yolları | `projects/ui/core/src/config/direction.ts`, `root-directionality.ts`, `config.directive.ts`, `config.scope.ts`, `projects/ui/theme.css` |

Giriş tipi `ArnDirection` = `'ltr' | 'rtl' | 'auto'`. Çıkış (`injectArnConfig().direction`, `ArnConfigService.direction`) HER ZAMAN `'ltr' | 'rtl'`'dir (`ArnResolvedConfig.direction`).

## 2. Mimari ve CDK

`@angular/cdk/bidi` kullanılır (`Directionality` token'ı ve tipi). `Dir` direktifi KULLANILMAZ (§7).

**Tek doğruluk kaynağı en yakın `Directionality`'dir.** Öncelik:

| Sıra | Seviye | Nerede |
|---|---|---|
| 1 | Bileşenin kendi input'u (varsa) | `injectArnConfig('direction', own)` |
| 2 | Bölümün açık değeri (`ltr` / `rtl`) | `createScope`: `explicitDirection(own.direction()) ?? parent.direction()` |
| 3 | En yakın `Directionality` | Üst `[arnConfig]`, araya giren CDK `Dir`, en sonda kök |
| 4 | Kök: `provideArn({ direction })` açık değeri, yoksa belge (`<html>` / `<body>` `dir`) | `ArnRootDirectionality` |

`auto` ile "verilmemiş" aynıdır: ikisi de "burada geçerli olan". Bu yüzden yönde üst bölümün AYARI devralınmaz, üstteki `Directionality` okunur; araya giren `<div dir="ltr">` (CDK `Dir`) de doğru sonuç verir. `DEFAULT_CONFIG`'te `direction` yoktur (`locale` gibi ortamdan gelir).

### Parçalar

| Parça | Görev |
|---|---|
| `ambientDirection(dir)` | Bir `Directionality`'yi signal'e çevirir. `valueSignal` varsa onu döner (CDK 22'nin `Directionality` ve `Dir`'i ile bizim nesnelerimiz taşır); yoksa `change` her yaydığında `dir.value`'yu yeniden okuyan `computed` (CDK 19 için yazılmış yedek yol). Abonelik `DestroyRef` ile temizlenir |
| `SignalDirectionality` | CDK'nın beklediği biçim: `value` (getter), `change` (`EventEmitter`), `valueSignal`. `sync()` son görülenden farklıysa yayar; ilk çağrı yalnız kaydeder |
| `ArnRootDirectionality` | `provideArn` ile kök `Directionality`'nin yerine geçer: `explicit(kök direction) ?? belge yönü`. Belge yönünü, özel token altında `useClass: Directionality` ile kurulan CDK örneğinden alır (CDK'nın kendi okuma mantığı; CDK 22.2'de önce `<body dir>`, yoksa `<html dir>`, `auto` değeri `navigator.language`'a göre çözülür). `ARN_ROOT_OVERRIDES`'a bağlıdır, scope'a değil (döngü yok) |
| `[arnConfig]` sağlayıcıları | `ARN_CONFIG_SCOPE` (üst scope + `direction: ambientDirection(üst Directionality)`), `ARN_SECTION_DIRECTIONALITY` (`createSectionDirectionality`), `Directionality` → `useExisting` |

### Değişimi yayma (`effect()` olmadan)

- Bölüm: `ngOnChanges` (signal input'larda da çalışır) → host `dir` yazımı + `sync()`; `ngOnInit` → `sync()` (hiç input bağlanmamışsa başlangıcı kaydeder). Üst `Directionality.change` → `sync()`.
- Kök: `ArnConfigService.update` sonunda `rootDirectionality.sync()`.
- Bölümün `Directionality`'si direktifin constructor'ında inject EDİLEMEZ (factory'si direktifi ister → döngü); hook'larda `Injector.get` ile alınır.

### Host `dir`

Yalnız açık değer (`ltr` / `rtl`) yazılır; `auto` / verilmemiş yazmaz. `Renderer2` ile yazılır, `[attr.dir]` binding'i ile değil: `null` binding elemandaki statik `dir`'i silerdi. Direktif yalnız kendi yazdığını kaldırır (`wroteDir`, servisteki örüntünün aynısı).

## 3. Token'lar

Yok. Tek CSS kuralı: `.arn-rtl-mirror:dir(rtl) { scale: -1 1; }` (`theme.css`).

## 4. Override rehberi

- **Uygulama (önerilen):** `<html dir="rtl">` yaz, `direction` verme. SSR'da da doğru.
- **Uygulama, çalışma zamanında:** `provideArn({ direction: 'rtl', applyToDocument: true })` + `ArnConfigService.setDirection('ltr')`.
- **Bölüm:** `<div arnConfig direction="rtl">`; içine `direction="ltr"` bölüm konabilir.
- **İkon:** yön bildiren ikona (ok, chevron) `class="arn-rtl-mirror"`; tüketicinin kendi ikonunda ve üçüncü parti ikon bileşeninde de aynı. Onay, artı, saat gibi yönsüz ikonlar işaretlenmez.

**Tuzak:** `provideArn({ direction: 'rtl' })` `applyToDocument` olmadan yalnız DEĞERDİR: config ve `Directionality` `rtl` der ama DOM değişmez, mantıksal CSS ve `:dir()` LTR kalır (density / colorScheme ile aynı tuzak, [config.md](config.md) §5).

## 5. Davranış ve a11y

- Bölüm yönü DOM'da gerçek `dir` özniteliğidir: tarayıcı bidi algoritması, mantıksal CSS ve `:dir()` kendiliğinden uyar.
- `<html lang>` YAZILMAZ: `locale` biçimlendirme dilidir, içerik dili olmayabilir; WCAG 3.1.1 için `lang`'i tüketici verir.

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **`hostDirectives: [Dir]` reddedildi:** `Dir` bulunduğu her elemanda `Directionality`'yi ezer ve değer verilmediğinde `'ltr'` der; RTL sayfadaki `<div arnConfig size="sm">` altını LTR sanardı. Input'u da `effect()` olmadan beslenemez.
- **`valueSignal`:** CDK 22.2'de `Directionality` ve `Dir` `valueSignal` taşır; kendi nesnelerimiz de sağlar. `ambientDirection`'daki `change` yedeği CDK 19 için yazıldı; peer `^22.0.0` ile CDK nesnelerinde devreye girmez (kaldırılması ayrı kod işi).
- **`rxjs-interop` yok:** elle abonelik + `DestroyRef.onDestroy`. İlk gerekçe (19'da developer preview) artık geçerli değil: Angular 22'de `takeUntilDestroyed` `@publicApi 19.0`, `ToSignalOptions` `@publicApi 20.0` (`toSignal`'in kendi etiketi `.d.ts`'te yok). Örüntü kalır ([../rules/angular.md](../rules/angular.md)).
- **`scale`, `transform: scaleX(-1)` değil:** etki aynı; bileşenin kendi `transform`'unu (açılınca dönen chevron) ezmez. Token (`--arn-mirror`) reddedildi: her RTL elemana özellik yazan evrensel kural ister, tüketiciye yine CSS yazdırır.
- **Kural `theme.css`'te:** ikon bileşeni yok; global kural bileşen içindeki ikonlara da uygulanır. `:dir()` tabanı Chrome 120 / Firefox 49 / Safari 16.4 (`light-dark()` tabanının altında).

### Bilinen sınırlar

| Durum | Sonuç |
|---|---|
| `auto` iken `<html dir>` elle değiştirilir | İzlenmez (CDK da izlemez; `MutationObserver` reddedildi: SSR, maliyet). Çalışma zamanı için `setDirection` |
| `provideArn()` çağrılmadan `setDirection` | Yalnız kök config değeri değişir; bölümler ve CDK izlemez. Geliştirme modunda uyarı |
| CDK `Dir`'e `[dir]="x"` ile bağlanan İLK değer | CDK 22.2'de `Dir` `ngAfterContentInit`'ten önce `change` yaymaz ama `valueSignal`'i hemen günceller. `ambientDirection` signal'i okuduğu için bölümün doğru yönü görmesi beklenir (kaynaktan çıkarım, spec'le sınanmadı); `value`'yu oluşturma anında bir kez okuyan kod `ltr` görebilir. Statik `dir="rtl"` ve `[arnConfig]` etkilenmez |
| Şablonda düz `<div dir="rtl">` (CDK `Dir` import edilmemiş) ya da `<div arnConfig dir="rtl">` | DOM RTL olur, DI görmez. `arnConfig direction="rtl"` kullan |

## 8. Testler

| Spec | Kapsam |
|---|---|
| `config.direction.spec.ts` (+ `.spec.host.html`) | `auto` → belge (provideArn'lı ve provideArn'sız), açık `auto` üstü izler, CDK `Dir` altında; host `dir` yazımı / kaldırma, statik `dir` korunur; `rtl > ltr > verilmemiş` iç içe; config değeri ile `inject(Directionality).value` her düğümde eşit; `change` yayımı (değişim başına bir kez, kendi yönü olan bölüm yaymaz); kök `provideArn` / `setDirection` / `auto`'ya dönüş; locale zinciri; axe |
| `config.service.spec.ts` | `auto` → `<html dir>`; kök `Directionality` `setDirection`'ı izler ve yayar; `provideArn`'sız uyarı; `lang` yazılmaz |
| `testing/theme.spec.ts` | `.arn-rtl-mirror`: RTL'de `scale` `-1 1`, LTR'de ve `rtl` içindeki `ltr`'de `none`, sınıfsız eleman, `transform` korunur |
| `config.types.spec.ts` | Çözülmüş yöne `'auto'` atanamaz |

Boşluklar: SSR'da çalıştırma yok. Spec'ler CDK 22.2 ile koşar; CDK nesnelerinin `valueSignal` yolu için ayrı bir test yok. Gerçek CDK overlay ile sınama: `overlay.inherit.spec.ts`, `overlay.presets.spec.ts` ([overlay.md](overlay.md)).

## 9. Bağlantılar

- Kod: `projects/ui/core/src/config/direction.ts`, `root-directionality.ts`, `config.directive.ts`, `config.scope.ts`, `config.service.ts`, `provide-arn.ts`, `projects/ui/theme.css`
- Ana dosya: [config.md](config.md); dil paketleri: [locales.md](locales.md)
- CDK kaynağı: `src/cdk/bidi/directionality.ts`, `dir.ts` (yazılırken 19.2.x okundu); kurulu 22.2.7 paketinde `fesm2022/_directionality-chunk.mjs`, `fesm2022/bidi.mjs`
- Doküman sayfası: `/configuration`, `direction` bölümü ([docs-site-pages-guides.md](../../arn-docs-site/components/docs-site-pages-guides.md))
