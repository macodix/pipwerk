import type { VisibleChoice, VisibleMethod, VisibleName, VisibleProperty } from '../api/objects';
import type { InputArgument, InputDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import type { TypeIndex } from '../model/typeIndex';
import { argumentBlock, fixedArguments, methodBlock, nameBlock, pathKey, type Block } from './blocks';

/**
 * The values an expression can use at a place, as the lists of the block editor offer them (specification 5.4): the
 * connected values of the element first, then the objects of the strategy, the objects of the application, the results
 * of other steps, the strategy parameters and the parameters. A value is a property or a method of an object. Everything
 * comes from the answer of the expression endpoint (`names`); nothing here knows a single object (E2).
 */

export type ValueGroupId = 'connected' | 'objects' | 'application' | 'results' | 'strategy' | 'parameters';

export type ValueOption = {
  /** The key the choice stands under in a list (see `valueKey` in `blocks.ts`; a method begins with `m:`). */
  key: string;
  path: string[];
  label: string;
  explanation: string;
  datatype: string | null;
  choices: VisibleChoice[];
  /** The value has an earlier value: a crossing may use it. */
  previousValue: boolean;
  /** The value is the result of this method; its arguments are the blocks below the name. */
  method: VisibleMethod | null;
  /** The fixed values of the arguments of a method the user connected with the element; `null` otherwise. */
  args: InputArgument[] | null;
};

export type ValueGroup = { id: ValueGroupId; options: ValueOption[] };

export const GROUP_ORDER: readonly ValueGroupId[] = ['connected', 'objects', 'application', 'results', 'strategy', 'parameters'];

const SEPARATOR = ' › ';

function optionKey(path: readonly string[]): string {
  return `n:${path.join('\u001f')}`;
}

/** The key of a method; with `args` the key of the variant a connected input names. */
export function methodKey(path: readonly string[], args?: readonly InputArgument[] | null): string {
  const base = `m:${path.join('\u001f')}`;
  return args === undefined || args === null ? base : `${base}\u001e${JSON.stringify(args)}`;
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
    method: null,
    args: null,
  };
}

function methodOption(parentPath: readonly string[], prefix: string, method: VisibleMethod, language: SupportedLanguage): ValueOption {
  const path = [...parentPath, method.key];
  return {
    key: methodKey(path),
    path,
    label: `${prefix}${SEPARATOR}${textOf(method.label, language)}`,
    explanation: method.explanation === null ? '' : textOf(method.explanation, language),
    datatype: method.datatype,
    choices: method.choices,
    previousValue: method.previousValue,
    method,
    args: null,
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

/** The options of one name: one per property and per method, and for a property that is an object also one per property of that object. */
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
  for (const method of name.methods) {
    options.push(methodOption(name.path, name.display, method, language));
  }
  for (const content of name.contents) {
    const path = content.path.length > 0 && pathKey(content.path.slice(0, name.path.length)) === pathKey(name.path) ? content.path : [...name.path, ...content.path];
    options.push(
      ...optionsOfName({ ...content, path, display: `${name.display}${SEPARATOR}${content.display}` }, names, types, language),
    );
  }
  return options;
}

function lookupKey(option: ValueOption): string {
  return `${option.method === null ? 'n' : 'm'}:${pathKey(option.path)}`;
}

export function buildValueGroups(
  names: readonly VisibleName[],
  inputs: readonly Pick<InputDocument, 'instance' | 'property' | 'kind' | 'arguments'>[],
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
            method: null,
            args: null,
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
            method: null,
            args: null,
          },
        ];
        break;
    }
    for (const option of options) {
      all.set(lookupKey(option), option);
      push(id, option);
    }
  }
  // The values the user connected with the element come first. A property stands only there; a method stands there with
  // the arguments of the input and stays in its list for the standard values of its arguments.
  const connectedKeys = new Set<string>();
  for (const input of inputs) {
    const method = input.kind === 'method';
    const option = all.get(`${method ? 'm' : 'n'}:${pathKey([input.instance, input.property])}`);
    if (option === undefined) {
      continue;
    }
    const args = method ? [...(input.arguments ?? [])] : null;
    const connected: ValueOption =
      method && args !== null
        ? { ...option, key: methodKey(option.path, args), args, label: args.length === 0 ? option.label : `${option.label} (${args.join('; ')})` }
        : option;
    if (!connectedKeys.has(connected.key)) {
      connectedKeys.add(connected.key);
      push('connected', connected);
    }
  }
  return GROUP_ORDER.map((id) => ({
    id,
    options: (groups.get(id) ?? []).filter((option) => id === 'connected' || !connectedKeys.has(option.key)),
  })).filter((group) => group.options.length > 0);
}

/** The option of a name by its path (without regard to case), or `undefined`; `call` asks for a method. */
export function findOption(groups: readonly ValueGroup[], path: readonly string[] | undefined, call = false): ValueOption | undefined {
  if (path === undefined) {
    return undefined;
  }
  const wanted = pathKey(path);
  let fallback: ValueOption | undefined;
  for (const group of groups) {
    for (const option of group.options) {
      if ((option.method !== null) === call && pathKey(option.path) === wanted) {
        if (option.args === null) {
          return option;
        }
        fallback ??= option;
      }
    }
  }
  return fallback;
}

/**
 * The key under which the list of values shows a name block: the key of the property, or of the method with the
 * arguments the block carries if the user connected exactly that variant, else the plain key of the method.
 */
export function selectKeyOf(block: Block, groups: readonly ValueGroup[]): string {
  const path = block.path ?? [];
  if (block.call !== true) {
    return optionKey(path);
  }
  const args = fixedArguments(block);
  if (args !== null) {
    const wanted = JSON.stringify(args);
    for (const group of groups) {
      for (const option of group.options) {
        if (option.method !== null && option.args !== null && pathKey(option.path) === pathKey(path) && JSON.stringify(option.args) === wanted) {
          return option.key;
        }
      }
    }
  }
  const plain = findOption(groups, path, true);
  return plain !== undefined && plain.args === null ? plain.key : methodKey(path);
}

/** The value an argument starts with: its standard value, else something that fits its data type. */
function startArgument(argument: VisibleMethod['arguments'][number]): Block {
  if (argument.default !== null) {
    return argumentBlock(argument.default);
  }
  switch (argument.datatype) {
    case 'boolean':
      return argumentBlock(false);
    case 'choice':
    case 'time_unit':
      return argumentBlock(argument.choices[0]?.id ?? '');
    case 'number':
    case 'integer':
    case 'percent':
      return argumentBlock(1);
    default:
      return argumentBlock('');
  }
}

/** The block a choice stands for: a name for a property, a call with the arguments of the connected input or the standard ones for a method. */
export function blockOfOption(option: ValueOption): Block {
  if (option.method === null) {
    return nameBlock(option.path);
  }
  return methodBlock(
    option.path,
    option.args !== null ? option.args.map(argumentBlock) : option.method.arguments.map(startArgument),
  );
}

/** The choice of a text a value of a choice may have: the value is the identifier or the label of a choice. */
export function matchChoice(value: unknown, choices: readonly VisibleChoice[]): VisibleChoice | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const wanted = value.trim().toLowerCase();
  return choices.find((choice) => choice.id.toLowerCase() === wanted || choice.label.de.toLowerCase() === wanted || choice.label.en.toLowerCase() === wanted);
}
