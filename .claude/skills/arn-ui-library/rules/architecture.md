# Mimari ve paket yapısı

## Bileşen mimarisi (eski §2)

**Tek çekirdek, iki yüz.** Basit bileşenlerde davranış ve stil tek bir directive'de durur, element sarmalayıcı aynı directive'i kullanır. Davranış asla iki yerde ayrı yazılmaz.

| Bileşen türü | Kullanım şekli |
|---|---|
| Basit, native elemanı olanlar (button, input) | Hem attribute (`<button arnButton>`) hem element (`<arn-button label="..." icon="...">`) |
| Karmaşık (select, mask input, dialog, date picker, tooltip vb.) | SADECE element (`<arn-select>`) |

- Attribute kullanımda gerçek native eleman kalır (`type`, `form`, `aria-*` vb. native davranış bedavaya çalışır).
- Element sarmalayıcı içinde gerçek bir native eleman render eder (örn. `<arn-button>` içinde `<button>`). Dış `<arn-button>` etiketi tıklanabilir/odaklanabilir sahte bir kutu OLMAZ.
- Sınıf adları: directive `ArnButtonDirective`, element `ArnButton`, aynı kalıp her bileşende.

## Paket ve import yapısı (eski §3)

- Her bileşen kendi secondary entry point'inde: `@arn-ng/ui/button`, `@arn-ng/ui/input`, `@arn-ng/ui/select`.
- Kök entry point (`@arn-ng/ui`) bileşen export etmez. Her şey secondary entry point'lerden import edilir.
- Klasör yapısı: her entry point `projects/ui/<ad>/` altında, kendi `ng-package.json` ve `src/public-api.ts` dosyasıyla. Dil paketleri bir kat içeridedir: `projects/ui/locales/<dil>/` → `@arn-ng/ui/locales/<dil>`.
- Entry point'ler birbirini paket adıyla import eder (`@arn-ng/ui/core`), göreli yolla değil. Spec ve ESLint bu adları `projects/ui/tsconfig.json` ile kaynağa çözer (`dist` gerekmez); spec'ler göreli import kullanabilir.
- `angular.json`'da ui projesinin `sourceRoot`'u `projects/ui`: `@angular/build:unit-test` `include` kalıplarını (varsayılan `**/*.spec.ts`) "relative to the project source root" çözer, secondary entry point'lerin ve `testing/`'in spec'leri böyle bulunur. Bileşen dosyaları `projects/ui/<entry-point>/src/` altında durur; `ng generate` kullanılırsa `--path` verilmeli.
- Her entry point sadece bileşeni ve ona ait tipleri/token'ları export eder. Kullanıcı sadece kullandığını import eder (`import { ArnButton } from '@arn-ng/ui/button'`).
- Tüm bileşenler standalone. NgModule YOK.
- `package.json`: `sideEffects: false`. `peerDependencies` (`@angular/core`, `@angular/common`, `@angular/cdk`) yalnızca test edilmiş majörleri taşır, üstten açık BIRAKILMAZ (`>=22` yasak; şu an `@angular/core` ve `@angular/common` `^22.2.5`, `@angular/cdk` `^22.0.0`; alt sınır gerekçesi decisions 2026-11 "Signal Forms stratejisi" (4), `@angular/forms` ilk form bileşeniyle `^22.2.5` olarak eklenir). Yeni majör, tüketici uyumluluk testi (ROADMAP Faz 4) o majörde geçince üç pakete birlikte eklenir (`^22.0.0 || ^23.0.0`). Gerekçe: üstten açık aralıkta npm en yeni CDK'yı seçer ve eski Angular'da kurulum `ERESOLVE` ile düşer.
- Yayın metadata'sı `projects/ui/package.json`'da durur (`description`, `keywords`, `license`, `author`, `homepage`, `repository`, `bugs`, `publishConfig.access: public`). `projects/ui/LICENSE` kök `LICENSE`'ın kopyasıdır (ng-packagr proje dışından dosya almaz); biri değişirse diğeri de güncellenir.
- Tema tek dosya: kaynak `projects/ui/theme.css`, ng-packagr `assets` ile `dist/ui/theme.css`'e kopyalanır, `projects/ui/package.json` `exports`'unda `./theme.css` olarak açılır (ng-packagr elle yazılan `exports`'u üretilenlerle birleştirir). Tüketici bir kez ekler: `@import '@arn-ng/ui/theme.css'`.
- Public API küçük tutulur. Dışarı açılan her şey söz verilmiş sayılır. İç detaylar export edilmez. Export etmeden önce gerekçe sor.
- Entry point'ler arası döngüsel bağımlılık YASAK. Ortak kod `@arn-ng/ui/core` altında.

## İsimlendirme tutarlılığı (eski §11)

Ortak input isimleri tüm bileşenlerde aynıdır: `size`, `variant`, `disabled`, `invalid`, `readonly`, `required`, `label`, `icon`; ayar adları `ArnConfig` alanlarıdır (`density`, `colorScheme`, `direction`, `ripple`, `locale`). Aynı kavram için farklı isim icat etme. Yeni ortak kavram gerekiyorsa önce karar günlüğüne yaz.
