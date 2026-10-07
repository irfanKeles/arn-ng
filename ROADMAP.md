# @arn-ng/ui — Yol Haritası

Kurallar için `SKILL.md` dosyasına bak. Bu dosya fazları ve ilerlemeyi takip eder. Bir faz bitmeden sonrakine geçme. Yeni karar çıkarsa `SKILL.md` karar günlüğüne yaz.

## Faz 0 — Hazırlık
- [x] npm kapsamı alındı: `@arn` doluydu, `@arn-ng` organizasyonu oluşturuldu (paket adı `@arn-ng/ui`, selector prefix `arn` aynı kaldı)
- [x] GitHub repo oluştur, MIT `LICENSE` ekle
- [x] `SKILL.md` ve `ROADMAP.md` dosyalarını repoya koy (Claude Code kullanılacaksa `.claude/skills/arn-ui-library/SKILL.md`)
- [ ] npm hesabında 2FA aç, npm'in yayın politikası duyurusunu oku (Ağu 2026 / Oca 2027 değişiklikleri CI'dan yayını etkileyebilir)

## Faz 1 — Altyapı
- [ ] Monorepo aracı kararı (Angular workspace mi Nx mi)
- [ ] `projects/ui` (kütüphane, ng-packagr) ve `projects/docs` (doküman uygulaması)
- [ ] Secondary entry point yapısı (`@arn-ng/ui/core`, `@arn-ng/ui/button` ...)
- [ ] Lint, strict TypeScript, birim test altyapısı
- [ ] CI (build + test + lint, Angular 19 ve en güncel sürümde derleme)
- [ ] Changesets + sürüm/changelog akışı
- [ ] Yerel paket testi (Verdaccio) ile gerçek projede kurulum denemesi

## Faz 2 — Çekirdek (`@arn-ng/ui/core`)
- [ ] Token yapısı (ham / anlamlı / bileşen), shadcn paleti, `oklch`, dark mode
- [ ] Boyutlar xs-xl, density (comfortable / compact)
- [ ] `provideArn()` ve hiyerarşik ayar öncelik sırası
- [ ] i18n mesaj sistemi, RTL (`cdk/bidi`)
- [ ] Ortak overlay altyapısı (CDK Overlay üstünde), z-index token'ları
- [ ] `arnRipple` directive'i

## Faz 3 — Doküman sitesi iskeleti
- [ ] Sidebar (kategorili), sayfa içi gezinti, arama
- [ ] Tema / yön / yoğunluk / dil değiştiriciler
- [ ] Örnek bileşeni (canlı demo + kod sekmesi + kopyala)
- [ ] API ve Styling tablo bileşenleri
- [ ] Giriş sayfaları: Kurulum, Yapılandırma, Tema, Erişilebilirlik

## Faz 4 — İlk bileşenler (her biri "Bitti" tanımıyla)
- [ ] button (directive + element)
- [ ] input (directive + element)
- [ ] checkbox
- [ ] select
- [ ] dialog
- [ ] tooltip

## Faz 5 — İlk yayın
- [ ] README, kurulum rehberi
- [ ] `0.1.0` npm'e yayın
- [ ] Gerçek bir projede npm'den kurup kullanma
- [ ] Geri bildirim ve düzeltmeler

## Faz 6 — Genişleme
- [ ] mask input, date picker, table, toast ve diğerleri (önceliği ihtiyaçla belirle)

## Açık kararlar
- Monorepo aracı (Angular workspace / Nx)
- i18n mesaj sisteminin tam API'si
- Doküman sitesinde kod vurgulama yöntemi
