import { requestRemoval, type RemovalKind } from '../api/objects';
import { closeGapAfterRemoval } from '../document/ops';
import type { StrategyDocument } from '../document/types';
import type { TypeIndex } from '../model/typeIndex';

/**
 * Removing an object, a step or a strategy parameter that others use (specification 5.4, "Entfernen"): the user is
 * asked, with the list of the steps that use it and, at "Order aufgeben", the steps of its management that go with it.
 * Afterwards the places in expressions that named it are empty places (specification 3.4), assignments that used it are
 * "not assigned", lines and inputs that came from it are gone. Who uses it and what the strategy looks like without it
 * the backend says (`POST /api/v1/removals`, specification 4.2); the user interface does not read an expression.
 */

export type RemovalTarget =
  | { kind: 'element'; id: string }
  | { kind: 'parameter'; key: string }
  | { kind: 'rule'; key: string };

export type RemovalPlan = {
  /** The steps that use the thing, by identifier; `null` stands for the rules of the strategy. */
  users: (string | null)[];
};

export const NO_USE: RemovalPlan = { users: [] };

function kindOf(target: RemovalTarget): RemovalKind {
  return target.kind === 'element' ? 'element' : target.kind === 'parameter' ? 'strategy_parameter' : 'rule';
}

function targetOf(target: RemovalTarget): string {
  return target.kind === 'element' ? target.id : target.key;
}

/** Who uses the target. One request to the backend. */
export async function planRemoval(document: StrategyDocument, target: RemovalTarget, signal?: AbortSignal): Promise<RemovalPlan> {
  const report = await requestRemoval(document, kindOf(target), targetOf(target), false, signal);
  const users: (string | null)[] = [...report.usedBy];
  if (report.usedByRules.length > 0) {
    users.push(null);
  }
  return { users };
}

/**
 * The strategy without the target, as the backend forms it: places in expressions that named it are empty, assignments
 * are "not assigned", inputs and connections are gone. A step that had one way in and one way out leaves its predecessor
 * connected with its successor.
 */
export async function removeWithBackend(
  document: StrategyDocument,
  types: TypeIndex,
  target: RemovalTarget,
  signal?: AbortSignal,
): Promise<StrategyDocument> {
  const report = await requestRemoval(document, kindOf(target), targetOf(target), true, signal);
  if (report.document === null) {
    throw new Error('removals without document');
  }
  return target.kind === 'element' ? closeGapAfterRemoval(document, report.document, types, target.id) : report.document;
}
