import type { TypeDescription } from '../api/elementTypes';

/**
 * What an object type lets the user put into an instance of it (specification 3.3): the descriptions have no field for
 * it, so it follows from their form without knowing a single type (hint H7): a rule has a rule expression, a ruleset
 * holds rules, a trend an expression for its properties and contained objects, and an indicator without properties of
 * its own in the description is one the user defines.
 */
export type ContentKind = 'rule' | 'ruleset' | 'trend' | 'indicator';

export function contentKind(type: TypeDescription | undefined): ContentKind | null {
  if (type === undefined || type.kind !== 'object_type') {
    return null;
  }
  switch (type.category) {
    case 'rule':
      return 'rule';
    case 'ruleset':
      return 'ruleset';
    case 'trend':
      return 'trend';
    case 'indicator':
      return type.properties.length === 0 ? 'indicator' : null;
    default:
      return null;
  }
}

/** Own parameters can be defined in a rule and in an indicator (specification 3.3). */
export function allowsOwnParameters(kind: ContentKind | null): boolean {
  return kind === 'rule' || kind === 'indicator';
}

/** Own properties can be defined in an indicator and in a trend. */
export function allowsOwnProperties(kind: ContentKind | null): boolean {
  return kind === 'indicator' || kind === 'trend';
}

/** Indicators and rules can be contained in an indicator and in a trend; a ruleset contains rules. */
export function allowsContainedInstances(kind: ContentKind | null): boolean {
  return kind === 'indicator' || kind === 'trend';
}

export function allowsContainedRules(kind: ContentKind | null): boolean {
  return kind === 'indicator' || kind === 'trend' || kind === 'ruleset';
}

/** The datatypes the user can give an own parameter or property. */
export const OWN_DATATYPES = ['number', 'integer', 'percent', 'boolean', 'text', 'time_unit'] as const;
