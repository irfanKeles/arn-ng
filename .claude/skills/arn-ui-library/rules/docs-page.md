# Doküman sayfası standardı (PrimeNG tarzı) (eski §13)

Doküman sitesi aynı workspace'te ayrı bir Angular uygulamasıdır ve kütüphaneyi gerçek bir kullanıcı gibi tüketir (böylece her örnek aynı zamanda gerçek kullanım testidir). Yeni bileşen, doküman sayfası olmadan merge edilmez.

**Site yapısı**
- Solda sidebar: bileşenler kategori başlıkları altında gruplanır (Form, Button, Overlay, Data...). Sidebar'ın en üstünde arama (sayfa ve bölüm başlıkları).
- Sağda sayfa içi başlık gezintisi ("bu sayfada").
- Üstte tema (light/dark), yön (LTR/RTL), yoğunluk (comfortable/compact) ve dil değiştiriciler. Bunlar tüm örnekleri anlık etkiler.
- Giriş bölümü: Kurulum, Yapılandırma (`provideArn`), Tema ve token'lar, Yoğunluk, RTL ve i18n, Erişilebilirlik. Altı başlık dört sayfada karşılanır: Yoğunluk Theming'de, RTL ve i18n Configuration'da bölümdür (§16).

**Her bileşen sayfasının bölümleri (bu sırayla)**
1. Kısa açıklama
2. **Import** (kopyalanabilir kod)
3. **Basic** (en basit kullanım)
4. **ngModel ile kullanım** (form elemanıysa)
5. **Reactive Forms ile kullanım** (form elemanıysa)
6. **Disabled**
7. **Invalid / Validation**
8. **Sizes** (xs-xl)
9. **Label, Icon varken / yokken** ve bileşene özgü tüm varyantlar
10. **Density** (gerekliyse)
11. Bileşene özgü örnekler (olay yönetimi, template ile özelleştirme...)
12. **Accessibility** (klavye tuşları tablosu, aria nitelikleri)
13. **API tabloları:** Inputs, Outputs, Templates/Slots, Methods
14. **Styling:** bu bileşenin tüm CSS token'ları (isim, varsayılan, açıklama)

**Her örneğin biçimi**
- Canlı çalışan demo, altında "Kodu göster" ile HTML + TS sekmeleri, kopyala düğmesi.
- Örnek kodu kopyalanıp yapıştırıldığında çalışmalı (import'lar dahil tam kod).
- API tabloları kod/yorumdan türetilir veya elle yazılıyorsa bileşen değişince aynı PR'da güncellenir. Eski doküman YASAK.
- Yalnızca gerçek, anlamlı örnekler. Dolgu örneği yok.
