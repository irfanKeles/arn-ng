# docs-site-toc-api ("On this page", API ve Styling tabloları)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Ana dosya: docs-site.md. Kurallar: ../SKILL.md, ../../arn-ui-library/rules/docs-page.md, ../../arn-ui-library/rules/component-files.md; kararlar: ../../arn-ui-library/decisions/. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-section` (sayfa bölümü), `docs-toc` ("On this page"), `docs-api-table`, `docs-token-table`, iç `docs-table` |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (docs bileşenleri + root servis + spec yardımcısı) |
| Sınıf adları | `DocsSectionComponent`, `DocsTocComponent`, `DocsTocService`, `ApiTableComponent`, `TokenTableComponent`, `DocsTableComponent`; tipler `DocsTocEntry`, `DocsApiTable`, `DocsApiInput` / `Output` / `Method` / `Slot` / `Token`; token'lar `DOCS_TOC_VIEWPORT`, `DOCS_SMOOTH_SCROLL`; sabitler `DOCS_MAIN_END_ID`, `DOCS_SCROLL_START_MS`, `DOCS_SCROLL_IDLE_MS`; saf `activeIndex` |
| Dosya yolları | `projects/docs/src/app/toc/`, `projects/docs/src/app/api/` (yardımcı `api/testing/expect-api.ts`), kabuk `app.component.*`, `--docs-toc-width` `styles.css` |

Adım 3b-2: "On this page" ile API ve Styling tabloları ([rules/docs-page.md](../../arn-ui-library/rules/docs-page.md), sayfa bölümleri 13-14).

## 2. Mimari ve CDK

### Bölümler bildirimseldir: `docs-section` + `DocsTocService`

Sayfa `<h2>` yazmaz; `<docs-section sectionId="status" heading="Status">` yazar. Bileşen `<section>` + `<h2 [id] tabindex="-1">` + `<ng-content>` üretir ve oluşurken servise kaydolur, `DestroyRef` ile çıkar.

| Parça | Neden |
|---|---|
| Kayıt modeli (DOM taraması değil) | Zoneless'ta ve `afterNextRender` olmadan (yazıldığı dönemde yasaktı) lazy route içeriğinin ne zaman hazır olduğu belirsiz; kayıt senkron ve SSR güvenli |
| Kayıt constructor'da, girdiler signal olarak | Required girdiler constructor'da okunamaz; kayıt signal'lerin kendisini taşır, liste onları sonradan okur (girdi değişince liste de değişir) |
| Sıra = kayıt sırası | Angular şablon sırasıyla oluşturur. `@if` ile sonradan gelen bölüm listenin sonuna düşer (bilinen sınır, §7) |
| `unregister` kimlikle | Aynı `id`'li iki kayıttan yalnız ayrılan silinir |
| `<section>` adsız | `aria-labelledby` verilmedi: adlı `section` bir `region` landmark'ı olur, her bölüm landmark listesini şişirirdi (plandan bilinçli sapma) |
| Host `display: block` | Varsayılan inline; başlık biçimi global `.docs-page h2` torun seçicisinden gelir, ek stil yok |

### Liste: `DocsTocComponent`

- Kabukta, route'un DIŞINDA durur; bu yüzden göreli `[routerLink]="[]"` kök route'a çözülür ve ana sayfaya giderdi. Kabuk sayfa yolunu `path` girdisiyle verir (`AppComponent.path`, sorgu ve fragment'sız; eski `currentPath` alanı bu signal'e dönüştü).
- Bağlantı `RouterLink` DEĞİL: `href` = `LocationStrategy.prepareExternalUrl(router.serializeUrl(createUrlTree([path], { fragment })))`, RouterLink'in yazdığının aynısı (`/#status`); orta tık ve "bağlantıyı kopyala" çalışır. Gerekçe: `RouterLink` `scroll` seçeneği almaz.
- `app.config.ts`: `withInMemoryScrolling({ anchorScrolling: 'enabled' })` (sidebar bölüm bağlantısı ve sayfa değişimi için kalır).
- Değiştiricisiz birincil tık: `preventDefault`, `focusSection(document, id, behavior)` (`scrollIntoView({ block: 'start', behavior })` + `focus({ preventScroll: true })`), fragment URL'de değilse `router.navigate([path], { fragment, scroll: 'manual' })` (router kaydırmaz). `behavior` `DOCS_SMOOTH_SCROLL`'dan (`shell/viewport.ts`; `(prefers-reduced-motion: no-preference)` → `'smooth'`, değilse ve sunucuda `'instant'`). Değiştiricili tık tarayıcıya bırakılır.

### Scrollspy

- Aktif = `pinned() ?? spied()`; bağlantıda `aria-current="location"`. Saf hesap `toc/scroll-spy.ts` `activeIndex({ headingTops, line, atBottom, scrollable })`: kaydırılabilir sayfanın sonunda son, değilse çizgiye ulaşan son başlık, hiçbiri değilse ilk.
- `IntersectionObserver` (`afterRenderEffect`; başlıklar `DocsTocEntry.element` ile, `docs-section` `viewChild`) başlıkları ve `#docs-main-end`'i (`DOCS_MAIN_END_ID`, kabukta `<main>`'in son çocuğu) gözler; `rootMargin` üstü `-çizgi`. Geri çağrı sayfayı okur, signal yazar (zoneless). Sunucuda ve IO yokken işaret yok.
- Çizgi `--docs-scroll-margin` (`styles.css`; `.docs-page h2` `scroll-margin-block-start`), başlığın hesaplanmış değerinden +1px payla okunur.
- Kilit: tıklanan bağlantı window `scrollend`'e kadar aktif; yedekler 1000 ms (`DOCS_SCROLL_START_MS`, kaydırma yoksa) ve son `scroll`'dan 150 ms (`DOCS_SCROLL_IDLE_MS`); capture `wheel` / `touchstart` / `keydown` / `pointerdown` hemen bırakır. `scrollend` capture'la dinlenmez (başka elemanın kaydırma sonu).
- Uzun listede aktif bağlantı host'un `scrollTop`'uyla görünür alana gelir (`afterRenderEffect` `write`); `scrollIntoView` yok (window'u kaydırırdı).
- URL kaydırırken yazılmaz.

### Kabukta görünürlük

`tocVisible = tocViewport() && !narrow() && path() !== undefined && sections().length >= 2`.

| Konu | Karar |
|---|---|
| Kırılma noktası | `DOCS_TOC_QUERY = '(width >= 80rem)'`, `DOCS_TOC_VIEWPORT` token'ı (dar mod ile aynı örüntü: ortak `injectMediaQuery`, sunucuda `false`, spec `signal` verir) |
| Üçüncü sütun | Yalnız `docs-with-toc` sınıfı (`tocVisible()`) varken: `sidebar minmax(0, 1fr) --docs-toc-width`. Sınıf yokken iki sütun (ve dar modda tek) aynen kalır, boş sütun oluşmaz |
| Render | `@if (tocVisible())`: gizliyken DOM'da yok |
| Konum | `main`'den sonra; sticky, `align-self: start`, `max-block-size: 100dvb`, `overflow: auto` (sidebar ile aynı) |
| Çekmece | Çakışmaz: çekmece <48rem, liste ≥80rem. `!narrow()` yine de yazıldı; listeye `inert` gerekmez |
| `scroll-margin` | `--docs-scroll-margin` (nefes payı ve scrollspy çizgisi); header sticky değil, olursa yüksekliği buraya girer |

### API ve Styling tabloları: elle yazılmış veri + spec doğrulaması

Sayfa `<docs-api-table [table]="{ kind: 'inputs', rows }">` (kind: `inputs` / `outputs` / `methods` / `slots`) ve `<docs-token-table [rows]>` yazar. Veri tipli ve elle yazılır (`api/docs-api.ts`); derleme zamanında kod çözümleme (compodoc, TS API) şimdilik ağır bulundu.

| Parça | Görev |
|---|---|
| `api/docs-table.ts` | Saf `apiTableView` / `tokenTableView`: başlık (Inputs, Outputs, Methods, Templates, CSS tokens), sütunlar, hücreler (`code` / düz metin, boş = yok) |
| `DocsTableComponent` | Tek şablon: iki sarmalayıcı aynı tabloyu basar (plandaki iki ayrı tablo yerine ortak iç bileşen) |
| `ApiTableComponent`, `TokenTableComponent` | İnce sarmalayıcı: girdi → `computed` görünüm → `<docs-table>` |
| `apiMismatches(type, { inputs, outputs }): string[]` | Saf karşılaştırma: `reflectComponentType` (Angular 22'de `@publicApi`) ile gerçek `templateName`'ler (alias ve `model()`'in `<ad>Change` output'u dahil) ↔ tablo adları. Eksik, fazla, tekrar eden ad satır satır; boş liste = uyumlu |
| `expectApiMatchesComponent` | İnce sarmalayıcı: `expect(apiMismatches(...)).toEqual([])`. Sayfa spec'i her bileşen için çağırır ([rules/docs-page.md](../../arn-ui-library/rules/docs-page.md) "eski doküman yasak") |

Directive'ler (`reflectComponentType` → `null`) 3c-1b'den beri ɵdir ile okunur; Styling tablosu `tokenMismatches` ile doğrulanır; `properties` türü: [docs-site-pages.md](docs-site-pages.md). Yalnız ad karşılaştırılır; tip, varsayılan ve açıklama elle tutulur.

İlk kullanım 3c Ripple sayfası (Inputs + CSS tokens); ilk bileşen sayfası Faz 4 button.

CDK: yok (`MediaMatcher` viewport token'ında).

## 3. Token'lar

Bileşen token'ı yok. `--docs-toc-width: calc(var(--arn-spacing) * 56)` (`styles.css` `:root`). Liste stili sidebar bağlantılarının aynısıdır (`--arn-muted-foreground`, hover `--arn-accent`). Tablo: kenarlık `--arn-border`, başlık hücresi `--arn-muted-foreground`, kod `--arn-font-mono`; yeni değer yok.

## 4. Override rehberi

Yok (uygulama).

## 5. Davranış ve a11y

| Konu | Davranış |
|---|---|
| Landmark | `<nav aria-labelledby="docs-toc-title">`; ikinci `nav` (sidebar `aria-label="Documentation"`) |
| Etiket | Görünür `<p>` "On this page"; başlık DEĞİL (sayfanın başlık ağacına karışmaz) |
| Bölüm başlığı | `h2`, `tabindex="-1"`: bağlantıdan odak alır, Tab sırasına girmez. Odak halkası yok (`docs-section.component.css` `h2:focus { outline: none }`; kapsülleme özniteliğiyle global `:focus-visible:not(.arn-button)`'ı özgüllükle yener). Başlık etkileşimsiz, odak yalnız okuma konumunu taşır; bağlantı, düğme ve form öğesi halkayı korur ([karar](../../arn-ui-library/decisions/2026-11.md) "Bölüm başlığında odak halkası yok") |
| Odak | Sayfa değişince `<main>` (mevcut kural); yalnız fragment değişince `<main>`'e taşınmaz, liste bağlantısı başlığa taşır |
| Aktif bağlantı | `aria-current="location"`; `--arn-foreground`, semibold, 2px `border-inline-start` `--arn-foreground` (≥3:1; her bağlantıda saydam aynı kenar, metin kaymaz); RTL'de sağda ([karar](../../arn-ui-library/decisions/2026-11.md) "On this page scrollspy ve tıklayınca kaydırma") |
| Hareket | Liste tıklaması yalnız `prefers-reduced-motion: no-preference`'te yumuşak; odak `preventScroll` ile kaydırmayı kesmez |
| Hedef boyutu | Bağlantılar compact'ta da ≥24px |
| RTL | Mantıksal CSS; sütun `main`'in solunda |
| Tablo yapısı | Görünür `<caption>`; `th scope="col"`; ad hücresi `th scope="row"` + `<code>` |
| Tablo bölgesi | `<div role="region" tabindex="0" aria-labelledby=caption>`: dar ekranda yalnız bölge yatay kayar, klavyeyle odaklanıp kaydırılır (axe `scrollable-region-focusable`; kod bloğundaki örüntü). Bölge `position: relative`: gizli "None" (`.docs-visually-hidden`, `position: absolute`) için kapsayıcı blok olur; yoksa metin `overflow-x`'ten kaçıp belgeyi genişletiyordu (320px'te Configuration 89px kayıyordu) |
| Boş hücre | Görünür "—" (`aria-hidden`) + gizli "None" |
| Tablo RTL | Hücre `text-align: start`; kod `direction: ltr` + `unicode-bidi: isolate` (inline kutu kendi yönünü alsın) |

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- Dar ekranda liste YOK: ROADMAP cila maddesi. Scrollspy var (§2).
- Sayfa sonuna yakın kısa bir bölüme tıklanınca kilit kalkınca son bölüm aktif olur (sayfa o başlığı çizgiye getiremez).
- Sonradan (`@if`) gelen bölüm sırası bozulabilir; şimdilik bölümler koşulsuz yazılır.
- Yalnız `h2` listelenir; `h3` alt bölümler listeye girmez.
- `sectionId` sayfada benzersiz olmalı (denetlenmiyor).
- **Bundle (prod, Angular 19 ile ölçüldü; yeniden ölçülmedi):** initial 248.16 → 252.54 kB ham (68.71 → 69.88 kB aktarım; liste ve servis kabukta, `main` 23.47 → 26.24 kB). `docs-section` yalnız kullanan sayfanın tembel parçasında (Overview 2.47 → 3.33 kB). Bütçe uyarısı yok. Tablolar eklenince çıktı birebir aynı (dosya adları dahil); tablo dizgeleri `dist/docs`'ta yok.
- `apiMismatches` spec fixture'ında alias YOK: `@angular-eslint/no-input-rename` alias'ı yasaklar, kural kapatılmadı; alias desteği `templateName` karşılaştırmasından gelir, `model()` örneği türetilmiş adı sınar.
- Prettier `<caption>` içindeki interpolasyonu üç satıra böler (zararsız, biçim kaynaklı).
- **Kalıp:** kaydırılan / kırpan bir kapsayıcının içindeki mutlak konumlu eleman, kapsayıcı konumlu değilse kırpılmaz ve sayfayı genişletir. Tarandı (3c): kod bloğu `pre` yalnız satır içi `span`; sidebar ve "On this page" mutlak eleman taşımaz; örnek bloğu `:host` (`overflow: hidden`, konumsuz) bugün güvenli (ripple dalgaları konumlu düğmelerde) ama AÇIK: konumsuz bir host'ta ripple ya da gizli metin içeren örnek kaçar.

## 8. Testler

| Spec | Kapsam |
|---|---|
| `toc/docs-toc.service.spec.ts` | Boş başlangıç, kayıt sırası, kimlikle silme (aynı id), kayıtlı olmayanı yok sayma |
| `toc/docs-section.component.spec.ts` | `section > h2` (`id`, `tabindex`), içerik, `display: block`, sayfa sırası, girdi değişimi, yok olunca çıkış; gerçek Tab (`userEvent.tab()`) ile bağlantıda halka var (`solid`, 3px), oradan script ile odaklanan başlık `:focus-visible` eşleşir ama `outline-style: none`; axe |
| `toc/scroll-spy.spec.ts` (8) | Bölüm yok → -1; çizgiden önce ilk; çizgideki / üstündeki son; tam çizgide ulaşmış; kaydırılabilir sayfa sonunda son; kaydırılmayan sayfada sonu yok sayar; render olmamış başlık (Infinity); tek bölüm |
| `toc/docs-toc.component.spec.ts` (28; önce 10) | Görünür etiketle adlı `nav`, başlık yok; sıra ve `href` (`/guide#intro`); liste değişimi; tık → URL + başlığa odak; Ctrl+tık odaklamaz, kaydırmaz; compact hedef boyutu. Scrollspy (uzun sayfa fixture'ı, gerçek `scrollTo` + `expect.poll`): başta yalnız ilk; kaydırınca o bölüm ve geri, router URL'i ve `location.hash` değişmez; sayfa sonunda kısa son bölüm; kaymayan sayfada ilk; IO yokken işaret yok; yok olunca `disconnect`; uzun listede aktif bağlantı görünür alanda (iki yön); kalınlık + 2px çizgi ≥3:1, diğerleri saydam aynı kenar (light / dark); RTL çizgi sağda. Tıklama: yumuşak (`behavior: 'smooth'`) ve anında (`'instant'`, başlık çizgide, odakta) ayrı, ikisinde `focus({ preventScroll: true })`; `navigate` `scroll: 'manual'` ile; URL'deki fragment'a `navigate` yok ama kaydırma var. Kilit (sahte `setTimeout`; ara bölüm içerik kısaltılarak çizgiye getirilir, gerçek kaydırma yok): `scrollend`'e kadar tıklanan aktif; `scrollend` gelmezse 1000 ms'de; tekerlekte hemen; başka elemanın `scrollend`'i bırakmaz. axe dört mod × aktif bağlantı |
| `shell/viewport.spec.ts` | `DOCS_TOC_VIEWPORT` tarayıcıda media query, sunucuda `false`; dar aralıkla çakışmaz; `DOCS_SMOOTH_SCROLL` reduced-motion sorgusu, sunucuda `false` |
| `app.component.spec.ts` (+3: liste tıklamasında `ViewportScroller.scrollToAnchor` çağrılmaz; ilk bölüm işaretli ve `<main>` `#docs-main-end` ile biter; 320px'te liste yok, taşma yok) | İki `nav`, Overview'un üç bölümü ve `href`; kırılmada / <2 bölümde / dar modda yok ve sütun sayısı (2 / 2 / 1); viewport ile gelip gitme (3 ↔ 2 sütun); sayfa değişince eski bölümler gider; bağlantı → başlığa odak, `<main>`'e değil; sütun yeri LTR / RTL; axe dört mod × liste açık |
| `pages/overview/…spec.ts` | Üç bölüm sırasıyla servis listesinde ve `h2` id'leri |
| `api/docs-table.spec.ts` | Saf görünüm: her kind'in başlığı ve sütunları, hücre türleri, boş varsayılan, sütun başına bir hücre; token tablosu |
| `api/api-table.component.spec.ts` | Caption bölgeyi adlandırır; `scope` col / row; kod ve düz metin hücreleri; "—" + "None"; girdi değişimi; benzersiz caption id; 320px: sayfa taşmaz, yalnız bölge taşar (`overflow-x: auto`); kenarın ötesindeki boş varsayılan hücresiyle `document.documentElement.scrollWidth` render öncesinden büyümez (`.docs-page.scrollWidth` bunu görmüyordu; taban render öncesi genişlik: test çalıştırıcısının sayfası taşabilir, [docs-site-pages.md](docs-site-pages.md)); bölge `tabindex=0` ile odak alır ve kayan elemandır; RTL'de kod `ltr` + `isolate`, hücre `start`; axe light / dark / RTL / compact + 320px |
| `api/token-table.component.spec.ts` | "CSS tokens" başlığı, sütunlar, adlar ve varsayılan kod olarak; axe |
| `api/testing/expect-api.spec.ts` | `apiMismatches`: uyumlu → boş, sıra önemsiz; eksik girdi, fazla girdi, yanlış ad, `model()`'in `valueChange`'i eksik, fazla output, tekrar eden satır, tablo yok → dolu liste; sarmalayıcı uyumlu tabloda geçer. Directive grubu: [docs-site-pages.md](docs-site-pages.md) §8 |

Sidebar seçicileri `app.component.spec.ts`'te `nav[aria-label="Documentation"]` ile daraltıldı (ikinci `nav` yüzünden).

Ctrl+tık testi varsayılan eylemi iptal eder: sentetik Ctrl+tık bağlantıda gerçekten yeni sekme açıp test penceresinin odağını alıyor, rastgele sırada sonraki odak testini (skip link) düşürüyordu.

Boşluklar: gerçek yumuşak kaydırma animasyonu birim testte oynatılmaz (spy + elle kilit); Playwright ile ölçüldü (decisions "On this page scrollspy…" (9)). Firefox ve WebKit ölçülmedi. Sidebar bağlantısının gerçek kaydırması (`anchorScrolling`) tarayıcıda elle sınanır. Gerçek pencere daraltması bir kez Playwright ile ölçüldü (2026-10, repo dışı, `playwright-core` + sistem Chrome): `/ripple`, `/installation`, `/configuration` 1280 → 320px yenilemesiz `docs-narrow` alır, taşma 0. Tablo bölgesinin gerçek ok tuşuyla kaydırılması birim testte üretilemez (sentetik tuş olayı tarayıcıyı kaydırmaz; Karma'da doğrulandı, Vitest browser mode'da yeniden denenmedi); spec onun önkoşullarını sınar: bölge odaklanabilir, kayan eleman odur, sayfa kaymaz.

## 9. Bağlantılar

- Kod: `projects/docs/src/app/toc/`, `projects/docs/src/app/api/`, `projects/docs/src/app/shell/viewport.ts`, `app.component.*`, `app.config.ts`, `pages/overview/`
- İlgili: [docs-site.md](docs-site.md), [docs-site-examples.md](docs-site-examples.md)
