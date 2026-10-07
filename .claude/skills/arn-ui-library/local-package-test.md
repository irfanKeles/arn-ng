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
   npm install @arn-ng/ui@0.0.0-local.1
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
- Henüz export'u olmayan entry point yalnızca "import çözülüyor"u kanıtlar. Bileşen derlemesi/linklemesi gerçek bir bileşenle sınanır.

## İlk çalıştırma (2026-10)

`core` ve `button` boşken, geçici bir `probe-tmp` entry point'i (tek standalone bileşen) ile yapıldı; sonra silindi. Kanıtlanan: tarball kurulumu, Angular 19.2 ile peer çözümü, `@arn-ng/ui`, `/core`, `/button` import çözümlemesi (tip + bundler), partial-Ivy bileşenin tüketicide linklenip derlenmesi, input tip denetimi, `LICENSE` ve metadata'nın tarball'da olması. Kanıtlanmayan: gerçek bileşen davranışı, `@angular/cdk` peer'ı, en güncel Angular, SSR, çalışma zamanı.

## İkinci çalıştırma (2026-10, tema)

`exports`'a `./theme.css` eklenince yapıldı. Kanıtlanan: `theme.css` tarball'da (16 dosya), tüketicide CSS `@import '@arn-ng/ui/theme.css'` çözülüyor ve `ng build` çıktısına `light-dark()` bozulmadan giriyor. Denenmeyen: `angular.json` `styles` dizisinden ekleme.
