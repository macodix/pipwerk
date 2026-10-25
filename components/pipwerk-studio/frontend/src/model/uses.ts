import type { ElementUsage, ElementUse, InstanceUsage, MemberUse, UsageReport } from '../api/usage';
import type { StrategyDocument } from '../document/types';
import { isConnectionValue } from '../document/types';
import { instanceElementByKey, isCardElement, type ExpressionReference } from './elements';
import type { TypeIndex } from './typeIndex';

/**
 * The lines of values on the drawing area (specification 3.3, 5.3): which instance an element uses, with which
 * properties and methods, and where the instance sits. The facts come from the report of the backend
 * (`/api/v1/usage`, specification E2); only while it is not there (or failed) the document alone gives an
 * approximation: the stored element of the first use, else the first element in the order of the document.
 */

/** A line from the card of an instance to the element (or the card of another instance) that uses its values. */
export type UseLink = {
  /** `src>dst`. */
  key: string;
  /** The element that shows the instance. */
  src: string;
  dst: string;
  /** The line to the element of the first use: drawn always, solid. The others are dashed and can be hidden. */
  first: boolean;
  /** The rows of the card whose values the line carries. */
  rows: string[];
  /** The values with the arguments of a method and "Aktualisieren", in the order the report names them. */
  members: MemberUse[];
};

export type UsageModel = {
  links: UseLink[];
  /** The facts come from the report of the backend and not from the approximation of the document. */
  fromReport: boolean;
  /**
   * Per card (element that shows an instance): the element or card it sits beside, `null` if no element uses it.
   * A card of an instance that only another instance uses sits beside the card of that instance.
   */
  homes: ReadonlyMap<string, string | null>;
  /** Whether the instance has an element of its first use. */
  connected: (card: string) => boolean;
  /** Whether the instance of the card can be connected with the element: it is usable there (specification 3.3). */
  usable: (card: string, target: string) => boolean;
  /** The element of the first use of the instance of the card, if there is one. */
  firstUse: (card: string) => string | null;
};

/** The row of a card a name of a member belongs to: a name inside a contained instance counts for the first identifier. */
export function rowOfMember(name: string): string {
  return name.split('.')[0] ?? name;
}

function memberKey(member: MemberUse): string {
  return JSON.stringify([member.name, member.kind, member.arguments, member.refresh]);
}

function mergeMembers(into: MemberUse[], more: readonly MemberUse[]): void {
  for (const member of more) {
    if (!into.some((existing) => memberKey(existing) === memberKey(member))) {
      into.push(member);
    }
  }
}

/**
 * The report the document alone allows: an element uses the instances of its inputs, of its connected assignments and
 * of its expressions (`references`). It does not know the flow, so the first use is the stored one or the first element
 * of the document; every instance is usable everywhere.
 */
export function reportFromDocument(
  document: StrategyDocument,
  types: TypeIndex,
  references: ReadonlyMap<string, readonly ExpressionReference[]>,
): UsageReport {
  const entries = new Map<string, Map<string, ElementUse>>();
  const add = (elementId: string, instanceKey: string, kind: ElementUse['kind'], byInstance: string | null, member: MemberUse): void => {
    const perElement = entries.get(elementId) ?? new Map<string, ElementUse>();
    entries.set(elementId, perElement);
    const id = `${instanceKey}|${kind}|${byInstance ?? ''}`;
    const existing = perElement.get(id) ?? { instance: instanceKey, kind, byInstance, members: [] };
    perElement.set(id, existing);
    mergeMembers(existing.members, [member]);
  };
  for (const element of document.elements) {
    if (isCardElement(element, types)) {
      continue;
    }
    for (const input of element.inputs) {
      add(element.id, input.instance, 'input', null, {
        name: input.property,
        kind: input.kind === 'method' ? 'method' : 'property',
        arguments: input.arguments ?? [],
        refresh: input.refresh === true,
      });
    }
    const bindings = [...Object.values(element.parameters), ...Object.values(element.properties)];
    for (const binding of bindings) {
      if (binding.kind === 'connection' && isConnectionValue(binding.value)) {
        add(element.id, binding.value.instance, 'data_link', null, { name: binding.value.property, kind: 'property', arguments: [], refresh: false });
      }
    }
    for (const reference of references.get(element.id) ?? []) {
      add(element.id, reference.instance, 'expression', null, { name: reference.property, kind: 'property', arguments: [], refresh: false });
    }
  }
  const users = new Map<string, string[]>();
  for (const [elementId, perElement] of entries) {
    for (const use of perElement.values()) {
      const list = users.get(use.instance.toLowerCase()) ?? [];
      if (!list.includes(elementId)) {
        list.push(elementId);
      }
      users.set(use.instance.toLowerCase(), list);
    }
  }
  const firstOf = new Map<string, string | null>();
  const instances: InstanceUsage[] = [];
  for (const element of document.elements) {
    const instance = element.instance;
    if (!isCardElement(element, types) || instance === undefined || instance === null) {
      continue;
    }
    const list = users.get(instance.key.toLowerCase()) ?? [];
    const stored = typeof instance.first_use === 'string' && list.includes(instance.first_use) ? instance.first_use : null;
    const first = stored ?? list[0] ?? null;
    firstOf.set(element.id, first);
    instances.push({
      instance: instance.key,
      name: instance.name,
      element: element.id,
      objectType: instance.object_type,
      canRefresh: types.byId.get(element.type)?.canRefresh === true,
      connected: first !== null,
      firstUse: first,
      firstUseSource: first === null ? null : stored !== null ? 'stored' : 'flow',
      usableEverywhere: true,
      usableAt: [],
      usableAtOmitted: false,
    });
  }
  // an instance that another instance uses by a connected assignment: the use lies at the element of that instance
  for (const element of document.elements) {
    const instance = element.instance;
    if (!isCardElement(element, types) || instance === undefined || instance === null) {
      continue;
    }
    const bindings = Object.values(instance.parameter_values ?? {});
    for (const binding of bindings) {
      if (binding.kind === 'connection' && isConnectionValue(binding.value)) {
        add(firstOf.get(element.id) ?? element.id, binding.value.instance, 'data_link', instance.key, {
          name: binding.value.property,
          kind: 'property',
          arguments: [],
          refresh: false,
        });
      }
    }
  }
  const elements: ElementUsage[] = [...entries].map(([element, perElement]) => ({ element, uses: [...perElement.values()] }));
  for (const item of instances) {
    if (item.firstUse === null) {
      const via = elements.find((entry) => entry.uses.some((use) => use.instance.toLowerCase() === item.instance.toLowerCase() && use.byInstance !== null));
      if (via !== undefined) {
        item.connected = true;
        item.firstUse = via.element;
        item.firstUseSource = 'instance';
      }
    }
  }
  return { instances, elements, strategyRules: [], truncated: false };
}

/** The lines and places of the cards, from the report (or, without one, from the document). */
export function buildUsageModel(
  document: StrategyDocument,
  types: TypeIndex,
  report: UsageReport | null,
  references: ReadonlyMap<string, readonly ExpressionReference[]>,
): UsageModel {
  const used = report ?? reportFromDocument(document, types, references);
  const byKey = instanceElementByKey(document);
  const cardOf = (key: string): string | undefined => byKey.get(key.toLowerCase())?.id;
  const usageOf = new Map<string, InstanceUsage>();
  for (const item of used.instances) {
    const card = cardOf(item.instance) ?? item.element;
    usageOf.set(card, item);
  }

  const homes = new Map<string, string | null>();
  for (const [card, item] of usageOf) {
    if (item.firstUse === null) {
      homes.set(card, null);
    } else if (item.firstUseSource === 'instance') {
      const via = used.elements
        .filter((entry) => entry.element === item.firstUse)
        .flatMap((entry) => entry.uses)
        .find((use) => use.instance.toLowerCase() === item.instance.toLowerCase() && use.byInstance !== null);
      const other = via?.byInstance ?? null;
      homes.set(card, other === null ? item.firstUse : (cardOf(other) ?? item.firstUse));
    } else {
      homes.set(card, item.firstUse);
    }
  }

  const merged = new Map<string, UseLink>();
  const join = (src: string, dst: string, first: boolean, members: readonly MemberUse[]): void => {
    if (src === dst) {
      return;
    }
    const key = `${src}>${dst}`;
    const link = merged.get(key) ?? { key, src, dst, first: false, rows: [], members: [] };
    merged.set(key, link);
    link.first = link.first || first;
    mergeMembers(link.members, members);
  };
  for (const entry of used.elements) {
    for (const use of entry.uses) {
      const src = cardOf(use.instance);
      if (src === undefined) {
        continue;
      }
      const dst = use.byInstance !== null ? cardOf(use.byInstance) : entry.element;
      if (dst === undefined) {
        continue;
      }
      join(src, dst, usageOf.get(src)?.firstUse === entry.element, use.members);
    }
  }
  for (const use of used.strategyRules) {
    const src = cardOf(use.instance);
    const item = src === undefined ? undefined : usageOf.get(src);
    if (src !== undefined && item?.firstUseSource === 'rule' && item.firstUse !== null) {
      join(src, item.firstUse, true, use.members);
    }
  }
  const links = [...merged.values()].map((link) => ({
    ...link,
    rows: [...new Set(link.members.map((member) => rowOfMember(member.name)))],
  }));

  return {
    links,
    fromReport: report !== null,
    homes,
    connected: (card) => (usageOf.get(card)?.firstUse ?? null) !== null,
    firstUse: (card) => usageOf.get(card)?.firstUse ?? null,
    usable: (card, target) => {
      const item = usageOf.get(card);
      if (card === target) {
        return false;
      }
      if (item === undefined) {
        return true;
      }
      return item.usableEverywhere || item.usableAtOmitted || item.firstUse === target || item.usableAt.includes(target);
    },
  };
}
