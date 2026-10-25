import type { FunctionDescription } from '../api/elementTypes';
import type { ExpressionToken, VisibleMethod, VisibleName, VisibleProperty } from '../api/objects';
import type { SupportedLanguage } from '../i18n';
import type { TypeIndex } from '../model/typeIndex';

/**
 * Help while a formula is typed (specification 5.4, req-ui-013): the suggestions after `Object.` and after a name,
 * the explanation of the arguments of a function, and the brackets that belong together. Everything comes from the
 * answer of the expression endpoint (tokens, visible names, functions); the text itself is not parsed here (E2).
 */

export type Completion = {
  /** Shown in the list. */
  label: string;
  /** Replaces the part already typed. */
  insert: string;
  /** The datatype or kind, shown beside the label. */
  detail: string;
  /** The explanation of the entry. */
  tip: string;
};

export type CompletionResult = { from: number; items: Completion[] };

/** A name that is no simple name in OpenFormula stands in square brackets (specification 3.4). */
export function displayName(label: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(label) ? label : `[${label}]`;
}

const QUALIFIED = /((?:\[[^\]]*\]|[\p{L}\p{N}_]+)(?:\.(?:\[[^\]]*\]|[\p{L}\p{N}_]+))*)\.([\p{L}\p{N}_]*)$/u;
const WORD = /[\p{L}\p{N}_]+$/u;

function segmentsOf(qualifier: string): string[] {
  const parts: string[] = [];
  const pattern = /\[([^\]]*)\]|([\p{L}\p{N}_]+)/gu;
  for (const match of qualifier.matchAll(pattern)) {
    parts.push((match[1] ?? match[2] ?? '').toLowerCase());
  }
  return parts;
}

type Node = {
  properties: readonly VisibleProperty[];
  methods: readonly VisibleMethod[];
  contents: readonly VisibleName[];
  parameters: readonly VisibleName[];
};

function objectTypeOfProperty(types: TypeIndex | null, key: string): string | null {
  if (types === null) {
    return null;
  }
  for (const type of types.list) {
    for (const property of type.properties) {
      if (property.id === key && property.datatype === 'object' && property.objectType !== null) {
        return property.objectType;
      }
    }
  }
  return null;
}

function nodeOf(name: VisibleName): Node {
  return name.kind === 'strategy_parameter'
    ? { properties: [], methods: [], contents: [], parameters: [name] }
    : { properties: name.properties, methods: name.methods, contents: name.contents, parameters: [] };
}

function matches(name: VisibleName, segment: string): boolean {
  return name.display.toLowerCase() === segment || name.path[0]?.toLowerCase() === segment;
}

/** The nodes the qualifier `a.b.c` names at the place. */
function resolve(segments: readonly string[], names: readonly VisibleName[], types: TypeIndex | null): Node[] {
  const [first, ...rest] = segments;
  if (first === undefined) {
    return [];
  }
  let nodes: Node[] = names.filter((name) => matches(name, first)).map(nodeOf);
  for (const segment of rest) {
    const next: Node[] = [];
    for (const node of nodes) {
      for (const property of node.properties) {
        if (property.key.toLowerCase() === segment || property.label.de.toLowerCase() === segment || property.label.en.toLowerCase() === segment) {
          const objectType = property.datatype === 'object' ? objectTypeOfProperty(types, property.key) : null;
          const target = objectType === null ? undefined : names.find((candidate) => candidate.kind === 'application_object' && candidate.path[0] === objectType);
          if (target !== undefined) {
            next.push(nodeOf(target));
          }
        }
      }
      for (const content of node.contents) {
        if (matches(content, segment) || content.path[content.path.length - 1]?.toLowerCase() === segment) {
          next.push(nodeOf(content));
        }
      }
    }
    nodes = next;
  }
  return nodes;
}

function propertyCompletion(property: VisibleProperty, language: SupportedLanguage): Completion {
  return {
    label: property.label[language],
    insert: displayName(property.label[language]),
    detail: property.datatype ?? '',
    tip: property.explanation === null ? '' : property.explanation[language],
  };
}

/** A method is suggested with its opening bracket: the arguments are explained while they are typed. */
function methodCompletion(method: VisibleMethod, language: SupportedLanguage): Completion {
  return {
    label: method.label[language],
    insert: `${displayName(method.label[language])}(`,
    detail: 'method',
    tip: method.explanation === null ? '' : method.explanation[language],
  };
}

/** The suggestions for the text before the caret, or `null` if there is nothing to suggest. */
export function completionsAt(
  text: string,
  caret: number,
  names: readonly VisibleName[],
  functions: readonly FunctionDescription[],
  types: TypeIndex | null,
  language: SupportedLanguage,
): CompletionResult | null {
  const before = text.slice(0, caret);
  const qualified = QUALIFIED.exec(before);
  if (qualified !== null) {
    const partial = (qualified[2] ?? '').toLowerCase();
    const nodes = resolve(segmentsOf(qualified[1] ?? ''), names, types);
    const items: Completion[] = [];
    const seen = new Set<string>();
    const push = (completion: Completion): void => {
      if (!seen.has(completion.label) && (partial === '' || completion.label.toLowerCase().startsWith(partial))) {
        seen.add(completion.label);
        items.push(completion);
      }
    };
    for (const node of nodes) {
      node.properties.forEach((property) => { push(propertyCompletion(property, language)); });
      node.methods.forEach((method) => { push(methodCompletion(method, language)); });
      node.contents.forEach((content) => {
        push({ label: content.display, insert: displayName(content.display), detail: '', tip: '' });
      });
      node.parameters.forEach((parameter) => {
        push({ label: parameter.display, insert: displayName(parameter.display), detail: parameter.datatype ?? '', tip: '' });
      });
    }
    return items.length === 0 ? null : { from: caret - (qualified[2] ?? '').length, items };
  }
  const word = WORD.exec(before);
  if (word === null) {
    return null;
  }
  const typedWord = word[0].toLowerCase();
  const items: Completion[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    if (name.kind === 'strategy_parameter' || seen.has(name.display)) {
      continue;
    }
    if (name.display.toLowerCase().startsWith(typedWord)) {
      seen.add(name.display);
      items.push({ label: name.display, insert: displayName(name.display), detail: '', tip: '' });
    }
  }
  for (const fn of functions) {
    if (fn.name.toLowerCase().startsWith(typedWord) || fn.label[language].toLowerCase().startsWith(typedWord)) {
      items.push({ label: fn.name, insert: `${fn.name}(`, detail: fn.label[language], tip: fn.explanation[language] });
    }
  }
  return items.length === 0 ? null : { from: caret - word[0].length, items: items.slice(0, 12) };
}

export type CallHint = { fn: FunctionDescription; argument: number };

type OpenCall = { fn: string | null; member: string | null; argument: number };

/** The calls whose brackets the caret is in, the innermost last: the function or the name before the bracket, and the argument the caret is at. */
function openCalls(tokens: readonly ExpressionToken[], text: string, caret: number): OpenCall[] {
  const stack: OpenCall[] = [];
  tokens.forEach((token, index) => {
    if (token.start >= caret) {
      return;
    }
    if (token.kind === 'bracket') {
      if (text[token.start] === '(') {
        const previous = tokens[index - 1];
        const adjacent = previous !== undefined && previous.end === token.start;
        stack.push({
          fn: adjacent && previous.kind === 'function' ? text.slice(previous.start, previous.end) : null,
          member: adjacent && previous.kind === 'name' ? text.slice(previous.start, previous.end) : null,
          argument: 0,
        });
      } else if (token.end <= caret) {
        stack.pop();
      }
    } else if (token.kind === 'separator' && stack.length > 0 && token.end <= caret) {
      const top = stack[stack.length - 1];
      if (top !== undefined) {
        top.argument += 1;
      }
    }
  });
  return stack;
}

/** The function whose brackets the caret is in and the number of the argument it is at, from the tokens of the text. */
export function callAt(tokens: readonly ExpressionToken[], text: string, caret: number, functions: readonly FunctionDescription[]): CallHint | null {
  const top = openCalls(tokens, text, caret).at(-1);
  if (top === undefined || top.fn === null) {
    return null;
  }
  const wanted = top.fn.toUpperCase();
  const fn = functions.find((candidate) => candidate.name === wanted);
  return fn === undefined ? null : { fn, argument: top.argument };
}

export type MethodHint = { method: VisibleMethod; argument: number };

function allNames(names: readonly VisibleName[]): VisibleName[] {
  return names.flatMap((name) => [name, ...allNames(name.contents)]);
}

/** The last part of a name as written: `[EMA 20].[Wert vor]` gives `wert vor`. */
function lastSegment(written: string): string {
  const parts = segmentsOf(written);
  return parts[parts.length - 1] ?? '';
}

/** The method whose brackets the caret is in and the number of its argument, for the explanation of the arguments while typing. */
export function methodCallAt(tokens: readonly ExpressionToken[], text: string, caret: number, names: readonly VisibleName[]): MethodHint | null {
  const top = openCalls(tokens, text, caret).at(-1);
  if (top === undefined || top.member === null) {
    return null;
  }
  const wanted = lastSegment(top.member);
  for (const name of allNames(names)) {
    const method = name.methods.find(
      (candidate) => candidate.key.toLowerCase() === wanted || candidate.label.de.toLowerCase() === wanted || candidate.label.en.toLowerCase() === wanted,
    );
    if (method !== undefined) {
      return { method, argument: top.argument };
    }
  }
  return null;
}

/** The positions of the two brackets that belong together, if the caret stands at one of them. */
export function matchingBrackets(tokens: readonly ExpressionToken[], caret: number): [number, number] | null {
  const index = tokens.findIndex((token) => token.kind === 'bracket' && (token.start === caret || token.start === caret - 1));
  const token = tokens[index];
  if (token === undefined || token.partner === null) {
    return null;
  }
  const partner = tokens[token.partner];
  return partner === undefined ? null : [token.start, partner.start];
}
