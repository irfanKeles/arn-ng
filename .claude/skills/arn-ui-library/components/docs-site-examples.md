# docs-site-examples (örnek bloğu ve kod renklendirme)

<!-- En fazla 150 satır. Kütüphane parçası değil: `projects/docs` uygulaması. Ana dosya: docs-site.md. Kurallar: ../SKILL.md §13, §16, §18. -->

## 1. Özet

| Alan | Değer |
|---|---|
| Selector | `docs-example` (örnek bloğu), `docs-code-block` (kod bloğu) |
| Entry point | Yok (uygulama) |
| Tür | ortak yapı (docs bileşenleri + tembel servis) |
| Sınıf adları | `ExampleComponent`, `CodeBlockComponent`, `DocsHighlighterService`; token'lar `DOCS_HIGHLIGHT_LOADER`, `DOCS_CLIPBOARD`; tipler `DocsCodeLanguage`, `DocsCodeToken`, `DocsHighlight` |
| Dosya yolları | `projects/docs/src/app/example/`, `projects/docs/src/app/code/`, `projects/docs/src/text-imports.d.ts`, renkler `code/code-block.component.css` |

Adım 3b-1'de yazıldı. Hiçbir sayfada kullanılmıyor (dolgu örneği yok, SKILL §13); ilk gerçek kullanım 3c ripple sayfası. Kullanılmadığı sürece üretim paketine girmez (bkz. §7).

## 2. Mimari ve CDK

### Örnek kodunun kaynağı: derlenen dosyanın kendisi

Her örnek gerçek bir `<ad>.example.ts` + `<ad>.example.html` çiftidir. Sayfa bileşeni örneği hem bileşen olarak hem metin olarak import eder:

- `import html from './x.example.html?source' with { loader: 'text' };` (aynısı `.ts` için)
- `<docs-example [html]="html" [ts]="ts"><docs-x-example /></docs-example>`

| Parça | Neden |
|---|---|
| `with { loader: 'text' }` | Angular'ın esbuild builder'ı dosyayı string olarak gömer (`loader-import-attribute-plugin`) |
| `?source` soneki | TypeScript belirteci dosyaya çözemez ve `text-imports.d.ts`'teki tek `declare module '*?source'` bildirimine düşer (tip `string`). Soneksiz `.ts` import'u TS1192 / TS5097 verir; her import'a `@ts-expect-error` yazmak reddedildi. esbuild soneki çözerken atar |
| `module: esnext` (docs `tsconfig.app/spec/json`) | Import attribute `ES2022` modülünde TS2823 verir. Kök `tsconfig.json`'a dokunulmadı |
| `angular.json` docs `test.options.builderMode: "application"` | Webpack Karma bu import'u derleyemez ("Module parse failed"). Angular 19'da **developer preview** (SKILL §16). ui testleri webpack'te kalır |

Örnek, bir sayfa tarafından import edilmezse bundle'a girmez; `sideEffects` gerekmez (import yoksa modül grafiğinde yok).

### Kod renklendirme: Shiki, tembel

| Parça | Görev |
|---|---|
| `code/docs-highlight.ts` | Shiki'yi import eden TEK dosya. `createHighlighterCore` + `createCssVariablesTheme` (`shiki/core`), `createJavaScriptRegexEngine` (`shiki/engine/javascript`, wasm yok), diller `shiki/langs/{html,typescript,css}.mjs`. Highlighter modül düzeyinde tektir (servis TestBed başına yeniden oluşur; Shiki çoklu örnekte uyarır). Çıktıyı `DocsCodeToken[]`'e çevirir; satır sonu da bir token'dır, içerikler toplanınca kod çıkar |
| `DOCS_HIGHLIGHT_LOADER` | Varsayılanı `import('./docs-highlight')`: ayrı chunk (`docs-highlight`, 636.09 kB ham / 82.78 kB aktarım). Spec'ler sahte / bekleyen / başarısız yükleyici verir |
| `DocsHighlighterService.load()` | Sözü bir kez alır; sunucuda, indirme hatasında ve yükleyici fırlatınca `null` |
| `CodeBlockComponent` | `ngOnChanges`'te `load().then(...)` → `signal`. `effect()` / `afterNextRender` / `rxjs-interop` yok. Girdi değiştiyse geç gelen sonuç atılır; `highlight` fırlatırsa düz metin kalır |

Çıktı `@for` ile `<span [style.color]>` olarak basılır: `innerHTML` ve `codeToHtml` yok (SKILL §4). Şablondaki `<pre>` tek satırdır: Angular `<pre>` içinde boşluğu korur, araya girilen her boşluk koda eklenir (Prettier `<pre>` içine dokunmaz).

CDK: `LiveAnnouncer` (kopya sonucu), `Directionality` (ok tuşu yönü).

## 3. Token'lar

Shiki renk taşımaz: tema yalnız `var(--docs-code-<ad>)` üretir. Değişkenler `code-block.component.css` `:host`'unda (global `styles.css`'te DEĞİL: orada initial CSS'i 0.85 kB büyütüyordu) mevcut `--arn-*` token'larına bağlıdır (nötr palet, yeni renk değeri yok). `light-dark()` kullanım yerinde çözüldüğü için `.dark` / `.light` / sistem tercihi anında yansır.

| Değişken | Değer |
|---|---|
| `--docs-code-background` | `--arn-card` (`--arn-muted` DEĞİL: yorum rengi onun üstünde 4.5:1'in altında kalır) |
| `--docs-code-foreground`, `-token-keyword`, `-token-function`, `-token-link`, `-token-inserted` / `-deleted` / `-changed` | `--arn-foreground` |
| `-token-constant`, `-token-parameter` | `light-dark(--arn-neutral-700, --arn-neutral-300)` |
| `-token-string`, `-token-string-expression` | `light-dark(--arn-neutral-600, --arn-neutral-400)` |
| `-token-punctuation`, `-token-comment` | `--arn-muted-foreground` |

Liste Shiki'nin `createCssVariablesTheme` kaynağındaki adların tamamıdır (`ansi-*` hariç). Renkli palet eklemek: yalnız bu değerler değişir, bileşen ve Shiki kodu değişmez (ROADMAP Faz 3, karar günlüğü sapması gerekir).

## 4. Override rehberi

Yok (uygulama).

## 5. Davranış ve a11y

| Konu | Davranış |
|---|---|
| Demo | `<ng-content>`; örnek bileşen gerçekten çalışır |
| Kodu göster | Disclosure düğmesi: `aria-expanded`, `aria-controls` (bölge hep DOM'da, `hidden`). Metin "Show code" / "Hide code" |
| Sekmeler | `role=tablist` (`aria-label="Example code"`), `tab` (HTML, TS), tek `tabpanel` (`aria-labelledby` seçili sekme). `aria-selected`, `aria-controls`, roving `tabindex`. Ok tuşları (RTL'de ters, uçlarda sarar), Home / End; odaklanan sekme seçilir |
| Kod alanı | `<pre role="group" tabindex="0" aria-label="HTML code">`: klavyeyle kaydırılır (axe `scrollable-region-focusable`). Kaydırma gerekmese de odaklanabilir (taşmayı ölçmek gözlemci gerektirirdi) |
| Kopyala | Gerçek `<button>`, seçili sekmenin kodu. Sonuç düğme metninde ("Copied" / "Copy failed") ve `LiveAnnouncer` ile. Pano yoksa da "Copy failed". Zamanlayıcı yok: durum sekme değişince veya blok kapanınca sıfırlanır |
| Pano | `DOCS_CLIPBOARD`: `DOCUMENT.defaultView?.navigator.clipboard`, `isPlatformBrowser`, try/catch; yoksa `null` |
| RTL | Kod `direction: ltr`; düzen mantıksal CSS |
| Dar ekran | Uzun satır yalnız `<pre>` içinde kayar (`overflow-x: auto`, host `min-inline-size: 0`) |
| Yüklenme | Önce düz metin, sonra aynı kutuda token'lar: boyut değişmez |

Seçili sekme yalnız renkle değil, kenarlık ve kalınlıkla da ayrılır. Düğme yüksekliği kabuktaki hedef ifadesidir (docs-site.md §4).

## 6. Form uyumu

Yok.

## 7. Kısıtlar ve kararlar

- **Sekme klavyesi elle yazıldı** (`event.key`). CDK `ListKeyManager` kullanımdan kalkmış `keyCode`'u okur; spec onu `no-deprecated` ihlali olmadan üretemez. SKILL §8'deki CDK tercihinden bilinçli sapma (§16).
- **Tek `tabpanel`:** iki sekme aynı paneli denetler; panel adı seçili sekmeden gelir.
- **Bundle (prod, ölçüldü):** blok hiçbir sayfada yokken initial 248.16 kB, dosya adları öncekiyle aynı; örnek ve Shiki dizgeleri `dist/docs`'ta yok. Tembel bir sayfa kullanınca (Overview'da geçici önizlemeyle ölçüldü) initial 252.07 kB (+3.91 kB ham, +2.0 kB aktarım), `docs-highlight` ayrı tembel chunk (636.09 kB ham / 82.78 kB aktarım). Initial'daki artış Shiki değil: esbuild'in ana paketle ortak kullanılan CDK parçalarını ve yardımcılarını ortak chunk'lara ayırması; bütçe uyarısı yok.
- Shiki sürüm yükseltmesinde tema değişken adları değişebilir; `highlighter.service.spec.ts` gerçek Shiki'nin kullandığı her rengin kod bloğunda tanımlı olduğunu `code-block.component.spec.ts` sınar.
- Örnek dosya adı kalıbı: `<ad>.example.ts` / `.html`, selector `docs-<ad>-example`. Gösterilen TS `templateUrl` ile HTML'e işaret eder; kopyalayan iki dosyayı da alır.
- Reddedilenler: elle yazılmış string, `raw-loader`, `angular.json` `loader` seçeneği, Shiki çift tema, `codeToHtml` + `innerHTML`, oniguruma wasm, precompiled diller.

## 8. Testler

Docs Karma hedefi esbuild ile koşar (`builderMode: application`). Fixture: `example/testing/basic.example.{ts,html}` ve `example-host.ts` (yalnız spec'ler import eder). `testing/dom.ts`'e `nextTask()` eklendi (kuyruktaki söz geri çağrılarından sonra çözülür; süreye bağlı değil).

| Spec | Kapsam |
|---|---|
| `code/highlighter.service.spec.ts` | Tek yükleme, istenene kadar yüklememe, indirme hatası / fırlatan yükleyici / sunucu → `null`; gerçek Shiki ile üç dil: metin değişmez, birden çok stil, her renk bir `var(--docs-code-*)`; tek highlighter |
| `code/code-block.component.spec.ts` | Yüklenene kadar düz metin; token'lara geçişte metin ve boyut aynı (±1px); renk değişkeni ve italik / kalın sınıfları; yükleme hatası ve fırlatan highlight → düz metin; geç gelen sonuç atılır; odaklanabilir ve adlı; 320px'te sayfa taşmaz; RTL'de `ltr`; kod rozeti stili uygulanmaz; gerçek Shiki'nin kullandığı her değişken tanımlı; axe |
| `example/clipboard.spec.ts` | Tarayıcıda `navigator.clipboard`, sunucuda `null` |
| `example/example.component.spec.ts` | Demo çalışır; disclosure; gösterilen kod fixture dosyalarının metni; sekme rolleri, ilişkiler, roving tabindex, ok / Home / End, RTL'de ters; kopyalama başarı / ret / pano yok (elle yazılmış sahte pano ve duyurucu); 320px; hedef boyutu (compact); axe: light / dark / RTL / compact × kod gizli, renklendirilmiş HTML ve TS |

Boşluklar: gerçek pano izni, gerçek ekran okuyucu duyurusu ve tarayıcıda görsel görünüm otomatik sınanmadı.

## 9. Bağlantılar

- Kod: `projects/docs/src/app/example/`, `projects/docs/src/app/code/`, `projects/docs/src/text-imports.d.ts`, `angular.json` (docs test), `projects/docs/tsconfig*.json`
- İlgili: [docs-site.md](docs-site.md), [tokens.md](tokens.md)
