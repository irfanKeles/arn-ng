import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { DOCS_SETTINGS_KEY } from '../../settings/docs-settings.service';
import { DOCS_STORAGE } from '../../settings/docs-storage';
import { query, queryAs, resetDocument } from '../../testing/dom';
import { createFakeStorage, type FakeStorage } from '../../testing/fake-storage';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  const root = document.documentElement;
  let fixture: ComponentFixture<SettingsComponent>;
  let element: HTMLElement;
  let config: ArnConfigService;
  let fake: FakeStorage;

  function select(name: string): HTMLSelectElement {
    return queryAs(element, `#docs-setting-${name}`, HTMLSelectElement);
  }

  async function choose(name: string, value: string): Promise<void> {
    const control = select(name);

    control.value = value;
    control.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    fake = createFakeStorage();
    TestBed.configureTestingModule({
      providers: [
        provideArn({ applyToDocument: true }),
        { provide: DOCS_STORAGE, useValue: fake.storage },
      ],
    });

    config = TestBed.inject(ArnConfigService);
    fixture = TestBed.createComponent(SettingsComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    resetDocument(document);
  });

  it('renders four native selects with visible labels', () => {
    const labels = Array.from(element.querySelectorAll('label'));

    expect(labels.map((label) => label.textContent)).toEqual([
      'Theme',
      'Direction',
      'Density',
      'Language',
    ]);

    for (const label of labels) {
      expect(query(element, `#${label.htmlFor}`).tagName).toBe('SELECT');
    }
  });

  it('shows the values in effect', () => {
    expect(select('color-scheme').value).toBe('system');
    expect(select('direction').value).toBe('ltr');
    expect(select('density').value).toBe('comfortable');
    expect(select('locale').value).toBe('en-US');
  });

  it('follows a value changed through the service', async () => {
    config.setDensity('compact');
    await fixture.whenStable();

    expect(select('density').value).toBe('compact');
  });

  it('switches the color scheme and writes the class to <html>', async () => {
    await choose('color-scheme', 'dark');

    expect(config.colorScheme()).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.classList.contains('light')).toBe(false);

    await choose('color-scheme', 'light');

    expect(config.colorScheme()).toBe('light');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.classList.contains('light')).toBe(true);
  });

  it('removes both classes for the system color scheme', async () => {
    await choose('color-scheme', 'dark');
    await choose('color-scheme', 'system');

    expect(config.colorScheme()).toBe('system');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.classList.contains('light')).toBe(false);
  });

  it('switches the direction and writes dir to <html>', async () => {
    await choose('direction', 'rtl');

    expect(config.direction()).toBe('rtl');
    expect(root.getAttribute('dir')).toBe('rtl');

    await choose('direction', 'ltr');

    expect(config.direction()).toBe('ltr');
    expect(root.getAttribute('dir')).toBe('ltr');
  });

  it('switches the density and writes data-density to <html>', async () => {
    await choose('density', 'compact');

    expect(config.density()).toBe('compact');
    expect(root.getAttribute('data-density')).toBe('compact');
    expect(getComputedStyle(root).getPropertyValue('--arn-density').trim()).toBe('0.875');

    await choose('density', 'comfortable');

    expect(root.getAttribute('data-density')).toBe('comfortable');
  });

  it("switches the library's locale and texts, not the site language", async () => {
    const lang = root.getAttribute('lang');

    await choose('locale', 'tr-TR');

    expect(config.locale()).toBe('tr-TR');
    expect(config.messages().common.ok).toBe('Tamam');
    expect(config.messages().datePicker.monthNames[0]).toBe('Ocak');
    expect(root.getAttribute('lang')).toBe(lang);
    expect(query(element, 'label').textContent).toBe('Theme');
  });

  it('restores the English texts when switching back', async () => {
    await choose('locale', 'tr-TR');
    await choose('locale', 'en-US');

    expect(config.locale()).toBe('en-US');
    expect(config.messages().common.ok).toBe('OK');
    expect(config.messages().common.cancel).toBe('Cancel');
    expect(config.messages().dialog.closeLabel).toBe('Close');
    expect(config.messages().toast.errorTitle).toBe('Error');
    expect(config.messages().datePicker.monthNames[0]).toBe('January');
  });

  it('stores every choice', async () => {
    await choose('color-scheme', 'dark');
    await choose('direction', 'rtl');
    await choose('density', 'compact');
    await choose('locale', 'tr-TR');

    expect(JSON.parse(fake.data.get(DOCS_SETTINGS_KEY) ?? '')).toEqual({
      colorScheme: 'dark',
      direction: 'rtl',
      density: 'compact',
      locale: 'tr-TR',
    });
  });

  it('ignores a value that is not offered', async () => {
    const control = select('density');
    const option = document.createElement('option');

    option.value = 'cozy';
    control.append(option);
    await choose('density', 'cozy');

    expect(config.density()).toBe('comfortable');
    expect(fake.data.has(DOCS_SETTINGS_KEY)).toBe(false);
  });

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(element);

    await choose('color-scheme', 'dark');
    await choose('density', 'compact');
    await choose('direction', 'rtl');

    await expectNoA11yViolations(element);
  });
});
