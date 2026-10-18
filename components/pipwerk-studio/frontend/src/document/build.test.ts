import { describe, expect, it } from 'vitest';

import { inventedTypes } from '../testing/inventedTypes';
import { loadTestcase, realTypes } from '../testing/fixtures';
import {
  defaultBindings,
  freshName,
  instanceFromTemplate,
  instanceFromType,
  newElementForType,
  newStrategy,
  usedNames,
} from './build';

describe('newStrategy', () => {
  it('is an empty strategy without any element: the user places the triggers (specification 5.2)', () => {
    const document = newStrategy();

    expect(document).toMatchObject({
      format: 'pipwerk.strategy',
      format_version: '1.0',
      title: '',
      description: '',
      parameters: [],
      rules: [],
      connections: [],
    });
    expect(document.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(document.elements).toEqual([]);
  });

  it('gets a new identifier each time', () => {
    expect(newStrategy().id).not.toBe(newStrategy().id);
  });
});

describe('defaultBindings', () => {
  it('takes the standard value, and for a required parameter that is fixed only the first value of its choice', () => {
    const launch = inventedTypes.byId.get('zz.launch')!;
    const gate = inventedTypes.byId.get('zz.gate')!;

    expect(defaultBindings(launch.parameters)).toEqual({ shape: { kind: 'fixed', value: 'ZzOrderA' } });
    expect(defaultBindings(gate.parameters)).toEqual({
      count: { kind: 'fixed', value: 3 },
      mode: { kind: 'fixed', value: 'fast' },
    });
  });
});

describe('elements from types', () => {
  const document = loadTestcase('str-03');

  it('makes an element of the flow with the title of the type', () => {
    const element = newElementForType(document, inventedTypes.byId.get('zz.gate')!, { x: 5, y: 6, language: 'en' });

    expect(element).toMatchObject({ type: 'zz.gate', title: 'zz.gate (en)', x: 5, y: 6, name: null, management_of: null });
    expect(element.instance).toBeUndefined();
    expect(element.parameters.count).toEqual({ kind: 'fixed', value: 3 });
  });

  it('makes an element that holds an instance for an object type, with a name that is free', () => {
    const element = newElementForType(document, realTypes.byId.get('EMA')!, { x: 0, y: 0, language: 'de' });

    expect(element.type).toBe('EMA');
    expect(element.instance).toMatchObject({
      name: 'ema',
      object_type: 'EMA',
      origin: { object_type: 'EMA', template_id: null, template_title: null },
      parameter_values: { verschiebung: { kind: 'fixed', value: 0 }, kursquelle: { kind: 'fixed', value: 'schlusskurs' } },
    });
    // ema20 and ema50 are taken in this strategy, but `ema` is free.
    expect(usedNames(document)).toContain('ema20');
  });

  it('counts up if the name is taken', () => {
    const first = newElementForType(document, realTypes.byId.get('EMA')!, { x: 0, y: 0, language: 'de' });
    const next = { ...document, elements: [...document.elements, first] };

    expect(freshName(next, 'EMA')).toBe('ema1');
  });

  it('puts the element into a management when asked', () => {
    const element = newElementForType(document, realTypes.byId.get('flow.delete_order')!, {
      x: 0,
      y: 0,
      language: 'de',
      managementOf: 'owner',
    });

    expect(element.management_of).toBe('owner');
  });
});

describe('instances', () => {
  it('copies a template completely and sets standard values of its own parameters (specification E4)', () => {
    const template = realTypes.templates[0]!;

    const instance = instanceFromTemplate(template, 'risiko');

    expect(instance.name).toBe('risiko');
    expect(instance.origin).toEqual({
      object_type: 'Regel',
      template_id: template.id,
      template_title: 'Risiko je Trade',
    });
    expect(instance.parameter_values).toEqual({ risikogrenze: { kind: 'fixed', value: 0.01 } });
    expect(instance.expression).toBe(template.expression);
    expect(instance.determined_property).toBe('volumen');
    expect(instance.comparison).toBe('hoechstens');
    // The instance is a copy: changing it does not change the template.
    instance.parameters![0]!.name = 'changed';
    expect((template.parameters as { name: string }[])[0]?.name).toBe('risikogrenze');
  });

  it('creates the instance of the test case "Risiko je Trade" exactly as the test case stores it', () => {
    const document = loadTestcase('str-03');
    const stored = document.rules[0]!;

    const instance = instanceFromTemplate(realTypes.templates[0]!, 'risiko');

    expect(instance).toEqual(stored);
  });

  it('makes a new rule from the object type that is a rule, with an empty expression', () => {
    const rule = instanceFromType(inventedTypes.byId.get('ZzRule')!, 'r1');

    expect(rule).toMatchObject({ name: 'r1', object_type: 'ZzRule', expression: '', determined_property: null });
  });
});
