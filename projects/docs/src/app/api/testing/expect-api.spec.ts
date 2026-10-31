import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  input,
  model,
  output,
} from '@angular/core';
import { ArnRippleDirective } from '@arn-ng/ui/ripple';
import {
  apiMismatches,
  directiveTemplateNames,
  expectApiMatchesComponent,
  type DocsApiNames,
} from './expect-api';

@Component({
  selector: 'docs-api-fixture',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ApiFixtureComponent {
  readonly label = input<string>();
  readonly size = input('md');
  readonly value = model(0);
  readonly changed = output<number>();
}

@Directive({ selector: '[docsApiFixture]' })
class ApiFixtureDirective {
  readonly docsApiFixture = input<string>();
  readonly docsApiFixtureTone = input(false, { transform: booleanAttribute });
  readonly docsApiFixtureFired = output();
}

/** A plain class: no Angular definition at all. */
class NotAngularFixture {
  readonly label = 'plain';
}

/** A class with a definition Angular never emits (inputs as a list). */
class UnknownShapeFixture {
  static readonly ɵdir = { inputs: [['docsSomething']], outputs: {} };
  readonly label = 'unknown';
}

/** The fixture's real API, by template name. */
const MATCHING: DocsApiNames = {
  inputs: [{ name: 'label' }, { name: 'size' }, { name: 'value' }],
  outputs: [{ name: 'valueChange' }, { name: 'changed' }],
};

describe('apiMismatches', () => {
  it('returns an empty list when the tables match the component', () => {
    expect(apiMismatches(ApiFixtureComponent, MATCHING)).toEqual([]);
  });

  it('does not depend on the order of the rows', () => {
    expect(
      apiMismatches(ApiFixtureComponent, {
        inputs: [{ name: 'value' }, { name: 'label' }, { name: 'size' }],
        outputs: [{ name: 'changed' }, { name: 'valueChange' }],
      }),
    ).toEqual([]);
  });

  it('returns a filled list for a missing input', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      ...MATCHING,
      inputs: [{ name: 'label' }, { name: 'value' }],
    });

    expect(problems).toEqual(['Missing input "size": the code has it, the table does not']);
  });

  it('returns a filled list for an extra input', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      ...MATCHING,
      inputs: [...(MATCHING.inputs ?? []), { name: 'disabled' }],
    });

    expect(problems).toEqual(['Unknown input "disabled": the table has it, the code does not']);
  });

  it('returns a filled list for a wrong name', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      ...MATCHING,
      inputs: [{ name: 'label' }, { name: 'sise' }, { name: 'value' }],
    });

    expect(problems).toEqual([
      'Missing input "size": the code has it, the table does not',
      'Unknown input "sise": the table has it, the code does not',
    ]);
  });

  it('expects the change output of a model()', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      ...MATCHING,
      outputs: [{ name: 'changed' }],
    });

    expect(problems).toEqual(['Missing output "valueChange": the code has it, the table does not']);
  });

  it('returns a filled list for an extra output and for a duplicate row', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      inputs: [...(MATCHING.inputs ?? []), { name: 'label' }],
      outputs: [...(MATCHING.outputs ?? []), { name: 'closed' }],
    });

    expect(problems).toEqual([
      'Duplicate input "label" in the table',
      'Unknown output "closed": the table has it, the code does not',
    ]);
  });

  it('treats missing tables as empty', () => {
    expect(apiMismatches(ApiFixtureComponent, {}).length).toBe(5);
  });

  it('reports a class that is neither a component nor a directive', () => {
    const problems = apiMismatches(NotAngularFixture, {});

    expect(problems.length).toBe(1);
    expect(problems[0]).toContain('cannot be read');
  });
});

describe('apiMismatches for a directive', () => {
  const DIRECTIVE_API: DocsApiNames = {
    inputs: [{ name: 'docsApiFixture' }, { name: 'docsApiFixtureTone' }],
    outputs: [{ name: 'docsApiFixtureFired' }],
  };

  it('returns an empty list when the tables match the directive', () => {
    expect(apiMismatches(ApiFixtureDirective, DIRECTIVE_API)).toEqual([]);
  });

  it('returns a filled list for a missing input, an extra input and a missing output', () => {
    const problems = apiMismatches(ApiFixtureDirective, {
      inputs: [{ name: 'docsApiFixture' }, { name: 'docsApiFixtureSize' }],
    });

    expect(problems).toEqual([
      'Missing input "docsApiFixtureTone": the code has it, the table does not',
      'Unknown input "docsApiFixtureSize": the table has it, the code does not',
      'Missing output "docsApiFixtureFired": the code has it, the table does not',
    ]);
  });

  it('reads the library directive by its template names', () => {
    expect(directiveTemplateNames(ArnRippleDirective)).toEqual({
      inputs: ['arnRipple', 'arnRippleColor', 'arnRippleCentered'],
      outputs: [],
    });
  });

  it('relies on the ɵdir shape Angular emits today (fails on an Angular update that changes it)', () => {
    const definition: unknown = Reflect.get(ApiFixtureDirective, 'ɵdir');
    const inputs: unknown =
      typeof definition === 'object' && definition !== null
        ? Reflect.get(definition, 'inputs')
        : undefined;
    const outputs: unknown =
      typeof definition === 'object' && definition !== null
        ? Reflect.get(definition, 'outputs')
        : undefined;
    const shapes = Object.entries(inputs ?? {}).map(([name, value]: [string, unknown]) => [
      name,
      Array.isArray(value)
        ? value.map((part: unknown) => (part === null ? 'null' : typeof part))
        : typeof value,
    ]);

    // Each input: [minified name, flags, transform]. A signal input keeps its transform in the
    // signal, so the third slot is null even with `transform: booleanAttribute`.
    expect(shapes).toEqual([
      ['docsApiFixture', ['string', 'number', 'null']],
      ['docsApiFixtureTone', ['string', 'number', 'null']],
    ]);
    expect(outputs).toEqual({ docsApiFixtureFired: 'docsApiFixtureFired' });
  });

  it('gives null instead of guessing when the definition has an unknown shape', () => {
    expect(directiveTemplateNames(UnknownShapeFixture)).toBeNull();
    expect(apiMismatches(UnknownShapeFixture, {})[0]).toContain('cannot be read');
  });
});

describe('expectApiMatchesComponent', () => {
  it('passes when the tables match', () => {
    expectApiMatchesComponent(ApiFixtureComponent, MATCHING);
  });

  it('passes for a directive whose tables match', () => {
    expectApiMatchesComponent(ArnRippleDirective, {
      inputs: [{ name: 'arnRipple' }, { name: 'arnRippleColor' }, { name: 'arnRippleCentered' }],
    });
  });
});
