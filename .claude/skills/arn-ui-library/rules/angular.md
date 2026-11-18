# Angular kodlama kuralları (eski §4)

- `input()`, `output()`, `model()`, `computed()`, `signal()` kullan. `@Input()/@Output()` decorator'ı YOK.
- `ChangeDetectionStrategy.OnPush` her bileşende zorunlu. Zoneless ile çalışmalı (zone.js'e bağımlı kod yazma).
- `inject()` kullan, constructor injection yok.
- Host binding/listener: `host: { ... }` metadata'sı. `@HostBinding/@HostListener` YOK.
- Şablonda yeni control flow: `@if`, `@for`, `@switch`. `*ngIf/*ngFor` YOK.
- `ViewEncapsulation`: bileşen stilleri CSS değişkenlerine dayanır. `::ng-deep` YASAK. Kullanıcının stil geçersiz kılması token'larla yapılabilmeli.
- `any` YASAK. Strict TypeScript. Public API'deki her tip export edilir.
- Doğrudan `window`, `document`, `localStorage` kullanma. `DOCUMENT` ve `isPlatformBrowser(inject(PLATFORM_ID))` kullan (SSR güvenliği). `afterNextRender` KULLANILMAZ (19'da developer preview).
- `innerHTML` ile kullanıcı verisi basma. Gerekirse sanitization açıkça yapılır.
- Her `subscribe` temizlenir (`takeUntilDestroyed`) veya hiç kullanılmaz (signal tercih edilir).
- Kaynak kodda JSDoc, yorum, test adı ve konsol mesajları İngilizce; `.claude/` ve `ROADMAP.md` Türkçe.
