describe('test ortamı', () => {
  it('zone.js yüklü değil', () => {
    expect('Zone' in globalThis).toBe(false);
  });
});
