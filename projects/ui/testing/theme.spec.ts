// theme.css, angular.json'daki ui test hedefinin `styles` seçeneğiyle yüklenir.

const semanticColorTokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
];

const scaleTokens = [
  'radius',
  'font-sans',
  'font-mono',
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'font-weight-normal',
  'font-weight-medium',
  'font-weight-semibold',
  'spacing',
  'border-width',
  'ring-width',
];

describe('theme.css', () => {
  let host: HTMLElement;

  /** `className` taşıyan bir kutu ekler; arka planı verilen değerdir. */
  function box(parent: HTMLElement, className: string, background: string): HTMLElement {
    const element = document.createElement('div');
    element.className = className;
    element.style.background = background;
    parent.appendChild(element);
    return element;
  }

  function backgroundOf(element: HTMLElement): string {
    return getComputedStyle(element).backgroundColor;
  }

  /** Ham token'ın tarayıcıdaki hesaplanmış rengi (karşılaştırma referansı). */
  function resolved(token: string): string {
    return backgroundOf(box(host, '', `var(--arn-${token})`));
  }

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('anlamlı renk ve ölçek token’ları :root’ta tanımlıdır', () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const missing = [...semanticColorTokens, ...scaleTokens].filter(
      (token) => rootStyle.getPropertyValue(`--arn-${token}`).trim() === '',
    );

    expect(missing).toEqual([]);
  });

  it('sınıf yokken sistem tercihine uyar', () => {
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const element = box(host, '', 'var(--arn-background)');

    expect(backgroundOf(element)).toBe(resolved(prefersDark ? 'neutral-950' : 'white'));
  });

  it('.dark koyu değerleri zorlar', () => {
    const element = box(host, 'dark', 'var(--arn-background)');

    expect(backgroundOf(element)).toBe(resolved('neutral-950'));
    expect(backgroundOf(element)).not.toBe(resolved('white'));
  });

  it('.light açık değerleri zorlar', () => {
    const element = box(host, 'light', 'var(--arn-background)');

    expect(backgroundOf(element)).toBe(resolved('white'));
  });

  it('iç içe sınıflarda en yakın olan geçerlidir', () => {
    const dark = box(host, 'dark', 'var(--arn-primary)');
    const lightInDark = box(dark, 'light', 'var(--arn-primary)');

    expect(backgroundOf(dark)).toBe(resolved('neutral-200'));
    expect(backgroundOf(lightInDark)).toBe(resolved('neutral-900'));
  });

  it('radius ölçeği --arn-radius’tan türer', () => {
    const element = box(host, '', 'none');
    const radiusOf = (value: string): number => {
      element.style.borderRadius = value;
      return parseFloat(getComputedStyle(element).borderTopLeftRadius);
    };
    const base = radiusOf('var(--arn-radius)');

    expect(base).toBeGreaterThan(0);
    expect(radiusOf('var(--arn-radius-sm)')).toBeCloseTo(base * 0.6, 3);
    expect(radiusOf('var(--arn-radius-lg)')).toBeCloseTo(base, 3);
    expect(radiusOf('var(--arn-radius-4xl)')).toBeCloseTo(base * 2.6, 3);
  });

  // Türetilmiş adımlar :root'ta hesaplanır: taban yalnızca :root'ta değiştirilince ölçek yeniden türer
  it('--arn-radius :root’ta değişince ölçek onu izler, container’da değişince izlemez', () => {
    const element = box(host, '', 'none');
    const smallRadius = (): number => {
      element.style.borderRadius = 'var(--arn-radius-sm)';
      return parseFloat(getComputedStyle(element).borderTopLeftRadius);
    };
    const initial = smallRadius();

    element.style.setProperty('--arn-radius', '100px');
    expect(smallRadius()).toBeCloseTo(initial, 3);
    element.style.removeProperty('--arn-radius');

    const root = document.documentElement;
    root.style.setProperty('--arn-radius', '100px');
    try {
      expect(smallRadius()).toBeCloseTo(60, 3);
    } finally {
      root.style.removeProperty('--arn-radius');
    }
  });
});
