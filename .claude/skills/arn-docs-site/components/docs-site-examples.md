# docs-site-examples (örnek bloğu ve kod renklendirme)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Ana dosya: docs-site.md. Kurallar: ../SKILL.md, ../../arn-ui-library/rules/docs-page.md, ../../arn-ui-library/rules/component-files.md; kararlar: ../../arn-ui-library/decisions/. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-example` (örnek kartı), `docs-code-block` (kod bloğu), `docs-copy-button` (ikisinin ortak kopyala düğmesi) |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (docs bileşenleri + tembel servis) |
| Sınıf adları | `ExampleComponent`, `CodeBlockComponent`, `CopyButtonComponent` (+ sabit `COPIED_RESET_MS`, `example.component`'ten de yeniden dışa açılır; tip `DocsCopyState`), `DocsHighlighterService`; token'lar `DOCS_HIGHLIGHT_LOADER`, `DOCS_CLIPBOARD` (`code/clipboard.ts`); tipler `DocsCodeLanguage`, `DocsCodeToken`, `DocsHighlight` |
| Dosya yolları | `projects/docs/src/app/example/`, `projects/docs/src/app/code/`, `projects/docs/src/text-imports.d.ts`, renkler `code/code-block.component.css` |

Adım 3b-1'de yazıldı. İlk gerçek kullanım 3c Ripple sayfası ([docs-site-pages-guides.md](docs-site-pages-guides.md)); örnek yalnız kullanan sayfanın tembel parçasına girer (bkz. §7).

## 2. Mimari ve CDK

### Örnek kodunun kaynağı: derlenen dosyanın kendisi

Her örnek gerçek bir `<ad>.example.ts` + `<ad>.example.html` çiftidir; stili varsa üçüncü dosya `<ad>.example.css` (`styleUrl`). Sayfa bileşeni örneği hem bileşen olarak hem metin olarak import eder:

- `import html from './x.example.html?source' with { loader: 'text' };` (aynısı `.ts` ve `.css` için)
- `<docs-example [html]="html" [ts]="ts" [css]="css"><docs-x-example /></docs-example>`; `css` isteğe bağlıdır, verilmezse CSS sekmesi yoktur

| Parça | Neden |
|---|---|
| `with { loader: 'text' }` | Angular'ın esbuild builder'ı dosyayı string olarak gömer (`loader-import-attribute-plugin`) |
| `?source` soneki | TypeScript belirteci dosyaya çözemez ve `text-imports.d.ts`'teki tek `declare module '*?source'` bildirimine düşer (tip `string`). Soneksiz `.ts` import'u TS1192 / TS5097 verir; her import'a `@ts-expect-error` yazmak reddedildi. esbuild soneki çözerken atar |
| `module: esnext` (docs `tsconfig.app/spec/json`) | Import attribute `ES2022` modülünde TS2823 verir. Kök `tsconfig.json`'a dokunulmadı |
| Test derlemesi | Docs testleri `@angular/build:unit-test` ile `docs:build:development,testing` hedefinin esbuild derlemesini kullanır; import orada da çalışır, ayrı bir Vite yapılandırması ya da test seçeneği gerekmez. Karma/webpack döneminde yalnız docs test hedefi bunun için ayrı bir builder modu taşıyordu ([karar](../../arn-ui-library/decisions/2026-10.md)) |

Örnek, bir sayfa tarafından import edilmezse bundle'a girmez; `sideEffects` gerekmez (import yoksa modül grafiğinde yok).

### Kod renklendirme: Shiki, tembel

| Parça | Görev |
|---|---|
| `code/docs-highlight.ts` | Shiki'yi import eden TEK dosya. `createHighlighterCore` + `createCssVariablesTheme` (`shiki/core`), `createJavaScriptRegexEngine` (`shiki/engine/javascript`, wasm yok), diller `shiki/langs/{html,typescript,css,shellscript}.mjs` (`shellscript` 3c Installation komutları için). Highlighter modül düzeyinde tektir (servis TestBed başına yeniden oluşur; Shiki çoklu örnekte uyarır). Çıktıyı `DocsCodeToken[]`'e çevirir; satır sonu da bir token'dır, içerikler toplanınca kod çıkar |
| `DOCS_HIGHLIGHT_LOADER` | Varsayılanı `import('./docs-highlight')`: ayrı chunk (`docs-highlight`, 636.09 kB ham / 82.78 kB aktarım; Angular 19 ile ölçüldü). Spec'ler sahte / bekleyen / başarısız yükleyici verir |
| `DocsHighlighterService.load()` | Sözü bir kez alır; sunucuda, indirme hatasında ve yükleyici fırlatınca `null` |
| `CodeBlockComponent` | `ngOnChanges`'te `load().then(...)` → `signal`. `effect()` / `afterNextRender` / `rxjs-interop` yok. Girdi değiştiyse geç gelen sonuç atılır; `highlight` fırlatırsa düz metin kalır |

Çıktı `@for` ile `<span [style.color]>` olarak basılır: `innerHTML` ve `codeToHtml` yok ([rules/angular.md](../../arn-ui-library/rules/angular.md)). Şablondaki `<pre>` tek satırdır: Angular `<pre>` içinde boşluğu korur, araya girilen her boşluk koda eklenir (Prettier `<pre>` içine dokunmaz).

CDK: `LiveAnnouncer` (kopya sonucu, `polite`).

İki görünüm (`embedded` girdisi, varsayılan `false`): tek başına duran blok kendi yüzeyini (kenarlık `--arn-border`, `--arn-radius`, zemin `--arn-muted`, alt boşluk) ve kopyala düğmesini taşır; örnek kartı `[embedded]="true"` verir, kart çerçeveyi ve tek kopya düğmesini kendisi taşır (host sınıfı `docs-code-block-embedded`). Tek başına duran blok iki sütunlu grid'dir (`minmax(0, 1fr) auto`): `pre` ilk sütunda kayar, düğme kendi sütununda üst-son köşede durur, kaydırılan metin `pre`'nin kenarında kırpılır ve düğmenin altına girmez.

Satır numaraları (`lineNumbers` girdisi, varsayılan `false`; yalnız örnek kartı açar): her satır `.docs-code-block-line`, numara CSS sayacıyla `::before { content: counter(docs-code-line) / "" }`. Üretilen içerik seçime ve kopyaya girmez, `user-select: none`, boş alt metin numarayı erişilebilirlik ağacından çıkarır. Satırlar düz metinde de bölünür (Shiki gelince boyut değişmez); son satır sonundan sonraki boş satır numaralanmaz. Sütun genişliği `--docs-code-digits` (en büyük numaranın basamak sayısı, `ch`). Numaralar yatay kaydırmada kodla birlikte kayar.

## 3. Token'lar

Shiki renk taşımaz: tema yalnız `var(--docs-code-<ad>)` üretir. Değişkenler `code-block.component.css` `:host`'unda (global `styles.css`'te DEĞİL: orada initial CSS'i 0.85 kB büyütüyordu; Angular 19 ile ölçüldü). Renkli palet docs'a özgü `light-dark(oklch(...), oklch(...))` literalleridir; yeni `--arn-*` token'ı açılmadı ([karar](../../arn-ui-library/decisions/2026-11.md) "Bileşen docs sayfası şablonu" (6)). Değerler sRGB gamutu içinde seçildi (kanal kırpılmaz). `light-dark()` kullanım yerinde çözüldüğü için `.dark` / `.light` / sistem tercihi anında yansır.

| Değişken | Açık | Koyu | Oran (açık `--arn-card` beyaz / koyu neutral-900) |
|---|---|---|---|
| `--docs-code-background` | `--arn-card` | `--arn-card` | Örnek kartı paneli. Tek başına duran blokta `--arn-muted` (aşağıda) |
| `--docs-code-foreground` | `--arn-foreground` | | |
| `-token-keyword` (mor) | `oklch(50% 0.19 300deg)` | `oklch(78% 0.12 300deg)` | 6.5924 / 8.6200 |
| `-token-function`, `-token-link` (mavi) | `oklch(50% 0.16 255deg)` | `oklch(79% 0.11 245deg)` | 6.0829 / 9.3617 |
| `-token-string`, `-string-expression`, `-inserted` (yeşil) | `oklch(50% 0.13 150deg)` | `oklch(81% 0.15 150deg)` | 5.6498 / 10.4874 |
| `-token-constant`, `-changed` (turuncu) | `oklch(52% 0.11 55deg)` | `oklch(81% 0.12 65deg)` | 5.7179 / 9.6946 |
| `-token-parameter`, `-deleted` (kırmızı) | `oklch(52% 0.16 20deg)` | `oklch(79% 0.11 20deg)` | 5.9925 / 8.8543 |
| `-token-punctuation`, `-token-comment`, `--docs-code-line-number` | `--arn-muted-foreground` | | 4.7323 / 6.9077 |

Tek başına duran blok (`:host(:not(.docs-code-block-embedded))`): `--docs-code-background: var(--arn-muted)` (açık neutral-100, koyu neutral-800; sayfa beyaz / neutral-950). Açık `--arn-muted-foreground` neutral-100 üstünde 4.5:1'in altında kaldığı için noktalama, yorum ve satır numarası `--docs-code-muted-text: light-dark(var(--arn-neutral-600), var(--arn-muted-foreground))` alır; renkli token'lar değişmez. Spec her rengi iki yüzey × iki temada sınar.

Oranlar paylaşımlı helper'la (`projects/ui/testing/contrast.ts`) hesaplandı; spec her rengin iki temada ≥4.5:1 olduğunu sınar (`TEXT_COLORS` listesi; gerçek Shiki'nin kullandığı her ad listede olmalı). Liste Shiki'nin `createCssVariablesTheme` kaynağındaki adların tamamıdır (`ansi-*` hariç). Palet değişirse yalnız bu değerler değişir, bileşen ve Shiki kodu değişmez.

## 4. Override rehberi

Yok (uygulama).

## 5. Davranış ve a11y

| Konu | Davranış |
|---|---|
| Demo | `<ng-content>` kartın ortasında (`grid`, `justify-items: center`; çocuk en fazla kart genişliğinde). `.docs-example-demo` hostun ilk çocuğu kalır (Theming / Configuration spec'leri onu sorgular) |
| Çubuk | Demo altında; başta görsel "Preview" etiketi (büyük harf CSS ile), sonda seçenekler, kopyala, kod açıkken gizle. `flex-wrap`, dar ekranda sarar; RTL'de aynalanır |
| Seçenekler | `<button aria-pressed aria-controls=<kod bölgesi>>` HTML, TS, `css` verilmişse CSS; tablist değil ([karar](../../arn-ui-library/decisions/2026-11.md) "Bileşen docs sayfası şablonu" (5)). Basmak o dosyayı açar ve yalnız onu basılı yapar; basılıya tekrar basmak kapatmaz. Kod kapalıyken hiçbiri basılı değil. Ok / Home / End işlemez (her düğme Tab sırasında) |
| Gizle | Kod açıkken ikon düğmesi, `aria-label="Hide code"`. Kapanınca DOM'dan kalkar; odak son seçilen seçeneğe taşınır (`viewChildren`, odak kaybı yok) |
| Kod alanı | Bölge hep DOM'da (`hidden`); içinde `lineNumbers`'lı `docs-code-block`. `<pre role="group" aria-label="HTML code">`, `tabindex="0"` yalnız metin yatayda taşarken (`ResizeObserver` + `afterRenderEffect` ölçümü, `DestroyRef`'te `disconnect`; sunucuda ve gözlemci yokken `tabindex` yok): taşan blok klavyeyle kaydırılır (axe `scrollable-region-focusable`), taşmayan blokta Tab doğrudan kopyala düğmesine gider. Tek başına duran blok ve kart paneli aynı kural |
| Kopyala | `docs-copy-button` (host `display: contents`, girdi `text`, public `state` ve `reset()`). İkon düğmesi, `aria-label="Copy code"` (ad değişmez). Kartta açıkken gösterilen dosyayı, kapalıyken HTML'i kopyalar. Başarı: ikon onay işaretine döner, `COPIED_RESET_MS` (3000) sonra geri döner. Hata (ret ya da pano yok): yanında görünür "Copy failed" metni (`--arn-destructive`, kendi `--arn-background` zemininde: açık `--arn-muted` üstünde 4.5:1 tutmazdı); zamanlayıcıyla silinmez, sonraki kopyaya ya da `reset()`'e kadar kalır (kart seçenek ve gizlemede çağırır). İkisi de `LiveAnnouncer` ile `polite` ("Copied" / "Copy failed"). Zamanlayıcı yeni kopyada, `reset()`'te ve `DestroyRef`'te temizlenir. Animasyon yok |
| Blokta kopyala | Tek başına duran blokta düğme `opacity: 0` ile gizlenir (`display` / `visibility` değil: Tab sırasında ve erişilebilirlik ağacında kalır). Görünür olduğu durumlar: `@media (hover: hover)` içinde blok hover'dayken, blokta odak varken (`:focus-within`, `pre` dahil), kopya sonucu dururken (`state() !== 'idle'`), `@media (hover: none)` cihazlarda her zaman. Yalnız hover'la görünür olma durumu yok |
| İkonlar | Satır içi SVG, `aria-hidden="true"`, `focusable="false"`, `stroke: currentcolor`. İki temada düğme zeminine ve blok zeminine ≥3:1, hata metni ≥4.5:1 (spec). Düğme kenarı `--arn-input` açık `--arn-muted` üstünde ≈2.97:1; düğmeyi ikon tanıtır (WCAG 1.4.11), kenar süs |
| Odak halkası | Blok `overflow: hidden` (yuvarlak köşe) taşır; dışa çizilen global halka kırpılırdı. Tek başına duran blokta `pre:focus-visible` `outline-offset: calc(--arn-ring-width * -1)`: halka `pre`'nin dolgusunda, dört kenarda, kodu örtmez; `pre` başlangıç köşeleri `--arn-radius - --arn-border-width`. Düğme halkası sütun dolgusuna sığar |
| Pano | `DOCS_CLIPBOARD`: `DOCUMENT.defaultView?.navigator.clipboard`, `isPlatformBrowser`, try/catch; yoksa `null` |
| RTL | Kod `direction: ltr`; düzen mantıksal CSS |
| Dar ekran | Uzun satır yalnız `<pre>` içinde kayar (`overflow-x: auto`, host `min-inline-size: 0`) |
| Yüklenme | Shiki ilk seçenek basılınca yüklenir; önce düz metin, sonra aynı kutuda token'lar: boyut değişmez |

Basılı seçenek yalnız renkle değil, kenarlık ve kalınlıkla da ayrılır. Düğme boyutu (en ve yükseklik) kabuktaki hedef ifadesidir (docs-site.md §4).

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **Sekme klavyesi yok:** seçenekler `aria-pressed` düğmeleridir; eski elle yazılmış ok / Home / End klavyesi ve onun CDK `ListKeyManager` sapması kalktı ([karar](../../arn-ui-library/decisions/2026-11.md)).
- **Zamanlayıcı yalnız başarıda:** onay işareti 3000 ms sonra döner; hata bir sonraki etkileşime kadar kalır ([karar](../../arn-ui-library/decisions/2026-11.md) "Örnek kartı uygulaması").
- **Bundle (prod, Angular 19 ile ölçüldü; yeniden ölçülmedi):** blok hiçbir sayfada yokken initial 248.16 kB, dosya adları öncekiyle aynı; örnek ve Shiki dizgeleri `dist/docs`'ta yok. Tembel bir sayfa kullanınca (Overview'da geçici önizlemeyle ölçüldü) initial 252.07 kB (+3.91 kB ham, +2.0 kB aktarım), `docs-highlight` ayrı tembel chunk (636.09 kB ham / 82.78 kB aktarım). Initial'daki artış Shiki değil: esbuild'in ana paketle ortak kullanılan CDK parçalarını ve yardımcılarını ortak chunk'lara ayırması; bütçe uyarısı yok. `shellscript` eklenince (3c-1a, `main.ts`'e geçici `import()` ile ölçüldü) initial aynı kaldı, `docs-highlight` 636.09 → 677.55 kB ham (82.78 → 87.69 kB aktarım).
- Shiki sürüm yükseltmesinde tema değişken adları değişebilir; `highlighter.service.spec.ts` gerçek Shiki'nin kullandığı her rengin kod bloğunda tanımlı olduğunu `code-block.component.spec.ts` sınar.
- Örnek dosya adı kalıbı: `<ad>.example.ts` / `.html` / (isteğe bağlı) `.css`, selector `docs-<ad>-example`. Gösterilen TS `templateUrl` ve `styleUrl` ile diğer dosyalara işaret eder; kopyalayan hepsini alır. Stil örneğin çalışması için gerekiyorsa (ör. ripple'da `position: relative`) CSS dosyası zorunludur: görünmeyen stil "kopyalanınca çalışır" kuralını bozar.
- Reddedilenler: elle yazılmış string, `raw-loader`, `angular.json` `loader` seçeneği, Shiki çift tema, `codeToHtml` + `innerHTML`, oniguruma wasm, precompiled diller.

## 8. Testler

Docs testleri Vitest ile `docs:build:development,testing` hedefinin esbuild derlemesinde koşar. Fixture: `example/testing/basic.example.{ts,html}`, stilli `styled.example.{ts,html,css}` ve `example-host.ts` (`ExampleHostComponent`, `StyledExampleHostComponent`) (yalnız spec'ler import eder). `testing/dom.ts`'e `nextTask()` eklendi (kuyruktaki söz geri çağrılarından sonra çözülür; süreye bağlı değil).

| Spec | Kapsam |
|---|---|
| `code/highlighter.service.spec.ts` | Tek yükleme, istenene kadar yüklememe, indirme hatası / fırlatan yükleyici / sunucu → `null`; gerçek Shiki ile dört dil (`shellscript` dahil): metin değişmez, birden çok stil, her renk bir `var(--docs-code-*)`; tek highlighter |
| `code/copy-button.component.spec.ts` (6) | Adlı ikon düğmesi, `display: contents`; kopya + onay + polite duyuru, 3000 ms; ret sonraki kopyaya kadar kalır; pano yok; `reset()` bekleyen zamanlayıcıyı temizler; yok olunca zamanlayıcı kalmaz (yalnız `setTimeout` sahte) |
| `code/code-block.component.spec.ts` (51; önce 18) | Tab durağı: taşmayan blokta `tabindex` yok ve Tab ilk durağı kopyala düğmesi; 320px'te uzun satır `tabindex="0"`, halka ve ok tuşuyla kaydırma; sayfa daralınca eklenir, genişleyince kalkar; aynı kutuda kod değişince yeniden ölçülür; axe iki durumda; `ResizeObserver` yokken yok; yok olunca `disconnect`. Odak halkası: Tab ile odaklanan `pre`'nin halkası kırpma kutusunun içinde, dört kenarda, dolguda; iki tema (zemine ≥3:1), RTL, 320px; Tab ile düğmenin halkası tam. Yüzey: iki temada kenarlık + `--arn-muted` zemin, sayfadan farklı; `embedded`'da kenarlık yok, `--arn-card`. Kopyala: kopya, onay ve duyuru; pano yokken görünür hata ve düğme görünür kalır; `embedded`'da düğme yok; `opacity: 0` ama Tab sırasında, düğmede ve `pre`'de odakla görünür; gerçek hover (`userEvent.hover`) ile görünür, ayrılınca gizli; CSSOM'da `(hover: none)` ve `(hover: hover)` kuralları; uzun satır sona kaydırılınca da düğme `pre`'nin dışında; RTL'de `inline-end`, kod `ltr`; 320px taşma yok (uzun satır + hata); compact ≥24×24; ikon ≥3:1 (düğme ve blok) ve hata ≥4.5:1 iki temada; axe `A11Y_MODES` × hata. Palet iki yüzey × iki tema. Önceki 18 test: |
| `code/code-block.component.spec.ts` (önceki kapsam) | Yüklenene kadar düz metin; token'lara geçişte metin ve boyut aynı (±1px); renk değişkeni ve italik / kalın sınıfları; yükleme hatası ve fırlatan highlight → düz metin; geç gelen sonuç atılır; odaklanabilir ve adlı; 320px'te sayfa taşmaz; RTL'de `ltr`; kod rozeti stili uygulanmaz; gerçek Shiki'nin kullandığı her değişken tanımlı ve `TEXT_COLORS`'ta; satır numaraları: varsayılan yok, düz ve renkli aynı sayıda ve boyutta, seçime girmez (`getSelection()`; Chromium son satır sonunu seçime katmaz), `user-select: none` ve boş alt metin, basamak genişliği; her metin rengi light / dark ≥4.5:1; axe |
| `code/clipboard.spec.ts` | Tarayıcıda `navigator.clipboard`, sunucuda `null` |
| `example/example.component.spec.ts` (47; önce 44: kartta tek kopya düğmesi ve o çubukta, panelde düğme yok; panel `embedded`, ikinci yüzey yok; panel `pre`'si yalnız taşarken Tab durağı, sayfa genişleyince kalkar) | Demo ilk çocuk ve ortada; Preview etiketi; seçenekler düğme, kapalıyken basılı değil, tablist yok; seçince açılır ve yalnız o basılı; basılıya tekrar basmak kapatmaz; gizle → basılı yok, düğme kalkar, odak son seçeneğe; ikon düğmelerinin adları ve gizli ikonlar; ok / Home / End işlemez; gösterilen kod fixture metni; numaralı panel; kopyalama: kapalıyken HTML, gösterilen dosya + onay ikonu + polite duyuru, ret, pano yok, 3000 ms sonra onay geri döner, hata o süreden sonra kalır ve seçenek / gizle / yeni kopyada silinir (yalnız `setTimeout` sahte), seçenek ve gizlemede onay sıfırlanır; ikon ≥3:1 ve hata metni ≥4.5:1 (light / dark); hareket yok; `expectNoPageOverflow` (kod ve hata açıkken); 320px'te kod içeride kayar; RTL'de çubuk aynalanır, kod `ltr`; compact'ta her düğme ≥24×24; axe `A11Y_MODES` × (kapalı, renkli HTML ve TS). CSS'li örnek: üçüncü seçenek ve ilişkisi, üç dosyanın metni (`styleUrl`), stil demoya uygulanır, CSS kopyası ve odak dönüşü, compact, axe dört mod × renkli CSS |

Boşluklar: gerçek pano izni, gerçek ekran okuyucu duyurusu (boş alt metnin numarayı gerçekten gizlemesi dahil) ve Firefox / WebKit otomatik sınanmadı. Görünüm 10 örnekte 1100px light ve 360px dark ekran görüntüsüyle gözle kontrol edildi.

## 9. Bağlantılar

- Kod: `projects/docs/src/app/example/`, `projects/docs/src/app/code/`, `projects/docs/src/text-imports.d.ts`, `angular.json` (docs test), `projects/docs/tsconfig*.json`
- İlgili: [docs-site.md](docs-site.md), [tokens.md](../../arn-ui-library/components/tokens.md)
