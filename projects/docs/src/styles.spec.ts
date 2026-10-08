// The global stylesheet (`styles.css`) is loaded by the test target, so plain DOM is enough here.

describe('global styles: inline code', () => {
  const packageName = '@arn-ng/ui/core';
  const longName = 'provideExperimentalZonelessChangeDetection'.repeat(2);

  let page: HTMLElement;

  function create<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    content = '',
  ): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);

    node.textContent = content;

    return node;
  }

  /** Adds a paragraph made of some text followed by a code badge, and returns the badge. */
  function paragraph(before: string, code: string): HTMLElement {
    const block = create('p');
    const badge = create('code', code);

    block.append(document.createTextNode(before), badge);
    page.append(block);

    return badge;
  }

  /** The filler lengths at which the badge is split over more than one line. */
  function splits(): number[] {
    const badge = paragraph('', packageName);
    const filler = badge.previousSibling;
    const found: number[] = [];

    if (!filler) {
      throw new Error('The badge has no text before it.');
    }

    for (let length = 0; length <= 60; length++) {
      filler.textContent = 'a '.repeat(length);

      if (badge.getClientRects().length !== 1) {
        found.push(length);
      }
    }

    return found;
  }

  beforeEach(() => {
    page = create('div');
    page.className = 'docs-page';
    page.style.inlineSize = '320px';
    document.body.append(page);
  });

  afterEach(() => {
    page.remove();
  });

  it('never splits a badge at the end of a line', () => {
    expect(splits()).toEqual([]);
  });

  it('wraps a badge wider than the page inside itself instead of scrolling', () => {
    const short = paragraph('', packageName);
    const long = paragraph('', longName);

    expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    expect(long.getBoundingClientRect().height).toBeGreaterThan(
      short.getBoundingClientRect().height,
    );
  });

  it('does not let a table squeeze a badge below its longest word', () => {
    const free = paragraph('', 'ArnOverlayService').getBoundingClientRect().width;
    const table = create('table');
    const row = create('tr');
    const cell = create('td');
    const badge = create('code', 'ArnOverlayService');

    cell.append(badge);
    row.append(
      cell,
      create('td', 'The shared foundation for dialogs, menus and tooltips. '.repeat(4)),
    );
    table.append(row);
    page.append(table);

    expect(Math.abs(badge.getBoundingClientRect().width - free)).toBeLessThanOrEqual(1);
  });

  it('keeps the height of the line it sits on', () => {
    const plain = create('p', 'Some text');

    page.append(plain);

    const badge = paragraph('Some ', 'text');
    const withBadge = badge.parentElement;

    if (!withBadge) {
      throw new Error('The badge has no paragraph.');
    }

    expect(
      Math.abs(withBadge.getBoundingClientRect().height - plain.getBoundingClientRect().height),
    ).toBeLessThanOrEqual(1);
  });

  it('stays left-to-right and whole in a right-to-left page', () => {
    page.setAttribute('dir', 'rtl');

    expect(getComputedStyle(paragraph('', packageName)).direction).toBe('ltr');
    expect(splits()).toEqual([]);
  });

  it('leaves code blocks alone', () => {
    const block = create('pre');
    const code = create('code', 'const answer = 42;');

    block.append(code);
    page.append(block);

    expect(getComputedStyle(code).display).toBe('inline');
    expect(getComputedStyle(code).paddingInlineStart).toBe('0px');
  });
});
