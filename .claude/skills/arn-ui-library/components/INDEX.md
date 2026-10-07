# Bileşen referans dosyaları — İndeks

Her bileşen, directive, servis veya ortak yapının "nasıl yapıldı ve neden" dosyası burada listelenir. Kurallar için `../SKILL.md` bölüm 18'e bak; yeni dosyayı `_TEMPLATE.md`'den kopyala ve aynı değişiklikte bu tabloya ekle.

| Bileşen | Tür | Entry point | Dosya |
|---|---|---|---|
| tokens (tema, global token'lar) | ortak yapı | `@arn-ng/ui/theme.css` | [tokens.md](tokens.md) |
| tokens-sizes (boyut xs-xl, density) | ortak yapı | `@arn-ng/ui/theme.css` | [tokens-sizes.md](tokens-sizes.md) |

Tür: `element`, `directive`, `element + directive`, `servis`, `ortak yapı`.

## Notlar

- `@arn-ng/ui/core` ve `@arn-ng/ui/button` entry point'leri şu an boş pilot (`export {};`). İçerik geldiğinde referans dosyaları yazılıp tabloya eklenecek. Tema bir JS entry point değil, paket kökündeki CSS dosyasıdır.
- Bu dosya en fazla 150 satır. Aşarsa kategori indekslerine (Form, Button, Overlay, Data...) bölünür ve buradan bağlanır.
