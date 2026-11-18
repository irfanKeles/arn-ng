# Form uyumu ve erişilebilirlik

## Form uyumu (eski §7)

- Form elemanları `ControlValueAccessor` ile çalışır: `ngModel`, `formControl`, `formControlName` üçü de test edilir.
- Zorunlu durumlar: `disabled` (formdan ve input'tan), `invalid`, `touched`, `dirty`, `readonly`, `required`.
- Hata görünümü `ng-invalid` + `forms.showErrorsOn` (`touched` varsayılan, `dirty`, `submitted`; `ArnConfig`'ten) ile ve `invalid` input'u ile tetiklenebilir.
- `setDisabledState` doğru uygulanır.
- Signal forms'a bağımlılık YOK (19'da kararlı değil). Gelecekte eklenecekse ayrı karar.

## Erişilebilirlik (a11y) — her bileşende zorunlu (eski §8)

- Tam klavye kullanımı: Tab/Shift+Tab, ok tuşları, Enter, Space, Escape, Home/End (bileşen türüne göre WAI-ARIA Authoring Practices kalıbına uy).
- Doğru `role` ve `aria-*` nitelikleri (`aria-expanded`, `aria-invalid`, `aria-describedby`, `aria-disabled`...).
- Focus yönetimi: overlay açılınca focus içeri, kapanınca tetikleyiciye döner. Focus trap (dialog). Görünür focus halkası.
- Sadece renkle bilgi verme. Kontrast yeterli.
- Ekran okuyucu için gizli metin/label mekanizması.
- A11y bir "sonra yaparız" değildir. A11y eksikse bileşen BİTMİŞ sayılmaz.
- CDK'nın a11y araçları (`FocusTrap`, `FocusMonitor`, `ListKeyManager`, `LiveAnnouncer`) tercih edilir, elle yazılmaz.
