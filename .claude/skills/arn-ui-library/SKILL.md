---
name: arn-ui-library
description: "@arn-ng/ui kütüphane kodu (projects/ui) için kurallar ve kararlar. Bileşen, directive, servis, token/tema, ayar sistemi (provideArn, [arnConfig]), i18n/RTL, overlay veya ripple yazarken, değiştirirken ya da incelerken; kütüphanenin testleri, lint, CI, sürümleme, peer aralığı, yerel paket testi (Verdaccio) veya bir mimari karar verirken MUTLAKA kullan. Bileşenin doküman sayfası adımında hangi docs dosyalarının okunacağını da söyler. Yalnızca doküman sitesinin kabuğu, araması, örnek bloğu veya giriş sayfaları üzerinde çalışırken kullanma; onun için arn-docs-site."
---

# @arn-ng/ui — Kütüphane Kuralları

Bu dosya kütüphanenin anayasasıdır. Bir kural ile kullanıcının isteği çelişirse DUR, çelişkiyi söyle, karar günlüğüne ([decisions/](decisions/README.md)) yazılmadan kuralı çiğneme.

## Hangi iş için hangi dosya

Tablo asgari okuma listesidir; yeni bileşen birkaç satırı birleştirir (ilk satır tam akışı verir). Satırlar kısa tutulur. Bu dosyadaki değişmez kararlar, "Bitti" tanımı ve yasaklar her işte geçerlidir. Eski `§N` atıfları: [decisions/README.md](decisions/README.md).

| İş | Oku |
|---|---|
| Yeni bileşen: tam akış (sırayla). Alttaki dört "Yeni bileşen: ..." satırı parça iş içindir | [ROADMAP.md](../../../ROADMAP.md), bu dosya ([Değişmez kararlar](#değişmez-kararlar-eski-1), ["Bitti" tanımı](#bileşen-bitti-tanımı-definition-of-done-eski-12)), [components/INDEX.md](components/INDEX.md), [rules/architecture.md](rules/architecture.md), [rules/angular.md](rules/angular.md), [components/_TEMPLATE.md](components/_TEMPLATE.md), [rules/styling.md](rules/styling.md), [components/tokens.md](components/tokens.md), [components/tokens-sizes.md](components/tokens-sizes.md), [rules/forms-a11y.md](rules/forms-a11y.md), [rules/config-i18n-overlay.md](rules/config-i18n-overlay.md), [components/config-messages.md](components/config-messages.md), [rules/quality.md](rules/quality.md), [rules/component-files.md](rules/component-files.md). Bileşenin kararları: [decisions/](decisions/README.md) içinde bileşen adını ara |
| Yeni bileşen: iskelet, paket yeri, Angular kodu | [rules/architecture.md](rules/architecture.md), [rules/angular.md](rules/angular.md), [components/_TEMPLATE.md](components/_TEMPLATE.md) |
| Yeni bileşen: stil, token, boyut, density | [rules/styling.md](rules/styling.md), [components/tokens.md](components/tokens.md), [components/tokens-sizes.md](components/tokens-sizes.md) |
| Yeni bileşen: form, klavye, a11y, metinler | [rules/forms-a11y.md](rules/forms-a11y.md), [rules/config-i18n-overlay.md](rules/config-i18n-overlay.md), [components/config-messages.md](components/config-messages.md) |
| Bileşen referans dosyasını yazma / güncelleme | [rules/component-files.md](rules/component-files.md), [components/_TEMPLATE.md](components/_TEMPLATE.md), [components/INDEX.md](components/INDEX.md) |
| Mevcut bileşeni değiştirme | [components/INDEX.md](components/INDEX.md), `components/<ad>.md`, değişikliğin konusuna ait `rules/` dosyası |
| Bileşenin doküman sayfasını yazma | [rules/docs-page.md](rules/docs-page.md), [arn-docs-site/components/docs-site-examples.md](../arn-docs-site/components/docs-site-examples.md), [arn-docs-site/components/docs-site-pages.md](../arn-docs-site/components/docs-site-pages.md), [arn-docs-site/components/docs-site-toc-api.md](../arn-docs-site/components/docs-site-toc-api.md) (API/Styling tabloları), [arn-docs-site/components/docs-site.md](../arn-docs-site/components/docs-site.md) (`docs-nav.ts` kaydı) |
| Doküman sitesi kabuğu, arama, "On this page" | [arn-docs-site/SKILL.md](../arn-docs-site/SKILL.md) (kendi yönlendirme tablosuyla) |
| Test, lint, CI, sürümleme, yayın | [rules/quality.md](rules/quality.md), [local-package-test.md](local-package-test.md) |
| Peer aralığı, paket yapısı, entry point, `exports` | [rules/architecture.md](rules/architecture.md), [rules/quality.md](rules/quality.md), [local-package-test.md](local-package-test.md) |
| Ayar sistemi, i18n, RTL, overlay | [rules/config-i18n-overlay.md](rules/config-i18n-overlay.md), [components/config.md](components/config.md), konunun devam dosyası ([config-direction.md](components/config-direction.md), [config-messages.md](components/config-messages.md), [locales.md](components/locales.md) ya da [overlay.md](components/overlay.md)) |
| Token, tema, dark mode | [rules/styling.md](rules/styling.md), [components/tokens.md](components/tokens.md), [components/tokens-sizes.md](components/tokens-sizes.md) |
| Yeni karar ekleme | [decisions/README.md](decisions/README.md), ilgili ayın dosyası ([decisions/2026-11.md](decisions/2026-11.md) …) |
| Eski `§N` / "bölüm N" atfını çözme | [decisions/README.md](decisions/README.md) |

## Değişmez kararlar (eski §1)

- Paket: `@arn-ng/ui`. Selector prefix: `arn`. Ücretsiz ve **açık kaynak** (npm'de public yayınlanır, lisans: MIT). Gerçek projelerde npm'den kurulup kullanılacak, bu yüzden public API kararlılığı ve semver baştan ciddiye alınır.
- Minimum Angular: **22** (peer `^22.0.0`). Minimum sürümde (Angular 22) `@publicApi` olan, `@experimental` / `@developerPreview` olmayan API serbesttir; kullanmadan önce `.d.ts` etiketi kontrol edilir. Ayrıntı: [rules/angular.md](rules/angular.md). Form elemanları yalnız `FormValueControl` / `FormCheckboxControl` uygular, `ControlValueAccessor` yok ([rules/forms-a11y.md](rules/forms-a11y.md)).
- Headless katman: **Angular CDK**. Başka bir headless kütüphane (Spartan brain, ng-primitives vb.) EKLENMEZ. Eksik bileşenler CDK primitifleri (overlay, a11y, listbox, menu, dialog, bidi, scrolling) üzerine yazılır.
- Görsel ve bileşen dili referansı: **shadcn/ui** (Spartan UI gibi: headless taban CDK, üstüne stil). Yalnızca renk değil; bileşen kataloğu, varyant adları (button: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`), boyut adları ve ölçüler (radius, boşluk, focus ring) shadcn'i izler. Kod kopyalanmaz, referans alınır; kendi token'larımızla Angular'a çevrilir. Her sapma bileşenin referans dosyasına ([rules/component-files.md](rules/component-files.md)) gerekçesiyle yazılır. Bizim eklerimiz: `xl` boyutu (xs-lg shadcn'de var), density, ileride mask vb.
- Hedef: PrimeNG kadar profesyonel, kararlı, tutarlı; kullanıcıya ve geliştiriciye sorun çıkarmayan bir kütüphane. Hız değil sağlamlık önceliklidir.
- Hedef tarayıcı: Angular'ın desteklediği güncel (evergreen) tarayıcılar, yaklaşık son 1 yıllık sürümler. `oklch` fallback'siz kullanılabilir.

## Bileşen "Bitti" tanımı (Definition of Done) (eski §12)

Bir bileşen ancak hepsi tamamsa bitmiştir:

- [ ] Selector ve import kuralları ([rules/architecture.md](rules/architecture.md)) uygulandı
- [ ] Token'lar tanımlı, hardcode değer yok, mantıksal CSS kullanıldı
- [ ] 5 boyut + iki yoğunluk çalışıyor
- [ ] Light + dark çalışıyor
- [ ] `ngModel` ve reactive forms ile çalışıyor (form elemanıysa), tüm durumlar test edildi
- [ ] Klavye + ekran okuyucu + focus yönetimi tamam, axe testi temiz
- [ ] RTL kontrol edildi, i18n metinleri dışarıdan
- [ ] SSR'da kırılmıyor
- [ ] Birim testleri yazıldı
- [ ] Doküman sayfası yazıldı ([rules/docs-page.md](rules/docs-page.md)) ve örnekler çalışıyor
- [ ] `components/<ad>.md` yazıldı/güncellendi ve `INDEX.md`'ye eklendi ([rules/component-files.md](rules/component-files.md))
- [ ] Public API gözden geçirildi, gereksiz export yok

## Yapılmaması gerekenler (özet) (eski §14)

- `::ng-deep`, `!important` ile stil zorlamak → [rules/styling.md](rules/styling.md)
- `@Input/@Output/@HostBinding` decorator'ları, `*ngIf/*ngFor`, NgModule → [rules/angular.md](rules/angular.md)
- `margin-left/right` gibi yön-bağımlı CSS → [rules/styling.md](rules/styling.md)
- Sabit renk/px/metin (token ve i18n dışında) → [rules/styling.md](rules/styling.md), [rules/config-i18n-overlay.md](rules/config-i18n-overlay.md)
- CDK dışında ikinci bir headless kütüphane → [Değişmez kararlar](#değişmez-kararlar-eski-1)
- Doküman sayfası, test veya a11y olmadan bileşeni "bitti" saymak → [rules/docs-page.md](rules/docs-page.md), [rules/quality.md](rules/quality.md), [rules/forms-a11y.md](rules/forms-a11y.md)
- Native davranışı bozan sarmalayıcı (tıklanamayan buton, form'a bağlanmayan input) → [rules/architecture.md](rules/architecture.md)
- Aynı kavrama farklı isim vermek (`disabled` vs `isDisabled`) → [rules/architecture.md](rules/architecture.md)
- Minimum sürümde (Angular 22) `@experimental` / `@developerPreview` olan API'ye bağımlı olmak → [Değişmez kararlar](#değişmez-kararlar-eski-1), [rules/angular.md](rules/angular.md)
- Gereksiz public export, belirsiz kırıcı değişiklik (breaking change) yapmak. Kırıcı değişiklik gerekiyorsa önce söyle, versiyon ve migration notunu hazırla. → [rules/architecture.md](rules/architecture.md), [rules/quality.md](rules/quality.md)

## Satır limitleri

- SKILL.md (bu dosya ve `arn-docs-site/SKILL.md`) ve her `rules/*.md` en fazla 150 satır. Aşarsa bir bölüm ayrı dosyaya taşınır ve buradan bağlanır.
- Bileşen dosyası en fazla 150 satır. Aşarsa `<ad>.md` + `<ad>-<konu>.md` olarak bölünür, ana dosyadan bağlanır.
- INDEX.md en fazla 150 satır. Aşarsa kategori indekslerine bölünür.
- Dosyalar kısa olsun: tablo ve liste ağırlıklı, kod kopyalamak yerine dosya yolu ver.
