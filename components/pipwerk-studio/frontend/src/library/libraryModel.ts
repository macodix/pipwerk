import { groupIds, type GroupId, type TypeDescription } from '../api/elementTypes';
import type { ObjectArt, ObjectListEntry } from '../api/objects';
import type { SupportedLanguage } from '../i18n';
import { groupOfCategory, kindClassOf, labelText, type KindClass, type TypeIndex } from '../model/typeIndex';

/**
 * The element library (specification 5.2): the groups come from the field `group` of the type descriptions, in the
 * order of the specification; stored templates stand in the group of their object type. Nothing here knows a single
 * type (E2).
 */

/** Where an entry comes from. */
export type LibrarySource =
  | { kind: 'type'; typeId: string }
  | { kind: 'builtinTemplate'; templateId: string }
  | { kind: 'storedTemplate'; art: ObjectArt; id: string };

/** What an entry does when it is inserted: lay an element on the drawing area, or add a rule to a list of rules. */
export type LibraryTarget = 'canvas' | 'rules';

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

const artGroups: Partial<Record<ObjectArt, GroupId>> = {
  indicators: 'indicators',
  trends: 'trends',
  rules: 'rules',
  rulesets: 'rules',
};

function targetOfType(type: TypeDescription): LibraryTarget | null {
  if (type.onCanvas) {
    return 'canvas';
  }
  return type.category === 'rule' || type.category === 'ruleset' ? 'rules' : null;
}

export function buildLibrary(types: TypeIndex, stored: StoredTemplates, language: SupportedLanguage): LibraryGroup[] {
  const groups: LibraryGroup[] = groupIds.map((id) => ({ id, entries: [] }));
  const group = (id: GroupId): LibraryGroup => groups[groupIds.indexOf(id)] as LibraryGroup;

  // delivered templates come first in their group
  for (const template of types.templates) {
    const objectType = types.byId.get(template.object_type);
    const id = groupOfCategory(objectType?.category ?? null);
    if (id === null || objectType === undefined) {
      continue;
    }
    const target = targetOfType(objectType) ?? (objectType.category === 'rule' || objectType.category === 'ruleset' ? 'rules' : 'canvas');
    group(id).entries.push({
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
    group(type.group).entries.push({
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
  for (const art of Object.keys(artGroups) as ObjectArt[]) {
    const id = artGroups[art];
    if (id === undefined) {
      continue;
    }
    for (const entry of stored[art] ?? []) {
      const objectType = entry.objectType === null ? undefined : types.byId.get(entry.objectType);
      group(id).entries.push({
        key: `stored:${art}:${entry.id}`,
        source: { kind: 'storedTemplate', art, id: entry.id },
        name: entry.name ?? '',
        explanation: entry.description ?? '',
        target: art === 'rules' || art === 'rulesets' ? 'rules' : 'canvas',
        own: true,
        unreadable: entry.unreadable,
        style: objectType === undefined ? (id === 'rules' ? 'rule' : id === 'trends' ? 'trend' : 'ind') : kindClassOf(objectType),
      });
    }
  }
  return groups;
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
