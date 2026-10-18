import type { PropertyDescription, TypeDescription } from '../api/elementTypes';
import { findElement, getRule } from '../document/ops';
import type { InstanceDocument, RulePath, StrategyDocument } from '../document/types';
import { getOwn } from '../document/own';
import { resources, type SupportedLanguage } from '../i18n';
import { allOrderProperties, commonOrderObject, labelText, type TypeIndex } from '../model/typeIndex';

/**
 * The names an expression can use at a place, as a tree: a name, then after the
 * point its properties, and so on. They come from the type descriptions and from
 * the strategy, in the order of the name spaces of specification 3.3: what stands
 * closer to the expression hides what stands further out. The suggestions of the
 * expression input and the display of the names in the language of the interface
 * both use this tree.
 */

export type Member = {
  /** The identifier as it is written in the expression. */
  id: string;
  /** The name in the language of the interface. */
  label: string;
  /** What it is, for the list of suggestions. */
  detail: string;
  children: () => Member[];
};

/** Where the expression stands. */
export type ExpressionContext =
  | { kind: 'element'; elementId: string }
  | { kind: 'rule'; path: RulePath }
  | { kind: 'rulesetResult'; path: RulePath };

/**
 * The property of a rule or rule set that other expressions use: its result.
 * The type descriptions of rules and rule sets list no properties; the
 * specification names the result (3.3, 3.4: `regel.Ergebnis`).
 */
const RESULT_ID = 'ergebnis';

/** The name of a datatype in the language of the interface (`datatype.*`); an unknown one stays as written. */
function datatypeLabel(datatype: string, language: SupportedLanguage): string {
  const names: Readonly<Record<string, string>> = resources[language].translation.datatype;
  return getOwn(names, datatype) ?? datatype;
}

function labelOfType(type: TypeDescription | undefined, id: string, language: SupportedLanguage): string {
  return type === undefined ? id : labelText(type.name, language);
}

function propertyMember(
  property: PropertyDescription,
  types: TypeIndex,
  language: SupportedLanguage,
  depth: number,
): Member {
  return {
    id: property.id,
    label: labelText(property.label, language),
    detail: datatypeLabel(property.datatype, language),
    children: () => {
      if (property.datatype !== 'object' || property.objectType === null || depth > 4) {
        return [];
      }
      const type = types.byId.get(property.objectType);
      return type === undefined ? [] : propertyMembers(type, types, language, depth + 1);
    },
  };
}

function propertyMembers(
  type: TypeDescription,
  types: TypeIndex,
  language: SupportedLanguage,
  depth = 0,
): Member[] {
  return type.properties.map((property) => propertyMember(property, types, language, depth));
}

function resultMember(language: SupportedLanguage): Member {
  return {
    id: RESULT_ID,
    label: resources[language].translation.expression.result,
    detail: resources[language].translation.expression.result,
    children: () => [],
  };
}

function ruleMember(rule: InstanceDocument, types: TypeIndex, language: SupportedLanguage): Member {
  return {
    id: rule.name,
    label: rule.name,
    detail: resources[language].translation.expression.rule,
    children: () => [resultMember(language), ...containedMembers(rule, types, language)],
  };
}

/** The instances and rules inside an instance. */
function containedMembers(instance: InstanceDocument, types: TypeIndex, language: SupportedLanguage): Member[] {
  return [
    ...(instance.instances ?? []).map((child) => instanceMember(child, types, language)),
    ...(instance.rules ?? []).map((child) => ruleMember(child, types, language)),
  ];
}

function isRuleLike(instance: InstanceDocument, types: TypeIndex): boolean {
  const category = types.byId.get(instance.object_type)?.category;
  return category === 'rule' || category === 'ruleset';
}

function instanceMember(instance: InstanceDocument, types: TypeIndex, language: SupportedLanguage): Member {
  return {
    id: instance.name,
    label: instance.name,
    // The label of the object type in the chosen language; an unknown type stays as its identifier.
    detail: labelOfType(types.byId.get(instance.object_type), instance.object_type, language),
    children: () => {
      const type = types.byId.get(instance.object_type);
      const members: Member[] = [];
      if (type !== undefined) {
        members.push(...propertyMembers(type, types, language));
      }
      for (const own of instance.properties ?? []) {
        members.push({ id: own.name, label: own.name, detail: datatypeLabel(own.datatype, language), children: () => [] });
      }
      if (isRuleLike(instance, types)) {
        members.push(resultMember(language));
      }
      members.push(...containedMembers(instance, types, language));
      return members;
    },
  };
}

function applicationMembers(document: StrategyDocument, types: TypeIndex, language: SupportedLanguage): Member[] {
  const order = commonOrderObject(types);
  return types.list
    .filter((type) => type.kind === 'application_object')
    .map((type) => ({
      id: type.id,
      label: labelText(type.name, language),
      detail: labelText(type.name, language),
      children: () => {
        const members = propertyMembers(type, types, language);
        if (type.strategyParameters) {
          // The object that stands for the strategy: after the point come the strategy parameters (field `strategy_parameters`).
          members.push(
            ...document.parameters.map((parameter) => ({
              id: parameter.name,
              label: parameter.name,
              detail: datatypeLabel(parameter.datatype, language),
              children: () => [],
            })),
          );
        }
        if (type !== order) {
          return members;
        }
        const known = new Set(members.map((member) => member.id));
        for (const property of allOrderProperties(types)) {
          if (!known.has(property.id)) {
            members.push(propertyMember(property, types, language, 0));
          }
        }
        return members;
      },
    }));
}

/** The names of the strategy: instances, named results of the flow, rules of the strategy. */
function strategyMembers(document: StrategyDocument, types: TypeIndex, language: SupportedLanguage): Member[] {
  const members: Member[] = [];
  for (const element of document.elements) {
    if (element.instance !== undefined && element.instance !== null) {
      members.push(instanceMember(element.instance, types, language));
    }
    const type = types.byId.get(element.type);
    if (element.name !== null && element.name !== '' && type !== undefined && type.named) {
      members.push({
        id: element.name,
        label: element.name,
        detail: labelText(type.name, language),
        children: () => propertyMembers(type, types, language),
      });
    }
  }
  for (const rule of document.rules) {
    members.push(ruleMember(rule, types, language));
  }
  return members;
}

function parameterMembers(instance: InstanceDocument | undefined, language: SupportedLanguage): Member[] {
  return (instance?.parameters ?? []).map((parameter) => ({
    id: parameter.name,
    label: parameter.name,
    detail: datatypeLabel(parameter.datatype, language),
    children: () => [],
  }));
}

function dedupe(members: Member[]): Member[] {
  const seen = new Set<string>();
  const result: Member[] = [];
  for (const member of members) {
    const key = member.id.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(member);
    }
  }
  return result;
}

/** The names visible at the place of an expression, the nearest first. */
export function rootMembers(
  document: StrategyDocument,
  types: TypeIndex,
  language: SupportedLanguage,
  context: ExpressionContext,
): Member[] {
  const application = applicationMembers(document, types, language);
  if (context.kind === 'element') {
    return dedupe([...strategyMembers(document, types, language), ...application]);
  }
  const rule = getRule(document, context.path);
  const parentPath: RulePath = { owner: context.path.owner, indices: context.path.indices.slice(0, -1) };
  const insideRuleset = context.path.indices.length > 1;
  const siblings = insideRuleset
    ? (getRule(document, parentPath)?.rules ?? [])
    : context.path.owner.kind === 'strategy'
      ? document.rules
      : (findElement(document, context.path.owner.id)?.rules ?? []);
  const siblingMembers = siblings.map((sibling) => ruleMember(sibling, types, language));
  if (context.kind === 'rulesetResult') {
    return dedupe([...(rule?.rules ?? []).map((inner) => ruleMember(inner, types, language)), ...application]);
  }
  if (insideRuleset) {
    // A rule in a rule set sees its own parameters, the rules of the rule set and the objects of the application.
    return dedupe([...parameterMembers(rule, language), ...siblingMembers, ...application]);
  }
  return dedupe([
    ...parameterMembers(rule, language),
    ...siblingMembers,
    ...strategyMembers(document, types, language),
    ...application,
  ]);
}

/** The member of a level with this identifier (without regard to case). */
export function findMember(members: readonly Member[], id: string): Member | undefined {
  const wanted = id.toLowerCase();
  return members.find((member) => member.id.toLowerCase() === wanted);
}
