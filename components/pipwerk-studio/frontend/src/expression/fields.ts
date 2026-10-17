import type { ExpressionNames } from '../api/objects';
import type { ElementDocument, InstanceDocument, StrategyDocument } from '../document/types';

/**
 * Where an expression stands in the document, in the way the check names it
 * (`element`, `subject`, `field`; see the technical documentation of the library,
 * section 9): the key joins the three and finds the expression again.
 */

export type ExpressionPlace = { element: string | null; subject: string | null; field: string };

export function placeKey(place: ExpressionPlace): string {
  return `${place.element ?? ''}|${place.subject ?? ''}|${place.field}`;
}

export function placeOf(expression: ExpressionNames): ExpressionPlace {
  return { element: expression.element, subject: expression.subject, field: expression.field };
}

function textOfBinding(binding: { kind: string; value?: unknown } | undefined): string | undefined {
  return binding !== undefined && binding.kind === 'expression' && typeof binding.value === 'string'
    ? binding.value
    : undefined;
}

/** The instance or rule with a name, searched along the dotted `subject` (`rule set.rule`). */
function findSubject(
  document: StrategyDocument,
  element: ElementDocument | undefined,
  subject: string,
): InstanceDocument | undefined {
  const names = subject.split('.');
  const [first, ...rest] = names;
  const roots: InstanceDocument[] =
    element === undefined
      ? document.rules
      : [...(element.instance === undefined || element.instance === null ? [] : [element.instance]), ...element.rules];
  let current = roots.find((candidate) => candidate.name === first);
  for (const name of rest) {
    if (current === undefined) {
      return undefined;
    }
    const inside: InstanceDocument[] = [...(current.instances ?? []), ...(current.rules ?? [])];
    current = inside.find((candidate) => candidate.name === name);
  }
  return current;
}

/** The text of the expression at a place, or `undefined` if there is none there. */
export function expressionText(document: StrategyDocument, place: ExpressionPlace): string | undefined {
  const element =
    place.element === null ? undefined : document.elements.find((candidate) => candidate.id === place.element);
  if (place.element !== null && element === undefined) {
    return undefined;
  }
  const separator = place.field.indexOf(':');
  const kind = separator < 0 ? place.field : place.field.slice(0, separator);
  const id = separator < 0 ? '' : place.field.slice(separator + 1);
  if (place.subject === null) {
    if (element === undefined) {
      return undefined;
    }
    if (kind === 'parameter') {
      return textOfBinding(element.parameters[id]);
    }
    if (kind === 'property') {
      return textOfBinding(element.properties[id]);
    }
    return undefined;
  }
  const instance = findSubject(document, element, place.subject);
  if (instance === undefined) {
    return undefined;
  }
  switch (kind) {
    case 'parameter':
      return textOfBinding(instance.parameter_values?.[id]);
    case 'expression':
      return typeof instance.expression === 'string' ? instance.expression : undefined;
    case 'result_expression':
      return typeof instance.result_expression === 'string' ? instance.result_expression : undefined;
    case 'property_definition':
      return instance.properties?.find((definition) => definition.name === id)?.expression;
    default:
      return undefined;
  }
}
