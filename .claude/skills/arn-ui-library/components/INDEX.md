# Bileşen referans dosyaları — İndeks

Her bileşen, directive, servis veya ortak yapının "nasıl yapıldı ve neden" dosyası burada listelenir. Kurallar için [../rules/component-files.md](../rules/component-files.md)'ye bak; yeni dosyayı `_TEMPLATE.md`'den kopyala ve aynı değişiklikte bu tabloya ekle. Doküman sitesinin (`projects/docs`) dosyaları ayrı skill'dedir: [arn-docs-site/components/INDEX.md](../../arn-docs-site/components/INDEX.md).

| Bileşen | Tür | Entry point | Dosya |
|---|---|---|---|
| tokens (tema, global token'lar) | ortak yapı | `@arn-ng/ui/theme.css` | [tokens.md](tokens.md) |
| tokens-sizes (boyut xs-xl, density) | ortak yapı | `@arn-ng/ui/theme.css` | [tokens-sizes.md](tokens-sizes.md) |
| config (`provideArn`, `[arnConfig]`, `ArnConfigService`, `injectArnConfig`) | ortak yapı | `@arn-ng/ui/core` | [config.md](config.md) |
| config-messages (mesaj şeması, Intl gün/ay adları, `locale` zinciri) | ortak yapı | `@arn-ng/ui/core` | [config-messages.md](config-messages.md) |
| config-direction (yön, RTL, `Directionality`, `.arn-rtl-mirror`) | ortak yapı | `@arn-ng/ui/core`, `@arn-ng/ui/theme.css` | [config-direction.md](config-direction.md) |
| locales (çeviri paketleri, `ARN_MESSAGES_TR`, yeni dil ekleme rehberi) | ortak yapı | `@arn-ng/ui/locales/<dil>` | [locales.md](locales.md) |
| overlay (`ArnOverlayService`, `ArnOverlayRef`, katmanlar, preset'ler, ayar mirası, `data-state` sözleşmesi) | servis + ortak yapı | `@arn-ng/ui/core`, `@arn-ng/ui/theme.css` | [overlay.md](overlay.md) |
| ripple (`arnRipple`, `ArnRippleDirective`, ripple token'ları) | directive | `@arn-ng/ui/ripple`, `@arn-ng/ui/theme.css` | [ripple.md](ripple.md) |
| button (`button[arnButton]`, `a[arnButton]`, `ArnButton`, `--arn-button-*`, rozet yuvası) | directive | `@arn-ng/ui/button` | [button.md](button.md) |

Tür: `element`, `directive`, `element + directive`, `servis`, `ortak yapı`.

## Notlar

- `@arn-ng/ui/core` ayar sistemini ve overlay altyapısını içerir. Ripple core'da değil, kendi entry point'indedir (`@arn-ng/ui/ripple`) ve core'a bağımlıdır. Dil paketleri core'da değil, dil başına ayrı entry point'tedir (`@arn-ng/ui/locales/tr`). İlk bileşen `@arn-ng/ui/button` (core'a ve ripple'a bağımlı). Tema bir JS entry point değil, paket kökündeki CSS dosyasıdır.
- Bu dosya en fazla 150 satır. Aşarsa kategori indekslerine (Form, Button, Overlay, Data...) bölünür ve buradan bağlanır.
