import { Dir, Directionality } from '@angular/cdk/bidi';
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  inject,
  input,
  LOCALE_ID,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../testing/a11y';
import { resetDocument } from '../../../testing/document';
import { ArnConfigDirective } from './config.directive';
import { ArnConfigService } from './config.service';
import type { ArnDirection, ArnRootConfig } from './config.types';
import { injectArnConfig } from './inject-arn-config';
import { provideArn } from './provide-arn';

/** Mimics a component: reads the config and, like a CDK-based part, the `Directionality`. */
@Component({
  selector: 'arn-direction-probe',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Probe {
  readonly locale = input<string>();
  readonly config = injectArnConfig();
  readonly resolvedLocale = injectArnConfig('locale', this.locale);
  readonly directionality = inject(Directionality);
}

@Component({
  imports: [ArnConfigDirective, Probe],
  templateUrl: './config.direction.spec.host.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly outerDirection = signal<ArnDirection | undefined>(undefined);
  readonly innerDirection = signal<ArnDirection | undefined>(undefined);
  readonly fixedDirection = signal<ArnDirection | undefined>(undefined);
  readonly outerLocale = signal<string | undefined>(undefined);
  readonly ownLocale = signal<string | undefined>(undefined);

  readonly rootProbe = viewChild.required<Probe>('rootProbe');
  readonly outerProbe = viewChild.required<Probe>('outerProbe');
  readonly innerProbe = viewChild.required<Probe>('innerProbe');
  readonly leafProbe = viewChild.required<Probe>('leafProbe');
  readonly outer = viewChild.required<ElementRef<HTMLElement>>('outer');
  readonly inner = viewChild.required<ElementRef<HTMLElement>>('inner');
  readonly leaf = viewChild.required<ElementRef<HTMLElement>>('leaf');
  readonly fixed = viewChild.required<ElementRef<HTMLElement>>('fixed');
}

/** A section under CDK's own `Dir` directive. */
@Component({
  imports: [ArnConfigDirective, Dir, Probe],
  template: '<div dir="rtl"><div arnConfig direction="auto"><arn-direction-probe /></div></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CdkDirHost {
  readonly probe = viewChild.required(Probe);
}

describe('ArnConfigDirective: direction and locale', () => {
  const root = document.documentElement;
  let fixture: ComponentFixture<Host>;
  let host: Host;

  function setup(config?: ArnRootConfig, localeId?: string): void {
    TestBed.configureTestingModule({
      providers: [
        config ? provideArn(config) : [],
        localeId === undefined ? [] : { provide: LOCALE_ID, useValue: localeId },
      ],
    });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** `[config value, Directionality value]` of a probe; the two must always agree. */
  function directionOf(probe: Probe): [string, string] {
    return [probe.config.direction(), probe.directionality.value];
  }

  /** Collects what the `Directionality` of a probe emits from now on. */
  function emissionsOf(probe: Probe): string[] {
    const emitted: string[] = [];
    probe.directionality.change.subscribe((direction) => emitted.push(direction));
    return emitted;
  }

  afterEach(() => {
    // applyToDocument also writes data-density, not only dir
    resetDocument(document);
  });

  describe('locale precedence', () => {
    it('LOCALE_ID applies when nothing is given', () => {
      setup(undefined, 'tr-TR');

      expect(host.rootProbe().resolvedLocale()).toBe('tr-TR');
      expect(host.leafProbe().resolvedLocale()).toBe('tr-TR');
      expect(host.leafProbe().config.messages().datePicker.monthNames[0]).toBe('Ocak');
    });

    it('provideArn wins over LOCALE_ID', () => {
      setup({ locale: 'de-DE' }, 'tr-TR');

      expect(host.rootProbe().resolvedLocale()).toBe('de-DE');
      expect(host.leafProbe().resolvedLocale()).toBe('de-DE');
    });

    it('the nearest section wins over provideArn', () => {
      setup({ locale: 'de-DE' }, 'tr-TR');
      host.outerLocale.set('fr-FR');
      fixture.detectChanges();

      expect(host.rootProbe().resolvedLocale()).toBe('de-DE');
      expect(host.leafProbe().resolvedLocale()).toBe('fr-FR');
    });

    it('the own input of the component wins over the section', () => {
      setup({ locale: 'de-DE' }, 'tr-TR');
      host.outerLocale.set('fr-FR');
      host.ownLocale.set('en-GB');
      fixture.detectChanges();

      expect(host.leafProbe().resolvedLocale()).toBe('en-GB');
      expect(host.leafProbe().config.locale()).toBe('fr-FR');
    });
  });

  describe('auto', () => {
    it('follows the document direction when nothing is given', () => {
      setup({});

      expect(directionOf(host.rootProbe())).toEqual(['ltr', 'ltr']);
      expect(directionOf(host.leafProbe())).toEqual(['ltr', 'ltr']);
    });

    it('reads rtl from the dir attribute of the document', () => {
      root.setAttribute('dir', 'rtl');
      setup({});

      expect(directionOf(host.rootProbe())).toEqual(['rtl', 'rtl']);
      expect(directionOf(host.leafProbe())).toEqual(['rtl', 'rtl']);
    });

    it('reads the document direction without provideArn too', () => {
      root.setAttribute('dir', 'rtl');
      setup();

      expect(directionOf(host.rootProbe())).toEqual(['rtl', 'rtl']);
      expect(directionOf(host.leafProbe())).toEqual(['rtl', 'rtl']);
    });

    it('an explicit auto in a section follows its parent, same as not given', () => {
      setup({});
      host.outerDirection.set('rtl');
      host.innerDirection.set('auto');
      fixture.detectChanges();

      expect(directionOf(host.innerProbe())).toEqual(['rtl', 'rtl']);
      expect(host.inner().nativeElement.hasAttribute('dir')).toBe(false);
    });

    it('follows a CDK Dir directive above the section', () => {
      const cdkFixture = TestBed.createComponent(CdkDirHost);
      cdkFixture.detectChanges();

      expect(directionOf(cdkFixture.componentInstance.probe())).toEqual(['rtl', 'rtl']);
    });
  });

  describe('explicit direction on a section', () => {
    it('writes dir to its own element and follows changes', () => {
      setup({});
      const outer = host.outer().nativeElement;

      expect(outer.hasAttribute('dir')).toBe(false);

      host.outerDirection.set('rtl');
      fixture.detectChanges();
      expect(outer.getAttribute('dir')).toBe('rtl');

      host.outerDirection.set('ltr');
      fixture.detectChanges();
      expect(outer.getAttribute('dir')).toBe('ltr');

      host.outerDirection.set('auto');
      fixture.detectChanges();
      expect(outer.hasAttribute('dir')).toBe(false);

      host.outerDirection.set('rtl');
      fixture.detectChanges();
      host.outerDirection.set(undefined);
      fixture.detectChanges();
      expect(outer.hasAttribute('dir')).toBe(false);
    });

    it('leaves a static dir attribute alone when direction is not given', () => {
      setup({});
      const fixed = host.fixed().nativeElement;

      expect(fixed.getAttribute('dir')).toBe('rtl');

      host.fixedDirection.set('auto');
      fixture.detectChanges();

      expect(fixed.getAttribute('dir')).toBe('rtl');
    });

    it('components and the Directionality inside see the direction of the section', () => {
      setup({});
      host.outerDirection.set('rtl');
      fixture.detectChanges();

      expect(directionOf(host.rootProbe())).toEqual(['ltr', 'ltr']);
      expect(directionOf(host.outerProbe())).toEqual(['rtl', 'rtl']);
      expect(directionOf(host.leafProbe())).toEqual(['rtl', 'rtl']);
      // only the section that gives a direction writes dir
      expect(host.leaf().nativeElement.hasAttribute('dir')).toBe(false);
    });

    it('nested: an ltr section inside an rtl section, and a section below it inherits ltr', () => {
      setup({});
      host.outerDirection.set('rtl');
      host.innerDirection.set('ltr');
      fixture.detectChanges();

      expect(directionOf(host.outerProbe())).toEqual(['rtl', 'rtl']);
      expect(directionOf(host.innerProbe())).toEqual(['ltr', 'ltr']);
      expect(directionOf(host.leafProbe())).toEqual(['ltr', 'ltr']);
      expect(host.outer().nativeElement.getAttribute('dir')).toBe('rtl');
      expect(host.inner().nativeElement.getAttribute('dir')).toBe('ltr');
    });

    it('the Directionality inside emits once per actual change of direction', () => {
      setup({});
      const outerEmitted = emissionsOf(host.outerProbe());
      const leafEmitted = emissionsOf(host.leafProbe());

      host.outerDirection.set('rtl');
      fixture.detectChanges();
      host.outerDirection.set('rtl');
      fixture.detectChanges();
      host.outerDirection.set(undefined);
      fixture.detectChanges();

      expect(outerEmitted).toEqual(['rtl', 'ltr']);
      expect(leafEmitted).toEqual(['rtl', 'ltr']);
    });

    it('a section with its own direction does not emit when its parent changes', () => {
      setup({});
      host.innerDirection.set('ltr');
      fixture.detectChanges();
      const innerEmitted = emissionsOf(host.innerProbe());

      host.outerDirection.set('rtl');
      fixture.detectChanges();

      expect(innerEmitted).toEqual([]);
      expect(directionOf(host.leafProbe())).toEqual(['ltr', 'ltr']);
    });
  });

  describe('application-wide direction', () => {
    it('provideArn({ direction }) reaches sections and the Directionality', () => {
      setup({ direction: 'rtl' });

      expect(directionOf(host.rootProbe())).toEqual(['rtl', 'rtl']);
      expect(directionOf(host.leafProbe())).toEqual(['rtl', 'rtl']);
      // only the value: without applyToDocument nothing is written to the DOM
      expect(root.hasAttribute('dir')).toBe(false);
    });

    it('a change through the service reaches sections without a direction, not one with', () => {
      setup({});
      host.innerDirection.set('ltr');
      fixture.detectChanges();
      const rootEmitted = emissionsOf(host.rootProbe());
      const outerEmitted = emissionsOf(host.outerProbe());

      TestBed.inject(ArnConfigService).setDirection('rtl');

      expect(directionOf(host.rootProbe())).toEqual(['rtl', 'rtl']);
      expect(directionOf(host.outerProbe())).toEqual(['rtl', 'rtl']);
      expect(directionOf(host.innerProbe())).toEqual(['ltr', 'ltr']);
      expect(rootEmitted).toEqual(['rtl']);
      expect(outerEmitted).toEqual(['rtl']);
    });

    it('back on auto the document direction applies again', () => {
      setup({ direction: 'rtl', applyToDocument: true });
      const service = TestBed.inject(ArnConfigService);

      expect(root.getAttribute('dir')).toBe('rtl');

      service.setDirection('auto');

      expect(root.hasAttribute('dir')).toBe(false);
      expect(directionOf(host.rootProbe())).toEqual(['ltr', 'ltr']);
      expect(directionOf(host.leafProbe())).toEqual(['ltr', 'ltr']);
    });
  });

  it('has no axe violations', async () => {
    setup({});
    host.outerDirection.set('rtl');
    host.innerDirection.set('ltr');
    fixture.detectChanges();

    await expectNoA11yViolations(fixture.nativeElement as Element);
  });
});
