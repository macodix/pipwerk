import { groupIds, type GroupId, type TypeDescription } from '../api/elementTypes';
import type { ObjectArt, ObjectListEntry } from '../api/objects';
import type { SupportedLanguage } from '../i18n';
import { groupOfCategory, kindClassOf, labelText, type KindClass, type TypeIndex } from '../model/typeIndex';

/**
 * The element library (specification 5.2): the groups come from the field `group` of the type descriptions, in the
 * order of the specification; stored templates stand in the group of their object type. Nothing here knows a single
 * type (E2). A group without an entry does not appear. A group value the interface has no name for does not stop
 * anything: its entries stand behind the known groups.
 */

/** Where an entry comes from. */
export type LibrarySource =
  | { kind: 'type'; typeId: string }
  | { kind: 'builtinTemplate'; templateId: string }
  | { kind: 'storedTemplate'; art: ObjectArt; id: string }
  | { kind: 'connection' };

/**
 * What an entry does when it is chosen: lay an element on the drawing area, add a rule to a list of rules, or start the
 * connection of the selected step with the next one (the way to connect without dragging, specification 5.3).
 */
export type LibraryTarget = 'canvas' | 'rules' | 'connection';

export type LibraryEntry = {
  key: string;
  source: LibrarySource;
  name: string;
  explanation: string;
  target: LibraryTarget;
  /** A stored template of the user (marked as "own"). */
  own: boolean;
  unreadable: boolean;
  style: KindClass;
};

export type LibraryGroup = { id: GroupId; entries: LibraryEntry[] };

export type StoredTemplates = Partial<Record<ObjectArt, readonly ObjectListEntry[]>>;

/** The entry "Verbindung" has no type description: its name and explanation come with the call. */
export type ConnectionEntryTexts = { name: string; explanation: string };

/** The key of the entry "Verbindung". */
export const CONNECTION_ENTRY_KEY = 'connection';

/** The group a stored template stands in when its object type names none. */
const artGroups: Partial<Record<ObjectArt, GroupId>> = {
  indicators: 'indicators',
  trends: 'trends',
  rules: 'rules',
  rulesets: 'rules',
};

/** The group the entry "Verbindung" belongs to (specification 5.2: Ablaufsteuerung). */
const CONNECTION_GROUP: GroupId = 'flow';

function targetOfType(type: TypeDescription): LibraryTarget | null {
  if (type.onCanvas) {
    return 'canvas';
  }
  return type.category === 'rule' || type.category === 'ruleset' ? 'rules' : null;
}

export function buildLibrary(
  types: TypeIndex,
  stored: StoredTemplates,
  language: SupportedLanguage,
  connection?: ConnectionEntryTexts,
): LibraryGroup[] {
  const groups = new Map<GroupId, LibraryEntry[]>();
  const push = (id: GroupId, entry: LibraryEntry): void => {
    const list = groups.get(id);
    if (list === undefined) {
      groups.set(id, [entry]);
    } else {
      list.push(entry);
    }
  };

  // delivered templates come first in their group
  for (const template of types.templates) {
    const objectType = types.byId.get(template.object_type);
    const id = template.group ?? objectType?.group ?? groupOfCategory(objectType?.category ?? null);
    if (id === null || objectType === undefined) {
      continue;
    }
    const target = targetOfType(objectType) ?? (objectType.category === 'rule' || objectType.category === 'ruleset' ? 'rules' : 'canvas');
    push(id, {
      key: `template:${template.id}`,
      source: { kind: 'builtinTemplate', templateId: template.id },
      name: labelText(template.label, language),
      explanation: labelText(template.explanation, language),
      target,
      own: false,
      unreadable: false,
      style: kindClassOf(objectType),
    });
  }
  for (const type of types.list) {
    if (type.group === null) {
      continue;
    }
    const target = targetOfType(type);
    if (target === null) {
      continue;
    }
    push(type.group, {
      key: `type:${type.id}`,
      source: { kind: 'type', typeId: type.id },
      name: labelText(type.name, language),
      explanation: labelText(type.explanation, language),
      target,
      own: false,
      unreadable: false,
      style: kindClassOf(type),
    });
  }
  if (connection !== undefined) {
    push(CONNECTION_GROUP, {
      key: CONNECTION_ENTRY_KEY,
      source: { kind: 'connection' },
      name: connection.name,
      explanation: connection.explanation,
      target: 'connection',
      own: false,
      unreadable: false,
      style: 'conn',
    });
  }
  for (const art of Object.keys(artGroups) as ObjectArt[]) {
    for (const entry of stored[art] ?? []) {
      const objectType = entry.objectType === null ? undefined : types.byId.get(entry.objectType);
      // a stored template stands in the group of its object type
      const id = objectType?.group ?? artGroups[art];
      if (id === undefined) {
        continue;
      }
      push(id, {
        key: `stored:${art}:${entry.id}`,
        source: { kind: 'storedTemplate', art, id: entry.id },
        name: entry.name ?? '',
        explanation: entry.description ?? '',
        target: art === 'rules' || art === 'rulesets' ? 'rules' : 'canvas',
        own: true,
        unreadable: entry.unreadable,
        style: objectType === undefined ? (art === 'rules' || art === 'rulesets' ? 'rule' : art === 'trends' ? 'trend' : 'ind') : kindClassOf(objectType),
      });
    }
  }
  const known: readonly string[] = groupIds;
  const ordered = [...known.filter((id) => groups.has(id)), ...[...groups.keys()].filter((id) => !known.includes(id))];
  return ordered.map((id) => ({ id, entries: groups.get(id) ?? [] }));
}

/** The entries whose name or explanation contains the search text (without regard to case); empty groups stay out. */
export function filterLibrary(groups: readonly LibraryGroup[], query: string): LibraryGroup[] {
  const needle = query.trim().toLowerCase();
  const filtered = groups.map((group) => ({
    id: group.id,
    entries:
      needle === ''
        ? group.entries
        : group.entries.filter(
            (entry) => entry.name.toLowerCase().includes(needle) || entry.explanation.toLowerCase().includes(needle),
          ),
  }));
  return filtered.filter((group) => group.entries.length > 0);
}

export function findEntry(groups: readonly LibraryGroup[], key: string): LibraryEntry | undefined {
  for (const group of groups) {
    const found = group.entries.find((entry) => entry.key === key);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}
