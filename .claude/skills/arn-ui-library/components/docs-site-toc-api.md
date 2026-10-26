# docs-site-toc-api ("On this page", API ve Styling tabloları)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Ana dosya: docs-site.md. Kurallar: ../SKILL.md §13, §16, §18. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-section` (sayfa bölümü), `docs-toc` ("On this page") |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (docs bileşenleri + root servis) |
| Sınıf adları | `DocsSectionComponent`, `DocsTocComponent`, `DocsTocService`; tip `DocsTocEntry`; token `DOCS_TOC_VIEWPORT` (`shell/viewport.ts`) |
| Dosya yolları | `projects/docs/src/app/toc/`, kabuk `app.component.*`, `--docs-toc-width` `styles.css` |

Adım 3b-2'nin ilk yarısı ("On this page"). API ve Styling tabloları bu dosyaya ikinci yarıda eklenir.

## 2. Mimari ve CDK

### Bölümler bildirimseldir: `docs-section` + `DocsTocService`

Sayfa `<h2>` yazmaz; `<docs-section sectionId="status" heading="Status">` yazar. Bileşen `<section>` + `<h2 [id] tabindex="-1">` + `<ng-content>` üretir ve oluşurken servise kaydolur, `DestroyRef` ile çıkar.

| Parça | Neden |
|---|---|
| Kayıt modeli (DOM taraması değil) | Zoneless'ta ve `afterNextRender` yasağında lazy route içeriğinin ne zaman hazır olduğu belirsiz; kayıt senkron ve SSR güvenli |
| Kayıt constructor'da, girdiler signal olarak | Required girdiler constructor'da okunamaz; kayıt signal'lerin kendisini taşır, liste onları sonradan okur (girdi değişince liste de değişir) |
| Sıra = kayıt sırası | Angular şablon sırasıyla oluşturur. `@if` ile sonradan gelen bölüm listenin sonuna düşer (bilinen sınır, §7) |
| `unregister` kimlikle | Aynı `id`'li iki kayıttan yalnız ayrılan silinir |
| `<section>` adsız | `aria-labelledby` verilmedi: adlı `section` bir `region` landmark'ı olur, her bölüm landmark listesini şişirirdi (plandan bilinçli sapma) |
| Host `display: block` | Varsayılan inline; başlık biçimi global `.docs-page h2` torun seçicisinden gelir, ek stil yok |

### Liste: `DocsTocComponent`

- Kabukta, route'un DIŞINDA durur; bu yüzden göreli `[routerLink]="[]"` kök route'a çözülür ve ana sayfaya giderdi. Kabuk sayfa yolunu `path` girdisiyle verir (`AppComponent.path`, sorgu ve fragment'sız; eski `currentPath` alanı bu signal'e dönüştü).
- Bağlantı `[routerLink]="path()" [fragment]="id"`: gerçek `href` (`/#status`), orta tık ve "bağlantıyı kopyala" çalışır.
- `app.config.ts`: `withInMemoryScrolling({ anchorScrolling: 'enabled' })`.
- Tıklayınca (değiştirici tuşsuz birincil tık) hedef başlığa `focus()`: klavye kullanıcısı oradan devam eder; odak kaydırmayı da yapar, bu yüzden URL'de zaten olan fragment'a tıklamak da (router yok sayar) çalışır.

### Kabukta görünürlük

`tocVisible = tocViewport() && !narrow() && path() !== undefined && sections().length >= 2`.

| Konu | Karar |
|---|---|
| Kırılma noktası | `DOCS_TOC_QUERY = '(width >= 80rem)'`, `DOCS_TOC_VIEWPORT` token'ı (dar mod ile aynı örüntü: ortak `injectMediaQuery`, sunucuda `false`, spec `signal` verir) |
| Üçüncü sütun | Yalnız `docs-with-toc` sınıfı (`tocVisible()`) varken: `sidebar minmax(0, 1fr) --docs-toc-width`. Sınıf yokken iki sütun (ve dar modda tek) aynen kalır, boş sütun oluşmaz |
| Render | `@if (tocVisible())`: gizliyken DOM'da yok |
| Konum | `main`'den sonra; sticky, `align-self: start`, `max-block-size: 100dvb`, `overflow: auto` (sidebar ile aynı) |
| Çekmece | Çakışmaz: çekmece <48rem, liste ≥80rem. `!narrow()` yine de yazıldı; listeye `inert` gerekmez |
| `scroll-margin` | Gerekmez: header sticky değil |

CDK: yok (`MediaMatcher` viewport token'ında).

## 3. Token'lar

Bileşen token'ı yok. `--docs-toc-width: calc(var(--arn-spacing) * 56)` (`styles.css` `:root`). Liste stili sidebar bağlantılarının aynısıdır (`--arn-muted-foreground`, hover `--arn-accent`).

## 4. Override rehberi

Yok (uygulama).

## 5. Davranış ve a11y

| Konu | Davranış |
|---|---|
| Landmark | `<nav aria-labelledby="docs-toc-title">`; ikinci `nav` (sidebar `aria-label="Documentation"`) |
| Etiket | Görünür `<p>` "On this page"; başlık DEĞİL (sayfanın başlık ağacına karışmaz) |
| Bölüm başlığı | `h2`, `tabindex="-1"`: bağlantıdan odak alır, Tab sırasına girmez |
| Odak | Sayfa değişince `<main>` (mevcut kural); yalnız fragment değişince `<main>`'e taşınmaz, liste bağlantısı başlığa taşır |
| Hedef boyutu | Bağlantılar compact'ta da ≥24px |
| RTL | Mantıksal CSS; sütun `main`'in solunda |

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- Scrollspy (kaydırırken aktif bölüm vurgusu, IntersectionObserver) ve dar ekranda liste YOK: ROADMAP cila maddesi.
- Sonradan (`@if`) gelen bölüm sırası bozulabilir; şimdilik bölümler koşulsuz yazılır.
- Yalnız `h2` listelenir; `h3` alt bölümler listeye girmez.
- `sectionId` sayfada benzersiz olmalı (denetlenmiyor).
- **Bundle (prod, ölçüldü):** initial 248.16 → 252.54 kB ham (68.71 → 69.88 kB aktarım; liste ve servis kabukta, `main` 23.47 → 26.24 kB). `docs-section` yalnız kullanan sayfanın tembel parçasında (Overview 2.47 → 3.33 kB). Bütçe uyarısı yok.

## 8. Testler

| Spec | Kapsam |
|---|---|
| `toc/docs-toc.service.spec.ts` | Boş başlangıç, kayıt sırası, kimlikle silme (aynı id), kayıtlı olmayanı yok sayma |
| `toc/docs-section.component.spec.ts` | `section > h2` (`id`, `tabindex`), içerik, `display: block`, sayfa sırası, girdi değişimi, yok olunca çıkış, axe |
| `toc/docs-toc.component.spec.ts` | Görünür etiketle adlı `nav`, başlık yok; sıra ve `href` (`/guide#intro`); liste değişimi; tık → URL + başlığa odak; Ctrl+tık odaklamaz; compact hedef boyutu; axe light / dark / RTL / compact |
| `shell/viewport.spec.ts` | `DOCS_TOC_VIEWPORT` tarayıcıda media query, sunucuda `false`; dar aralıkla çakışmaz |
| `app.component.spec.ts` | İki `nav`, Overview'un üç bölümü ve `href`; kırılmada / <2 bölümde / dar modda yok ve sütun sayısı (2 / 2 / 1); viewport ile gelip gitme (3 ↔ 2 sütun); sayfa değişince eski bölümler gider; bağlantı → başlığa odak, `<main>`'e değil; sütun yeri LTR / RTL; axe dört mod × liste açık |
| `pages/overview/…spec.ts` | Üç bölüm sırasıyla servis listesinde ve `h2` id'leri |

Sidebar seçicileri `app.component.spec.ts`'te `nav[aria-label="Documentation"]` ile daraltıldı (ikinci `nav` yüzünden).

Ctrl+tık testi varsayılan eylemi iptal eder: sentetik Ctrl+tık bağlantıda gerçekten yeni sekme açıp test penceresinin odağını alıyor, rastgele sırada sonraki odak testini (skip link) düşürüyordu.

Boşluklar: gerçek kaydırma (`anchorScrolling`) ve gerçek pencere genişliği tarayıcıda elle sınanır.

## 9. Bağlantılar

- Kod: `projects/docs/src/app/toc/`, `projects/docs/src/app/shell/viewport.ts`, `app.component.*`, `app.config.ts`, `pages/overview/`
- İlgili: [docs-site.md](docs-site.md), [docs-site-examples.md](docs-site-examples.md)
