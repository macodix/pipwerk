import { createContext, useContext } from 'react';

import type { IndexedFindings } from '../findings/findingsModel';
import type { DescribeContext } from '../model/describe';
import type { TypeIndex } from '../model/typeIndex';
import type { Expressions } from './useExpressions';
import type { StudioController } from './useStudioController';

/** What every part of the interface needs of the open strategy: state, actions, type descriptions, expressions, findings. */
export type StudioValue = {
  studio: StudioController;
  /** The type descriptions; `null` while they are not loaded. */
  types: TypeIndex | null;
  expressions: Expressions;
  findings: IndexedFindings;
  /** For the texts of elements and values; `null` without a strategy or type descriptions. */
  describe: DescribeContext | null;
};

export const StudioContext = createContext<StudioValue | null>(null);

export function useStudio(): StudioValue {
  const value = useContext(StudioContext);
  if (value === null) {
    throw new Error('useStudio is used outside of the StudioContext');
  }
  return value;
}
