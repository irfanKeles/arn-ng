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

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
type Size = (typeof sizes)[number];

/** Boyuta göre kontrol ölçüleri, rem cinsinden (density uygulanmamış). */
const controlRem = {
  height: { xs: 1.5, sm: 2, md: 2.25, lg: 2.5, xl: 3 },
  'padding-inline': { xs: 0.5, sm: 0.75, md: 1, lg: 1.5, xl: 2 },
  'font-size': { xs: 0.75, sm: 0.875, md: 0.875, lg: 0.875, xl: 1 },
  'icon-size': { xs: 0.75, sm: 1, md: 1, lg: 1, xl: 1.25 },
  gap: { xs: 0.25, sm: 0.375, md: 0.5, lg: 0.5, xl: 0.5 },
} satisfies Record<string, Record<Size, number>>;
type ControlProperty = keyof typeof controlRem;

const controlProperties = Object.keys(controlRem) as ControlProperty[];

const controlTokens = [
  ...controlProperties.flatMap((property) => sizes.map((size) => `control-${property}-${size}`)),
  'control-min-size',
  'density',
];

const compact = 0.875;

describe('theme.css', () => {
  let host: HTMLElement;
  let rem: number;

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

  /** `data-density` taşıyan bir container ekler. */
  function density(parent: HTMLElement, value: 'comfortable' | 'compact'): HTMLElement {
    const element = box(parent, '', 'none');
    element.setAttribute('data-density', value);
    return element;
  }

  /** Kesirli px karşılaştırması için üç basamağa yuvarlar. */
  const round = (value: number): number => Math.round(value * 1000) / 1000;

  /** Verilen uzunluk değerinin elemandaki hesaplanmış px karşılığı. */
  function lengthOf(element: HTMLElement, value: string): number {
    element.style.inlineSize = value;
    return round(parseFloat(getComputedStyle(element).inlineSize));
  }

  function bySize<T>(read: (size: Size) => T): Record<Size, T> {
    return Object.fromEntries(sizes.map((size) => [size, read(size)])) as Record<Size, T>;
  }

  /** Kontrol token'ının boyuta göre beklenen px değeri, isteğe bağlı çarpanla. */
  function expected(property: ControlProperty, factor = 1): Record<Size, number> {
    return bySize((size) => round(controlRem[property][size] * rem * factor));
  }

  /**
   * Bileşen host'unu taklit eden geçici deneme elemanı: kendi token'larını kendi üstünde hesaplar
   * (SKILL §5). Henüz bileşen yok; örüntü components/_TEMPLATE.md'dekiyle aynıdır.
   */
  function probe(parent: HTMLElement, size: Size): HTMLElement {
    const element = box(parent, '', 'none');
    element.style.setProperty(
      '--arn-probe-height',
      `max(var(--arn-control-min-size), calc(var(--arn-control-height-${size}) * var(--arn-density)))`,
    );
    element.style.setProperty(
      '--arn-probe-padding-inline',
      `calc(var(--arn-control-padding-inline-${size}) * var(--arn-density))`,
    );
    element.style.setProperty('--arn-probe-font-size', `var(--arn-control-font-size-${size})`);
    element.style.setProperty('--arn-probe-radius', 'calc(var(--arn-radius) * 0.8)');
    return element;
  }

  const heightOf = (element: HTMLElement): number => lengthOf(element, 'var(--arn-probe-height)');
  const paddingOf = (element: HTMLElement): number =>
    lengthOf(element, 'var(--arn-probe-padding-inline)');

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  });

  afterEach(() => {
    host.remove();
  });

  it('anlamlı renk ve ölçek token’ları :root’ta tanımlıdır', () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const missing = [...semanticColorTokens, ...scaleTokens, ...controlTokens].filter(
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

  it('kontrol token’ları her boyutta beklenen değere çözülür', () => {
    const element = box(host, '', 'none');

    for (const property of controlProperties) {
      const actual = bySize((size) => lengthOf(element, `var(--arn-control-${property}-${size})`));

      // Özellik adı beklentiye eklenir ki hata mesajı hangi token grubunun tutmadığını söylesin
      expect([property, actual]).toEqual([property, expected(property)]);
    }
    expect(lengthOf(element, 'var(--arn-control-min-size)')).toBeCloseTo(1.5 * rem, 3);
  });

  it('kontrol yüksekliği xs’ten xl’e artar', () => {
    const element = box(host, '', 'none');
    const heights = sizes.map((size) => lengthOf(element, `var(--arn-control-height-${size})`));

    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(sizes.length);
  });

  it('data-density yokken yükseklik ve padding kontrol token’ına eşittir', () => {
    const probes = bySize((size) => probe(host, size));

    expect(bySize((size) => heightOf(probes[size]))).toEqual(expected('height'));
    expect(bySize((size) => paddingOf(probes[size]))).toEqual(expected('padding-inline'));
  });

  it('compact yüksekliği ve padding’i çarpanla küçültür, yazı ve ikonu küçültmez', () => {
    const container = density(host, 'compact');
    const probes = bySize((size) => probe(container, size));

    // xs çarpanlı değerde değil, tabanda kalır (aşağıdaki test)
    expect(bySize((size) => heightOf(probes[size]))).toEqual({
      ...expected('height', compact),
      xs: round(1.5 * rem),
    });
    expect(bySize((size) => paddingOf(probes[size]))).toEqual(expected('padding-inline', compact));
    expect(bySize((size) => lengthOf(probes[size], 'var(--arn-probe-font-size)'))).toEqual(
      expected('font-size'),
    );
    expect(
      bySize((size) => lengthOf(probes[size], `var(--arn-control-icon-size-${size})`)),
    ).toEqual(expected('icon-size'));
  });

  // WCAG 2.2 SC 2.5.8: xs çarpanla 21px olurdu, taban 24px'te tutar
  it('compact xs yüksekliği --arn-control-min-size’ın altına düşmez', () => {
    const element = probe(density(host, 'compact'), 'xs');

    expect(heightOf(element)).toBeCloseTo(1.5 * rem, 3);
    expect(heightOf(element)).toBeGreaterThan(controlRem.height.xs * rem * compact);
  });

  it('--arn-control-min-size container’da değiştirilebilir', () => {
    const container = density(host, 'compact');
    container.style.setProperty('--arn-control-min-size', '2rem');

    expect(heightOf(probe(container, 'sm'))).toBeCloseTo(2 * rem, 3);
  });

  it('iç içe density’de en yakın olan geçerlidir', () => {
    const outer = density(host, 'compact');
    const comfortableInCompact = density(outer, 'comfortable');
    const compactAgain = density(comfortableInCompact, 'compact');
    const md = controlRem.height.md * rem;

    expect(heightOf(probe(outer, 'md'))).toBeCloseTo(md * compact, 3);
    expect(heightOf(probe(comfortableInCompact, 'md'))).toBeCloseTo(md, 3);
    expect(heightOf(probe(compactAgain, 'md'))).toBeCloseTo(md * compact, 3);
  });

  // [data-density] kuralı :root bloğundan sonra durduğu için kökte de kazanır
  it('data-density kök elemanda da çalışır', () => {
    const root = document.documentElement;
    const element = probe(host, 'md');

    root.setAttribute('data-density', 'compact');
    try {
      expect(heightOf(element)).toBeCloseTo(controlRem.height.md * rem * compact, 3);
    } finally {
      root.removeAttribute('data-density');
    }
  });

  // SKILL §5: host'ta hesaplanan token container'daki tabanı izler, :root'ta türetilen adım izlemez
  it('container’da taban değişince host’ta hesaplanan token güncellenir', () => {
    const container = box(host, '', 'none');
    const element = probe(container, 'md');
    const rootStep = lengthOf(element, 'var(--arn-radius-md)');

    container.style.setProperty('--arn-radius', '100px');

    expect(lengthOf(element, 'var(--arn-probe-radius)')).toBeCloseTo(80, 3);
    expect(lengthOf(element, 'var(--arn-radius-md)')).toBeCloseTo(rootStep, 3);
  });

  it('container’da kontrol token’ı değişince host’taki yükseklik onu izler', () => {
    const container = density(host, 'compact');
    container.style.setProperty('--arn-control-height-md', '3rem');

    expect(heightOf(probe(container, 'md'))).toBeCloseTo(3 * rem * compact, 3);
  });
});
