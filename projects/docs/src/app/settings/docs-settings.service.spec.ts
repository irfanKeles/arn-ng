import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { appConfig } from '../app.config';
import { resetDocument } from '../testing/dom';
import { createFakeStorage } from '../testing/fake-storage';
import { DOCS_SETTINGS_KEY, DocsSettingsService } from './docs-settings.service';
import { DOCS_STORAGE } from './docs-storage';

describe('DocsSettingsService', () => {
  const root = document.documentElement;

  function setup(storage: Storage | null): {
    settings: DocsSettingsService;
    config: ArnConfigService;
  } {
    TestBed.configureTestingModule({
      providers: [
        provideArn({ applyToDocument: true }),
        { provide: DOCS_STORAGE, useValue: storage },
      ],
    });

    return {
      settings: TestBed.inject(DocsSettingsService),
      config: TestBed.inject(ArnConfigService),
    };
  }

  function stored(value: unknown): Record<string, string> {
    return { [DOCS_SETTINGS_KEY]: JSON.stringify(value) };
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('writing', () => {
    it('keeps every choice under a single key', () => {
      const fake = createFakeStorage();
      const { settings } = setup(fake.storage);

      settings.setColorScheme('dark');
      settings.setDirection('rtl');
      settings.setDensity('compact');
      settings.setLocale('tr-TR');

      expect([...fake.data.keys()]).toEqual([DOCS_SETTINGS_KEY]);
      expect(JSON.parse(fake.data.get(DOCS_SETTINGS_KEY) ?? '')).toEqual({
        colorScheme: 'dark',
        direction: 'rtl',
        density: 'compact',
        locale: 'tr-TR',
      });
    });

    it('stores only what was chosen', () => {
      const fake = createFakeStorage();
      const { settings } = setup(fake.storage);

      settings.setDensity('compact');

      expect(JSON.parse(fake.data.get(DOCS_SETTINGS_KEY) ?? '')).toEqual({ density: 'compact' });
    });

    it('keeps the restored choices when another one is written', () => {
      const fake = createFakeStorage(stored({ colorScheme: 'dark' }));
      const { settings } = setup(fake.storage);

      settings.restore();
      settings.setDensity('compact');

      expect(JSON.parse(fake.data.get(DOCS_SETTINGS_KEY) ?? '')).toEqual({
        colorScheme: 'dark',
        density: 'compact',
      });
    });

    it('ignores a locale that is not offered', () => {
      const fake = createFakeStorage();
      const { settings, config } = setup(fake.storage);

      settings.setLocale('de-DE');

      expect(config.locale()).toBe('en-US');
      expect(fake.data.size).toBe(0);
    });
  });

  describe('restoring', () => {
    it('applies the stored choices to the config and to <html>', () => {
      const fake = createFakeStorage(
        stored({ colorScheme: 'dark', direction: 'rtl', density: 'compact', locale: 'tr-TR' }),
      );
      const { settings, config } = setup(fake.storage);

      settings.restore();

      expect(config.colorScheme()).toBe('dark');
      expect(config.direction()).toBe('rtl');
      expect(config.density()).toBe('compact');
      expect(config.locale()).toBe('tr-TR');
      expect(config.messages().common.cancel).toBe('Vazgeç');
      expect(root.classList.contains('dark')).toBe(true);
      expect(root.getAttribute('dir')).toBe('rtl');
      expect(root.getAttribute('data-density')).toBe('compact');
    });

    it('returns to English from a restored Turkish', () => {
      const { settings, config } = setup(createFakeStorage(stored({ locale: 'tr-TR' })).storage);

      settings.restore();
      settings.setLocale('en-US');

      expect(config.messages().common.cancel).toBe('Cancel');
      expect(config.messages().datePicker.dayNames[0]).toBe('Sunday');
    });

    it('follows the system color scheme when nothing is stored', () => {
      const fake = createFakeStorage();
      const { settings, config } = setup(fake.storage);

      settings.restore();

      expect(config.colorScheme()).toBe('system');
      expect(config.density()).toBe('comfortable');
      expect(config.locale()).toBe('en-US');
      expect(root.classList.contains('dark')).toBe(false);
      expect(root.classList.contains('light')).toBe(false);
      expect(root.hasAttribute('dir')).toBe(false);
      expect(fake.data.size).toBe(0);
    });

    it('drops invalid values and keeps the valid ones', () => {
      const fake = createFakeStorage(
        stored({
          colorScheme: 'neon',
          direction: 'auto',
          density: 'compact',
          locale: 'de-DE',
          size: 'xl',
        }),
      );
      const { settings, config } = setup(fake.storage);

      settings.restore();

      expect(config.colorScheme()).toBe('system');
      expect(root.hasAttribute('dir')).toBe(false);
      expect(config.density()).toBe('compact');
      expect(config.locale()).toBe('en-US');
      expect(config.size()).toBe('md');
    });

    it('ignores values of the wrong type', () => {
      const { settings, config } = setup(
        createFakeStorage(stored({ colorScheme: 1, density: ['compact'], locale: null })).storage,
      );

      settings.restore();

      expect(config.colorScheme()).toBe('system');
      expect(config.density()).toBe('comfortable');
      expect(config.locale()).toBe('en-US');
    });

    for (const raw of ['{not json', '"dark"', 'null', '[]', '42', '']) {
      it(`ignores the stored text ${JSON.stringify(raw)}`, () => {
        const { settings, config } = setup(createFakeStorage({ [DOCS_SETTINGS_KEY]: raw }).storage);

        settings.restore();

        expect(config.colorScheme()).toBe('system');
        expect(config.density()).toBe('comfortable');
      });
    }
  });

  describe('without a working storage', () => {
    it('keeps working when reading throws', () => {
      const fake = createFakeStorage(stored({ colorScheme: 'dark' }));
      fake.failReads = true;
      const { settings, config } = setup(fake.storage);

      settings.restore();

      expect(config.colorScheme()).toBe('system');

      settings.setColorScheme('light');

      expect(config.colorScheme()).toBe('light');
      expect(root.classList.contains('light')).toBe(true);
    });

    it('keeps working when writing throws', () => {
      const fake = createFakeStorage();
      fake.failWrites = true;
      const { settings, config } = setup(fake.storage);

      settings.setColorScheme('dark');
      settings.setDirection('rtl');
      settings.setDensity('compact');
      settings.setLocale('tr-TR');

      expect(config.colorScheme()).toBe('dark');
      expect(config.direction()).toBe('rtl');
      expect(config.density()).toBe('compact');
      expect(config.messages().common.ok).toBe('Tamam');
      expect(fake.data.size).toBe(0);
    });

    it('keeps working when there is no storage', () => {
      const { settings, config } = setup(null);

      settings.restore();
      settings.setDensity('compact');

      expect(config.density()).toBe('compact');
      expect(root.getAttribute('data-density')).toBe('compact');
    });
  });

  describe('DOCS_STORAGE', () => {
    it('is the localStorage of the document in the browser', () => {
      expect(TestBed.inject(DOCS_STORAGE)).toBe(localStorage);
    });

    it('is null on the server', () => {
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });

      expect(TestBed.inject(DOCS_STORAGE)).toBeNull();
    });
  });

  describe('application startup', () => {
    it('applies the stored choices before the first render', () => {
      const fake = createFakeStorage(stored({ colorScheme: 'dark', density: 'compact' }));

      TestBed.configureTestingModule({
        providers: [...appConfig.providers, { provide: DOCS_STORAGE, useValue: fake.storage }],
      });

      expect(TestBed.inject(ArnConfigService).colorScheme()).toBe('dark');
      expect(root.classList.contains('dark')).toBe(true);
      expect(root.getAttribute('data-density')).toBe('compact');
    });

    it('writes the defaults to <html> when nothing is stored', () => {
      TestBed.configureTestingModule({
        providers: [...appConfig.providers, { provide: DOCS_STORAGE, useValue: null }],
      });

      expect(TestBed.inject(ArnConfigService).colorScheme()).toBe('system');
      expect(root.classList.contains('dark')).toBe(false);
      expect(root.getAttribute('data-density')).toBe('comfortable');
    });
  });
});
