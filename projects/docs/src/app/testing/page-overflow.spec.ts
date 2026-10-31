import { expectNoPageOverflow, pageOverflow } from './page-overflow';

describe('pageOverflow', () => {
  let element: HTMLElement;
  const settle = (): Promise<void> => Promise.resolve();

  beforeEach(() => {
    element = document.createElement('div');
    document.body.append(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('is 0 for content that wraps to the width', async () => {
    element.textContent = 'Some words that wrap. '.repeat(40);

    expect(await pageOverflow(element, settle)).toBe(0);
    await expectNoPageOverflow(element, settle);
  });

  it('is 0 for wide content that scrolls inside its own container', async () => {
    const scroller = document.createElement('div');

    scroller.style.overflowX = 'auto';
    scroller.style.whiteSpace = 'nowrap';
    scroller.textContent = 'x'.repeat(400);
    element.append(scroller);

    expect(await pageOverflow(element, settle)).toBe(0);
  });

  it('measures an absolute element that escapes an unpositioned scroll container', async () => {
    const scroller = document.createElement('div');
    const wide = document.createElement('div');
    const hidden = document.createElement('span');

    scroller.style.overflowX = 'auto';
    wide.style.inlineSize = '3000px';
    hidden.style.position = 'absolute';
    hidden.textContent = 'None';
    wide.append(document.createTextNode('x'.repeat(10)));
    wide.style.display = 'flex';
    wide.style.justifyContent = 'flex-end';
    wide.append(hidden);
    scroller.append(wide);
    element.append(scroller);

    expect(await pageOverflow(element, settle)).toBeGreaterThan(0);

    // The same with the scroll container positioned: the text is clipped
    scroller.style.position = 'relative';

    expect(await pageOverflow(element, settle)).toBe(0);
  });

  it('puts the element back where it was', async () => {
    const before = document.createElement('i');
    const after = document.createElement('b');

    element.before(before);
    element.after(after);
    await pageOverflow(element, settle);

    expect(element.previousSibling).toBe(before);
    expect(element.nextSibling).toBe(after);
    before.remove();
    after.remove();
  });
});
