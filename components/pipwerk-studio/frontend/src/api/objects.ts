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
} from './http';
import { parseStrategyDocument } from '../document/parse';
import type { StrategyDocument } from '../document/types';

/** The kinds of objects the backend stores (`<art>` in the paths of the Web API). */
export type ObjectArt = 'strategies' | 'indicators' | 'trends' | 'rules' | 'rulesets';

export const templateArts: readonly ObjectArt[] = ['indicators', 'trends', 'rules', 'rulesets'];

export type FindingLevel = 'error' | 'hint';

export type Finding = {
  level: FindingLevel;
  code: string;
  element: string | null;
  subject: string | null;
  details: Record<string, unknown>;
};

export type ObjectListEntry = {
  id: string;
  title: string | null;
  description: string | null;
  objectType: string | null;
  /** Time of the last change, ISO 8601. */
  modified: string;
  unreadable: boolean;
};

export type NameSegment = { identifier: string; start: number; end: number };

export type NameOccurrence = {
  start: number;
  end: number;
  identifier: string;
  resolved: boolean;
  previous: boolean;
  segments: NameSegment[];
};

export type ExpressionNames = {
  element: string | null;
  subject: string | null;
  field: string;
  names: NameOccurrence[];
};

export type CheckResult = {
  findings: Finding[];
  expressions: ExpressionNames[];
  namesTruncated: boolean;
};

export type SavedStrategy = {
  id: string;
  document: StrategyDocument;
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
    title: expectNullableString(record.title, `${what}.title`),
    description: expectNullableString(record.description, `${what}.description`),
    objectType: expectNullableString(record.object_type, `${what}.object_type`),
    modified: expectString(record.modified, `${what}.modified`),
    unreadable: expectBoolean(record.unreadable, `${what}.unreadable`),
  };
}

export function parseObjectList(value: unknown): ObjectListEntry[] {
  const record = expectRecord(value, 'list');
  return expectArray(record.items, 'items').map((item, index) => parseListEntry(item, `items[${index}]`));
}

function parseNames(value: unknown, what: string): NameOccurrence[] {
  return expectArray(value, what).map((item, index) => {
    const record = expectRecord(item, `${what}[${index}]`);
    return {
      start: expectNumber(record.start, `${what}[${index}].start`),
      end: expectNumber(record.end, `${what}[${index}].end`),
      identifier: expectString(record.identifier, `${what}[${index}].identifier`),
      resolved: expectBoolean(record.resolved, `${what}[${index}].resolved`),
      previous: expectBoolean(record.previous, `${what}[${index}].previous`),
      segments: expectArray(record.segments, `${what}[${index}].segments`).map((segment, position) => {
        const part = expectRecord(segment, `${what}[${index}].segments[${position}]`);
        return {
          identifier: expectString(part.identifier, `${what}[${index}].segments[${position}].identifier`),
          start: expectNumber(part.start, `${what}[${index}].segments[${position}].start`),
          end: expectNumber(part.end, `${what}[${index}].segments[${position}].end`),
        };
      }),
    };
  });
}

export function parseCheckResult(value: unknown): CheckResult {
  const record = expectRecord(value, 'check');
  return {
    findings: parseFindings(record.findings),
    expressions: expectArray(record.expressions, 'expressions').map((item, index) => {
      const expression = expectRecord(item, `expressions[${index}]`);
      return {
        element: expectNullableString(expression.element, `expressions[${index}].element`),
        subject: expectNullableString(expression.subject, `expressions[${index}].subject`),
        field: expectString(expression.field, `expressions[${index}].field`),
        names: parseNames(expression.names, `expressions[${index}].names`),
      };
    }),
    namesTruncated: expectBoolean(record.names_truncated, 'names_truncated'),
  };
}

function parseSaved(value: unknown): SavedStrategy {
  const record = expectRecord(value, 'saved strategy');
  return {
    id: expectString(record.id, 'id'),
    document: parseStrategyDocument(record.document),
    findings: parseFindings(record.findings),
  };
}

export async function listObjects(art: ObjectArt, signal?: AbortSignal): Promise<ObjectListEntry[]> {
  return parseObjectList(await requestJson(`/api/v1/${art}`, { signal }));
}

export async function readStrategy(id: string, signal?: AbortSignal): Promise<StrategyDocument> {
  return parseStrategyDocument(await requestJson(`/api/v1/strategies/${encodeURIComponent(id)}`, { signal }));
}

/** Reads a template document (an indicator, trend, rule or rule set) as a plain record; its content is copied into instances. */
export async function readTemplate(
  art: ObjectArt,
  id: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const record = expectRecord(
    await requestJson(`/api/v1/${art}/${encodeURIComponent(id)}`, { signal }),
    'template',
  );
  expectString(record.id, 'id');
  expectString(record.object_type, 'object_type');
  expectString(record.title, 'title');
  return record;
}

/** First save: the backend assigns a new identifier. */
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

export async function checkDocument(document: StrategyDocument, signal?: AbortSignal): Promise<CheckResult> {
  return parseCheckResult(await requestJson('/api/v1/check', { method: 'POST', body: document, signal }));
}
