import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { resetDocument, queryAs, text } from '../testing/dom';
import { DOCS_CLIPBOARD, type DocsClipboard } from './clipboard';
import { COPIED_RESET_MS, CopyButtonComponent } from './copy-button.component';

describe('CopyButtonComponent', () => {
  interface Copy {
    fixture: ComponentFixture<CopyButtonComponent>;
    element: HTMLElement;
    announced: string[];
    button: HTMLButtonElement;
    /** Clicks and renders the result; only the timeouts may be faked. */
    click: () => Promise<void>;
  }

  function setup(clipboard: DocsClipboard | null): Copy {
    const announced: string[] = [];

    TestBed.configureTestingModule({
      providers: [
        { provide: DOCS_CLIPBOARD, useValue: clipboard },
        {
          provide: LiveAnnouncer,
          useValue: {
            announce: (message: string, politeness?: string) => {
              announced.push(`${message} (${politeness ?? 'default'})`);

              return Promise.resolve();
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(CopyButtonComponent);
    const element = fixture.nativeElement as HTMLElement;

    fixture.componentRef.setInput('text', 'npm install @arn-ng/ui');
    fixture.detectChanges();

    const button = queryAs(element, 'button', HTMLButtonElement);

    return {
      fixture,
      element,
      announced,
      button,
      click: async () => {
        button.click();
        await vi.advanceTimersByTimeAsync(0);
        fixture.detectChanges();
      },
    };
  }

  function icon(copy: Copy): string | null {
    return copy.button.querySelector('svg')?.getAttribute('data-icon') ?? null;
  }

  function status(copy: Copy): string {
    const found = copy.element.querySelector('.docs-copy-status');

    return found ? text(found) : '';
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    resetDocument(document);
  });

  it('is a named icon button that adds no box of its own', () => {
    const copy = setup(null);

    expect(copy.button.type).toBe('button');
    expect(copy.button.getAttribute('aria-label')).toBe('Copy code');
    expect(text(copy.button)).toBe('');
    expect(copy.button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(copy.element).display).toBe('contents');
    expect(copy.fixture.componentInstance.state()).toBe('idle');
  });

  it(`copies the text, shows a check mark for ${String(COPIED_RESET_MS)} ms and announces it politely`, async () => {
    const copied: string[] = [];
    const copy = setup({
      writeText: (value) => {
        copied.push(value);

        return Promise.resolve();
      },
    });

    await copy.click();

    expect(copied).toEqual(['npm install @arn-ng/ui']);
    expect(icon(copy)).toBe('check');
    expect(copy.button.getAttribute('aria-label')).toBe('Copy code');
    expect(copy.announced).toEqual(['Copied (polite)']);

    await vi.advanceTimersByTimeAsync(COPIED_RESET_MS - 1);
    copy.fixture.detectChanges();

    expect(icon(copy)).toBe('check');

    await vi.advanceTimersByTimeAsync(1);
    copy.fixture.detectChanges();

    expect(icon(copy)).toBe('copy');
    expect(copy.fixture.componentInstance.state()).toBe('idle');
  });

  it('keeps a refusal shown past that time, until the next copy', async () => {
    let calls = 0;
    const copy = setup({
      writeText: () => (++calls === 1 ? Promise.reject(new Error('denied')) : Promise.resolve()),
    });

    await copy.click();
    await vi.advanceTimersByTimeAsync(COPIED_RESET_MS * 3);
    copy.fixture.detectChanges();

    expect(status(copy)).toBe('Copy failed');
    expect(icon(copy)).toBe('copy');

    await copy.click();

    expect(status(copy)).toBe('');
    expect(icon(copy)).toBe('check');
    expect(copy.announced).toEqual(['Copy failed (polite)', 'Copied (polite)']);
  });

  it('is not silent without a clipboard', async () => {
    const copy = setup(null);

    await copy.click();

    expect(status(copy)).toBe('Copy failed');
    expect(copy.announced).toEqual(['Copy failed (polite)']);
    expect(copy.fixture.componentInstance.state()).toBe('failed');
  });

  it('goes back to idle on reset, and the pending timeout does nothing later', async () => {
    const copy = setup({ writeText: () => Promise.resolve() });

    await copy.click();
    copy.fixture.componentInstance.reset();
    copy.fixture.detectChanges();

    expect(icon(copy)).toBe('copy');

    await copy.click();
    copy.fixture.componentInstance.reset();
    await copy.click();
    await vi.advanceTimersByTimeAsync(COPIED_RESET_MS - 1);
    copy.fixture.detectChanges();

    // The first timeout was cleared by reset: the second check mark is still there.
    expect(icon(copy)).toBe('check');
  });

  it('clears its timeout when it is destroyed', async () => {
    const copy = setup({ writeText: () => Promise.resolve() });

    await copy.click();
    copy.fixture.destroy();

    expect(vi.getTimerCount()).toBe(0);
  });
});
