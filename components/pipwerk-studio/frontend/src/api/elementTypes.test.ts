import { describe, expect, it } from 'vitest';

import typesJson from '../testing/element-types.json';
import { parseElementTypes } from './elementTypes';
import { ResponseFormatError } from './http';

function copy(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(typesJson)) as Record<string, unknown>;
}

describe('parseElementTypes', () => {
  it('reads the answer of the backend', () => {
    const result = parseElementTypes(typesJson);

    expect(result.types.length).toBeGreaterThan(20);
    const condition = result.types.find((type) => type.id === 'flow.condition')!;
    expect(condition).toMatchObject({ kind: 'flow', rulesAllowed: false, onCanvas: true });
    expect(condition.outputs.map((output) => output.id)).toEqual(['wahr', 'falsch']);
    expect(condition.parameters[0]).toMatchObject({ id: 'ausdruck', datatype: 'expression', required: true });
    expect(result.templates).toHaveLength(1);
    expect(result.templates[0]).toMatchObject({ title: 'Risiko je Trade', object_type: 'Regel' });
    expect(result.functions.map((item) => item.name)).toContain('PREVIOUS');
  });

  it('keeps conditions of parameters', () => {
    const result = parseElementTypes(typesJson);

    const modify = result.types.find((type) => type.id === 'flow.modify_order')!;
    const expiry = modify.parameters.find((parameter) => parameter.id === 'ablaufzeit')!;
    expect(expiry.appliesWhen).toEqual({ name: 'gueltigkeit', value: 'bis_zeitpunkt' });
  });

  it.each([
    ['a missing list', (data: Record<string, unknown>) => delete data.types],
    ['a type that is not an object', (data: Record<string, unknown>) => ((data.types as unknown[])[0] = 3)],
    [
      'an unknown kind',
      (data: Record<string, unknown>) => (((data.types as Record<string, unknown>[])[0] as Record<string, unknown>).kind = 'mystery'),
    ],
    [
      'an unknown datatype',
      (data: Record<string, unknown>) => {
        const type = (data.types as { parameters: Record<string, unknown>[] }[]).find((t) => t.parameters.length > 0)!;
        (type.parameters[0] as Record<string, unknown>).datatype = 'quantum';
      },
    ],
    [
      'a label without English',
      (data: Record<string, unknown>) => {
        const first = (data.types as { name: Record<string, unknown> }[])[0]!;
        first.name = { de: 'x' };
      },
    ],
    [
      'a text where a flag is expected',
      (data: Record<string, unknown>) => (((data.types as Record<string, unknown>[])[0] as Record<string, unknown>).on_canvas = 'yes'),
    ],
    [
      'an unknown kind of binding',
      (data: Record<string, unknown>) => {
        const type = (data.types as { parameters: { bindings: unknown[] }[] }[]).find((t) => t.parameters.length > 0)!;
        type.parameters[0]!.bindings = ['magic'];
      },
    ],
    ['a template without an identifier', (data: Record<string, unknown>) => delete (data.templates as Record<string, unknown>[])[0]!.id],
  ])('rejects %s', (_name, damage) => {
    const data = copy();
    damage(data);

    expect(() => parseElementTypes(data)).toThrow(ResponseFormatError);
  });

  it('rejects an answer that is not an object', () => {
    expect(() => parseElementTypes([])).toThrow(ResponseFormatError);
    expect(() => parseElementTypes(null)).toThrow(ResponseFormatError);
  });
});
