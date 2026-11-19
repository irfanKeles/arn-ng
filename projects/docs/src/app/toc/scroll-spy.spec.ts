import { activeIndex, type ScrollSpyState } from './scroll-spy';

describe('activeIndex', () => {
  const page = (state: Partial<ScrollSpyState>): ScrollSpyState => ({
    headingTops: [100, 900, 1700],
    line: 16,
    atBottom: false,
    scrollable: true,
    ...state,
  });

  it('is -1 when there are no sections', () => {
    expect(activeIndex(page({ headingTops: [] }))).toBe(-1);
    expect(activeIndex(page({ headingTops: [], atBottom: true }))).toBe(-1);
  });

  it('is the first section before any heading reaches the line', () => {
    expect(activeIndex(page({}))).toBe(0);
  });

  it('is the last heading at or above the line', () => {
    expect(activeIndex(page({ headingTops: [-800, 16, 816] }))).toBe(1);
    expect(activeIndex(page({ headingTops: [-1600, -800, 4] }))).toBe(2);
  });

  it('counts a heading exactly on the line as reached', () => {
    expect(activeIndex(page({ headingTops: [-500, 16, 900] }))).toBe(1);
    expect(activeIndex(page({ headingTops: [-500, 16.5, 900] }))).toBe(0);
  });

  it('is the last section at the end of a page that scrolls, before its heading reaches the line', () => {
    expect(activeIndex(page({ headingTops: [-1600, -200, 400], atBottom: true }))).toBe(2);
  });

  it('ignores the end of a page that does not scroll', () => {
    expect(
      activeIndex(page({ headingTops: [100, 200, 300], atBottom: true, scrollable: false })),
    ).toBe(0);
  });

  it('puts a heading that has not rendered (top Infinity) below the line', () => {
    expect(activeIndex(page({ headingTops: [-100, Infinity, 500] }))).toBe(0);
  });

  it('is the only section, wherever it is', () => {
    expect(activeIndex(page({ headingTops: [700] }))).toBe(0);
    expect(activeIndex(page({ headingTops: [-700] }))).toBe(0);
  });
});
