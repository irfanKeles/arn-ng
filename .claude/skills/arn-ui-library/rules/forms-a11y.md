# Form uyumu ve erişilebilirlik

## Form uyumu (eski §7)

- Form elemanları yalnız `FormValueControl` / `FormCheckboxControl` (`@angular/forms`) uygular; `ControlValueAccessor` UYGULANMAZ (ikisi birden yasak: runtime'da CVA önce seçilir). Test matrisi: `ngModel`, `formControl`, `formControlName`, `[formField]` dördü de test edilir. Karar: [decisions/2026-11.md](../decisions/2026-11.md) "Signal Forms stratejisi".
- Zorunlu durumlar: `disabled` (formdan ve input'tan), `invalid`, `touched`, `dirty`, `readonly`, `required`.
- Hata görünümü bileşenin `invalid` / `touched` / `dirty` input'larından bileşenin kendisinde hesaplanır. `ng-*` sınıflarına (`ng-invalid` vb.) bağımlı olunmaz (Signal Forms onları varsayılan olarak uygulamaz); `errors` listesi yapısal okunmaz (`[formField]` ve CVA köprüsü yolunda tipi farklı).
- `forms.showErrorsOn` (`ArnConfig`): `touched` (varsayılan) ve `dirty` geçerli. `submitted` Signal Forms'ta karşılıksız (`FieldState`'te `submitted` yok); kullanılmaz, kaldırılması input'tan önce ayrı kod PR'ı (ROADMAP Faz 4).
- Bilinen boşluklar (Angular tarafı; input'ta testle kilitlenir, giderildiğinde test kırılır): `ngModel` yolunda `required` bağlanmaz; reactive yolda `readonly`, `name`, `min`, `max` bağlanmaz; `touch` blur'da emit edilir; `touched` 22.0'dan beri `touched` input + `touch` output.
- Minimum `@angular/forms` / `@angular/core`: `^22.2.5` (öncesinde `FormValueControl` + reactive `updateOn: 'blur'` / `'submit'` bozuk).

## Erişilebilirlik (a11y) — her bileşende zorunlu (eski §8)

- Tam klavye kullanımı: Tab/Shift+Tab, ok tuşları, Enter, Space, Escape, Home/End (bileşen türüne göre WAI-ARIA Authoring Practices kalıbına uy).
- Doğru `role` ve `aria-*` nitelikleri (`aria-expanded`, `aria-invalid`, `aria-describedby`, `aria-disabled`...).
- Focus yönetimi: overlay açılınca focus içeri, kapanınca tetikleyiciye döner. Focus trap (dialog). Görünür focus halkası.
- Sadece renkle bilgi verme. Kontrast yeterli.
- Ekran okuyucu için gizli metin/label mekanizması.
- A11y bir "sonra yaparız" değildir. A11y eksikse bileşen BİTMİŞ sayılmaz.
- CDK'nın a11y araçları (`FocusTrap`, `FocusMonitor`, `ListKeyManager`, `LiveAnnouncer`) tercih edilir, elle yazılmaz.
