import { describe, expect, it } from 'vitest';

import type { ElementDocument, StrategyDocument } from '../document/types';
import { inventedStrategy, inventedTypesWithMethod } from '../testing/inventedTypes';
import { usesOf } from '../testing/uses';
import { defaultArgument, defaultArguments, inputRefOf, memberChoices, usedValueGroups } from './usedValues';
import { buildUsageModel } from './uses';
import { reportOf, instanceUsage } from '../testing/uses';

const types = inventedTypesWithMethod();

const gauge: ElementDocument = {
  id: 'g1',
  type: 'zz.gauge',
  name: null,
  key: null,
  position: null,
  parameters: {},
  properties: {},
  inputs: [],
  rules: [],
  management_of: null,
  instance: { name: 'Pegel', key: 'pegel', object_type: 'zz.gauge', first_use: null, parameter_values: {} },
};

function documentWith(inputs: ElementDocument['inputs']): StrategyDocument {
  const base = inventedStrategy();
  return {
    ...base,
    elements: base.elements.map((element) => (element.name === 'Tun' ? { ...element, inputs } : element)).concat(gauge),
  };
}

describe('the properties and methods an object supplies', () => {
  it('lists the properties of the type, then its methods, then the own properties of the instance', () => {
    const type = types.byId.get('zz.gauge');
    const choices = memberChoices(type, { ...(gauge.instance as NonNullable<ElementDocument['instance']>), properties: [{ name: 'Eigen', key: 'eigen', datatype: 'number', expression: '' }] }, 'de');
    expect(choices.map((choice) => [choice.value, choice.label, choice.kind])).toEqual([
      ['p:stand', 'Stand', 'property'],
      ['m:mittel', 'Mittel', 'method'],
      ['p:eigen', 'Eigen', 'property'],
    ]);
    expect(choices[1]?.arguments.map((argument) => argument.id)).toEqual(['anzahl', 'gewicht']);
    expect(memberChoices(type, null, 'en')[1]?.label).toBe('Average');
  });

  it('starts an argument with its standard value, else with a value that fits its data type', () => {
    const [mean] = types.byId.get('zz.gauge')?.methods ?? [];
    expect(defaultArguments(mean as NonNullable<typeof mean>)).toEqual([1, 1]);
    const base = (mean as NonNullable<typeof mean>).arguments[0] as NonNullable<typeof mean>['arguments'][number];
    expect(defaultArgument({ ...base, datatype: 'boolean', default: null })).toBe(false);
    expect(defaultArgument({ ...base, datatype: 'text', default: null })).toBe('');
    expect(defaultArgument({ ...base, datatype: 'choice', default: null, choices: [{ id: 'a', label: { de: 'A', en: 'A' } }] })).toBe('a');
    expect(defaultArgument({ ...base, datatype: 'number', default: 2.5 })).toBe(2.5);
  });

  it('forms the input of a choice: a property without arguments, a method with the given or the standard arguments', () => {
    const choices = memberChoices(types.byId.get('zz.gauge'), null, 'de');
    expect(inputRefOf('pegel', choices[0] as never)).toEqual({ instance: 'pegel', property: 'stand', kind: 'property', arguments: [] });
    expect(inputRefOf('pegel', choices[1] as never)).toEqual({ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [1, 1] });
    expect(inputRefOf('pegel', choices[1] as never, [7])).toEqual({ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [7] });
  });
});

describe('the values an element uses (specification 5.4)', () => {
  const language = 'de';

  it('groups the values of the inputs by object, a method with other arguments being a value of its own', () => {
    const document = documentWith([
      { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 0.5], refresh: false },
      { instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: true },
      { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [7, 1], refresh: true },
    ]);
    const element = document.elements.find((candidate) => candidate.name === 'Tun') as ElementDocument;
    const groups = usedValueGroups(document, types, usesOf(document, types), element, language);

    expect(groups.map((group) => [group.name, group.rows.length])).toEqual([
      ['Pegel', 2],
      ['Messer', 1],
    ]);
    expect(groups[0]?.rows.map((row) => [row.member.arguments, row.refresh])).toEqual([[[3, 0.5], false], [[7, 1], true]]);
    expect(groups[1]?.rows[0]).toMatchObject({ input: true, refresh: true, expression: false });
  });

  it('adds the values that only an expression, a rule or an assignment names, to the row of an input of the same value', () => {
    const document = documentWith([{ instance: 'messer', property: 'stand', kind: 'property', arguments: [], refresh: false }]);
    const element = document.elements.find((candidate) => candidate.name === 'Tun') as ElementDocument;
    const messer = document.elements.find((candidate) => candidate.instance?.key === 'messer') as ElementDocument;
    const report = reportOf({
      instances: [instanceUsage({ instance: 'messer', element: messer.id, firstUse: element.id, canRefresh: false })],
      elements: [
        {
          element: element.id,
          uses: [
            { instance: 'messer', kind: 'expression', byInstance: null, members: [{ name: 'stand', kind: 'property', arguments: [], refresh: false }, { name: 'hoch', kind: 'property', arguments: [], refresh: false }] },
            { instance: 'messer', kind: 'rule', byInstance: null, members: [{ name: 'tief', kind: 'property', arguments: [], refresh: false }] },
            // a use that applies here only because another object takes the value is not the element's own
            { instance: 'messer', kind: 'data_link', byInstance: 'pegel', members: [{ name: 'trend', kind: 'property', arguments: [], refresh: false }] },
          ],
        },
      ],
    });
    const uses = buildUsageModel(document, types, report, new Map());
    const [group] = usedValueGroups(document, types, uses, element, language);

    expect(group?.rows.map((row) => [row.member.name, row.input, row.expression, row.rule])).toEqual([
      ['stand', true, true, false],
      ['hoch', false, true, false],
      ['tief', false, false, true],
    ]);
  });

  it('knows whether the object can refresh from the report', () => {
    const document = documentWith([{ instance: 'pegel', property: 'stand', kind: 'property', arguments: [], refresh: false }]);
    const element = document.elements.find((candidate) => candidate.name === 'Tun') as ElementDocument;
    const [group] = usedValueGroups(document, types, usesOf(document, types), element, language);
    // without a report the type description says: the gauge can refresh
    expect(group?.canRefresh).toBe(true);
  });
});
