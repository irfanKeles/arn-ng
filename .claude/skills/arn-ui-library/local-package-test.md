# Yerel paket testi (Verdaccio)

`@arn-ng/ui`'yi gerçek npm'e dokunmadan yerel bir registry'ye yayınlayıp repo dışındaki bir Angular uygulamasında kurup derler. Ne zaman: `exports`, entry point veya `projects/ui/package.json` değişince ve her yayından önce. Komutlar PowerShell içindir.

## Güvenlik kuralları (pazarlıksız)

- Gerçek registry'ye ASLA yayın yapılmaz. `npm login` / `npm adduser` çalıştırılmaz.
- Kullanıcı `~/.npmrc`'sine ve repoya `.npmrc` yazılmaz. npm ayarı yalnızca geçici dosyadan, `$env:npm_config_userconfig` ile verilir (ortam değişkeni o oturumda yaşar).
- Geçici `npmrc` scope'u yerel adrese bağlar: `@arn-ng:registry=http://127.0.0.1:4873/`. Scoped pakette bu ayar `--registry` bayrağından ÖNCELİKLİDİR; yayından önce `npm config get "@arn-ng:registry"` yerel adresi göstermiyorsa dur.
- Sürüm yalnızca `dist/ui` kopyasında değiştirilir (`0.0.0-local.<n>`, `--tag local`). `projects/ui/package.json` sürümüne dokunulmaz.
- Verdaccio'da uplink/proxy tanımlanmaz, yalnızca `127.0.0.1` dinler.

## Adımlar

Her yeni PowerShell oturumunda önce:

```powershell
$root = Join-Path $env:TEMP 'arn-ng-pkgtest'      # repo dışı; hepsi burada, sonda silinir
$reg  = 'http://127.0.0.1:4873/'
$env:npm_config_userconfig = "$root\npmrc"
$env:npm_config_cache      = "$root\npm-cache"
```

1. **Geçici dosyalar**
   - `$root\npmrc`: iki satır → `@arn-ng:registry=http://127.0.0.1:4873/` ve `//127.0.0.1:4873/:_authToken=local-dummy-token` (npm yayın için bir token ister; sahte token Verdaccio'da anonim sayılır).
   - `$root\verdaccio\config.yaml`: `storage: ./storage`; `auth.htpasswd` → `file: ./htpasswd`, `max_users: -1`; `packages` → `'@arn-ng/*'` için `access: $all`, `publish: $anonymous`, `unpublish: $anonymous`. Başka paket kuralı ve uplink yok.
2. **Verdaccio** (repoya bağımlılık eklenmez; ayrı terminalde açık kalır)
   ```powershell
   npm install --prefix "$root\verdaccio" verdaccio@6
   Set-Location "$root\verdaccio"
   node .\node_modules\verdaccio\bin\verdaccio --config .\config.yaml --listen 127.0.0.1:4873
   ```
3. **Paketle ve yayınla** (repo kökünden)
   ```powershell
   npm run build:ui
   Copy-Item -Recurse dist/ui "$root\pkg"; Set-Location "$root\pkg"
   npm pkg set version=0.0.0-local.1
   npm pack --dry-run                      # dosya listesi: LICENSE, README.md, theme.css, *.d.ts, fesm2022, entry point klasörleri
   npm config get "@arn-ng:registry"       # $reg olmalı, değilse DUR
   npm publish --registry $reg --tag local
   ```
4. **Tüketici**
   ```powershell
   Set-Location $root
   npx -y @angular/cli@19 new consumer --skip-git --skip-tests --style=css --ssr=false --package-manager=npm
   Set-Location consumer
   npm install @arn-ng/ui@0.0.0-local.1    # CDK peer olarak kendiliğinden kurulur; elle verme
   ```
   `src/app/app.component.ts` içinde sınanacak entry point'leri import et, bileşenleri `imports`'a ekleyip şablonda kullan, `src/styles.css`'e `@import '@arn-ng/ui/theme.css';` ekle, sonra `npx ng build` (çıktıdaki `styles-*.css` içinde `--arn-background` olmalı). Tiplerin gerçekten denetlendiğini görmek için bir input'a bilerek yanlış tip ver; build düşmeli.
5. **Temizlik**
   - Verdaccio'yu durdur (Ctrl+C veya `Stop-Process -Id (Get-NetTCPConnection -LocalPort 4873 -State Listen).OwningProcess`).
   - `Remove-Item -Recurse -Force $root` (önce `$root`'un doğru klasör olduğuna bak).
   - Doğrula: `git status` temiz, `Test-Path ~\.npmrc` ve repo `.npmrc` beklenen durumda, `npm config get "@arn-ng:registry"` → `undefined`.

## Bilinen tuzaklar

- Geçici `npmrc` etkinken `npm view @arn-ng/ui --registry https://registry.npmjs.org/` de Verdaccio'ya gider. Gerçek npm'i kontrol etmek için: `Invoke-WebRequest https://registry.npmjs.org/@arn-ng%2fui` (yayından önce 404 beklenir).
- Boş registry'de ilk yayın `--tag local` verilse bile `latest` etiketini de alır; yalnızca yerelde olduğu için önemsiz.
- Angular CLI 19, Node 24'te "Unsupported" uyarısı verir; derlemeyi engellemez.
- Kurulum `ERESOLVE` verirse peer aralığı tüketicinin Angular majörünü kapsamıyordur ya da üstten açık bırakılmıştır (`>=19.0.0` iken npm CDK 22'yi seçmişti; dördüncü çalıştırma). Aralık yalnız test edilmiş majörleri taşır (SKILL §3).
- `dist/ui` içindeki iç `package.json`'lar (`core/package.json`, `locales/tr/package.json`) tarball'a GİRMEZ (ng-packagr `.npmignore`); yalnız workspace içi çözümleme içindir. Tüketici `exports`'tan çözer.
- Henüz export'u olmayan entry point yalnızca "import çözülüyor"u kanıtlar. Bileşen derlemesi/linklemesi gerçek bir bileşenle sınanır.

## İlk çalıştırma (2026-10)

`core` ve `button` boşken, geçici bir `probe-tmp` entry point'i (tek standalone bileşen) ile yapıldı; sonra silindi. Kanıtlanan: tarball kurulumu, Angular 19.2 ile peer çözümü, `@arn-ng/ui`, `/core`, `/button` import çözümlemesi (tip + bundler), partial-Ivy bileşenin tüketicide linklenip derlenmesi, input tip denetimi, `LICENSE` ve metadata'nın tarball'da olması. Kanıtlanmayan: gerçek bileşen davranışı, `@angular/cdk` peer'ı, en güncel Angular, SSR, çalışma zamanı.

## İkinci çalıştırma (2026-10, tema)

`exports`'a `./theme.css` eklenince yapıldı. Kanıtlanan: `theme.css` tarball'da (16 dosya), tüketicide CSS `@import '@arn-ng/ui/theme.css'` çözülüyor ve `ng build` çıktısına `light-dark()` bozulmadan giriyor. Denenmeyen: `angular.json` `styles` dizisinden ekleme.

## Üçüncü çalıştırma (2026-10, `provideArn` ve ayar sistemi)

`@arn-ng/ui/core` ilk gerçek export'larını alınca yapıldı (27 dosya). Kanıtlanan: tüketicide `provideArn`, `ArnConfigService`, `ArnConfigDirective`, `injectArnConfig`, `ArnConfig`, `ArnSize` `@arn-ng/ui/core`'dan çözülüyor; partial-Ivy direktif (`<div arnConfig density="compact" [size]="'lg'">`) linklenip derleniyor ve koda giriyor; tipler denetleniyor (`provideArn({ size: 'huge' })` → TS2322, şablonda `density="dense"` → NG2, ikisinde de build düştü). Kanıtlanmayan: çalışma zamanı davranışı (tarayıcıda açılmadı), SSR, en güncel Angular.

## Dördüncü çalıştırma (2026-10, `locales/tr`, CDK peer'ı, RTL)

Yeni entry point (`@arn-ng/ui/locales/tr`) ve `@angular/cdk` peer'ı eklenince yapıldı (34 dosya, sürüm `0.0.0-local.4`). Kanıtlanan: `exports["./locales/tr"]` tarball'da; tüketicide (Angular 19.2.25 + CDK 19.2.19) `import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr'` ve `provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR })` ile `ng build` geçiyor, çıktı JS'inde "Vazgeç" var; `<div arnConfig direction="rtl">` derleniyor, `inject(Directionality)` `@angular/cdk/bidi`'den çözülüyor; çıktı CSS'inde `.arn-rtl-mirror:dir(rtl){scale:-1 1}` var. Build'i düşürenler (üçü de denendi): `@arn-ng/ui/locales/xx` ve `@arn-ng/ui/locales` (TS2307 + "Could not resolve"), `messages: { common: { okay: 'x' } }` (TS2353). Bulgu: CDK sürümü verilmeden kurulum `ERESOLVE` (tuzaklara ve ROADMAP açık kararlarına yazıldı). Kanıtlanmayan: çalışma zamanı davranışı (tarayıcıda açılmadı), SSR, en güncel Angular / CDK 20+.

## Beşinci çalıştırma (2026-10, daraltılmış peer aralığı)

Peer'lar `>=19.0.0` → `^19.0.0` olunca yapıldı (sürüm `0.0.0-local.5`). Kanıtlanan: Angular 19.2.25 tüketicide CDK elle kurulmadan yalnız `npm install @arn-ng/ui@0.0.0-local.5` `ERESOLVE` vermeden bitiyor ve `@angular/cdk@19.2.19`'u kendiliğinden kuruyor; dördüncü çalıştırmadaki aynı tüketici koduyla `ng build` geçiyor (JS'te "Vazgeç", CSS'te `.arn-rtl-mirror`). Kanıtlanmayan: Angular 20+ tüketici (aralık dışında, kurulum reddedilmeli; Faz 4 uyumluluk testinde bakılacak), çalışma zamanı, SSR.

## Altıncı çalıştırma (2026-10, overlay altyapısı)

`@arn-ng/ui/core` public API'sine `ArnOverlayService`, `ArnOverlayRef` ve overlay tipleri eklenince yapıldı (40 dosya, sürüm `0.0.0-local.6`). Kanıtlanan: Angular 19.2.25 tüketicide yalnız `npm install @arn-ng/ui@0.0.0-local.6` kurulumu bitiriyor (CDK 19.2.19 kendiliğinden); bir bileşende `ArnOverlayService.open()` ile şablondan popover açıp `ArnOverlayRef.close('done')` ve `await`'lenen `closed` kullanan kodla `ng build` geçiyor (`@angular/cdk/overlay`, `/portal`, `/a11y` tüketicide çözülüyor); çıktı CSS'inde `--arn-z-modal` ve `.arn-overlay-host.arn-overlay-host-modal`, çıktı JS'inde `arn-overlay-host` var; `layer: 'nope'` → TS2322, build düştü. Temizlik doğrulandı (geçici klasör yok, `.npmrc` yok, scope registry `undefined`, gerçek npm'de paket 404). Kanıtlanmayan: çalışma zamanı davranışı (tarayıcıda açılmadı; davranış Karma spec'lerinde), SSR, en güncel Angular / CDK 20+.

## Yedinci çalıştırma (2026-10, `@arn-ng/ui/ripple`)

Yeni entry point (`@arn-ng/ui/ripple`) eklenince yapıldı (46 dosya, sürüm `0.0.0-local.7`). `exports["./ripple"]` ng-packagr tarafından kendiliğinden üretildi, elle düzenleme gerekmedi. Kanıtlanan: Angular 19.2.25 tüketicide yalnız `npm install @arn-ng/ui@0.0.0-local.7` kurulumu bitiriyor (CDK 19.2.19 kendiliğinden); `import { ArnRippleDirective } from '@arn-ng/ui/ripple'` ve şablonda `<button arnRipple [arnRippleCentered]="true">` ile `[arnRipple]="on" arnRippleColor="…"` kullanan kodla `ng build` geçiyor (ripple'ın `@arn-ng/ui/core` import'u tüketicide çözülüyor); çıktı CSS'inde `--arn-ripple-color`, `.arn-ripple-container`, `.arn-ripple-wave`, çıktı JS'inde `arn-ripple-container` var. Build'i düşürenler (dördü de denendi): `ArnRippleDirective`'i `@arn-ng/ui/core`'dan import (TS2305), `@arn-ng/ui/ripple`'da olmayan ad (TS2305), `@arn-ng/ui/ripple/src/ripple.motion` derin import'u (TS2307 + "Could not resolve"), `[arnRippleColor]="5"` (NG2). Bulgu: tüketicinin CSS küçültücüsü `--arn-ripple-duration: 450ms`'yi `.45s` yapıyor; directive `ms` ve `s`'yi (baştaki sıfırsız da) ayrıştırdığı için sorun değil, spec bunu sabitler. Temizlik doğrulandı (geçici klasör yok, `.npmrc` yok, scope registry `undefined`, gerçek npm'de paket 404). Kanıtlanmayan: çalışma zamanı davranışı (tarayıcıda açılmadı; davranış Karma spec'lerinde), SSR, en güncel Angular / CDK 20+.
