# docs-site-search (sidebar araması, Faz 3 adım 3d)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Ana dosya: docs-site.md. Kurallar: ../SKILL.md, ../../arn-ui-library/rules/forms-a11y.md, ../../arn-ui-library/rules/component-files.md; kararlar: ../../arn-ui-library/decisions/. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-sidebar` içinde (ayrı bileşen yok) |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (sidebar'ın parçası) |
| Sınıf adları | `SidebarComponent` (`sectionSelected` çıktısı, `DocsSectionSelection`); saf fonksiyonlar `normalizeForSearch`, `searchNav`, `resultCount`; veri `DocsNavSection`; odak yardımcıları `isPlainClick`, `focusSection` |
| Dosya yolları | `nav/docs-search.ts`, `nav/docs-nav.ts` (`sections`), `shell/sidebar/`, `toc/focus-section.ts`, `app.component.ts` (`onSectionSelected`, `onNavigated`) |

## 2. Mimari

- **Kapsam:** sayfa başlıkları ve bölüm başlıkları. Kategori adları aranmaz, yalnız sonuçların grup başlığıdır.
- **Veri:** `DocsNavPage.sections` (zorunlu, sayfa sırasıyla). Sayfalar lazy olduğu için başlıklar çalışma zamanında okunamaz; `nav/docs-nav-sections.spec.ts` her sayfayı render edip `DocsTocService.sections()` ile birebir karşılaştırır (bozulan başlık spec'i düşürür: denendi).
- **Filtre, combobox değil:** liste yerinde daralır, nav sırası ve kategoriler korunur, sıralama yok. Sonuçlar sidebar'ın kendi bağlantılarıdır ve Tab sırasındadır; `aria-activedescendant` / listbox gereksiz karmaşıklık olurdu.
- **Görünüm:**
  - Başlığı eşleşen sayfa bağlantıdır.
  - Yalnız bölümü eşleşen sayfa bağlantı DEĞİL, etikettir (`<span class="docs-nav-label">`).
  - Eşleşen bölümler sayfanın altında iç içe listede `/<slug>#<id>` bağlantılarıdır.
  - Boş kalan kategori gizlenir.
  - Sorgu yokken liste bugünkü gibidir; bölüm görünmez.
- **Durum:** `SidebarComponent`'te `query` signal'i; kalıcı değil (yenilemede sıfırlanır), gezintide ve çekmece kapanıp açılınca korunur. `DocsSettingsService`'e girmez (o yalnız `ArnConfig` seçimlerini saklar).
- **Yerel `<input type="search">`:** kütüphanede Faz 4'e kadar input yok; docs olmayan bir bileşeni taklit etmez. Faz 4'te `arnInput`'a geçer (ROADMAP).

## 3. Eşleşme (`normalizeForSearch`)

Sıra: NFD → `\p{M}` sil → `toLowerCase()` → `ı` → `i` → boşlukları sadeleştir. Sorgu sözcüklere bölünür; her sözcük başlıkta alt dize olmalı (AND, sıra önemsiz).

| Tuzak | Çözüm |
|---|---|
| `toLocaleLowerCase` tarayıcı yereline bağlı | Kullanılmaz; `toLowerCase` yerelden bağımsız |
| `İ` (U+0130) tek kod noktası | Önce NFD (`I` + U+0307), sonra işaret silme. NFD yoksa ya da silme önce gelirse U+0307 kalır |
| `ı` NFD'de ayrışmaz | Açık eşleme |
| "densité" ≠ "density" | Aksan testi aynı sözcüğün aksanlı yazımıyla (`densíty`); "densité" başka sözcüktür |

## 4. Token'lar

Yok. Yalnız `--arn-*`: input kenarlığı `--arn-muted-foreground` (spec iki temada ≥3:1 hesaplar). `--arn-input` KULLANILMAZ: açık temada beyaz üstünde ≈1.3:1 (WCAG 1.4.11'in altında), karar Faz 4'te (ROADMAP). Yükseklik bağlantılarla aynı ifade (`max(--arn-control-min-size, sm × density)`), `box-sizing: border-box`. Etiket bağlantıdan renkle ayrılamaz (bağlantılar da `--arn-muted-foreground`): `--arn-text-xs` + `--arn-font-weight-medium`, hover ve imleç yok.

## 5. Davranış ve a11y

| Konu | Davranış |
|---|---|
| Landmark | `<div role="search">` sidebar içinde `<nav aria-label="Documentation">`'ın ÜSTÜNDE ve kardeşi; iç içe landmark yok, landmark listesinde ayrı giriş, nav yalnız bağlantıları anlatır |
| Etiket | Görsel gizli `<label for>` "Search the documentation"; placeholder "Search" yalnız ipucu |
| Temizle | Kendi düğmemiz (`aria-label="Clear search"`), yalnız sorgu varken; temizleyince odak input'a. WebKit'in çarpısı `::-webkit-search-cancel-button { appearance: none }` (Stylelint itiraz etmedi) |
| Escape | `isComposing` → yalnız `stopPropagation` (IME'nin; temizleme yok, çekmece kapanmaz). Sorgu dolu → temizle + `preventDefault` + `stopPropagation` (çekmece açık kalır). Sorgu boş → document'a ulaşır, kabuk çekmeceyi kapatır |
| Ok / Enter | Özel davranış yok |
| Duyuru | `role="status"` görünür metin, hep DOM'da (`:empty`'de boşluk yok): "1 result", "N results", "No pages or sections match "x"."; sayı = görünen `<a>` sayısı (spec eşitler). CDK `LiveAnnouncer`'dan sapma: metin görenler için de içerik, LiveAnnouncer ayrı gizli kopya üretip çift duyururdu |
| `aria-current` | Bağlantıda `routerLinkActive`; etikette elle (`NavigationEnd` ile izlenen yol) |
| Çekmece odağı | `focusFirstLink()` korunur (input'a otomatik odak telefonda ekran klavyesini açar). Bağlantı yoksa (sonuçsuz sorgu) arama alanına; yoksa odak düğmede, sayfa inert kalırdı |
| Bölüm bağlantısı, aynı sayfa | Sidebar düz tıklamada `sectionSelected({ path, id })` yayar (değiştirici tuşlu tıklama yok sayılır); kabuk `drawerOpen.set(false)` → `detectChanges()` → başlığa odak. `closeDrawer()` KULLANILMAZ (odağı düğmeye verip başlığı ezer). Router yalnız fragment'ı değiştirir ya da hiç gezinmez |
| Bölüm bağlantısı, başka sayfa | `onNavigated` çekmeceyi kapatır, `detectChanges()` (yeni sayfanın başlık id'leri) sonra `focusSection(fragment)`; bulamazsa `<main>` |

## 6. Form uyumu

Yok (form değil; `<input>` bir forma bağlı değil, Enter bir şey göndermez).

## 7. Kısıtlar ve kararlar

- `effect()`, `afterNextRender`, `rxjs-interop` yok; router olayına elle abonelik + `DestroyRef` (kabukla aynı örüntü).
- Odak mantığı TOC ile ortak (`toc/focus-section.ts`): `isPlainClick`, `focusSection`.
- Sorgu gezintide temizlenmez (kullanıcı sonuçlar arasında gezinebilsin).
- Arama sidebar'ın en üstünde ([../SKILL.md](../SKILL.md), Site yapısı). Kuralın ilk metni "altında arama" diyordu; listenin sonu klavye ve göz için kötü olduğundan en üste alındı ve kural buna göre güncellendi.

## 8. Testler

| Spec | Kapsam |
|---|---|
| `nav/docs-search.spec.ts` | Normalizasyon; `İnstallation`, `ınstallatıon`, `DENSİTY`, `densíty` gerçek nav'da; sıranın neden gerektiği (yalnız küçültme ve "silme önce" U+0307 bırakır); alt dize, AND, sıra ve kategoriler, etiket sayfası, boş kategori, sonuç yok, boş sorgu; `resultCount` |
| `nav/docs-nav-sections.spec.ts` | Her sayfanın `sections`'ı render edilenle aynı, id'ler benzersiz |
| `shell/sidebar/…spec.ts` | Mevcutlar (başlıklar `text()` ile: Prettier satırlara böldü) + `role="search"` nav'ın kardeşi; etiket; `box-sizing`, `min-block-size` bağlantıyla eşit, kenarlık iki temada ≥3:1; çarpı kuralı CSS metninde (`getComputedStyle` bu pseudo-element'i okuyamıyor: kural silinince de geçiyordu, denendi); filtre, etiket (`SPAN`, `<a>` içinde değil, `cursor: auto`), etikette `aria-current`; duyurulan sayı = `<a>` sayısı; sonuç yok; status hep DOM'da; temizle; Escape (dolu, boş, `isComposing`); `sectionSelected` düz / değiştiricili; sonuçsuzken `focusFirstLink` → input; axe dört mod × (boş, sonuçlu, sonuçsuz) |
| `app.component.spec.ts` | Aynı sayfa / başka sayfa × (dar: çekmece kapanır, `inert` yok, odak başlıkta; geniş: odak başlıkta); sonuçsuz sorgu çekmece kapat-aç → odak arama alanında; çekmece açıkken Escape (dolu: açık, `isComposing`: açık, boş: kapanır); 320px; axe dört mod × çekmece açık + arama |

Mutasyonla denendi: fragment odağı ve `isComposing` `stopPropagation`'ı kaldırılınca tam dört test düştü.

Boşluklar: duyuru (`role="status"`) ekran okuyucuyla denenmedi (Accessibility sayfası Known limits). Gerçek IME ve dokunmatik ekran klavyesi elle sınanır.

## 9. Bağlantılar

- Kod: `projects/docs/src/app/nav/`, `projects/docs/src/app/shell/sidebar/`, `projects/docs/src/app/toc/focus-section.ts`, `projects/docs/src/app/app.component.ts`
- İlgili: [docs-site.md](docs-site.md), [docs-site-toc-api.md](docs-site-toc-api.md)
