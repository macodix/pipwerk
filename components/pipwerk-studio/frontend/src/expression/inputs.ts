import { addInput } from '../document/ops';
import type { ExpressionPlace } from '../document/places';
import type { StrategyDocument } from '../document/types';
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

/**
 * Adds the inputs for the instances an expression addresses (specification 5.4: "Wählt der Anwender in den Bausteinen
 * die Eigenschaft einer Instanz, entsteht dazu ein Eingang"). An input that is there stays; none is ever removed here.
 */
export function withInputs(document: StrategyDocument, owner: string | null, blocks: Block | null): StrategyDocument {
  if (owner === null || blocks === null) {
    return document;
  }
  let next = document;
  for (const reference of instanceReferences(blocks)) {
    const instance = document.elements.find((candidate) => candidate.instance?.key.toLowerCase() === reference.instance.toLowerCase());
    if (instance === undefined || instance.id === owner || instance.instance === null || instance.instance === undefined) {
      continue;
    }
    next = addInput(next, owner, { instance: instance.instance.key, property: reference.property });
  }
  return next;
}
