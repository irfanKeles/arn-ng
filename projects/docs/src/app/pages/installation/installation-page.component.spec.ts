import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ArnConfigService, provideArn } from '@arn-ng/ui/core';
import { ARN_MESSAGES_TR } from '@arn-ng/ui/locales/tr';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';
import { expectNoA11yViolations } from '../../../../../ui/testing/a11y';
import { CodeBlockComponent } from '../../code/code-block.component';
import { query, resetDocument, text } from '../../testing/dom';
import { unknownInternalLinks } from '../../testing/links';
import { DocsTocService } from '../../toc/docs-toc.service';
import { A11Y_MODES } from '../../testing/render-example';
import { InstallationPageComponent } from './installation-page.component';
import { LIBRARY_PACKAGE_JSON, LIBRARY_PEERS, peerDependencies } from './installation.data';

describe('InstallationPageComponent', () => {
  interface Page {
    fixture: ComponentFixture<InstallationPageComponent>;
    element: HTMLElement;
  }

  async function render(): Promise<Page> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideArn({ applyToDocument: true })],
    });

    const fixture = TestBed.createComponent(InstallationPageComponent);

    await fixture.whenStable();

    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function codeBlocks(fixture: ComponentFixture<unknown>): CodeBlockComponent[] {
    return fixture.debugElement
      .queryAll(By.directive(CodeBlockComponent))
      .map((debug) => debug.componentInstance as CodeBlockComponent);
  }

  afterEach(() => {
    resetDocument(document);
  });

  describe('structure', () => {
    it('has a single top-level heading and carries the page class', async () => {
      const { element } = await render();

      expect(element.querySelectorAll('h1').length).toBe(1);
      expect(text(query(element, 'h1'))).toBe('Installation');
      expect(element.classList.contains('docs-page')).toBe(true);
    });

    it('starts with a note that the package is not on npm yet and the steps are for 0.1.0', async () => {
      const { element } = await render();
      const note = query(element, '[role="note"]');

      expect(element.querySelector('h1')?.nextElementSibling).toBe(note);
      expect(text(note)).toContain('Not on npm yet.');
      expect(text(note)).toContain('0.1.0');
    });

    it('lists its sections under "On this page", in order', async () => {
      await render();

      expect(
        TestBed.inject(DocsTocService)
          .sections()
          .map((section) => section.id()),
      ).toEqual(['requirements', 'install', 'theme', 'configuration', 'imports']);
    });

    it('links only to pages that exist', async () => {
      expect(unknownInternalLinks((await render()).element)).toEqual([]);
    });

    it('links to the Configuration page for the details', async () => {
      const { element } = await render();

      expect(
        Array.from(element.querySelectorAll('a[href]')).map((link) => link.getAttribute('href')),
      ).toContain('/configuration');
    });

    it('has no example blocks, only code blocks', async () => {
      const { fixture, element } = await render();

      expect(element.querySelector('docs-example')).toBeNull();
      expect(codeBlocks(fixture).length).toBe(5);
    });
  });

  describe('requirements', () => {
    it('reads the peer dependencies from the library package.json', () => {
      const manifest = JSON.parse(LIBRARY_PACKAGE_JSON) as {
        name: string;
        peerDependencies: Record<string, string>;
      };

      expect(manifest.name).toBe('@arn-ng/ui');
      expect(LIBRARY_PEERS).toEqual(
        Object.entries(manifest.peerDependencies).map(([name, range]) => ({ name, range })),
      );
      expect(LIBRARY_PEERS.map((peer) => peer.name)).toContain('@angular/cdk');
    });

    it('shows every peer with its range', async () => {
      const { element } = await render();
      const items = Array.from(element.querySelectorAll('.docs-peers li')).map((item) =>
        Array.from(item.querySelectorAll('code')).map((code) => text(code)),
      );

      expect(items).toEqual(LIBRARY_PEERS.map((peer) => [peer.name, peer.range]));
    });

    it('ignores a manifest without peers or with a non-string range', () => {
      expect(peerDependencies('{}')).toEqual([]);
      expect(peerDependencies('{"peerDependencies":{"a":"^1.0.0","b":1}}')).toEqual([
        { name: 'a', range: '^1.0.0' },
      ]);
    });
  });

  describe('code', () => {
    it('writes shell commands as shellscript and the rest as typescript or css', async () => {
      const { fixture } = await render();

      expect(codeBlocks(fixture).map((block) => block.language())).toEqual([
        'shellscript',
        'css',
        'typescript',
        'typescript',
        'typescript',
      ]);
    });

    it('uses the steps the local registry runs went through', async () => {
      const { fixture } = await render();
      const [install, theme, config, locale] = codeBlocks(fixture).map((block) => block.code());

      expect(install).toBe('npm install @arn-ng/ui');
      expect(theme).toContain("@import '@arn-ng/ui/theme.css';");
      expect(config).toContain("import { provideArn } from '@arn-ng/ui/core';");
      expect(locale).toContain("provideArn({ locale: 'tr-TR', messages: ARN_MESSAGES_TR });");
    });

    it('imports only entry points that resolve', () => {
      // These imports compile in this spec: the entry points named on the page exist.
      expect(typeof provideArn).toBe('function');
      expect(ArnConfigService).toBeDefined();
      expect(ArnRippleDirective).toBeDefined();
      expect(ARN_MESSAGES_TR.common?.cancel).toBe('Vazgeç');
    });
  });

  describe('accessibility', () => {
    for (const mode of A11Y_MODES) {
      it(`has no violations in ${mode.name} mode`, async () => {
        const { fixture, element } = await render();

        TestBed.inject(ArnConfigService).update(mode.config);
        await fixture.whenStable();

        await expectNoA11yViolations(element);
      });
    }
  });
});
