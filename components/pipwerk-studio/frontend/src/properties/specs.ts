import type {
  BindingKind,
  Choice,
  Condition,
  DataType,
  ParameterDescription,
  PropertyDescription,
  Scalar,
  TypeDescription,
} from '../api/elementTypes';
import { bindingKinds } from '../api/elementTypes';
import { getOwn } from '../document/own';
import type { Binding, Bindings, ElementDocument, InstanceDocument, ParameterDefinition } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import { definitionChoices, labelText, orderSelector, timeUnitChoices, type TypeIndex } from '../model/typeIndex';

/**
 * What the property view shows for an element, an instance or a rule: one row
 * per parameter or property, built from the type description (item 5 of the
 * order). The rows know the datatype, the allowed kinds of binding and the
 * condition under which they apply; nothing here is tied to a single type.
 */

export type BindingSpec = {
  key: string;
  label: string;
  datatype: DataType;
  required: boolean;
  /** For a property of an order: MUSS. */
  must: boolean;
  default: Scalar;
  choices: Choice[];
  bindings: readonly BindingKind[];
  appliesWhen: Condition | null;
};

/** The rows of the parameters of a type. */
export function parameterSpecs(type: TypeDescription, language: SupportedLanguage): BindingSpec[] {
  return type.parameters.map((parameter) => specOfParameter(parameter, language));
}

function specOfParameter(parameter: ParameterDescription, language: SupportedLanguage): BindingSpec {
  return {
    key: parameter.id,
    label: labelText(parameter.label, language),
    datatype: parameter.datatype,
    required: parameter.required,
    must: false,
    default: parameter.default,
    choices: parameter.choices,
    bindings: parameter.bindings,
    appliesWhen: parameter.appliesWhen,
  };
}

function specOfProperty(property: PropertyDescription, language: SupportedLanguage): BindingSpec {
  return {
    key: property.id,
    label: labelText(property.label, language),
    datatype: property.datatype,
    required: false,
    must: property.must,
    default: property.default,
    choices: property.choices,
    // The description of a property does not list kinds of binding: all four are offered.
    bindings: bindingKinds,
    appliesWhen: property.appliesWhen,
  };
}

/**
 * The order type that an element selects, with the rows of the properties the
 * user sets for it. An element of a type without such a selection has none.
 */
export function orderPropertySpecs(
  index: TypeIndex,
  type: TypeDescription | undefined,
  element: Pick<ElementDocument, 'parameters'>,
  language: SupportedLanguage,
): BindingSpec[] {
  if (type === undefined) {
    return [];
  }
  const selector = orderSelector(index, type);
  if (selector === null) {
    return [];
  }
  const binding = getOwn(element.parameters, selector.parameter.id);
  const selected =
    binding !== undefined && binding.kind === 'fixed' && typeof binding.value === 'string'
      ? binding.value
      : selector.parameter.default;
  const orderType = selector.orderTypes.find((candidate) => candidate.id === selected);
  if (orderType === undefined) {
    return [];
  }
  return orderType.properties.filter((property) => property.setByUser).map((property) => specOfProperty(property, language));
}

/**
 * The rows of the own parameters that an instance defines. A parameter of the
 * datatype time unit without `choices` of its own offers the time units of the
 * type descriptions (`timeUnits`, see `timeUnitChoices`).
 */
export function definitionSpecs(definitions: readonly ParameterDefinition[], timeUnits: readonly Choice[]): BindingSpec[] {
  return definitions.map((definition) => ({
    key: definition.name,
    label: definition.name,
    datatype: definition.datatype,
    required: definition.required === true,
    must: false,
    default: definition.default ?? null,
    choices: definitionChoices(definition.datatype, definition.choices, timeUnits),
    bindings: bindingKinds,
    appliesWhen: null,
  }));
}

/**
 * The rows that apply: a row with a condition is shown only if the row it
 * names has that value. A row whose value is not fixed (an expression, a
 * parameter) has no known value, and the conditional row stays visible.
 */
export function visibleSpecs(specs: readonly BindingSpec[], bindings: Bindings): BindingSpec[] {
  return specs.filter((spec) => {
    if (spec.appliesWhen === null) {
      return true;
    }
    const { name, value } = spec.appliesWhen;
    const other = specs.find((candidate) => candidate.key === name);
    const binding: Binding | undefined = getOwn(bindings, name);
    if (binding === undefined) {
      return other !== undefined && other.default === value;
    }
    if (binding.kind !== 'fixed') {
      return true;
    }
    return binding.value === value;
  });
}

/** The value a binding of a kind starts with when the user changes the kind. */
export function startBinding(kind: BindingKind, spec: BindingSpec, parameterNames: readonly string[]): Binding {
  switch (kind) {
    case 'fixed': {
      if (spec.default !== null) {
        return { kind, value: spec.default };
      }
      switch (spec.datatype) {
        case 'number':
        case 'integer':
        case 'percent':
          return { kind, value: 0 };
        case 'boolean':
          return { kind, value: false };
        case 'choice':
          return { kind, value: spec.choices[0]?.id ?? '' };
        default:
          return { kind, value: '' };
      }
    }
    case 'parameter':
      return { kind, value: parameterNames[0] ?? '' };
    case 'expression':
      return { kind, value: '' };
    case 'application':
      return { kind };
  }
}

/** The instance of an element or a rule has the values of its parameters in `parameter_values`. */
export function instanceParameterSpecs(
  instance: InstanceDocument,
  type: TypeDescription | undefined,
  language: SupportedLanguage,
  index: TypeIndex,
): BindingSpec[] {
  const own = definitionSpecs(instance.parameters ?? [], timeUnitChoices(index));
  const fromType = type === undefined ? [] : parameterSpecs(type, language);
  const known = new Set(fromType.map((spec) => spec.key));
  return [...fromType, ...own.filter((spec) => !known.has(spec.key))];
}
