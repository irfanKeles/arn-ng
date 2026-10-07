// theme.css is loaded through the `styles` option of the ui test target in angular.json.

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

/** Control dimensions per size, in rem (density not applied). */
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

  /** Appends a box with `className`; its background is the given value. */
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

  /** The computed color of a raw token in the browser (comparison reference). */
  function resolved(token: string): string {
    return backgroundOf(box(host, '', `var(--arn-${token})`));
  }

  /** Appends a container with `data-density`. */
  function density(parent: HTMLElement, value: 'comfortable' | 'compact'): HTMLElement {
    const element = box(parent, '', 'none');
    element.setAttribute('data-density', value);
    return element;
  }

  /** Rounds to three decimals for fractional px comparison. */
  const round = (value: number): number => Math.round(value * 1000) / 1000;

  /** The computed px value of the given length on the element. */
  function lengthOf(element: HTMLElement, value: string): number {
    element.style.inlineSize = value;
    return round(parseFloat(getComputedStyle(element).inlineSize));
  }

  function bySize<T>(read: (size: Size) => T): Record<Size, T> {
    return Object.fromEntries(sizes.map((size) => [size, read(size)])) as Record<Size, T>;
  }

  /** The expected px value of a control token per size, with an optional factor. */
  function expected(property: ControlProperty, factor = 1): Record<Size, number> {
    return bySize((size) => round(controlRem[property][size] * rem * factor));
  }

  /**
   * Temporary probe element that mimics a component host: it computes its own tokens on itself
   * (SKILL §5). There is no component yet; the pattern is the same as in components/_TEMPLATE.md.
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

  it('semantic color and scale tokens are defined on :root', () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const missing = [...semanticColorTokens, ...scaleTokens, ...controlTokens].filter(
      (token) => rootStyle.getPropertyValue(`--arn-${token}`).trim() === '',
    );

    expect(missing).toEqual([]);
  });

  it('overlay layer tokens are plain integers in ascending order', () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const values = ['dropdown', 'popover', 'modal', 'toast', 'tooltip'].map((layer) =>
      rootStyle.getPropertyValue(`--arn-z-${layer}`).trim(),
    );

    expect(values).toEqual(['1000', '1100', '1200', '1300', '1400']);
  });

  it('a layer class alone does nothing: both classes are needed (no clash with consumer CSS)', () => {
    const element = box(host, 'arn-overlay-host-modal', 'none');

    element.style.position = 'relative';

    expect(getComputedStyle(element).zIndex).toBe('auto');
    element.classList.add('arn-overlay-host');

    expect(getComputedStyle(element).zIndex).toBe('1200');
  });

  it('follows the system preference without a class', () => {
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const element = box(host, '', 'var(--arn-background)');

    expect(backgroundOf(element)).toBe(resolved(prefersDark ? 'neutral-950' : 'white'));
  });

  it('.dark forces the dark values', () => {
    const element = box(host, 'dark', 'var(--arn-background)');

    expect(backgroundOf(element)).toBe(resolved('neutral-950'));
    expect(backgroundOf(element)).not.toBe(resolved('white'));
  });

  it('.light forces the light values', () => {
    const element = box(host, 'light', 'var(--arn-background)');

    expect(backgroundOf(element)).toBe(resolved('white'));
  });

  it('with nested classes the nearest one applies', () => {
    const dark = box(host, 'dark', 'var(--arn-primary)');
    const lightInDark = box(dark, 'light', 'var(--arn-primary)');

    expect(backgroundOf(dark)).toBe(resolved('neutral-200'));
    expect(backgroundOf(lightInDark)).toBe(resolved('neutral-900'));
  });

  it('the radius scale derives from --arn-radius', () => {
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

  // Derived steps are computed on :root: the scale re-derives only when the base changes on :root
  it('the scale follows --arn-radius changed on :root, not changed in a container', () => {
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

  it('control tokens resolve to the expected value at every size', () => {
    const element = box(host, '', 'none');

    for (const property of controlProperties) {
      const actual = bySize((size) => lengthOf(element, `var(--arn-control-${property}-${size})`));

      // The property name is added to the expectation so the failure says which token group is off
      expect([property, actual]).toEqual([property, expected(property)]);
    }
    expect(lengthOf(element, 'var(--arn-control-min-size)')).toBeCloseTo(1.5 * rem, 3);
  });

  it('control height increases from xs to xl', () => {
    const element = box(host, '', 'none');
    const heights = sizes.map((size) => lengthOf(element, `var(--arn-control-height-${size})`));

    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(sizes.length);
  });

  it('without data-density, height and padding equal the control token', () => {
    const probes = bySize((size) => probe(host, size));

    expect(bySize((size) => heightOf(probes[size]))).toEqual(expected('height'));
    expect(bySize((size) => paddingOf(probes[size]))).toEqual(expected('padding-inline'));
  });

  it('compact scales height and padding by the factor, not font and icon', () => {
    const container = density(host, 'compact');
    const probes = bySize((size) => probe(container, size));

    // xs stays at the floor, not at the scaled value (see the test below)
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

  // WCAG 2.2 SC 2.5.8: xs would be 21px with the factor; the floor keeps it at 24px
  it('compact xs height does not drop below --arn-control-min-size', () => {
    const element = probe(density(host, 'compact'), 'xs');

    expect(heightOf(element)).toBeCloseTo(1.5 * rem, 3);
    expect(heightOf(element)).toBeGreaterThan(controlRem.height.xs * rem * compact);
  });

  it('--arn-control-min-size can be changed in a container', () => {
    const container = density(host, 'compact');
    container.style.setProperty('--arn-control-min-size', '2rem');

    expect(heightOf(probe(container, 'sm'))).toBeCloseTo(2 * rem, 3);
  });

  it('with nested density the nearest one applies', () => {
    const outer = density(host, 'compact');
    const comfortableInCompact = density(outer, 'comfortable');
    const compactAgain = density(comfortableInCompact, 'compact');
    const md = controlRem.height.md * rem;

    expect(heightOf(probe(outer, 'md'))).toBeCloseTo(md * compact, 3);
    expect(heightOf(probe(comfortableInCompact, 'md'))).toBeCloseTo(md, 3);
    expect(heightOf(probe(compactAgain, 'md'))).toBeCloseTo(md * compact, 3);
  });

  // The [data-density] rule comes after the :root block, so it also wins on the root element
  it('data-density also works on the root element', () => {
    const root = document.documentElement;
    const element = probe(host, 'md');

    root.setAttribute('data-density', 'compact');
    try {
      expect(heightOf(element)).toBeCloseTo(controlRem.height.md * rem * compact, 3);
    } finally {
      root.removeAttribute('data-density');
    }
  });

  // SKILL §5: a token computed on the host follows the container's base; a step derived on :root does not
  it('a token computed on the host updates when the base changes in a container', () => {
    const container = box(host, '', 'none');
    const element = probe(container, 'md');
    const rootStep = lengthOf(element, 'var(--arn-radius-md)');

    container.style.setProperty('--arn-radius', '100px');

    expect(lengthOf(element, 'var(--arn-probe-radius)')).toBeCloseTo(80, 3);
    expect(lengthOf(element, 'var(--arn-radius-md)')).toBeCloseTo(rootStep, 3);
  });

  describe('.arn-rtl-mirror', () => {
    /** Appends an element with the given `dir` (none when omitted). */
    function section(parent: HTMLElement, dir?: 'ltr' | 'rtl'): HTMLElement {
      const element = box(parent, '', 'none');
      if (dir) {
        element.setAttribute('dir', dir);
      }
      return element;
    }

    const scaleOf = (element: HTMLElement): string => getComputedStyle(element).scale;

    it('mirrors the element horizontally in rtl', () => {
      const icon = box(section(host, 'rtl'), 'arn-rtl-mirror', 'none');

      expect(scaleOf(icon)).toBe('-1 1');
    });

    it('leaves the element alone in ltr', () => {
      const withoutDir = box(host, 'arn-rtl-mirror', 'none');
      const inLtr = box(section(host, 'ltr'), 'arn-rtl-mirror', 'none');

      expect(scaleOf(withoutDir)).toBe('none');
      expect(scaleOf(inLtr)).toBe('none');
    });

    it('with nested directions the nearest dir applies', () => {
      const rtl = section(host, 'rtl');
      const ltrInRtl = section(rtl, 'ltr');
      const rtlAgain = section(ltrInRtl, 'rtl');

      expect(scaleOf(box(ltrInRtl, 'arn-rtl-mirror', 'none'))).toBe('none');
      expect(scaleOf(box(rtlAgain, 'arn-rtl-mirror', 'none'))).toBe('-1 1');
    });

    it('does not touch elements without the class', () => {
      expect(scaleOf(box(section(host, 'rtl'), '', 'none'))).toBe('none');
    });

    it('keeps the own transform of the element', () => {
      const icon = box(section(host, 'rtl'), 'arn-rtl-mirror', 'none');
      icon.style.transform = 'rotate(90deg)';

      expect(scaleOf(icon)).toBe('-1 1');
      expect(getComputedStyle(icon).transform).not.toBe('none');
    });
  });

  it('the host height follows a control token changed in a container', () => {
    const container = density(host, 'compact');
    container.style.setProperty('--arn-control-height-md', '3rem');

    expect(heightOf(probe(container, 'md'))).toBeCloseTo(3 * rem * compact, 3);
  });
});
