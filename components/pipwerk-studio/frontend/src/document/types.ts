import type { BindingKind, DataType, Scalar } from '../api/elementTypes';

/**
 * The strategy document (format `pipwerk.strategy`, format version 2.0,
 * `contracts/strategies/v2/`). It is the state of an open strategy; the
 * presentation on the drawing area is derived from it (specification E3). Every
 * type carries an index signature: fields that the user interface does not know
 * stay as they are.
 */

export const STRATEGY_FORMAT = 'pipwerk.strategy';
export const FORMAT_VERSION = '2.0';

/** The value of an assignment by data connection: a property of an instance on the drawing area. */
export type ConnectionValue = { instance: string; property: string };

export type Binding = {
  kind: BindingKind;
  value?: Scalar | ConnectionValue;
  [field: string]: unknown;
};

export type Bindings = Record<string, Binding>;

export type Origin = {
  object_type: string;
  template_id?: string | null;
  /** The name of an own template at the time of insertion; mentioned templates and object types store only the identifier. */
  template_name?: string | null;
  [field: string]: unknown;
};

export type ParameterDefinition = {
  key: string;
  name: string;
  datatype: DataType;
  object_type?: string | null;
  required?: boolean;
  default?: Scalar;
  choices?: string[];
  [field: string]: unknown;
};

export type PropertyDefinition = {
  key: string;
  name: string;
  datatype: DataType;
  expression: string;
  choices?: string[];
  [field: string]: unknown;
};

export type InstanceDocument = {
  name: string;
  key: string;
  object_type: string;
  origin?: Origin | null;
  parameter_values?: Bindings;
  parameters?: ParameterDefinition[];
  properties?: PropertyDefinition[];
  instances?: InstanceDocument[];
  rules?: InstanceDocument[];
  expression?: string | null;
  determined_property?: string | null;
  comparison?: string | null;
  result_expression?: string | null;
  [field: string]: unknown;
};

/** An input of an element: a property of an instance on the drawing area that the user connected with the element. */
export type InputDocument = { instance: string; property: string; [field: string]: unknown };

export type Position = { x: number; y: number };

export type ElementDocument = {
  id: string;
  type: string;
  /** The name of an element that shows no object; an element with an instance has the name of the instance. */
  name?: string | null;
  /** The identifier in expressions of a condition or calculation. */
  key?: string | null;
  /** The position the user gave by moving the element; `null` if the user interface arranges it. */
  position: Position | null;
  parameters: Bindings;
  properties: Bindings;
  inputs: InputDocument[];
  rules: InstanceDocument[];
  management_of: string | null;
  instance?: InstanceDocument | null;
  [field: string]: unknown;
};

export type ConnectionDocument = {
  id: string;
  source: string;
  output: string;
  target: string;
  [field: string]: unknown;
};

export type SectionDocument = {
  id: string;
  name: string;
  /** The element "place order" whose management the section belongs to, or `null` for the main flow. */
  flow: string | null;
  elements: string[];
  collapsed: boolean;
  [field: string]: unknown;
};

export type StrategyParameter = {
  key: string;
  name: string;
  datatype: DataType;
  object_type?: string | null;
  value?: Scalar;
  at_application?: boolean;
  choices?: string[];
  [field: string]: unknown;
};

export type Orientation = 'vertical' | 'horizontal';

export type StrategyDocument = {
  format: typeof STRATEGY_FORMAT;
  format_version: string;
  id: string;
  name: string;
  description: string;
  parameters: StrategyParameter[];
  rules: InstanceDocument[];
  elements: ElementDocument[];
  connections: ConnectionDocument[];
  sections: SectionDocument[];
  orientation: Orientation;
  collapsed_managements: string[];
  [field: string]: unknown;
};

export function isConnectionValue(value: unknown): value is ConnectionValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'instance' in value &&
    'property' in value &&
    typeof value.instance === 'string' &&
    typeof value.property === 'string'
  );
}
