/**
 * The expression endpoint for the tests of the interface (`FakeApi`): it turns blocks into the stored text and a simple
 * text into blocks, and it names what an expression can use at a place. It knows a small part of the language; the
 * tests of the interface use it where the real backend would answer, and the browser tests run against the real one.
 */

type Json = Record<string, unknown>;

const OPERATORS_BY_PRECEDENCE: readonly (readonly string[])[] = [['=', '<>', '<=', '>=', '<', '>'], ['+', '-'], ['*', '/']];

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function blocksIn(value: unknown): Json[] {
  return Array.isArray(value) ? (value as Json[]) : [];
}

/** The stored text of a tree of blocks (an empty place is the empty text). */
export function blocksToStored(block: Json | null | undefined): string {
  if (block === null || block === undefined) {
    return '';
  }
  const children = blocksIn(block.children).map(blocksToStored);
  switch (block.kind) {
    case 'name':
      return block.call === true ? `${(block.path as string[]).join('.')}(${children.join('; ')})` : (block.path as string[]).join('.');
    case 'literal':
      if (block.datatype === 'text') {
        return `"${text(block.value).replaceAll('"', '""')}"`;
      }
      if (block.datatype === 'boolean') {
        return block.value === true ? 'TRUE()' : 'FALSE()';
      }
      return String(block.value);
    case 'arithmetic':
      return `${children[0] ?? ''} ${text(block.operator)} ${blocksIn(block.children)[1]?.kind === 'arithmetic' ? `(${children[1] ?? ''})` : (children[1] ?? '')}`;
    case 'comparison':
      return `${children[0] ?? ''} ${text(block.operator)} ${children[1] ?? ''}`;
    case 'logic':
      return `${text(block.operator).toUpperCase()}(${children.join('; ')})`;
    case 'if':
      return `IF(${children.join('; ')})`;
    case 'function':
      return `${text(block.function)}(${children.join('; ')})`;
    default:
      return '';
  }
}

type Parsed = { block: Json; rest: string };

function skip(source: string): string {
  return source.trimStart();
}

function parseAtom(source: string): Parsed | null {
  const input = skip(source);
  const number = /^\d+(\.\d+)?/.exec(input);
  if (number !== null) {
    const value = Number(number[0]);
    return { block: { kind: 'literal', value, datatype: Number.isInteger(value) ? 'integer' : 'number' }, rest: input.slice(number[0].length) };
  }
  const quoted = /^"((?:[^"]|"")*)"/.exec(input);
  if (quoted !== null) {
    return { block: { kind: 'literal', value: (quoted[1] ?? '').replaceAll('""', '"'), datatype: 'text' }, rest: input.slice(quoted[0].length) };
  }
  if (input.startsWith('(')) {
    const inner = parseExpression(input.slice(1));
    if (inner === null || !skip(inner.rest).startsWith(')')) {
      return null;
    }
    return { block: inner.block, rest: skip(inner.rest).slice(1) };
  }
  const word = /^[A-Za-z_][A-Za-z0-9_]*/.exec(input);
  if (word === null) {
    return null;
  }
  const afterWord = input.slice(word[0].length);
  if (afterWord.startsWith('(')) {
    const name = word[0].toUpperCase();
    const children: Json[] = [];
    let rest = afterWord.slice(1);
    if (skip(rest).startsWith(')')) {
      rest = skip(rest).slice(1);
    } else {
      for (;;) {
        const argument = parseExpression(rest);
        if (argument === null) {
          return null;
        }
        children.push(argument.block);
        rest = skip(argument.rest);
        if (rest.startsWith(';')) {
          rest = rest.slice(1);
          continue;
        }
        if (rest.startsWith(')')) {
          rest = rest.slice(1);
          break;
        }
        return null;
      }
    }
    if (name === 'TRUE' || name === 'FALSE') {
      return { block: { kind: 'literal', value: name === 'TRUE', datatype: 'boolean' }, rest };
    }
    if (name === 'AND' || name === 'OR' || name === 'NOT') {
      return { block: { kind: 'logic', operator: name.toLowerCase(), children }, rest };
    }
    if (name === 'IF') {
      return { block: { kind: 'if', children }, rest };
    }
    return { block: { kind: 'function', function: name, children }, rest };
  }
  const path = [word[0]];
  let rest = afterWord;
  for (;;) {
    const next = /^\.([A-Za-z_][A-Za-z0-9_]*)/.exec(rest);
    if (next === null) {
      break;
    }
    path.push(next[1] ?? '');
    rest = rest.slice(next[0].length);
  }
  if (path.length > 1 && rest.startsWith('(')) {
    // the result of a method: the blocks of the arguments are the children
    const children: Json[] = [];
    rest = rest.slice(1);
    if (skip(rest).startsWith(')')) {
      return { block: { kind: 'name', path, call: true }, rest: skip(rest).slice(1) };
    }
    for (;;) {
      const argument = parseExpression(rest);
      if (argument === null) {
        return null;
      }
      children.push(argument.block);
      rest = skip(argument.rest);
      if (rest.startsWith(';')) {
        rest = rest.slice(1);
        continue;
      }
      if (rest.startsWith(')')) {
        return { block: { kind: 'name', path, call: true, children }, rest: rest.slice(1) };
      }
      return null;
    }
  }
  return { block: { kind: 'name', path }, rest };
}

function parseLevel(source: string, level: number): Parsed | null {
  const operators = OPERATORS_BY_PRECEDENCE[level];
  if (operators === undefined) {
    return parseAtom(source);
  }
  let left = parseLevel(source, level + 1);
  if (left === null) {
    return null;
  }
  for (;;) {
    const input = skip(left.rest);
    const operator = operators.find((candidate) => input.startsWith(candidate));
    if (operator === undefined) {
      return left;
    }
    const right = parseLevel(input.slice(operator.length), level + 1);
    if (right === null) {
      return null;
    }
    left = {
      block: { kind: level === 0 ? 'comparison' : 'arithmetic', operator, children: [left.block, right.block] },
      rest: right.rest,
    };
  }
}

function parseExpression(source: string): Parsed | null {
  return parseLevel(source, 0);
}

/** The blocks of a stored text; `null` if the text is outside of the part of the language this fake knows. */
export function storedToBlocks(stored: string): Json | null {
  if (stored.trim() === '') {
    return { kind: 'empty' };
  }
  const parsed = parseExpression(stored);
  return parsed === null || parsed.rest.trim() !== '' ? null : parsed.block;
}

// ---- the names an expression can use ----------------------------------------------------------------------------------

const label = (de: string, en: string): { de: string; en: string } => ({ de, en });

/** The word for a data type in trader language, as the library delivers it with the type descriptions. */
const DATATYPE_WORDS: Record<string, { de: string; en: string }> = {
  number: label('Zahl', 'number'),
  integer: label('ganze Zahl', 'whole number'),
  percent: label('Prozentwert', 'percentage'),
  boolean: label('Wahrheitswert', 'true/false value'),
  text: label('Text', 'text'),
};

function property(key: string, de: string, en: string, datatype = 'number', previous = false, choices: Json[] = []): Json {
  return { key, label: label(de, en), datatype, datatype_label: DATATYPE_WORDS[datatype] ?? null, explanation: null, choices, previous_value: previous };
}

function nameOf(display: string, path: string[], kind: string, properties: Json[] = [], datatype: string | null = null, methods: Json[] = []): Json {
  return { display, path, kind, datatype, properties, methods, properties_truncated: false, contents: [] };
}

function pair(value: unknown): { de: string; en: string } {
  const record = typeof value === 'object' && value !== null ? (value as Json) : {};
  return { de: text(record.de), en: text(record.en) };
}

/** The properties and methods the type description of an instance names; a type without methods stands for one value, "Wert". */
function membersOf(type: Json | undefined): { properties: Json[]; methods: Json[] } {
  const methods = blocksIn(type?.methods);
  if (type === undefined || methods.length === 0) {
    return { properties: [property('wert', 'Wert', 'Value', 'number', true)], methods: [] };
  }
  return {
    properties: blocksIn(type.properties).map((entry) => ({
      key: entry.id,
      label: pair(entry.label),
      datatype: entry.datatype,
      datatype_label: entry.datatype_label ?? null,
      explanation: pair(entry.explanation),
      choices: [],
      previous_value: false,
    })),
    methods: methods.map((method) => ({
      key: method.id,
      label: pair(method.label),
      datatype: method.datatype,
      datatype_label: method.datatype_label ?? null,
      explanation: pair(method.explanation),
      choices: [],
      previous_value: false,
      arguments: blocksIn(method.arguments).map((argument) => ({
        key: argument.id,
        label: pair(argument.label),
        datatype: argument.datatype,
        datatype_label: argument.datatype_label ?? null,
        required: argument.required === true,
        default: argument.default ?? null,
        explanation: pair(argument.explanation),
        choices: [],
      })),
    })),
  };
}

/**
 * What can be used in the expressions of the document: its instances, the results of its steps, the parameters, the
 * candle. `usable` says whether the instance of an element can be used at the place of the expression (the real
 * endpoint leaves out the ones that cannot); by default every instance can.
 */
export function namesOf(document: Json, types: ReadonlyMap<string, Json> = new Map(), usable: (instanceKey: string) => boolean = () => true): Json[] {
  const names: Json[] = [];
  for (const element of blocksIn(document.elements)) {
    const instance = element.instance as Json | null | undefined;
    if (instance !== null && instance !== undefined) {
      if (!usable(text(instance.key))) {
        continue;
      }
      const members = membersOf(types.get(text(element.type)));
      names.push(nameOf(text(instance.name), [text(instance.key)], 'instance', members.properties, null, members.methods));
    } else if (typeof element.key === 'string' && element.key !== '') {
      names.push(nameOf(text(element.name), [element.key], 'result', [property('ergebnis', 'Ergebnis', 'Result', 'number', true)]));
    }
  }
  for (const parameter of blocksIn(document.parameters)) {
    names.push(nameOf(text(parameter.name), ['Strategie', text(parameter.key)], 'strategy_parameter', [], text(parameter.datatype)));
  }
  names.push(nameOf('Kerze', ['Kerze'], 'application_object', [property('schluss', 'Schluss', 'Close', 'number', true)]));
  return names;
}
