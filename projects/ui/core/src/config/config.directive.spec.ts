import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { ArnConfigDirective } from './config.directive';
import { ArnConfigService } from './config.service';
import type {
  ArnColorScheme,
  ArnDeepPartial,
  ArnDensity,
  ArnFormsConfig,
  ArnRootConfig,
  ArnSize,
} from './config.types';
import { injectArnConfig } from './inject-arn-config';
import type { ArnMessages } from './messages';
import { provideArn } from './provide-arn';

/** Mimics a component: it has its own `size` input and reads the rest from the hierarchy. */
@Component({
  selector: 'arn-probe',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Probe {
  readonly size = input<ArnSize>();
  readonly config = injectArnConfig();
  readonly resolvedSize = injectArnConfig('size', this.size);
}

@Component({
  imports: [ArnConfigDirective, Probe],
  templateUrl: './config.directive.spec.host.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly outerSize = signal<ArnSize | undefined>('sm');
  readonly outerDensity = signal<ArnDensity | undefined>(undefined);
  readonly outerColorScheme = signal<ArnColorScheme | undefined>(undefined);
  readonly outerLocale = signal<string | undefined>(undefined);
  readonly outerMessages = signal<ArnDeepPartial<ArnMessages> | undefined>(undefined);
  readonly outerForms = signal<ArnFormsConfig | undefined>(undefined);
  readonly innerSize = signal<ArnSize | undefined>(undefined);
  readonly ownSize = signal<ArnSize | undefined>(undefined);

  readonly rootProbe = viewChild.required<Probe>('rootProbe');
  readonly outerProbe = viewChild.required<Probe>('outerProbe');
  readonly middleProbe = viewChild.required<Probe>('middleProbe');
  readonly innerProbe = viewChild.required<Probe>('innerProbe');
  readonly outer = viewChild.required<ElementRef<HTMLElement>>('outer');
  readonly middle = viewChild.required<ElementRef<HTMLElement>>('middle');
  readonly inner = viewChild.required<ElementRef<HTMLElement>>('inner');
}

describe('ArnConfigDirective and injectArnConfig', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  function setup(config?: ArnRootConfig): void {
    if (config) {
      TestBed.configureTestingModule({ providers: [provideArn(config)] });
    }
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('precedence', () => {
    it('the library default applies when nothing is given', () => {
      setup();

      expect(host.rootProbe().resolvedSize()).toBe('md');
    });

    it('provideArn wins over the default', () => {
      setup({ size: 'lg' });

      expect(host.rootProbe().resolvedSize()).toBe('lg');
    });

    it('the nearest [arnConfig] section wins over provideArn', () => {
      setup({ size: 'lg' });

      expect(host.outerProbe().resolvedSize()).toBe('sm');
      expect(host.rootProbe().resolvedSize()).toBe('lg');
    });

    it('the own input of the component wins over the section', () => {
      setup({ size: 'lg' });
      host.innerSize.set('xs');
      host.ownSize.set('xl');
      fixture.detectChanges();

      expect(host.innerProbe().resolvedSize()).toBe('xl');
      expect(host.innerProbe().config.size()).toBe('xs');
    });
  });

  describe('nested sections', () => {
    it('a field that is not given comes from the parent section, else from the root', () => {
      setup({ density: 'compact', ripple: false });

      // middle and inner give no size: from outer (sm)
      expect(host.middleProbe().config.size()).toBe('sm');
      expect(host.innerProbe().resolvedSize()).toBe('sm');
      // no section gives density: from provideArn
      expect(host.innerProbe().config.density()).toBe('compact');
      // only middle gives ripple
      expect(host.outerProbe().config.ripple()).toBe(false);
      expect(host.middleProbe().config.ripple()).toBe(true);
      expect(host.innerProbe().config.ripple()).toBe(true);
    });

    it('the nearest section overrides its parent', () => {
      setup();
      host.innerSize.set('xl');
      fixture.detectChanges();

      expect(host.outerProbe().resolvedSize()).toBe('sm');
      expect(host.middleProbe().resolvedSize()).toBe('sm');
      expect(host.innerProbe().resolvedSize()).toBe('xl');
    });

    it('messages are deep-merged at every level', () => {
      setup({ messages: { common: { yes: 'Evet' }, dialog: { closeLabel: 'Kapat' } } });
      host.outerMessages.set({ common: { ok: 'Tamam' } });
      fixture.detectChanges();

      const messages = host.innerProbe().config.messages();

      expect(messages.common.yes).toBe('Evet'); // provideArn
      expect(messages.common.ok).toBe('Tamam'); // outer
      expect(messages.common.no).toBe('Hayır'); // middle
      expect(messages.common.cancel).toBe('Cancel'); // default
      expect(messages.dialog.closeLabel).toBe('Kapat');
      // upper levels do not see the texts of lower ones
      expect(host.outerProbe().config.messages().common.no).toBe('No');
      expect(host.rootProbe().config.messages().common.ok).toBe('OK');
    });

    it('in a section that only changes locale the day/month names switch language', () => {
      setup({ locale: 'en-US' });
      host.outerLocale.set('tr-TR');
      fixture.detectChanges();

      expect(host.rootProbe().config.messages().datePicker.monthNames[0]).toBe('January');
      expect(host.innerProbe().config.locale()).toBe('tr-TR');
      expect(host.innerProbe().config.messages().datePicker.monthNames[0]).toBe('Ocak');
    });

    it('forms are merged with the upper level', () => {
      setup({ forms: { showErrorsOn: 'dirty' } });

      expect(host.innerProbe().config.forms()).toEqual({ showErrorsOn: 'dirty' });

      host.outerForms.set({ showErrorsOn: 'submitted' });
      fixture.detectChanges();

      expect(host.innerProbe().config.forms()).toEqual({ showErrorsOn: 'submitted' });
      expect(host.rootProbe().config.forms()).toEqual({ showErrorsOn: 'dirty' });
    });
  });

  describe('runtime changes', () => {
    it('a component below follows when a section input changes', () => {
      setup();

      host.outerSize.set('lg');
      fixture.detectChanges();

      expect(host.innerProbe().resolvedSize()).toBe('lg');
    });

    it('falls back to the upper level when a section input becomes undefined', () => {
      setup({ size: 'xl' });

      host.outerSize.set(undefined);
      fixture.detectChanges();

      expect(host.outerProbe().resolvedSize()).toBe('xl');
      expect(host.innerProbe().resolvedSize()).toBe('xl');
    });

    it('falls back to the section when the component input becomes undefined', () => {
      setup();
      host.ownSize.set('xs');
      fixture.detectChanges();
      expect(host.innerProbe().resolvedSize()).toBe('xs');

      host.ownSize.set(undefined);
      fixture.detectChanges();

      expect(host.innerProbe().resolvedSize()).toBe('sm');
    });

    it('on a service change, fields the section does not give follow; fields it gives do not', () => {
      setup();
      const service = TestBed.inject(ArnConfigService);

      service.update({ size: 'xl', density: 'compact' });

      expect(host.rootProbe().resolvedSize()).toBe('xl');
      expect(host.innerProbe().config.density()).toBe('compact');
      expect(host.innerProbe().resolvedSize()).toBe('sm');
    });
  });

  describe('host reflection', () => {
    it('leaves the element alone when density and colorScheme are not given', () => {
      setup({ density: 'compact', colorScheme: 'dark' });
      const outer = host.outer().nativeElement;

      expect(outer.hasAttribute('data-density')).toBe(false);
      expect(outer.classList.contains('dark')).toBe(false);
      expect(outer.classList.contains('light')).toBe(false);
      // the static class stays in place
      expect(host.inner().nativeElement.classList.contains('dark')).toBe(true);
    });

    it('density is reflected as data-density and follows changes', () => {
      setup();
      const outer = host.outer().nativeElement;

      host.outerDensity.set('compact');
      fixture.detectChanges();
      expect(outer.getAttribute('data-density')).toBe('compact');

      host.outerDensity.set('comfortable');
      fixture.detectChanges();
      expect(outer.getAttribute('data-density')).toBe('comfortable');

      host.outerDensity.set(undefined);
      fixture.detectChanges();
      expect(outer.hasAttribute('data-density')).toBe(false);
    });

    it('colorScheme is reflected as .dark / .light; system writes no class', () => {
      setup();
      const classes = host.outer().nativeElement.classList;

      host.outerColorScheme.set('dark');
      fixture.detectChanges();
      expect([classes.contains('dark'), classes.contains('light')]).toEqual([true, false]);

      host.outerColorScheme.set('light');
      fixture.detectChanges();
      expect([classes.contains('dark'), classes.contains('light')]).toEqual([false, true]);

      host.outerColorScheme.set('system');
      fixture.detectChanges();
      expect([classes.contains('dark'), classes.contains('light')]).toEqual([false, false]);
    });

    it('the reflected density changes the factor in theme.css', () => {
      setup();
      host.outerDensity.set('compact');
      fixture.detectChanges();

      const style = getComputedStyle(host.middle().nativeElement);

      expect(style.getPropertyValue('--arn-density').trim()).toBe('0.875');
    });
  });

  it('has no axe violations', async () => {
    setup();
    host.outerDensity.set('compact');
    host.outerColorScheme.set('dark');
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement as Element);
  });
});

describe('injectArnConfig', () => {
  it('throws outside an injection context', () => {
    expect(() => injectArnConfig()).toThrowError(/injectArnConfig/);
  });

  it('gives the root config inside a context', () => {
    TestBed.configureTestingModule({ providers: [provideArn({ size: 'xs' })] });

    const size = TestBed.runInInjectionContext(() => injectArnConfig('size', () => undefined));
    const own = TestBed.runInInjectionContext(() => injectArnConfig('size', () => 'xl' as const));

    expect(size()).toBe('xs');
    expect(own()).toBe('xl');
  });
});
