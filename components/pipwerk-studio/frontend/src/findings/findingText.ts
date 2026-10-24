import type { i18n as I18n, TFunction } from 'i18next';

import type { Finding } from '../api/objects';
import type { StrategyDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { elementName, instanceElementByKey, propertyRows } from '../model/elements';
import { labelText, orderSelector, typeName, type TypeIndex } from '../model/typeIndex';

/**
 * The text of a finding in the language of the interface, with the way to fix it (specification 3.6, 5.5). The texts
 * stand in the translation files under `findings.<identifier of the finding>` and `findingFixes.<identifier>`; the
 * data of the finding is inserted. A finding with an identifier that has no text appears with a general text and its
 * identifier.
 */

export type FindingTextContext = {
  document: StrategyDocument | null;
  types: TypeIndex | null;
  language: SupportedLanguage;
};

/** The kinds of problems in an expression (`details.issue` of `expression.invalid`). */
export const EXPRESSION_ISSUES = [
  'syntax',
  'unknown_function',
  'unknown_name',
  'unknown_property',
  'type_mismatch',
  'unknown_choice_value',
  'argument_count',
] as const;

/** The reasons of a typing error (`details.reason` of the issue `syntax`). */
export const SYNTAX_REASONS = [
  'unexpected_end',
  'unexpected_token',
  'invalid_character',
  'invalid_number',
  'unterminated_string',
  'too_long',
  'too_deep',
] as const;

export const CONNECTION_REASONS = [
  'unknown_source',
  'unknown_target',
  'unknown_output',
  'target_is_trigger',
  'across_managements',
] as const;

export const BINDING_REASONS = [
  'binding_kind',
  'type',
  'choice_value',
  'value',
  'unknown_parameter',
  'unknown_property',
  'set_by_application',
] as const;

export const RESULT_REASONS = ['unknown_property', 'choice_value', 'type'] as const;

export const REFERENCE_KINDS = ['forward', 'cycle'] as const;

/** The reasons of `data.unknown`. */
export const DATA_REASONS = ['unknown_instance', 'unknown_property', 'unknown_method', 'arguments'] as const;

/** Findings whose `instance` and `property` name a value of an object on the drawing area (instance key, property or method). */
const MEMBER_CODES = new Set([
  'input.unused',
  'input.refresh_not_allowed',
  'instance.not_usable',
  'instance.unconnected',
  'data.unknown',
  'data.type_mismatch',
]);

/** The reasons of `layout.invalid`. */
export const LAYOUT_REASONS = ['unknown_flow', 'unknown_element', 'element_twice', 'other_flow'] as const;

/** The data the texts can use. Every name has a value (empty if the finding does not have it). */
const knownDetails = [
  'name',
  'property',
  'parameter',
  'type',
  'field',
  'issue',
  'reason',
  'found',
  'expected',
  'elements',
  'owner',
  'kind',
  'scope',
  'limit',
  'source',
  'output',
  'target',
  'function',
  'operator',
  'values',
  'allowed',
  'object',
  'minimum',
  'maximum',
  'index',
  'left',
  'right',
  'what',
  'namespace',
  'rule',
  'refers_to',
  'list',
  'start',
  'end',
  'order_type',
  'rules',
  'names',
  'context',
  'length',
  'instance',
  'value',
  'key',
  'object_type',
  'use',
  'where',
] as const;

function plain(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(plain).join(', ');
  }
  return '';
}

function labelOfId(ctx: FindingTextContext, finding: Finding, kind: 'parameter' | 'property', id: string): string {
  if (ctx.document === null || ctx.types === null || finding.element === null) {
    return id;
  }
  const element = ctx.document.elements.find((candidate) => candidate.id === finding.element);
  const type = element === undefined ? undefined : ctx.types.byId.get(element.type);
  if (type === undefined) {
    return id;
  }
  const own = kind === 'parameter' ? type.parameters : type.properties;
  const found = own.find((candidate) => candidate.id === id);
  if (found !== undefined) {
    return labelText(found.label, ctx.language);
  }
  // The properties the user sets for an order come from the order type that the element selects.
  const selector = orderSelector(ctx.types, type);
  if (kind === 'property' && selector !== null) {
    for (const orderType of selector.orderTypes) {
      const property = orderType.properties.find((candidate) => candidate.id === id);
      if (property !== undefined) {
        return labelText(property.label, ctx.language);
      }
    }
  }
  return id;
}

/**
 * The name the user sees for the object with the identifier `key`, and the label of its value `member` (a property or
 * a method). What the document or the type descriptions do not know stays as the identifier.
 */
function memberTexts(ctx: FindingTextContext, key: string, member: string | null): { instance: string; property: string } {
  const owner = ctx.document === null ? undefined : instanceElementByKey(ctx.document).get(key.toLowerCase());
  const instance = owner?.instance;
  if (owner === undefined || instance === undefined || instance === null || ctx.types === null) {
    return { instance: owner?.instance?.name ?? key, property: member ?? '' };
  }
  const type = ctx.types.byId.get(owner.type);
  const row = member === null ? undefined : propertyRows(type, instance, ctx.language).find((candidate) => candidate.id === member);
  const method = member === null ? undefined : type?.methods.find((candidate) => candidate.id === member);
  return {
    instance: instance.name,
    property: row?.label ?? (method === undefined ? (member ?? '') : labelText(method.label, ctx.language)),
  };
}

/** Codes whose `type` is an identifier the user interface does not translate. */
const RAW_TYPE_CODES = new Set(['type.unknown', 'rule.invalid_type']);

export function findingParams(t: TFunction, finding: Finding, ctx: FindingTextContext): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of knownDetails) {
    params[key] = plain(finding.details[key]);
  }
  params.code = finding.code;
  params.subject = finding.subject ?? '';
  const element = ctx.document?.elements.find((candidate) => candidate.id === finding.element);
  params.element =
    element === undefined ? '' : ctx.types === null ? element.type : elementName(element, ctx.types, ctx.language);
  if (typeof finding.details.parameter === 'string') {
    params.parameter = labelOfId(ctx, finding, 'parameter', finding.details.parameter);
  }
  if (typeof finding.details.property === 'string') {
    params.property = labelOfId(ctx, finding, 'property', finding.details.property);
  }
  if (typeof finding.details.type === 'string' && ctx.types !== null && !RAW_TYPE_CODES.has(finding.code)) {
    params.type = typeName(ctx.types, finding.details.type, ctx.language);
  }
  if (MEMBER_CODES.has(finding.code) && typeof finding.details.instance === 'string') {
    const member = typeof finding.details.property === 'string' ? finding.details.property : null;
    const texts = memberTexts(ctx, finding.details.instance, member);
    params.instance = texts.instance;
    params.property = texts.property;
  }
  if (finding.code === 'instance.not_usable') {
    const firstUse = finding.details.first_use;
    const home =
      typeof firstUse === 'string' && ctx.document !== null && ctx.types !== null
        ? ctx.document.elements.find((candidate) => candidate.id === firstUse)
        : undefined;
    params.firstUse =
      home === undefined || ctx.types === null
        ? t('findings.firstUse.unnamed')
        : t('findings.firstUse.named', { name: elementName(home, ctx.types, ctx.language) });
  }
  const field = finding.details.field;
  if (typeof field === 'string') {
    const separator = field.indexOf(':');
    const kind = separator < 0 ? field : field.slice(0, separator);
    const id = separator < 0 ? '' : field.slice(separator + 1);
    if (kind === 'parameter') {
      params.field = t('findings.fields.parameter', { name: labelOfId(ctx, finding, 'parameter', id) });
    } else if (kind === 'property') {
      params.field = t('findings.fields.property', { name: labelOfId(ctx, finding, 'property', id) });
    } else if (kind === 'property_definition') {
      params.field = t('findings.fields.propertyDefinition', { name: id });
    } else if (kind === 'expression' || kind === 'result_expression') {
      params.field = t(`findings.fields.${kind}`);
    } else {
      params.field = field;
    }
  }
  const reason = params.reason ?? '';
  if (finding.code === 'connection.invalid') {
    params.reason = t(`findings.connectionReasons.${reason}`, { defaultValue: reason });
  } else if (finding.code === 'parameter.binding_invalid') {
    params.reason = t(`findings.bindingReasons.${reason}`, { defaultValue: reason });
  } else if (finding.code === 'rule.result_mismatch') {
    params.reason = t(`findings.resultReasons.${reason}`, { defaultValue: reason });
  } else if (finding.code === 'ruleset.reference_order') {
    params.kind = t(`findings.referenceKinds.${params.kind ?? ''}`, { defaultValue: params.kind ?? '' });
  } else if (finding.code === 'data.unknown') {
    params.reason = t(`findings.dataReasons.${reason}`, { defaultValue: reason });
  } else if (finding.code === 'layout.invalid') {
    params.reason = t(`findings.layoutReasons.${reason}`, { defaultValue: reason });
  } else if (finding.code === 'flow.unending_loop') {
    params.elements = String(Array.isArray(finding.details.elements) ? finding.details.elements.length : 0);
  }
  if (params.issue === 'syntax') {
    params.syntaxReason = t(`findings.syntax.${reason}`, { defaultValue: reason, found: params.found });
  }
  return params;
}

/** The keys of the texts that are missing for a list of identifiers. `has` tells whether a key exists. */
export function missingFindingTexts(codes: readonly string[], has: (key: string) => boolean): string[] {
  return codes.flatMap((code) => [`findings.${code}`, `findingFixes.${code}`]).filter((key) => !has(key));
}

const issueCodes = new Set(['expression.invalid', 'rule.unresolved_name']);

export type FindingTexts = { message: string; fix: string };

/** The text of a finding and the way to fix it. */
export function findingTexts(t: TFunction, i18n: I18n, finding: Finding, ctx: FindingTextContext): FindingTexts {
  const params = findingParams(t, finding, ctx);
  const key = `findings.${finding.code}`;
  const fixKey = `findingFixes.${finding.code}`;
  if (!i18n.exists(key)) {
    return { message: t('findings.unknown', params), fix: t('findingFixes.unknown', params) };
  }
  if (issueCodes.has(finding.code)) {
    const issueKey = `findings.issues.${params.issue ?? ''}`;
    const problem = i18n.exists(issueKey) ? t(issueKey, params) : t('findings.issues.other', params);
    const issueFix = `findingFixes.issues.${params.issue ?? ''}`;
    return {
      message: t(key, { ...params, problem }),
      fix: i18n.exists(issueFix) ? t(issueFix, params) : t('findingFixes.issues.other', params),
    };
  }
  return { message: t(key, params), fix: i18n.exists(fixKey) ? t(fixKey, params) : t('findingFixes.unknown', params) };
}
