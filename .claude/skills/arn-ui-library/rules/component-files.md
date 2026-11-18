# Bileşen referans dosyaları (`components/`) (eski §18)

Her bileşen, directive, servis veya ortak yapı için `.claude/skills/arn-ui-library/components/<ad>.md` yazılır. Amaç: sonraki oturumlarda koda bakmadan bileşenin nasıl kurulduğunu anlamak. Kullanıcıya dönük doküman sayfasından (bölüm 13) farklıdır: orası "nasıl kullanılır", burası "nasıl yapıldı ve neden".

- Bileşen oluşturulurken veya değiştirilirken referans dosyası AYNI değişiklikte yazılır/güncellenir. Güncel değilse bileşen BİTMİŞ sayılmaz.
- Bir bileşeni değiştirmeden önce referans dosyasını oku.
- Tüm referans dosyalarının tek satırlık listesi: [components/INDEX.md](../components/INDEX.md). Bu dosya (SKILL.md) sadece INDEX'e bağlanır, bileşen ayrıntısı buraya yazılmaz.
- Yeni dosya [components/_TEMPLATE.md](../components/_TEMPLATE.md) kopyalanarak başlar.

**Şablon bölümleri (bu sırayla)**
1. **Özet:** selector, entry point, element/directive, sınıf adları, dosya yolları
2. **Mimari ve CDK:** neyden extend ediyor, hangi CDK parçalarını kullandı, neyi neden genişletti, `hostDirectives`
3. **Token'lar:** tablo (ad, host'taki hesap, bağlı anlamlı token)
4. **Override rehberi:** global, container, tek örnek
5. **Davranış ve a11y:** klavye, aria
6. **Form uyumu**
7. **Kısıtlar ve kararlar**
8. **Testler**
9. **Bağlantılar:** kod yolları, doküman sayfası
