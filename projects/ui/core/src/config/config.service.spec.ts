import { Directionality } from '@angular/cdk/bidi';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { captureWarnings } from '../../../testing/console';
import { resetDocument } from '../../../testing/document';
import { ArnConfigService } from './config.service';
import type { ArnRootConfig } from './config.types';
import { provideArn } from './provide-arn';

describe('ArnConfigService', () => {
  const root = document.documentElement;

  function setup(config?: ArnRootConfig): ArnConfigService {
    if (config) {
      TestBed.configureTestingModule({ providers: [provideArn(config)] });
    }
    return TestBed.inject(ArnConfigService);
  }

  /** Everything the library may write on `<html>`. */
  function documentState(): {
    dark: boolean;
    light: boolean;
    density: string | null;
    dir: string | null;
  } {
    return {
      dark: root.classList.contains('dark'),
      light: root.classList.contains('light'),
      density: root.getAttribute('data-density'),
      dir: root.getAttribute('dir'),
    };
  }

  const untouched = { dark: false, light: false, density: null, dir: null };

  // The specs below compare against a clean <html>, whatever ran before them
  beforeEach(() => {
    resetDocument(document);
  });

  afterEach(() => {
    resetDocument(document);
  });

  describe('values', () => {
    it('gives the library defaults without provideArn', () => {
      const config = setup();

      expect(config.size()).toBe('md');
      expect(config.density()).toBe('comfortable');
      expect(config.colorScheme()).toBe('system');
      // `auto` is resolved: the direction of the document
      expect(config.direction()).toBe('ltr');
      expect(config.ripple()).toBe(false);
      expect(config.locale()).toBe('en-US');
      expect(config.forms()).toEqual({ showErrorsOn: 'touched' });
      expect(config.messages().common.ok).toBe('OK');
    });

    it('an empty provideArn() does not change the defaults', () => {
      const config = setup({});

      expect(config.size()).toBe('md');
      expect(config.density()).toBe('comfortable');
    });

    it('a partial config changes only the given field', () => {
      const config = setup({ size: 'sm' });

      expect(config.size()).toBe('sm');
      expect(config.density()).toBe('comfortable');
      expect(config.ripple()).toBe(false);
    });

    it('messages in provideArn are deep-merged with the defaults', () => {
      const config = setup({ locale: 'tr-TR', messages: { common: { yes: 'Evet' } } });

      expect(config.messages().common.yes).toBe('Evet');
      expect(config.messages().common.no).toBe('No');
      expect(config.messages().datePicker.monthNames[0]).toBe('Ocak');
    });

    it('locale defaults to LOCALE_ID: day and month names follow it, other texts do not', () => {
      TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'tr-TR' }] });
      const config = setup();

      expect(config.locale()).toBe('tr-TR');
      expect(config.messages().datePicker.monthNames[0]).toBe('Ocak');
      expect(config.messages().common.yes).toBe('Yes');
    });

    it('locale in provideArn wins over LOCALE_ID', () => {
      TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'tr-TR' }] });
      const config = setup({ locale: 'de-DE' });

      expect(config.locale()).toBe('de-DE');
      expect(config.messages().datePicker.monthNames[0]).toBe('Januar');
    });

    it('direction auto resolves to the dir attribute of the document', () => {
      root.setAttribute('dir', 'rtl');
      const config = setup({ direction: 'auto' });

      expect(config.direction()).toBe('rtl');
      expect(TestBed.inject(Directionality).value).toBe('rtl');
    });

    it('provideArn ignores fields outside the types and warns', () => {
      const untyped: object = { size: 'huge', density: 'compact', nope: 1 };
      let providers = provideArn();

      const warnings = captureWarnings(() => {
        providers = provideArn(untyped);
      });
      TestBed.configureTestingModule({ providers: [providers] });
      const config = TestBed.inject(ArnConfigService);

      expect(warnings.length).toBe(2);
      expect(config.size()).toBe('md');
      expect(config.density()).toBe('compact');
    });
  });

  describe('runtime changes', () => {
    it('set methods update the signals immediately', () => {
      const config = setup({ size: 'sm' });

      config.setSize('xl');
      config.setDensity('compact');
      config.setColorScheme('dark');
      config.setDirection('rtl');
      config.setRipple(true);
      config.setLocale('tr-TR');
      config.setForms({ showErrorsOn: 'submitted' });

      expect(config.size()).toBe('xl');
      expect(config.density()).toBe('compact');
      expect(config.colorScheme()).toBe('dark');
      expect(config.direction()).toBe('rtl');
      expect(config.ripple()).toBe(true);
      expect(config.locale()).toBe('tr-TR');
      expect(config.forms()).toEqual({ showErrorsOn: 'submitted' });
      expect(config.messages().datePicker.dayNames[0]).toBe('Pazar');
    });

    it('update changes several fields and leaves the others alone', () => {
      const config = setup({ size: 'sm', density: 'compact' });

      config.update({ size: 'lg', ripple: true });

      expect(config.size()).toBe('lg');
      expect(config.ripple()).toBe(true);
      expect(config.density()).toBe('compact');
    });

    it('setMessages deep-merges with the previous texts', () => {
      const config = setup({ messages: { common: { yes: 'Evet' } } });

      config.setMessages({ common: { no: 'Hayır' } });
      config.setMessages({ dialog: { closeLabel: 'Kapat' } });

      expect(config.messages().common.yes).toBe('Evet');
      expect(config.messages().common.no).toBe('Hayır');
      expect(config.messages().common.ok).toBe('OK');
      expect(config.messages().dialog.closeLabel).toBe('Kapat');
    });

    it('the application-wide Directionality follows setDirection and emits the change', () => {
      const config = setup({});
      const directionality = TestBed.inject(Directionality);
      const emitted: string[] = [];
      directionality.change.subscribe((direction) => emitted.push(direction));

      config.setDirection('rtl');
      config.setDirection('rtl');
      config.setSize('lg');
      config.setDirection('auto');

      expect(emitted).toEqual(['rtl', 'ltr']);
      expect(directionality.value).toBe('ltr');
      expect(config.direction()).toBe('ltr');
    });

    it('warns when direction is set without provideArn, where nothing else can follow it', () => {
      const config = setup();

      const warnings = captureWarnings(() => {
        config.setSize('lg');
        config.setDirection('rtl');
      });

      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('provideArn');
      expect(config.direction()).toBe('rtl');
      expect(TestBed.inject(Directionality).value).toBe('ltr');
    });

    it('update ignores a value outside the types and warns', () => {
      const config = setup({ size: 'sm' });
      const untyped: object = { size: 'huge' };

      const warnings = captureWarnings(() => {
        config.update(untyped);
      });

      expect(config.size()).toBe('sm');
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('ArnConfigService');
    });
  });

  describe('applyToDocument', () => {
    it('does not write to <html> unless called', () => {
      const config = setup({ colorScheme: 'dark', density: 'compact', direction: 'rtl' });

      expect(config.colorScheme()).toBe('dark');
      config.setColorScheme('light');
      config.setDensity('comfortable');
      config.setDirection('ltr');

      expect(documentState()).toEqual(untouched);
    });

    it('writes the current values when called', () => {
      const config = setup({ colorScheme: 'dark', density: 'compact', direction: 'rtl' });

      config.applyToDocument();

      expect(documentState()).toEqual({ dark: true, light: false, density: 'compact', dir: 'rtl' });
    });

    it('follows changes made after the call', () => {
      const config = setup({});
      config.applyToDocument();

      expect(documentState()).toEqual({
        dark: false,
        light: false,
        density: 'comfortable',
        dir: null,
      });

      config.setColorScheme('light');
      config.update({ density: 'compact', direction: 'ltr' });

      expect(documentState()).toEqual({ dark: false, light: true, density: 'compact', dir: 'ltr' });
    });

    it('removes the classes on system and the dir it wrote on auto', () => {
      const config = setup({ colorScheme: 'dark', direction: 'rtl' });
      config.applyToDocument();

      config.setColorScheme('system');
      config.setDirection('auto');

      expect(documentState()).toEqual({
        dark: false,
        light: false,
        density: 'comfortable',
        dir: null,
      });
    });

    it('leaves the document dir attribute alone while direction is auto', () => {
      root.setAttribute('dir', 'rtl');
      const config = setup();

      config.applyToDocument();
      config.setSize('lg');

      expect(root.getAttribute('dir')).toBe('rtl');
      expect(config.direction()).toBe('rtl');
    });

    it('never writes lang: the document language belongs to the application', () => {
      const config = setup({ locale: 'tr-TR', applyToDocument: true });

      config.setLocale('de-DE');

      expect(root.hasAttribute('lang')).toBe(false);
    });

    it('can be called more than once', () => {
      const config = setup({ colorScheme: 'dark' });

      config.applyToDocument();
      config.applyToDocument();

      expect(documentState()).toEqual({
        dark: true,
        light: false,
        density: 'comfortable',
        dir: null,
      });
    });

    it('provideArn({ applyToDocument: true }) writes at startup and follows changes', () => {
      const config = setup({ colorScheme: 'dark', density: 'compact', applyToDocument: true });

      expect(documentState()).toEqual({ dark: true, light: false, density: 'compact', dir: null });

      config.setColorScheme('light');

      expect(documentState()).toEqual({ dark: false, light: true, density: 'compact', dir: null });
    });

    it('does not write when applyToDocument is false', () => {
      setup({ colorScheme: 'dark', applyToDocument: false });

      expect(documentState()).toEqual(untouched);
    });
  });
});
