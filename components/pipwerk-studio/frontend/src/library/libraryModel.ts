import type { TypeDescription } from '../api/elementTypes';
import type { ObjectArt, ObjectListEntry } from '../api/objects';
import type { SupportedLanguage } from '../i18n';
import { labelText, type TypeIndex } from '../model/typeIndex';

/**
 * The element library: groups and entries, built from the type descriptions
 * and the lists of stored templates. It knows no single type (specification E2).
 */

export type LibraryGroupId =
  | 'triggers'
  | 'flow'
  | 'applicationObjects'
  | 'objectTypes'
  | 'builtinTemplates'
  | 'storedTemplates';

export const libraryGroupIds: readonly LibraryGroupId[] = [
  'triggers',
  'flow',
  'applicationObjects',
  'objectTypes',
  'builtinTemplates',
  'storedTemplates',
];

/** Where an entry comes from: a type, a template delivered with the software or a stored template. */
export type LibrarySource =
  | { kind: 'type'; typeId: string }
  | { kind: 'builtinTemplate'; templateId: string }
  | { kind: 'storedTemplate'; art: ObjectArt; id: string };

/** What an entry can be used for: laid on the drawing area, or added to a list of rules. */
export type LibraryTarget = 'canvas' | 'rules';

export type LibraryEntry = {
  key: string;
  group: LibraryGroupId;
  label: string;
  description: string;
  /** Name of the object type for templates, shown beside the name. */
  objectTypeName: string | null;
  source: LibrarySource;
  target: LibraryTarget;
  /** The file of a stored template cannot be read; the entry cannot be used. */
  unreadable: boolean;
};

export type LibraryGroup = { id: LibraryGroupId; entries: LibraryEntry[] };

/** The stored templates by kind, as the lists of the backend deliver them. */
export type StoredTemplates = Partial<Record<ObjectArt, ObjectListEntry[]>>;

function targetOfObjectType(index: TypeIndex, objectType: string | null): LibraryTarget {
  const type = objectType === null ? undefined : index.byId.get(objectType);
  if (type !== undefined && (type.category === 'rule' || type.category === 'ruleset')) {
    return 'rules';
  }
  return 'canvas';
}

function typeEntry(group: LibraryGroupId, type: TypeDescription, language: SupportedLanguage, target: LibraryTarget): LibraryEntry {
  return {
    key: `type:${type.id}`,
    group,
    label: labelText(type.name, language),
    description: labelText(type.description, language),
    objectTypeName: null,
    source: { kind: 'type', typeId: type.id },
    target,
    unreadable: false,
  };
}

export function buildLibrary(
  index: TypeIndex,
  stored: StoredTemplates,
  language: SupportedLanguage,
): LibraryGroup[] {
  const groups: LibraryGroup[] = libraryGroupIds.map((id) => ({ id, entries: [] }));
  const group = (id: LibraryGroupId): LibraryEntry[] => groups.find((candidate) => candidate.id === id)!.entries;
  const typeNameOf = (objectType: string | null): string | null => {
    if (objectType === null) {
      return null;
    }
    const type = index.byId.get(objectType);
    return type === undefined ? objectType : labelText(type.name, language);
  };

  for (const type of index.list) {
    if (type.kind === 'trigger' && type.byUser && type.onCanvas) {
      group('triggers').push(typeEntry('triggers', type, language, 'canvas'));
    } else if (type.kind === 'flow' && type.byUser && type.onCanvas) {
      group('flow').push(typeEntry('flow', type, language, 'canvas'));
    } else if (type.kind === 'application_object' && type.onCanvas) {
      group('applicationObjects').push(typeEntry('applicationObjects', type, language, 'canvas'));
    } else if (type.kind === 'object_type' && type.byUser) {
      group('objectTypes').push(
        typeEntry('objectTypes', type, language, type.onCanvas ? 'canvas' : targetOfObjectType(index, type.id)),
      );
    }
  }

  for (const template of index.templates) {
    group('builtinTemplates').push({
      key: `builtin:${template.id}`,
      group: 'builtinTemplates',
      label: template.title,
      description: template.description,
      objectTypeName: typeNameOf(template.object_type),
      source: { kind: 'builtinTemplate', templateId: template.id },
      target: targetOfObjectType(index, template.object_type),
      unreadable: false,
    });
  }

  for (const art of ['indicators', 'trends', 'rules', 'rulesets'] as const) {
    for (const item of stored[art] ?? []) {
      group('storedTemplates').push({
        key: `stored:${art}:${item.id}`,
        group: 'storedTemplates',
        label: item.title ?? item.id,
        description: item.description ?? '',
        objectTypeName: typeNameOf(item.objectType),
        source: { kind: 'storedTemplate', art, id: item.id },
        target: targetOfObjectType(index, item.objectType),
        unreadable: item.unreadable,
      });
    }
  }
  return groups;
}

// --- dragging --------------------------------------------------------------------------

/** Type of the data an entry carries when it is dragged. */
export const LIBRARY_DRAG_TYPE = 'application/x-pipwerk-library';

export function serializeSource(source: LibrarySource): string {
  return JSON.stringify(source);
}

/** Reads the data of a drop; anything that is not an entry of the library gives `null`. */
export function parseSource(text: string): LibrarySource | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.kind === 'type' && typeof record.typeId === 'string') {
    return { kind: 'type', typeId: record.typeId };
  }
  if (record.kind === 'builtinTemplate' && typeof record.templateId === 'string') {
    return { kind: 'builtinTemplate', templateId: record.templateId };
  }
  if (
    record.kind === 'storedTemplate' &&
    typeof record.id === 'string' &&
    (record.art === 'indicators' ||
      record.art === 'trends' ||
      record.art === 'rules' ||
      record.art === 'rulesets')
  ) {
    return { kind: 'storedTemplate', art: record.art, id: record.id };
  }
  return null;
}

/** The entry that a source belongs to, if the library has it. */
export function findEntry(groups: readonly LibraryGroup[], source: LibrarySource): LibraryEntry | undefined {
  const text = serializeSource(source);
  for (const group of groups) {
    const entry = group.entries.find((candidate) => serializeSource(candidate.source) === text);
    if (entry !== undefined) {
      return entry;
    }
  }
  return undefined;
}
