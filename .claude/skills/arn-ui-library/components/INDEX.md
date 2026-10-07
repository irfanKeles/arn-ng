# Bileşen referans dosyaları — İndeks

Her bileşen, directive, servis veya ortak yapının "nasıl yapıldı ve neden" dosyası burada listelenir. Kurallar için `../SKILL.md` bölüm 18'e bak; yeni dosyayı `_TEMPLATE.md`'den kopyala ve aynı değişiklikte bu tabloya ekle.

| Bileşen | Tür | Entry point | Dosya |
|---|---|---|---|
| tokens (tema, global token'lar) | ortak yapı | `@arn-ng/ui/theme.css` | [tokens.md](tokens.md) |
| tokens-sizes (boyut xs-xl, density) | ortak yapı | `@arn-ng/ui/theme.css` | [tokens-sizes.md](tokens-sizes.md) |
| config (`provideArn`, `[arnConfig]`, `ArnConfigService`, `injectArnConfig`) | ortak yapı | `@arn-ng/ui/core` | [config.md](config.md) |
| config-messages (mesaj şeması, Intl gün/ay adları) | ortak yapı | `@arn-ng/ui/core` | [config-messages.md](config-messages.md) |

Tür: `element`, `directive`, `element + directive`, `servis`, `ortak yapı`.

## Notlar

- `@arn-ng/ui/core` şu an yalnızca ayar sistemini içerir (overlay, ripple, i18n paketleri sonraki adımlar). `@arn-ng/ui/button` hâlâ boş pilot (`export {};`). Tema bir JS entry point değil, paket kökündeki CSS dosyasıdır.
- Bu dosya en fazla 150 satır. Aşarsa kategori indekslerine (Form, Button, Overlay, Data...) bölünür ve buradan bağlanır.
