import type { InstanceUsage, UsageReport } from '../api/usage';
import type { StrategyDocument } from '../document/types';
import type { ExpressionReference } from '../model/elements';
import type { TypeIndex } from '../model/typeIndex';
import { buildUsageModel, type UsageModel } from '../model/uses';
import { EMA_ELEMENT_IDS as EL } from './emaTrendfolge';

/**
 * The expressions of "EMA-Trendfolge" name the instances like this (the user interface learns them from the blocks the
 * expression endpoint returns): EMA20 and EMA50 in the condition, the calculation and the condition of the management,
 * ATR14 in the two calculations of the stop.
 */
export function emaReferences(): Map<string, ExpressionReference[]> {
  const ema = [
    { instance: 'ema20', property: 'wert' },
    { instance: 'ema50', property: 'wert' },
  ];
  const atr = [{ instance: 'atr14', property: 'wert' }];
  return new Map([
    [EL.cross, ema],
    [EL.direction, ema],
    [EL.stop, atr],
    [EL.crossAgainst, ema],
    [EL.newStop, atr],
  ]);
}

/** The lines and places of the cards of a document without a report of the backend (the approximation from the document). */
export function usesOf(
  document: StrategyDocument,
  types: TypeIndex,
  references: ReadonlyMap<string, readonly ExpressionReference[]> = new Map(),
): UsageModel {
  return buildUsageModel(document, types, null, references);
}

/** A report of the backend for the tests: only what a test names, everything else usable everywhere. */
export function reportOf(part: Partial<UsageReport> & { instances: InstanceUsage[] }): UsageReport {
  return { elements: [], strategyRules: [], truncated: false, ...part };
}

export function instanceUsage(part: Partial<InstanceUsage> & Pick<InstanceUsage, 'instance' | 'element'>): InstanceUsage {
  return {
    name: part.instance,
    objectType: 'EMA',
    canRefresh: false,
    connected: part.firstUse !== undefined && part.firstUse !== null,
    firstUse: null,
    firstUseSource: null,
    usableEverywhere: true,
    usableAt: [],
    usableAtOmitted: false,
    ...part,
  };
}
