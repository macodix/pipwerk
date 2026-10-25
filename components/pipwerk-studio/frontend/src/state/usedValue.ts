import { requestExpressions } from '../api/objects';
import type { InputRef } from '../document/ops';
import { expressionPlaces, placeOwner, placePointer, placeStored, type ExpressionPlace } from '../document/places';
import type { StrategyDocument } from '../document/types';
import { argumentBlock, isMember, mapBlocks, methodBlock, nameBlock, type Block } from '../expression/blocks';
import type { SupportedLanguage } from '../i18n';

/**
 * The expressions of an element after the user chose another property or method (or other arguments) for a value the
 * element uses (specification 5.4, "Verwendete Werte"): "Die Wahl ändert auch den Ausdruck des Elements, wenn er diesen
 * Wert verwendet." The user interface does not read an expression (E2): it asks the expression endpoint for the blocks of
 * every expression of the element and its rules, replaces the blocks that name the old value, and asks the endpoint to
 * form the expressions from the changed blocks.
 */

/** The block that names a property or a method of an instance, with the fixed values of the arguments of a method. */
export function memberBlockOf(member: InputRef): Block {
  return member.kind === 'method'
    ? methodBlock([member.instance, member.property], (member.arguments ?? []).map(argumentBlock))
    : nameBlock([member.instance, member.property]);
}

/** The tree with every block that names `from` replaced by one that names `to`; `null` if there was none. */
export function replaceMemberIn(block: Block, from: InputRef, to: InputRef): Block | null {
  let changed = false;
  const next = mapBlocks(block, (current) => {
    if (isMember(current, from.instance, from.property, from.kind === 'method' ? 'method' : 'property')) {
      changed = true;
      return memberBlockOf(to);
    }
    return undefined;
  });
  return changed ? next : null;
}

export type ExpressionRewrite = { place: ExpressionPlace; stored: string };

/** The expressions of the element (its assignments and its rules) that name `from`, written with `to`. */
export async function rewriteMember(
  document: StrategyDocument,
  language: SupportedLanguage,
  owner: string,
  from: InputRef,
  to: InputRef,
  signal?: AbortSignal,
): Promise<ExpressionRewrite[]> {
  const places = expressionPlaces(document).filter((place) => placeOwner(place) === owner);
  const asked = places.flatMap((place) => {
    const pointer = placePointer(document, place);
    return pointer === null ? [] : [{ place, pointer, stored: placeStored(document, place) }];
  });
  if (asked.length === 0) {
    return [];
  }
  const answers = await requestExpressions(
    document,
    language,
    asked.map(({ pointer, stored }) => ({ pointer, stored })),
    signal,
  );
  const changes: { place: ExpressionPlace; pointer: string; blocks: Block }[] = [];
  asked.forEach((item, index) => {
    const blocks = answers[index]?.blocks ?? null;
    const replaced = blocks === null ? null : replaceMemberIn(blocks, from, to);
    if (replaced !== null) {
      changes.push({ place: item.place, pointer: item.pointer, blocks: replaced });
    }
  });
  if (changes.length === 0) {
    return [];
  }
  const formed = await requestExpressions(
    document,
    language,
    changes.map(({ pointer, blocks }) => ({ pointer, blocks })),
    signal,
  );
  return changes.map((change, index) => ({ place: change.place, stored: formed[index]?.stored ?? placeStored(document, change.place) }));
}
