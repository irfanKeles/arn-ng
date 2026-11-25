import * as core from './public-api';

describe('@arn-ng/ui/core public API', () => {
  // ɵ exports are internal helpers shared between entry points, not a supported API. Each one
  // needs a decision record (decisions/YYYY-MM.md) before it is added to this list; past the
  // ceiling written there, they move to their own internal entry point instead.
  it('exports only the internal (ɵ) helpers that have a decision record', () => {
    expect(
      Object.keys(core)
        .filter((name) => name.startsWith('ɵ'))
        .sort(),
    ).toEqual(['ɵdevWarn', 'ɵdisabledLink']);
  });
});
