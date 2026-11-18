# Karar günlüğü (eski §16)

Yeni bir karar alındığında buraya tarihle eklenir. Bu bölüm bölüm 1-15'in önüne geçmez, onları günceller.

Kayıtlar aylık dosyalardadır: [2026-10.md](2026-10.md), [2026-11.md](2026-11.md). Yeni karar ilgili ayın dosyasının (`YYYY-MM.md`) sonuna tarihli, ayrı bir madde olarak eklenir; eski maddeler düzeltilmez, geçersiz kalan kısım yeni maddeyle güncellenir.

**Yeni karar nasıl eklenir:** ilgili ayın dosyasına tek satır, `- YYYY-MM: Konu (kaynak; ayrıntı dosyası). (1) … (2) …` biçiminde. Etkilediği eski kararı adıyla anar ve ne yaptığını söyler ("2026-10 "Overlay altyapısı" maddesini günceller" / "… geçersiz kılar"). Kural metni (`SKILL.md`, `rules/`, `components/`) aynı değişiklikte güncellenir.

## Eski bölüm numaraları

Eski kayıtlarda ve kodda geçen `§N` / "bölüm N" atıfları, bölünmeden önceki tek SKILL.md'nin bölümleridir. Yeni dosyaların başlıkları eski numarayı taşır ("eski §4").

| Eski | Konu | Yeni yer |
|---|---|---|
| §1 | Değişmez kararlar | [SKILL.md](../SKILL.md) |
| §2 | Bileşen mimarisi | [rules/architecture.md](../rules/architecture.md) |
| §3 | Paket ve import yapısı | [rules/architecture.md](../rules/architecture.md) |
| §4 | Angular kodlama kuralları | [rules/angular.md](../rules/angular.md) |
| §5 | Token, tema, stil | [rules/styling.md](../rules/styling.md) |
| §6 | Merkezi ayar | [rules/config-i18n-overlay.md](../rules/config-i18n-overlay.md) |
| §7 | Form uyumu | [rules/forms-a11y.md](../rules/forms-a11y.md) |
| §8 | Erişilebilirlik | [rules/forms-a11y.md](../rules/forms-a11y.md) |
| §9 | i18n ve RTL | [rules/config-i18n-overlay.md](../rules/config-i18n-overlay.md) |
| §10 | Overlay | [rules/config-i18n-overlay.md](../rules/config-i18n-overlay.md) |
| §11 | İsimlendirme tutarlılığı | [rules/architecture.md](../rules/architecture.md) |
| §12 | "Bitti" tanımı | [SKILL.md](../SKILL.md) |
| §13 | Doküman sayfası standardı | [rules/docs-page.md](../rules/docs-page.md); site yapısı [arn-docs-site/SKILL.md](../../arn-docs-site/SKILL.md) |
| §14 | Yapılmaması gerekenler | [SKILL.md](../SKILL.md) |
| §15 | Sürümleme ve kalite | [rules/quality.md](../rules/quality.md) |
| §16 | Karar günlüğü | bu klasör |
| §17 | Henüz açık kararlar | [SKILL.md](../SKILL.md) |
| §18 | Bileşen referans dosyaları | [rules/component-files.md](../rules/component-files.md); satır limitleri [SKILL.md](../SKILL.md) |
