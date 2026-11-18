# Doküman sayfası standardı (PrimeNG tarzı) (eski §13)

Doküman sitesi aynı workspace'te ayrı bir Angular uygulamasıdır ve kütüphaneyi gerçek bir kullanıcı gibi tüketir (böylece her örnek aynı zamanda gerçek kullanım testidir). Yeni bileşen, doküman sayfası olmadan merge edilmez.

**Her bileşen sayfasının bölümleri (bu sırayla)**
1. Kısa açıklama
2. **Import** (kopyalanabilir kod)
3. **Basic** (en basit kullanım). İstisna: varyantı olan bileşende (button) ayrı Basic bölümü yoktur, **Variants** bölümünün ilk örneği onun yerine geçer
4. **ngModel ile kullanım** (form elemanıysa)
5. **Reactive Forms ile kullanım** (form elemanıysa)
6. **Disabled**
7. **Invalid / Validation**
8. **Sizes** (xs-xl)
9. **Label, Icon varken / yokken** ve bileşene özgü tüm varyantlar
10. **Density** (gerekliyse)
11. Bileşene özgü örnekler (olay yönetimi, template ile özelleştirme...)
12. **Accessibility** (klavye tuşları tablosu zorunlu, aria nitelikleri)
13. **API tabloları:** Inputs, Outputs, Templates/Slots, Methods (olmayanlar için "no outputs and no public methods" gibi tek cümle)
14. **Styling:** bu bileşenin tüm CSS token'ları (isim, varsayılan, açıklama); çoksa gruplu tablolar (ör. Size, Color)

Import başta; Accessibility, API, Styling sonda ve bu sırada sabittir. Arada yalnız bileşene özgü bölümler değişir. Örnek: Button sayfası Import, Variants, Disabled, Sizes, Icons, Icon only and round, As a link, Badge, Ripple, Accessibility, API, Styling ([karar](../decisions/2026-11.md)).

**Her örneğin biçimi (örnek kartı)**
- Canlı çalışan demo kartın ortasında. Altta solda PREVIEW etiketi; sağda HTML ve TS seçenekleri (örneğin CSS dosyası varsa üçüncü seçenek CSS), kopyala düğmesi ve kod açıkken kapat düğmesi.
- Bir seçenek kartın altında satır numaralı kod panelini açar. Kopyala seçili kodu, kod kapalıyken HTML'i kopyalar. Satır numaraları kopyaya girmez.
- Gösterilen kod derlenen dosyanın kendisidir: TS sekmesi gerçek `.ts` dosyası (`templateUrl`, varsa `styleUrl`), sentetik kod yok.
- Örnek kodu kopyalanıp yapıştırıldığında çalışmalı (import'lar dahil tam kod).
- API tabloları kod/yorumdan türetilir veya elle yazılıyorsa bileşen değişince aynı PR'da güncellenir. Eski doküman YASAK.
- Yalnızca gerçek, anlamlı örnekler. Dolgu örneği yok.
