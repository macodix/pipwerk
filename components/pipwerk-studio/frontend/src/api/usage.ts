import type { StrategyDocument } from '../document/types';
import {
  expectArray,
  expectBoolean,
  expectNullableString,
  expectRecord,
  expectString,
  isScalar,
  requestJson,
  ResponseFormatError,
} from './http';

/**
 * The use of the instances of a strategy as the backend reports it (specification 3.3, `POST /api/v1/usage`): the element
 * of the first use of each instance, the elements at which it is usable and, per element, the values it uses. The user
 * interface neither finds the first use nor walks the flow (specification E2).
 */

export type UseKind = 'input' | 'expression' | 'rule' | 'data_link';
export type FirstUseSource = 'stored' | 'flow' | 'instance' | 'rule';
export type MemberKind = 'property' | 'method';

/** A property or method of an instance that an element uses. `arguments` are the fixed values of a method's arguments. */
export type MemberUse = { name: string; kind: MemberKind; arguments: (string | number | boolean)[]; refresh: boolean };

/** How an element uses an instance; `byInstance` is the key of another instance whose data connection uses it. */
export type ElementUse = { instance: string; kind: UseKind; byInstance: string | null; members: MemberUse[] };

export type InstanceUsage = {
  /** The identifier in expressions of the instance. */
  instance: string;
  name: string;
  /** The element that shows the instance. */
  element: string;
  objectType: string;
  canRefresh: boolean;
  connected: boolean;
  firstUse: string | null;
  firstUseSource: FirstUseSource | null;
  usableEverywhere: boolean;
  usableAt: string[];
  /** The list `usableAt` was left out because the answer reached its limit: the instance is treated as usable. */
  usableAtOmitted: boolean;
};

export type ElementUsage = { element: string; uses: ElementUse[] };

export type UsageReport = {
  instances: InstanceUsage[];
  elements: ElementUsage[];
  strategyRules: ElementUse[];
  truncated: boolean;
};

const useKinds: readonly string[] = ['input', 'expression', 'rule', 'data_link'];
const sources: readonly string[] = ['stored', 'flow', 'instance', 'rule'];

function parseMember(value: unknown, what: string): MemberUse {
  const record = expectRecord(value, what);
  const kind = expectString(record.kind, `${what}.kind`);
  if (kind !== 'property' && kind !== 'method') {
    throw new ResponseFormatError(`${what}.kind`);
  }
  const args = expectArray(record.arguments ?? [], `${what}.arguments`).map((item, index) => {
    if (!isScalar(item) || item === null) {
      throw new ResponseFormatError(`${what}.arguments[${index}]`);
    }
    return item;
  });
  return { name: expectString(record.name, `${what}.name`), kind, arguments: args, refresh: record.refresh === true };
}

function parseUse(value: unknown, what: string): ElementUse {
  const record = expectRecord(value, what);
  const kind = expectString(record.kind, `${what}.kind`);
  if (!useKinds.includes(kind)) {
    throw new ResponseFormatError(`${what}.kind`);
  }
  return {
    instance: expectString(record.instance, `${what}.instance`),
    kind: kind as UseKind,
    byInstance: expectNullableString(record.by_instance, `${what}.by_instance`),
    members: expectArray(record.members ?? [], `${what}.members`).map((item, index) => parseMember(item, `${what}.members[${index}]`)),
  };
}

function parseInstance(value: unknown, what: string): InstanceUsage {
  const record = expectRecord(value, what);
  const source = record.first_use_source === null || record.first_use_source === undefined ? null : expectString(record.first_use_source, `${what}.first_use_source`);
  if (source !== null && !sources.includes(source)) {
    throw new ResponseFormatError(`${what}.first_use_source`);
  }
  return {
    instance: expectString(record.instance, `${what}.instance`),
    name: expectString(record.name, `${what}.name`),
    element: expectString(record.element, `${what}.element`),
    objectType: expectString(record.object_type, `${what}.object_type`),
    canRefresh: record.can_refresh === true,
    connected: expectBoolean(record.connected, `${what}.connected`),
    firstUse: expectNullableString(record.first_use, `${what}.first_use`),
    firstUseSource: source as FirstUseSource | null,
    usableEverywhere: expectBoolean(record.usable_everywhere, `${what}.usable_everywhere`),
    usableAt: expectArray(record.usable_at ?? [], `${what}.usable_at`).map((item, index) => expectString(item, `${what}.usable_at[${index}]`)),
    usableAtOmitted: record.usable_at_omitted === true,
  };
}

export function parseUsageReport(value: unknown): UsageReport {
  const record = expectRecord(value, 'usage');
  return {
    instances: expectArray(record.instances, 'instances').map((item, index) => parseInstance(item, `instances[${index}]`)),
    elements: expectArray(record.elements ?? [], 'elements').map((item, index) => {
      const entry = expectRecord(item, `elements[${index}]`);
      return {
        element: expectString(entry.element, `elements[${index}].element`),
        uses: expectArray(entry.uses ?? [], `elements[${index}].uses`).map((use, at) => parseUse(use, `elements[${index}].uses[${at}]`)),
      };
    }),
    strategyRules: expectArray(record.strategy_rules ?? [], 'strategy_rules').map((item, index) => parseUse(item, `strategy_rules[${index}]`)),
    truncated: record.truncated === true,
  };
}

/** Asks which element uses which instance of the open strategy, and where each instance is usable. */
export async function requestUsage(document: StrategyDocument, signal?: AbortSignal): Promise<UsageReport> {
  return parseUsageReport(await requestJson('/api/v1/usage', { method: 'POST', body: { document }, signal }));
}
