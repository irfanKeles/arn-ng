# Doküman sitesi referans dosyaları — İndeks

`projects/docs` uygulamasının parçalarının "nasıl yapıldı ve neden" dosyaları. Dosya kuralları ve şablon kütüphaneyle ortaktır: [arn-ui-library/rules/component-files.md](../../arn-ui-library/rules/component-files.md), [arn-ui-library/components/_TEMPLATE.md](../../arn-ui-library/components/_TEMPLATE.md). Yeni dosya aynı değişiklikte bu tabloya eklenir.

| Bileşen | Tür | Entry point | Dosya |
|---|---|---|---|
| docs-site (doküman sitesi kabuğu, `docs-nav.ts`, değiştiriciler, kalıcılık) | ortak yapı (uygulama) | yok (`projects/docs`) | [docs-site.md](docs-site.md) |
| docs-site-examples (örnek bloğu `docs-example`, kod bloğu `docs-code-block`, Shiki, metin import'u) | ortak yapı (uygulama) | yok (`projects/docs`) | [docs-site-examples.md](docs-site-examples.md) |
| docs-site-pages (doküman spec yardımcıları: `unknownInternalLinks`, `apiMismatches` directive desteği, `tokenMismatches`, `renderExample`; `properties` tablo türü) | ortak yapı (uygulama) | yok (`projects/docs`) | [docs-site-pages.md](docs-site-pages.md) |
| docs-site-pages-guides (3c sayfaları: Ripple, Installation, Configuration, Theming, Accessibility; örnekleri, doğrulamaları, token kapsamı değişmezi) | ortak yapı (uygulama) | yok (`projects/docs`) | [docs-site-pages-guides.md](docs-site-pages-guides.md) |
| docs-site-search (sidebar araması: `searchNav`, `normalizeForSearch`, `DocsNavPage.sections`, bölüm bağlantısında odak) | ortak yapı (uygulama) | yok (`projects/docs`) | [docs-site-search.md](docs-site-search.md) |
| docs-site-toc-api ("On this page": `docs-section`, `docs-toc`, `DocsTocService`; API ve Styling tabloları `docs-api-table`, `docs-token-table`, `apiMismatches`) | ortak yapı (uygulama) | yok (`projects/docs`) | [docs-site-toc-api.md](docs-site-toc-api.md) |

## Notlar

- Bu dosya en fazla 150 satır. Aşarsa kategori indekslerine bölünür ve buradan bağlanır.
