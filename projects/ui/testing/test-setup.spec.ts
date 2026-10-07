describe('test environment', () => {
  it('zone.js is not loaded', () => {
    expect('Zone' in globalThis).toBe(false);
  });
});
