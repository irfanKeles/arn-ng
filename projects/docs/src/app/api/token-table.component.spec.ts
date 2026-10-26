import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '../../../../ui/testing/a11y';
import { query, text } from '../testing/dom';
import type { DocsApiToken } from './docs-api';
import { TokenTableComponent } from './token-table.component';

const TOKENS: readonly DocsApiToken[] = [
  {
    name: '--arn-button-radius',
    default: 'calc(var(--arn-radius) * 0.8)',
    description: 'Corner radius.',
  },
  { name: '--arn-button-bg', default: 'var(--arn-primary)', description: 'Background color.' },
];

describe('TokenTableComponent', () => {
  async function create(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(TokenTableComponent);

    fixture.componentRef.setInput('rows', TOKENS);
    await fixture.whenStable();

    return fixture.nativeElement as HTMLElement;
  }

  it('lists the tokens under a "CSS tokens" caption', async () => {
    const element = await create();

    expect(text(query(element, 'caption'))).toBe('CSS tokens');
    expect(Array.from(element.querySelectorAll('thead th')).map((th) => text(th))).toEqual([
      'Name',
      'Default',
      'Description',
    ]);
    expect(Array.from(element.querySelectorAll('tbody th code')).map((code) => text(code))).toEqual(
      ['--arn-button-radius', '--arn-button-bg'],
    );
  });

  it('sets the default as code', async () => {
    const element = await create();

    expect(text(query(element, 'tbody td code'))).toBe('calc(var(--arn-radius) * 0.8)');
  });

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(await create());
  });
});
