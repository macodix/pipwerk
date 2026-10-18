import type { BindingKind, DataType, Scalar } from '../api/elementTypes';

/**
 * The strategy document (format `pipwerk.strategy`, `contracts/strategies/v1/`).
 * It is the state of an open strategy; the model of React Flow is derived from
 * it (specification E3). Every type carries an index signature: fields that the
 * user interface does not know stay as they are (item 3 of the order).
 */

export const STRATEGY_FORMAT = 'pipwerk.strategy';
export const FORMAT_VERSION = '1.0';

export type Binding = {
  kind: BindingKind;
  value?: Scalar;
  [field: string]: unknown;
};

export type Bindings = Record<string, Binding>;

export type Origin = {
  object_type: string;
  template_id?: string | null;
  template_title?: string | null;
  [field: string]: unknown;
};

export type ParameterDefinition = {
  name: string;
  datatype: DataType;
  required?: boolean;
  default?: Scalar;
  choices?: string[];
  [field: string]: unknown;
};

export type PropertyDefinition = {
  name: string;
  datatype: DataType;
  expression: string;
  choices?: string[];
  [field: string]: unknown;
};

export type Comparison = 'hoechstens' | 'mindestens' | 'gleich';

export const comparisons: readonly Comparison[] = ['hoechstens', 'mindestens', 'gleich'];

export type InstanceDocument = {
  name: string;
  object_type: string;
  origin?: Origin | null;
  parameter_values?: Bindings;
  parameters?: ParameterDefinition[];
  properties?: PropertyDefinition[];
  instances?: InstanceDocument[];
  rules?: InstanceDocument[];
  expression?: string | null;
  determined_property?: string | null;
  comparison?: Comparison | null;
  result_expression?: string | null;
  [field: string]: unknown;
};

export type ElementDocument = {
  id: string;
  type: string;
  title: string;
  name: string | null;
  x: number;
  y: number;
  parameters: Bindings;
  properties: Bindings;
  rules: InstanceDocument[];
  management_of: string | null;
  instance?: InstanceDocument | null;
  [field: string]: unknown;
};

export type ConnectionDocument = {
  source: string;
  output: string;
  target: string;
  [field: string]: unknown;
};

export type StrategyParameter = {
  name: string;
  datatype: DataType;
  value?: Scalar;
  at_application?: boolean;
  choices?: string[];
  [field: string]: unknown;
};

export type StrategyDocument = {
  format: typeof STRATEGY_FORMAT;
  format_version: string;
  id: string;
  title: string;
  description: string;
  parameters: StrategyParameter[];
  rules: InstanceDocument[];
  elements: ElementDocument[];
  connections: ConnectionDocument[];
  [field: string]: unknown;
};

/** Where the rules of a rule list stand: in the strategy or at an element. */
export type RuleOwner = { kind: 'strategy' } | { kind: 'element'; id: string };

/** A rule or rule set: the list of its owner and the position in that list, then the position in a rule set, and so on. */
export type RulePath = { owner: RuleOwner; indices: number[] };

export function sameRuleOwner(a: RuleOwner, b: RuleOwner): boolean {
  return a.kind === b.kind && (a.kind === 'strategy' || (b.kind === 'element' && a.id === b.id));
}

export function sameRulePath(a: RulePath, b: RulePath): boolean {
  return (
    sameRuleOwner(a.owner, b.owner) &&
    a.indices.length === b.indices.length &&
    a.indices.every((index, position) => index === b.indices[position])
  );
}
