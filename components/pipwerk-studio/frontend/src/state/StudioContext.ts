import { createContext, useContext } from 'react';

import type { FindingsIndex } from '../findings/findingsModel';
import type { LiveNames } from '../expression/useLiveNames';
import type { FunctionItem } from '../expression/completions';
import type { RuleOwner, RulePath, StrategyDocument } from '../document/types';
import type { SupportedLanguage } from '../i18n';
import type { LibraryGroup, LibrarySource } from '../library/libraryModel';
import type { TypeIndex } from '../model/typeIndex';
import type { Selection } from './editorState';

/** What the views of an open strategy need: the strategy, the type descriptions and the ways to change the strategy. */
export type StudioApi = {
  document: StrategyDocument;
  types: TypeIndex;
  language: SupportedLanguage;
  findings: FindingsIndex;
  /** `true` once a check or a save has delivered findings for this strategy. */
  findingsKnown: boolean;
  liveNames: LiveNames;
  functions: readonly FunctionItem[];
  library: readonly LibraryGroup[];
  selection: Selection;
  edit: (change: (document: StrategyDocument) => StrategyDocument) => void;
  select: (selection: Selection) => void;
  /** Adds an entry of the library (a rule or rule set) to a list of rules; inside a rule set with `inside`. */
  addRuleFromLibrary: (owner: RuleOwner, source: LibrarySource, inside?: number[]) => void;
  /** Adds a new, empty rule to a list of rules. */
  addNewRule: (owner: RuleOwner, inside?: number[]) => void;
  removeRule: (path: RulePath) => void;
  moveRule: (path: RulePath, delta: -1 | 1) => void;
};

export const StudioContext = createContext<StudioApi | null>(null);

export function useStudio(): StudioApi {
  const value = useContext(StudioContext);
  if (value === null) {
    throw new Error('StudioContext is missing');
  }
  return value;
}
