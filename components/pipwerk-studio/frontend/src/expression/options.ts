import type { VisibleChoice, VisibleName, VisibleProperty } from '../api/objects';
import type { InputDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import type { TypeIndex } from '../model/typeIndex';
import { pathKey } from './blocks';

/**
 * The values an expression can use at a place, as the lists of the block editor offer them (specification 5.4): the
 * connected values of the element first, then the objects of the strategy, the objects of the application, the results
 * of other steps, the strategy parameters and the parameters. Everything comes from the answer of the expression
 * endpoint (`names`); nothing here knows a single object (E2).
 */

export type ValueGroupId = 'connected' | 'objects' | 'application' | 'results' | 'strategy' | 'parameters';

export type ValueOption = {
  /** The key the choice stands under in a list (see `valueKey` in `blocks.ts`). */
  key: string;
  path: string[];
  label: string;
  explanation: string;
  datatype: string | null;
  choices: VisibleChoice[];
  /** The value has an earlier value: a crossing may use it. */
  previousValue: boolean;
};

export type ValueGroup = { id: ValueGroupId; options: ValueOption[] };

export const GROUP_ORDER: readonly ValueGroupId[] = ['connected', 'objects', 'application', 'results', 'strategy', 'parameters'];

const SEPARATOR = ' › ';

function optionKey(path: readonly string[]): string {
  return `n:${path.join('\u001f')}`;
}

function textOf(label: { de: string; en: string }, language: SupportedLanguage): string {
  return label[language];
}

function propertyOption(parentPath: readonly string[], prefix: string, property: VisibleProperty, language: SupportedLanguage): ValueOption {
  const path = [...parentPath, property.key];
  return {
    key: optionKey(path),
    path,
    label: `${prefix}${SEPARATOR}${textOf(property.label, language)}`,
    explanation: property.explanation === null ? '' : textOf(property.explanation, language),
    datatype: property.datatype,
    choices: property.choices,
    previousValue: property.previousValue,
  };
}

/** The object type a property of the datatype object stands for, from the type descriptions (any type that has such a property). */
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

/** The options of one name: one per property, and for a property that is an object also one per property of that object. */
function optionsOfName(name: VisibleName, names: readonly VisibleName[], types: TypeIndex | null, language: SupportedLanguage): ValueOption[] {
  const options: ValueOption[] = [];
  for (const property of name.properties) {
    if (property.datatype === 'object') {
      const objectType = objectTypeOfProperty(types, property.key);
      const target = objectType === null ? undefined : names.find((candidate) => candidate.kind === 'application_object' && candidate.path[0] === objectType);
      for (const inner of target?.properties ?? []) {
        options.push(
          propertyOption(
            [...name.path, property.key],
            `${name.display}${SEPARATOR}${textOf(property.label, language)}`,
            inner,
            language,
          ),
        );
      }
      continue;
    }
    options.push(propertyOption(name.path, name.display, property, language));
  }
  for (const content of name.contents) {
    const path = content.path.length > 0 && pathKey(content.path.slice(0, name.path.length)) === pathKey(name.path) ? content.path : [...name.path, ...content.path];
    options.push(
      ...optionsOfName({ ...content, path, display: `${name.display}${SEPARATOR}${content.display}` }, names, types, language),
    );
  }
  return options;
}

export function buildValueGroups(
  names: readonly VisibleName[],
  inputs: readonly InputDocument[],
  selfKey: string | null,
  types: TypeIndex | null,
  language: SupportedLanguage,
): ValueGroup[] {
  const groups = new Map<ValueGroupId, ValueOption[]>(GROUP_ORDER.map((id) => [id, []]));
  const push = (id: ValueGroupId, option: ValueOption): void => {
    groups.get(id)?.push(option);
  };
  const all = new Map<string, ValueOption>();
  for (const name of names) {
    let id: ValueGroupId;
    let options: ValueOption[];
    switch (name.kind) {
      case 'instance':
        id = 'objects';
        options = optionsOfName(name, names, types, language);
        break;
      case 'application_object':
        id = 'application';
        options = optionsOfName(name, names, types, language);
        break;
      case 'result':
      case 'rule':
        id = 'results';
        if (selfKey !== null && name.path[0] === selfKey) {
          continue;
        }
        options = optionsOfName(name, names, types, language);
        break;
      case 'strategy_parameter':
        id = 'strategy';
        options = [
          {
            key: optionKey(name.path),
            path: name.path,
            label: name.display,
            explanation: '',
            datatype: name.datatype,
            choices: [],
            previousValue: false,
          },
        ];
        break;
      case 'parameter':
        id = 'parameters';
        options = [
          {
            key: optionKey(name.path),
            path: name.path,
            label: name.display,
            explanation: '',
            datatype: name.datatype,
            choices: [],
            previousValue: false,
          },
        ];
        break;
    }
    for (const option of options) {
      all.set(pathKey(option.path), option);
      push(id, option);
    }
  }
  // The values the user connected with the element come first and stand only there.
  const connectedKeys = new Set<string>();
  for (const input of inputs) {
    const option = all.get(pathKey([input.instance, input.property]));
    if (option !== undefined && !connectedKeys.has(option.key)) {
      connectedKeys.add(option.key);
      push('connected', option);
    }
  }
  return GROUP_ORDER.map((id) => ({
    id,
    options: (groups.get(id) ?? []).filter((option) => id === 'connected' || !connectedKeys.has(option.key)),
  })).filter((group) => group.options.length > 0);
}

/** The option of a name by its path (without regard to case), or `undefined`. */
export function findOption(groups: readonly ValueGroup[], path: readonly string[] | undefined): ValueOption | undefined {
  if (path === undefined) {
    return undefined;
  }
  const wanted = pathKey(path);
  for (const group of groups) {
    const found = group.options.find((option) => pathKey(option.path) === wanted);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

/** The choice of a text a value of a choice may have: the value is the identifier or the label of a choice. */
export function matchChoice(value: unknown, choices: readonly VisibleChoice[]): VisibleChoice | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const wanted = value.trim().toLowerCase();
  return choices.find((choice) => choice.id.toLowerCase() === wanted || choice.label.de.toLowerCase() === wanted || choice.label.en.toLowerCase() === wanted);
}
