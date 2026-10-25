import { addInput, setFirstUse } from '../document/ops';
import type { ExpressionPlace } from '../document/places';
import type { StrategyDocument } from '../document/types';
import { memberChoices } from '../model/usedValues';
import type { SupportedLanguage } from '../i18n';
import type { TypeIndex } from '../model/typeIndex';
import { instanceReferences, type Block } from './blocks';

/** The element whose inputs the values of an expression at the place join: the element or the owner of the rule. */
export function ownerElement(place: ExpressionPlace): string | null {
  switch (place.kind) {
    case 'binding':
      return place.element;
    case 'rule':
    case 'property':
    case 'parameter':
      return place.ref.root.kind === 'element' ? place.ref.root.id : null;
  }
}

export type InputContext = {
  /** The type descriptions: only what an instance supplies becomes an input. Without them every name does. */
  types?: TypeIndex | null;
  language?: SupportedLanguage;
  /**
   * Whether an element already uses the instance shown by the card (the report of the backend). If not, the element the
   * input is added to becomes the element of its first use, as when the user connects the instance on the drawing area
   * (specification 3.3, 5.3).
   */
  connected?: (card: string) => boolean;
};

/**
 * Adds the inputs for the instances an expression addresses (specification 5.4: "Wählt der Anwender in den Bausteinen die
 * Eigenschaft einer Instanz, entsteht dazu ein Eingang"): one for each property, and one for each method with fixed
 * arguments. An input that is there stays; none is ever removed here. An instance that no element used yet gets the
 * element as the element of its first use (`first_use`).
 */
export function withInputs(
  document: StrategyDocument,
  owner: string | null,
  blocks: Block | null,
  context: InputContext = {},
): StrategyDocument {
  if (owner === null || blocks === null) {
    return document;
  }
  let next = document;
  for (const reference of instanceReferences(blocks)) {
    const card = next.elements.find((candidate) => candidate.instance?.key.toLowerCase() === reference.instance.toLowerCase());
    if (card === undefined || card.id === owner || card.instance === null || card.instance === undefined) {
      continue;
    }
    if (reference.kind === 'method' && reference.arguments === null) {
      continue;
    }
    if (context.types !== undefined && context.types !== null) {
      const choices = memberChoices(context.types.byId.get(card.type), card.instance, context.language ?? 'de');
      if (!choices.some((choice) => choice.kind === reference.kind && choice.id.toLowerCase() === reference.property.toLowerCase())) {
        continue;
      }
    }
    next = addInput(next, owner, {
      instance: card.instance.key,
      property: reference.property,
      kind: reference.kind,
      arguments: reference.arguments ?? [],
    });
    const stored = next.elements.find((candidate) => candidate.id === card.id)?.instance?.first_use;
    if (context.connected !== undefined && !context.connected(card.id) && (stored === null || stored === undefined)) {
      next = setFirstUse(next, card.id, owner);
    }
  }
  return next;
}
