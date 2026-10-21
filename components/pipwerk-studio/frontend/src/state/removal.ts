import { requestExpressions } from '../api/objects';
import { removeElement, removalSet, removeStrategyParameter } from '../document/ops';
import { expressionPlaces, placeOwner, placePointer, placeStored, setPlaceStored, type ExpressionPlace } from '../document/places';
import { isConnectionValue, type StrategyDocument } from '../document/types';
import { emptyWhere, usesName, type Block } from '../expression/blocks';
import type { SupportedLanguage } from '../i18n';
import type { TypeIndex } from '../model/typeIndex';

/**
 * Removing an object, a step with a name or a strategy parameter that others use (specification 5.4, "Entfernen"):
 * the user is asked, with the list of the steps that use it; afterwards the places in expressions that named it are
 * empty places (specification 3.4), assignments that used it are "not assigned", lines and inputs that came from it
 * are gone. The expressions are read and written back by the expression endpoint; nothing here reads an expression.
 */

export type RemovalTarget = { kind: 'element'; id: string } | { kind: 'parameter'; key: string };

export type RemovalEdit = { place: ExpressionPlace; blocks: Block };

export type RemovalPlan = {
  /** The steps that use the thing, by identifier; `null` stands for the rules of the strategy. */
  users: (string | null)[];
  /** The expressions in which it is named, with the blocks without it. */
  edits: RemovalEdit[];
};

export const NO_USE: RemovalPlan = { users: [], edits: [] };

/** The elements that go with the target: the element itself and the steps of its management. */
function goneElements(document: StrategyDocument, target: RemovalTarget): Set<string> {
  return target.kind === 'element' ? new Set([target.id, ...removalSet(document, target.id)]) : new Set();
}

/** The identifiers under which expressions and connections name the target: keys of instances and of named steps. */
function goneKeys(document: StrategyDocument, gone: ReadonlySet<string>): Set<string> {
  const keys = new Set<string>();
  for (const element of document.elements) {
    if (!gone.has(element.id)) {
      continue;
    }
    if (element.instance !== undefined && element.instance !== null) {
      keys.add(element.instance.key.toLowerCase());
    }
    if (typeof element.key === 'string' && element.key !== '') {
      keys.add(element.key.toLowerCase());
    }
  }
  return keys;
}

function matcher(target: RemovalTarget, keys: ReadonlySet<string>): (path: readonly string[]) => boolean {
  if (target.kind === 'parameter') {
    const wanted = target.key.toLowerCase();
    return (path) => path[0]?.toLowerCase() === 'strategie' && path[1]?.toLowerCase() === wanted;
  }
  return (path) => path[0] !== undefined && keys.has(path[0].toLowerCase());
}

/** The steps that use the target without an expression: by an input or an assignment by data connection. */
function connectedUsers(document: StrategyDocument, keys: ReadonlySet<string>, gone: ReadonlySet<string>, parameter: string | null): Set<string> {
  const users = new Set<string>();
  for (const element of document.elements) {
    if (gone.has(element.id)) {
      continue;
    }
    if (element.inputs.some((input) => keys.has(input.instance.toLowerCase()))) {
      users.add(element.id);
    }
    for (const record of [element.parameters, element.properties]) {
      for (const binding of Object.values(record)) {
        if (isConnectionValue(binding.value) && keys.has(binding.value.instance.toLowerCase())) {
          users.add(element.id);
        }
        if (parameter !== null && binding.kind === 'parameter' && binding.value === parameter) {
          users.add(element.id);
        }
      }
    }
  }
  return users;
}

/** Who uses the target and which expressions name it. One request to the expression endpoint. */
export async function planRemoval(
  document: StrategyDocument,
  language: SupportedLanguage,
  target: RemovalTarget,
  signal?: AbortSignal,
): Promise<RemovalPlan> {
  const gone = goneElements(document, target);
  const keys = target.kind === 'element' ? goneKeys(document, gone) : new Set<string>();
  const matches = matcher(target, keys);
  const places = expressionPlaces(document).filter((place) => {
    const owner = placeOwner(place);
    return owner === null || !gone.has(owner);
  });
  const queries = places.flatMap((place) => {
    const pointer = placePointer(document, place);
    return pointer === null ? [] : [{ place, query: { pointer, stored: placeStored(document, place) } }];
  });
  const answers = queries.length === 0 ? [] : await requestExpressions(document, language, queries.map((item) => item.query), signal);
  const edits: RemovalEdit[] = [];
  const users = new Set<string | null>();
  queries.forEach((item, index) => {
    const blocks = answers[index]?.blocks ?? null;
    if (blocks !== null && usesName(blocks, matches)) {
      edits.push({ place: item.place, blocks: emptyWhere(blocks, matches) });
      users.add(placeOwner(item.place));
    }
  });
  for (const id of connectedUsers(document, keys, gone, target.kind === 'parameter' ? target.key : null)) {
    users.add(id);
  }
  return { users: [...users], edits };
}

/** The document without the target: the expressions of the plan are written without it, then it is removed. */
export async function removeWithPlan(
  document: StrategyDocument,
  types: TypeIndex,
  language: SupportedLanguage,
  target: RemovalTarget,
  plan: RemovalPlan,
  signal?: AbortSignal,
): Promise<StrategyDocument> {
  let next = document;
  if (plan.edits.length > 0) {
    const queries = plan.edits.map((edit) => ({ pointer: placePointer(document, edit.place) ?? '', blocks: edit.blocks }));
    const answers = await requestExpressions(document, language, queries, signal);
    plan.edits.forEach((edit, index) => {
      const answer = answers[index];
      if (answer !== undefined) {
        next = setPlaceStored(next, types, edit.place, answer.stored);
      }
    });
  }
  return target.kind === 'element' ? removeElement(next, types, target.id) : removeStrategyParameter(next, target.key);
}
