import type { ArgumentDescription, DataType, MethodDescription, TypeDescription } from '../api/elementTypes';
import type { InputRef } from '../document/ops';
import type { ElementDocument, InputArgument, InputKind, InstanceDocument, StrategyDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { instanceElementByKey, propertyRows } from './elements';
import { labelText, type TypeIndex } from './typeIndex';
import type { UsageModel } from './uses';

/**
 * The values an element uses (specification 5.4, "Verwendete Werte"): per instance the properties and methods that its
 * inputs, its expressions and its assignments name. Everything the user chooses here comes from the type description:
 * the properties and methods of the instance, the arguments of a method with their data types and standard values.
 */

/** A property or a method an instance supplies, as the choice of "Verwendete Werte" and of the connection of a new value. */
export type MemberChoice = {
  /** `p:<id>` for a property, `m:<id>` for a method. */
  value: string;
  id: string;
  kind: InputKind;
  label: string;
  explanation: string;
  datatype: DataType;
  /** The arguments of a method in the order of the description; none for a property. */
  arguments: ArgumentDescription[];
};

export function memberValue(kind: InputKind, id: string): string {
  return `${kind === 'method' ? 'm' : 'p'}:${id}`;
}

/** The properties (those of the type, then own properties of the instance) and the methods an instance supplies. */
export function memberChoices(
  type: TypeDescription | undefined,
  instance: InstanceDocument | null | undefined,
  language: SupportedLanguage,
): MemberChoice[] {
  const rows = propertyRows(type, instance, language);
  const properties: MemberChoice[] = rows
    .filter((row) => !row.own)
    .map((row) => ({
      value: memberValue('property', row.id),
      id: row.id,
      kind: 'property' as const,
      label: row.label,
      explanation: row.explanation,
      datatype: row.datatype,
      arguments: [],
    }));
  const methods: MemberChoice[] = (type?.methods ?? []).map((method) => ({
    value: memberValue('method', method.id),
    id: method.id,
    kind: 'method' as const,
    label: labelText(method.label, language),
    explanation: labelText(method.explanation, language),
    datatype: method.datatype,
    arguments: method.arguments,
  }));
  const own: MemberChoice[] = rows
    .filter((row) => row.own)
    .map((row) => ({
      value: memberValue('property', row.id),
      id: row.id,
      kind: 'property' as const,
      label: row.label,
      explanation: row.explanation,
      datatype: row.datatype,
      arguments: [],
    }));
  return [...properties, ...methods, ...own];
}

/** The value an argument starts with: its standard value, else something that fits its data type. */
export function defaultArgument(argument: ArgumentDescription): InputArgument {
  if (argument.default !== null) {
    return argument.default;
  }
  switch (argument.datatype) {
    case 'boolean':
      return false;
    case 'choice':
    case 'time_unit':
      return argument.choices[0]?.id ?? '';
    case 'number':
    case 'integer':
    case 'percent':
      return 1;
    default:
      return '';
  }
}

export function defaultArguments(method: Pick<MethodDescription, 'arguments'>): InputArgument[] {
  return method.arguments.map(defaultArgument);
}

/** The input a choice stands for, with the arguments (the standard ones if none are given). */
export function inputRefOf(instance: string, choice: MemberChoice, args?: readonly InputArgument[]): InputRef {
  return choice.kind === 'method'
    ? { instance, property: choice.id, kind: 'method', arguments: args ?? defaultArguments(choice) }
    : { instance, property: choice.id, kind: 'property', arguments: [] };
}

/** One value an element uses, with the ways it uses it. */
export type UsedRow = {
  /** Stable among the rows of the element. */
  key: string;
  member: { name: string; kind: InputKind; arguments: InputArgument[] };
  /** The element has an input for it (it can be changed and removed here). */
  input: boolean;
  /** "Aktualisieren" of the input. */
  refresh: boolean;
  /** An expression of the element names it; it is changed there or here (the expression follows) and removed there. */
  expression: boolean;
  /** A rule of the element names it. */
  rule: boolean;
  /** An assignment by data connection takes it; it is changed at the assignment. */
  dataLink: boolean;
};

export type UsedGroup = {
  /** The element that shows the instance. */
  card: string;
  instance: string;
  name: string;
  type: TypeDescription | undefined;
  canRefresh: boolean;
  choices: MemberChoice[];
  rows: UsedRow[];
};

function rowKey(instance: string, member: { name: string; kind: InputKind; arguments: readonly InputArgument[] }): string {
  return `${instance.toLowerCase()}|${member.kind}|${member.name.toLowerCase()}|${JSON.stringify(member.arguments)}`;
}

/**
 * The instances an element uses and, per instance, the values: first those of its inputs in their order, then those
 * only an expression, a rule or an assignment names. Uses that apply to the element only because another instance takes
 * the value there (`byInstance`) are not the element's own and do not appear.
 */
export function usedValueGroups(
  document: StrategyDocument,
  types: TypeIndex,
  uses: UsageModel,
  element: ElementDocument,
  language: SupportedLanguage,
): UsedGroup[] {
  const cards = instanceElementByKey(document);
  const groups = new Map<string, UsedGroup>();
  const rowOf = (instance: string, member: UsedRow['member']): UsedRow | null => {
    const card = cards.get(instance.toLowerCase());
    if (card === undefined || card.instance === undefined || card.instance === null) {
      return null;
    }
    const type = types.byId.get(card.type);
    const group = groups.get(instance.toLowerCase()) ?? {
      card: card.id,
      instance: card.instance.key,
      name: card.instance.name,
      type,
      canRefresh: uses.canRefresh(card.id),
      choices: memberChoices(type, card.instance, language),
      rows: [],
    };
    groups.set(instance.toLowerCase(), group);
    const key = rowKey(instance, member);
    const existing = group.rows.find((row) => row.key === key);
    if (existing !== undefined) {
      return existing;
    }
    const row: UsedRow = { key, member, input: false, refresh: false, expression: false, rule: false, dataLink: false };
    group.rows.push(row);
    return row;
  };
  for (const input of element.inputs) {
    const row = rowOf(input.instance, { name: input.property, kind: input.kind === 'method' ? 'method' : 'property', arguments: [...(input.arguments ?? [])] });
    if (row !== null) {
      row.input = true;
      row.refresh = input.refresh === true;
    }
  }
  for (const use of uses.usesOf(element.id)) {
    if (use.byInstance !== null) {
      continue;
    }
    if (use.kind === 'input') {
      continue; // the inputs are read from the document, which is up to date before the report is
    }
    for (const member of use.members) {
      // the report names the use of a method in an expression without the arguments of the expression: it joins the row
      // of an input of that method if there is one
      const loose = groups
        .get(use.instance.toLowerCase())
        ?.rows.find((candidate) => candidate.member.kind === member.kind && candidate.member.name.toLowerCase() === member.name.toLowerCase());
      const row = loose ?? rowOf(use.instance, { name: member.name, kind: member.kind, arguments: [] });
      if (row === null) {
        continue;
      }
      if (use.kind === 'expression') {
        row.expression = true;
      } else if (use.kind === 'rule') {
        row.rule = true;
      } else {
        row.dataLink = true;
      }
    }
  }
  return [...groups.values()];
}
