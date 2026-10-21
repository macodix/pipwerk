import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';
import {
  expectArray,
  expectBoolean,
  expectNullableString,
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

/**
 * The identifier in expressions for a new name (specification 3.3). The backend forms it, so that the user
 * interface does not repeat the rule (E2). `scope` is the JSON Pointer to the list the new entry joins.
 */
export async function createKey(
  document: StrategyDocument,
  scope: string,
  name: string,
  signal?: AbortSignal,
): Promise<string> {
  const record = expectRecord(
    await requestJson('/api/v1/keys', { method: 'POST', body: { document, scope, name }, signal }),
    'key',
  );
  return expectString(record.key, 'key');
}

/** One block of the tree of an expression (specification 3.4); the fields beyond these stay as they are. */
export type ExpressionBlock = {
  kind: string;
  /** For a name: the identifiers of the path, for example the instance and its property. */
  path?: string[];
  children?: ExpressionBlock[];
  [field: string]: unknown;
};

export type ExpressionAnswer = {
  stored: string;
  display: string;
  /** The expression as a readable sentence in the language asked for. */
  sentence: string;
  /** The blocks of the expression; `null` if the expression has a typing error. */
  blocks: ExpressionBlock | null;
  findings: Finding[];
};

export type ExpressionQuery = { pointer: string; stored: string };

function parseBlock(value: unknown, what: string): ExpressionBlock {
  const record = expectRecord(value, what);
  const block: ExpressionBlock = { ...record, kind: expectString(record.kind, `${what}.kind`) };
  // The backend writes every field of a block; one that does not apply to the kind is `null`.
  if (record.path === null || record.path === undefined) {
    delete block.path;
  } else {
    block.path = expectArray(record.path, `${what}.path`).map((item, index) => expectString(item, `${what}.path[${index}]`));
  }
  if (record.children !== undefined && record.children !== null) {
    block.children = expectArray(record.children, `${what}.children`).map((item, index) =>
      parseBlock(item, `${what}.children[${index}]`),
    );
  }
  return block;
}

function parseExpressionAnswer(value: unknown, what: string): ExpressionAnswer {
  const record = expectRecord(value, what);
  return {
    stored: expectString(record.stored, `${what}.stored`),
    display: expectString(record.display, `${what}.display`),
    sentence: expectString(record.sentence, `${what}.sentence`),
    blocks: record.blocks === null || record.blocks === undefined ? null : parseBlock(record.blocks, `${what}.blocks`),
    findings: record.findings === undefined ? [] : parseFindings(record.findings, `${what}.findings`),
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
        body: { document, language, items: part.map((query) => ({ pointer: query.pointer, stored: query.stored })) },
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
