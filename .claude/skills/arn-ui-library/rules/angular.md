# Angular kodlama kuralları (eski §4)

- `input()`, `output()`, `model()`, `computed()`, `signal()` kullan. `@Input()/@Output()` decorator'ı YOK.
- `ChangeDetectionStrategy.OnPush` her bileşende zorunlu. Zoneless ile çalışmalı (zone.js'e bağımlı kod yazma).
- `inject()` kullan, constructor injection yok.
- Host binding/listener: `host: { ... }` metadata'sı. `@HostBinding/@HostListener` YOK.
- Şablonda yeni control flow: `@if`, `@for`, `@switch`. `*ngIf/*ngFor` YOK.
- `ViewEncapsulation`: bileşen stilleri CSS değişkenlerine dayanır. `::ng-deep` YASAK. Kullanıcının stil geçersiz kılması token'larla yapılabilmeli.
- `any` YASAK. Strict TypeScript. Public API'deki her tip export edilir.
- Doğrudan `window`, `document`, `localStorage` kullanma. `DOCUMENT` ve `isPlatformBrowser(inject(PLATFORM_ID))` kullan (SSR güvenliği). `afterNextRender` Angular 20'den beri `@publicApi`'dir, kararlılık kuralına göre serbesttir; mevcut kod tarayıcıya özgü işi `isPlatformBrowser` ile korur.
- Kararlılık: minimum sürümde (Angular 22) `@publicApi` olan, `@experimental` / `@developerPreview` olmayan API serbesttir; kullanmadan önce `node_modules/@angular/*` `.d.ts` etiketi kontrol edilir. Mevcut örüntüler kalır: servisin senkron `update`'i, `ngOnChanges` ile yayma, `DestroyRef` ile elle abonelik. `effect()` kullanılırsa gerekçesi bileşenin referans dosyasına yazılır.
- `innerHTML` ile kullanıcı verisi basma. Gerekirse sanitization açıkça yapılır.
- Her `subscribe` temizlenir (`takeUntilDestroyed`) veya hiç kullanılmaz (signal tercih edilir).
- Dil: `projects/` altındaki kaynak kod (JSDoc, yorum, test adı, konsol mesajı) ve repo yapılandırma dosyalarının yorumları (`eslint.config.mjs`, `.github/workflows/ci.yml`, `.github/dependabot.yml`, test setup dosyaları) İngilizce; `.claude/`, `ROADMAP.md` ve `CLAUDE.md` Türkçe.
