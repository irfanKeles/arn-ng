# @arn-ng/ui — Yol Haritası

Kurallar için `SKILL.md` dosyasına bak. Bu dosya fazları ve ilerlemeyi takip eder. Bir faz bitmeden sonrakine geçme. Yeni karar çıkarsa `SKILL.md` karar günlüğüne yaz.

## Faz 0 — Hazırlık
- [x] npm kapsamı alındı: `@arn` doluydu, `@arn-ng` organizasyonu oluşturuldu (paket adı `@arn-ng/ui`, selector prefix `arn` aynı kaldı)
- [x] GitHub repo oluştur, MIT `LICENSE` ekle
- [x] `SKILL.md` ve `ROADMAP.md` dosyalarını repoya koy (Claude Code kullanılacaksa `.claude/skills/arn-ui-library/SKILL.md`)
- [x] npm hesabında 2FA aç, npm'in yayın politikası duyurusunu oku (Ağu 2026 / Oca 2027 değişiklikleri CI'dan yayını etkileyebilir)

## Faz 1 — Altyapı
- [x] Monorepo aracı kararı: Angular workspace (Nx yok), paket yöneticisi npm, geliştirme Angular 19 / CLI 19
- [x] `projects/ui` (kütüphane, ng-packagr) ve `projects/docs` (doküman uygulaması)
- [x] Secondary entry point yapısı (`projects/ui/<ad>/`; pilotlar: `@arn-ng/ui/core`, `@arn-ng/ui/button`, ikisi de boş)
- [x] Lint, format, strict TypeScript (ESLint + angular-eslint, Stylelint, Prettier, Node 22)
- [x] Birim test altyapısı (Karma + Jasmine, zoneless testler, axe yardımcısı, `test:ci`)
- [x] CI (GitHub Actions: lint + format + build + test) ve Dependabot. En güncel Angular'da derleme kontrolü Faz 4'teki tüketici uyumluluk testine taşındı
- [x] Changesets + sürüm/changelog akışı (sürüm kaynağı `projects/ui/package.json`, npm workspaces)
- [x] Yerel paket testi (Verdaccio) ile gerçek projede kurulum denemesi. Yayın metadata'sı ve `LICENSE` paketlemesi de bu maddede yapıldı

## Faz 2 — Çekirdek (`@arn-ng/ui/core`)
- [ ] Token yapısı (ham / anlamlı / bileşen), shadcn paleti, `oklch`, dark mode
- [ ] Boyutlar xs-xl, density (comfortable / compact)
- [ ] `provideArn()` ve hiyerarşik ayar öncelik sırası
- [ ] i18n mesaj sistemi, RTL (`cdk/bidi`)
- [ ] Ortak overlay altyapısı (CDK Overlay üstünde), z-index token'ları
- [ ] `arnRipple` directive'i
- [ ] Token kataloğu referans dosyası (global token'lar, tema, density)

## Faz 3 — Doküman sitesi iskeleti
- [ ] Sidebar (kategorili), sayfa içi gezinti, arama
- [ ] Tema / yön / yoğunluk / dil değiştiriciler
- [ ] Örnek bileşeni (canlı demo + kod sekmesi + kopyala)
- [ ] API ve Styling tablo bileşenleri
- [ ] Giriş sayfaları: Kurulum, Yapılandırma, Tema, Erişilebilirlik
- [ ] Docs uygulamasını zoneless çalıştırmayı değerlendir (deneysel, kütüphaneyi gerçek kullanımda sınamak için)

## Faz 4 — İlk bileşenler (her biri "Bitti" tanımıyla)
- [ ] button (directive + element)
- [ ] input (directive + element)
- [ ] checkbox
- [ ] select
- [ ] dialog
- [ ] tooltip
- [ ] Tüketici uyumluluk testi: `npm pack` ile paketlenen kütüphaneyi Angular 19 ve en güncel Angular uygulamasında kurup derle (ilk bileşenle birlikte; `local-package-test.md` akışı temel alınır)
- [ ] Playwright ile çoklu tarayıcı testi (Chromium, Firefox, WebKit)

## Faz 5 — İlk yayın
- [ ] README, kurulum rehberi (`projects/ui/README.md` hâlâ CLI'ın jenerik metni ve pakete giriyor)
- [ ] `0.1.0` npm'e yayın
  - Yayın "trusted publishing (OIDC)" ile yapılacak, saklı npm token kullanılmayacak. Gerekçe: npm 31 Temmuz 2026'dan itibaren hassas işlemlerde etkileşimli 2FA istiyor, Ocak 2027'de 2FA-bypass token'lar doğrudan yayın yetkisini kaybedecek.
- [ ] PR'larda changeset kontrolünü CI'a ekle (0.1.0'dan sonra)
- [ ] Gerçek bir projede npm'den kurup kullanma
- [ ] Geri bildirim ve düzeltmeler

## Faz 6 — Genişleme
- [ ] mask input, date picker, table, toast ve diğerleri (önceliği ihtiyaçla belirle)

## Açık kararlar
- i18n mesaj sisteminin tam API'si
- Doküman sitesinde kod vurgulama yöntemi
