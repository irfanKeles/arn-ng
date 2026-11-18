---
name: arn-docs-site
description: "@arn-ng/ui doküman sitesi (projects/docs, selector öneki docs-) üzerinde çalışırken kullan: site kabuğu ve gezinti (docs-nav.ts), sidebar araması, \"On this page\", örnek bloğu ve Shiki kod renklendirmesi, API/Styling tabloları ve doğrulama spec'leri (apiMismatches, tokenMismatches, 320px taşma), giriş sayfaları (Installation, Configuration, Theming, Accessibility) ve docs backlog. projects/ui altında bileşen yazarken veya değiştirirken kullanma; bir bileşenin doküman sayfasını yazma adımında arn-ui-library seni buraya yönlendirir."
---

# @arn-ng/ui — Doküman sitesi

Kütüphane kuralları (selector, token, a11y, yasaklar, karar günlüğü) docs için de geçerlidir: [arn-ui-library/SKILL.md](../arn-ui-library/SKILL.md). Bileşen sayfasının bölümleri ve örnek biçimi: [arn-ui-library/rules/docs-page.md](../arn-ui-library/rules/docs-page.md).

## Hangi iş için hangi dosya

Tüm docs referans dosyalarının listesi: [components/INDEX.md](components/INDEX.md).

| İş | Oku |
|---|---|
| Kabuk, gezinti (`docs-nav.ts`), değiştiriciler, kalıcılık | [components/docs-site.md](components/docs-site.md) |
| Sidebar araması | [components/docs-site-search.md](components/docs-site-search.md), [components/docs-site.md](components/docs-site.md) |
| "On this page", API ve Styling tabloları | [components/docs-site-toc-api.md](components/docs-site-toc-api.md) |
| Örnek bloğu, kod renklendirme (Shiki), `?source` import'u | [components/docs-site-examples.md](components/docs-site-examples.md) |
| Doküman spec yardımcıları (`apiMismatches`, `tokenMismatches`, 320px taşma, iç bağlantılar) | [components/docs-site-pages.md](components/docs-site-pages.md) |
| Giriş sayfaları ve Ripple sayfası | [components/docs-site-pages-guides.md](components/docs-site-pages-guides.md), [components/docs-site-pages.md](components/docs-site-pages.md) |
| Bir bileşenin doküman sayfası | [arn-ui-library/rules/docs-page.md](../arn-ui-library/rules/docs-page.md), [components/docs-site-examples.md](components/docs-site-examples.md), [components/docs-site-pages.md](components/docs-site-pages.md), [components/docs-site-toc-api.md](components/docs-site-toc-api.md) (API/Styling tabloları), [components/docs-site.md](components/docs-site.md) (`docs-nav.ts` kaydı) |
| Docs ile ilgili karar ekleme / eski karar arama | [arn-ui-library/decisions/README.md](../arn-ui-library/decisions/README.md) |

## Site yapısı (eski §13, site kısmı)

**Site yapısı**
- Solda sidebar: bileşenler kategori başlıkları altında gruplanır (Form, Button, Overlay, Data...). Sidebar'ın en üstünde arama (sayfa ve bölüm başlıkları).
- Sağda sayfa içi başlık gezintisi ("bu sayfada").
- Üstte tema (light/dark), yön (LTR/RTL), yoğunluk (comfortable/compact) ve dil değiştiriciler. Bunlar tüm örnekleri anlık etkiler.
- Giriş bölümü: Kurulum, Yapılandırma (`provideArn`), Tema ve token'lar, Yoğunluk, RTL ve i18n, Erişilebilirlik. Altı başlık dört sayfada karşılanır: Yoğunluk Theming'de, RTL ve i18n Configuration'da bölümdür ([karar](../arn-ui-library/decisions/2026-10.md)).
