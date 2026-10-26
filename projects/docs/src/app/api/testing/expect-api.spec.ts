import { ChangeDetectionStrategy, Component, Directive, input, model, output } from '@angular/core';
import { apiMismatches, expectApiMatchesComponent, type DocsApiNames } from './expect-api';

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

    expect(problems).toEqual(['Missing input "size": the component has it, the table does not']);
  });

  it('returns a filled list for an extra input', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      ...MATCHING,
      inputs: [...(MATCHING.inputs ?? []), { name: 'disabled' }],
    });

    expect(problems).toEqual([
      'Unknown input "disabled": the table has it, the component does not',
    ]);
  });

  it('returns a filled list for a wrong name', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      ...MATCHING,
      inputs: [{ name: 'label' }, { name: 'sise' }, { name: 'value' }],
    });

    expect(problems).toEqual([
      'Missing input "size": the component has it, the table does not',
      'Unknown input "sise": the table has it, the component does not',
    ]);
  });

  it('expects the change output of a model()', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      ...MATCHING,
      outputs: [{ name: 'changed' }],
    });

    expect(problems).toEqual([
      'Missing output "valueChange": the component has it, the table does not',
    ]);
  });

  it('returns a filled list for an extra output and for a duplicate row', () => {
    const problems = apiMismatches(ApiFixtureComponent, {
      inputs: [...(MATCHING.inputs ?? []), { name: 'label' }],
      outputs: [...(MATCHING.outputs ?? []), { name: 'closed' }],
    });

    expect(problems).toEqual([
      'Duplicate input "label" in the table',
      'Unknown output "closed": the table has it, the component does not',
    ]);
  });

  it('treats missing tables as empty', () => {
    expect(apiMismatches(ApiFixtureComponent, {}).length).toBe(5);
  });

  it('reports a directive, whose API it cannot read', () => {
    const problems = apiMismatches(ApiFixtureDirective, { inputs: [{ name: 'docsApiFixture' }] });

    expect(problems.length).toBe(1);
    expect(problems[0]).toContain('is not a component');
  });
});

describe('expectApiMatchesComponent', () => {
  it('passes when the tables match', () => {
    expectApiMatchesComponent(ApiFixtureComponent, MATCHING);
  });
});
