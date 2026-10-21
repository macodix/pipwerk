import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';
import {
  expectArray,
  expectBoolean,
  expectNullableString,
  expectNumber,
  expectRecord,
  expectString,
  isRecord,
  requestJson,
  ResponseFormatError,
  type JsonRecord,
} from './http';

/** The kinds of objects the backend stores (`<art>` in the paths of the Web API). */
export type ObjectArt = 'strategies' | 'indicators' | 'trends' | 'rules' | 'rulesets';

export const templateArts: readonly ObjectArt[] = ['indicators', 'trends', 'rules', 'rulesets'];

export type FindingLevel = 'error' | 'hint';

/** A finding of the consistency check (specification 3.6): the identifier names the problem, the details fill its text. */
export type Finding = {
  level: FindingLevel;
  code: string;
  element: string | null;
  subject: string | null;
  details: Record<string, unknown>;
};

export type ObjectListEntry = {
  id: string;
  name: string | null;
  description: string | null;
  objectType: string | null;
  /** Time of the last change, ISO 8601. */
  modified: string;
  unreadable: boolean;
};

export type SavedStrategy = {
  id: string;
  /** The document as the backend stored it; `null` if the answer does not repeat it. */
  document: StrategyDocument | null;
  findings: Finding[];
};

function parseFinding(value: unknown, what: string): Finding {
  const record = expectRecord(value, what);
  const level = record.level;
  if (level !== 'error' && level !== 'hint') {
    throw new ResponseFormatError(`${what}.level`);
  }
  const details = record.details;
  if (details !== undefined && details !== null && !isRecord(details)) {
    throw new ResponseFormatError(`${what}.details`);
  }
  return {
    level,
    code: expectString(record.code, `${what}.code`),
    element: expectNullableString(record.element, `${what}.element`),
    subject: expectNullableString(record.subject, `${what}.subject`),
    details: details ?? {},
  };
}

export function parseFindings(value: unknown, what = 'findings'): Finding[] {
  return expectArray(value, what).map((item, index) => parseFinding(item, `${what}[${index}]`));
}

function parseListEntry(value: unknown, what: string): ObjectListEntry {
  const record = expectRecord(value, what);
  return {
    id: expectString(record.id, `${what}.id`),
    name: expectNullableString(record.name, `${what}.name`),
    description: expectNullableString(record.description, `${what}.description`),
    objectType: expectNullableString(record.object_type, `${what}.object_type`),
    modified: expectString(record.modified, `${what}.modified`),
    unreadable: record.unreadable === undefined ? false : expectBoolean(record.unreadable, `${what}.unreadable`),
  };
}

export function parseObjectList(value: unknown): ObjectListEntry[] {
  const record = expectRecord(value, 'list');
  return expectArray(record.items, 'items').map((item, index) => parseListEntry(item, `items[${index}]`));
}

function parseSaved(value: unknown): SavedStrategy {
  const record = expectRecord(value, 'saved strategy');
  return {
    id: expectString(record.id, 'id'),
    document: record.document === undefined ? null : parseStrategyDocument(record.document),
    findings: record.findings === undefined ? [] : parseFindings(record.findings),
  };
}

export async function listObjects(art: ObjectArt, signal?: AbortSignal): Promise<ObjectListEntry[]> {
  return parseObjectList(await requestJson(`/api/v1/${art}`, { signal }));
}

export async function readStrategy(id: string, signal?: AbortSignal): Promise<StrategyDocument> {
  return parseStrategyDocument(await requestJson(`/api/v1/strategies/${encodeURIComponent(id)}`, { signal }));
}

/** Reads the document of a stored template as a plain record; its content is copied into instances. */
export async function readTemplate(art: ObjectArt, id: string, signal?: AbortSignal): Promise<JsonRecord> {
  const record = expectRecord(await requestJson(`/api/v1/${art}/${encodeURIComponent(id)}`, { signal }), 'template');
  expectString(record.id, 'id');
  expectString(record.object_type, 'object_type');
  expectString(record.name, 'name');
  return record;
}

/** First save: the backend stores the document under the identifier it carries. */
export async function createStrategy(document: StrategyDocument, signal?: AbortSignal): Promise<SavedStrategy> {
  return parseSaved(await requestJson('/api/v1/strategies', { method: 'POST', body: document, signal }));
}

/** Saves again; the identifier in the path is the one of the document. */
export async function replaceStrategy(document: StrategyDocument, signal?: AbortSignal): Promise<SavedStrategy> {
  return parseSaved(
    await requestJson(`/api/v1/strategies/${encodeURIComponent(document.id)}`, {
      method: 'PUT',
      body: document,
      signal,
    }),
  );
}

export async function deleteStrategy(id: string, signal?: AbortSignal): Promise<void> {
  await requestJson(`/api/v1/strategies/${encodeURIComponent(id)}`, { method: 'DELETE', signal });
}

export async function checkDocument(document: StrategyDocument, signal?: AbortSignal): Promise<Finding[]> {
  const record = expectRecord(
    await requestJson('/api/v1/check', { method: 'POST', body: document, signal }),
    'check',
  );
  return parseFindings(record.findings);
}

/** What the new object is, for the key the backend forms when the name gives none (specification 3.3). */
export type KeyKind = 'parameter' | 'property' | 'instance' | 'rule' | 'condition' | 'calculation';

/**
 * The identifier in expressions for a new name (specification 3.3). The backend forms it, so that the user
 * interface does not repeat the rule (E2). `scope` is the JSON Pointer to the list the new entry joins.
 */
export async function createKey(
  document: StrategyDocument,
  scope: string,
  name: string,
  signal?: AbortSignal,
  options?: { kind?: KeyKind; objectType?: string },
): Promise<string> {
  const body: Record<string, unknown> = { document, scope, name };
  if (options?.kind !== undefined) {
    body.kind = options.kind;
  }
  if (options?.objectType !== undefined) {
    body.object_type = options.objectType;
  }
  const record = expectRecord(await requestJson('/api/v1/keys', { method: 'POST', body, signal }), 'key');
  return expectString(record.key, 'key');
}

/** The kinds of block of an expression (specification 3.4). */
export type BlockKind = 'empty' | 'name' | 'literal' | 'comparison' | 'arithmetic' | 'logic' | 'if' | 'function' | 'crossing';

const blockKinds: readonly string[] = ['empty', 'name', 'literal', 'comparison', 'arithmetic', 'logic', 'if', 'function', 'crossing'];

export type LiteralType = 'number' | 'integer' | 'percent' | 'text' | 'boolean';

/**
 * One block of the tree of an expression (specification 3.4). Only the fields that belong to the kind are present:
 * `path` (the identifiers of a name, for example the instance and its property), `value` and `datatype` (a fixed value),
 * `operator` (comparison, arithmetic, logic), `function`, `direction` (crossing) and `children`.
 */
export type ExpressionBlock = {
  kind: BlockKind;
  path?: string[];
  value?: string | number | boolean;
  datatype?: LiteralType;
  operator?: string;
  function?: string;
  direction?: 'up' | 'down' | 'any';
  children?: ExpressionBlock[];
};

/** The kinds of part of an expression the formula view colours (specification 3.4). */
export type TokenKind = 'name' | 'function' | 'value' | 'operator' | 'bracket' | 'separator';

/** A part of the display form: `start` is the first character, `end` the position after the last. */
export type ExpressionToken = { start: number; end: number; kind: TokenKind; partner: number | null };

export type VisibleChoice = { id: string; label: { de: string; en: string } };

/** A property of a name that an expression can address at a place. */
export type VisibleProperty = {
  key: string;
  label: { de: string; en: string };
  datatype: string | null;
  explanation: { de: string; en: string } | null;
  choices: VisibleChoice[];
  /** The property has an earlier value (`PREVIOUS` may stand around it). */
  previousValue: boolean;
};

export type VisibleNameKind = 'instance' | 'result' | 'strategy_parameter' | 'parameter' | 'application_object' | 'rule';

/** A name that an expression can address at the place, with its properties. */
export type VisibleName = {
  display: string;
  path: string[];
  kind: VisibleNameKind;
  datatype: string | null;
  properties: VisibleProperty[];
  propertiesTruncated: boolean;
  /** The instances and rules contained in an instance, a trend or a ruleset. */
  contents: VisibleName[];
};

export type ExpressionAnswer = {
  stored: string;
  /** The expression in the display form, in the language of the request. */
  display: string;
  /** The expression as a readable sentence in the language asked for; `null` with a typing error. */
  sentence: string | null;
  /** The blocks of the expression; `null` if the expression has a typing error. */
  blocks: ExpressionBlock | null;
  blocksOmitted: boolean;
  tokens: ExpressionToken[];
  findings: Finding[];
  findingsTruncated: boolean;
  /** The names visible at the place. */
  names: VisibleName[];
  namesTruncated: boolean;
};

/** A question about the expression at a place: exactly one of `stored`, `display` and `blocks` is given. */
export type ExpressionQuery = { pointer: string; stored?: string; display?: string; blocks?: ExpressionBlock };

function optionalString(value: unknown, what: string): string | undefined {
  return value === null || value === undefined ? undefined : expectString(value, what);
}

function parseBlock(value: unknown, what: string): ExpressionBlock {
  const record = expectRecord(value, what);
  const kind = expectString(record.kind, `${what}.kind`);
  if (!blockKinds.includes(kind)) {
    throw new ResponseFormatError(`${what}.kind`);
  }
  const block: ExpressionBlock = { kind: kind as BlockKind };
  // The backend writes every field of a block; one that does not apply to the kind is `null`.
  if (record.path !== null && record.path !== undefined) {
    block.path = expectArray(record.path, `${what}.path`).map((item, index) => expectString(item, `${what}.path[${index}]`));
  }
  const literal = record.value;
  if (typeof literal === 'string' || typeof literal === 'number' || typeof literal === 'boolean') {
    block.value = literal;
  }
  const datatype = optionalString(record.datatype, `${what}.datatype`);
  if (datatype !== undefined) {
    block.datatype = datatype as LiteralType;
  }
  const operator = optionalString(record.operator, `${what}.operator`);
  if (operator !== undefined) {
    block.operator = operator;
  }
  const functionName = optionalString(record.function, `${what}.function`);
  if (functionName !== undefined) {
    block.function = functionName;
  }
  const direction = optionalString(record.direction, `${what}.direction`);
  if (direction === 'up' || direction === 'down' || direction === 'any') {
    block.direction = direction;
  }
  if (record.children !== undefined && record.children !== null) {
    const children = expectArray(record.children, `${what}.children`).map((item, index) => parseBlock(item, `${what}.children[${index}]`));
    if (children.length > 0) {
      block.children = children;
    }
  }
  return block;
}

function parseTokens(value: unknown, what: string): ExpressionToken[] {
  return expectArray(value, what).map((item, index) => {
    const record = expectRecord(item, `${what}[${index}]`);
    return {
      start: expectNumber(record.start, `${what}[${index}].start`),
      end: expectNumber(record.end, `${what}[${index}].end`),
      kind: expectString(record.kind, `${what}[${index}].kind`) as TokenKind,
      partner: record.partner === null || record.partner === undefined ? null : expectNumber(record.partner, `${what}[${index}].partner`),
    };
  });
}

function parseLabelPair(value: unknown, what: string): { de: string; en: string } {
  const record = expectRecord(value, what);
  return { de: expectString(record.de, `${what}.de`), en: expectString(record.en, `${what}.en`) };
}

function parseVisibleName(value: unknown, what: string): VisibleName {
  const record = expectRecord(value, what);
  return {
    display: expectString(record.display, `${what}.display`),
    path: expectArray(record.path, `${what}.path`).map((item, index) => expectString(item, `${what}.path[${index}]`)),
    kind: expectString(record.kind, `${what}.kind`) as VisibleNameKind,
    datatype: expectNullableString(record.datatype, `${what}.datatype`),
    properties: expectArray(record.properties ?? [], `${what}.properties`).map((item, index) => {
      const property = expectRecord(item, `${what}.properties[${index}]`);
      return {
        key: expectString(property.key, `${what}.properties[${index}].key`),
        label: parseLabelPair(property.label, `${what}.properties[${index}].label`),
        datatype: expectNullableString(property.datatype, `${what}.properties[${index}].datatype`),
        explanation:
          property.explanation === null || property.explanation === undefined
            ? null
            : parseLabelPair(property.explanation, `${what}.properties[${index}].explanation`),
        choices: expectArray(property.choices ?? [], `${what}.properties[${index}].choices`).map((choice, choiceIndex) => {
          const entry = expectRecord(choice, `${what}.properties[${index}].choices[${choiceIndex}]`);
          return {
            id: expectString(entry.id, `${what}.properties[${index}].choices[${choiceIndex}].id`),
            label: parseLabelPair(entry.label, `${what}.properties[${index}].choices[${choiceIndex}].label`),
          };
        }),
        previousValue: property.previous_value === true,
      };
    }),
    propertiesTruncated: record.properties_truncated === true,
    contents: expectArray(record.contents ?? [], `${what}.contents`).map((item, index) => parseVisibleName(item, `${what}.contents[${index}]`)),
  };
}

function parseExpressionAnswer(value: unknown, what: string): ExpressionAnswer {
  const record = expectRecord(value, what);
  return {
    stored: expectString(record.stored, `${what}.stored`),
    display: expectString(record.display, `${what}.display`),
    sentence: expectNullableString(record.sentence, `${what}.sentence`),
    blocks: record.blocks === null || record.blocks === undefined ? null : parseBlock(record.blocks, `${what}.blocks`),
    blocksOmitted: record.blocks_omitted === true,
    tokens: record.tokens === undefined ? [] : parseTokens(record.tokens, `${what}.tokens`),
    findings: record.findings === undefined ? [] : parseFindings(record.findings, `${what}.findings`),
    findingsTruncated: record.findings_truncated === true,
    names: expectArray(record.names ?? [], `${what}.names`).map((item, index) => parseVisibleName(item, `${what}.names[${index}]`)),
    namesTruncated: record.names_truncated === true,
  };
}

/** The most entries the backend accepts in one request (specification of order 04, "Grenzen"). */
export const MAX_EXPRESSIONS_PER_REQUEST = 50;

/** Asks for sentence, display form and blocks of expressions in their place in the document. The answer keeps the order of the query. */
export async function requestExpressions(
  document: StrategyDocument,
  language: 'de' | 'en',
  queries: readonly ExpressionQuery[],
  signal?: AbortSignal,
): Promise<ExpressionAnswer[]> {
  const answers: ExpressionAnswer[] = [];
  for (let start = 0; start < queries.length; start += MAX_EXPRESSIONS_PER_REQUEST) {
    const part = queries.slice(start, start + MAX_EXPRESSIONS_PER_REQUEST);
    const record = expectRecord(
      await requestJson('/api/v1/expressions', {
        method: 'POST',
        body: { document, language, items: part },
        signal,
      }),
      'expressions',
    );
    const items = expectArray(record.items, 'items');
    if (items.length !== part.length) {
      throw new ResponseFormatError('items');
    }
    items.forEach((item, index) => answers.push(parseExpressionAnswer(item, `items[${index}]`)));
  }
  return answers;
}
