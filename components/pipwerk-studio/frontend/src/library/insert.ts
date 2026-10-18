import type { TemplateDocument } from '../api/elementTypes';
import {
  freshName,
  instanceFromTemplate,
  instanceFromType,
  newElementForType,
  newTemplateElement,
  type NewElementOptions,
} from '../document/build';
import type { ElementDocument, InstanceDocument, StrategyDocument } from '../document/types';
import type { TypeIndex } from '../model/typeIndex';
import type { LibrarySource } from './libraryModel';

/** Reads the document of a stored template. */
export type TemplateLoader = (source: Extract<LibrarySource, { kind: 'storedTemplate' }>) => Promise<Record<string, unknown>>;

async function templateOf(
  types: TypeIndex,
  source: LibrarySource,
  load: TemplateLoader,
): Promise<TemplateDocument | null> {
  if (source.kind === 'builtinTemplate') {
    return types.templates.find((template) => template.id === source.templateId) ?? null;
  }
  if (source.kind === 'storedTemplate') {
    const record = await load(source);
    return {
      ...record,
      id: String(record.id),
      title: String(record.title),
      description: typeof record.description === 'string' ? record.description : '',
      object_type: String(record.object_type),
    };
  }
  return null;
}

/** A new element for an entry of the library that is laid on the drawing area. `null` if the type is not known. */
export async function elementForSource(
  document: StrategyDocument,
  types: TypeIndex,
  source: LibrarySource,
  options: NewElementOptions,
  load: TemplateLoader,
): Promise<ElementDocument | null> {
  if (source.kind === 'type') {
    const type = types.byId.get(source.typeId);
    return type === undefined ? null : newElementForType(document, type, options);
  }
  const template = await templateOf(types, source, load);
  return template === null ? null : newTemplateElement(document, template, options);
}

/** A new rule or rule set for an entry of the library that is added to a list of rules. */
export async function ruleForSource(
  document: StrategyDocument,
  types: TypeIndex,
  source: LibrarySource,
  load: TemplateLoader,
): Promise<InstanceDocument | null> {
  if (source.kind === 'type') {
    const type = types.byId.get(source.typeId);
    return type === undefined ? null : instanceFromType(type, freshName(document, type.id));
  }
  const template = await templateOf(types, source, load);
  return template === null ? null : instanceFromTemplate(template, freshName(document, template.title));
}
