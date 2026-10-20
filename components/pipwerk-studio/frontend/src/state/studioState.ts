import type { Finding } from '../api/objects';
import type { StrategyDocument } from '../document/types';

/** What the properties view shows (specification 5.1). */
export type Selection =
  | { kind: 'strategy' }
  | { kind: 'element'; id: string }
  | { kind: 'frame'; id: string }
  | { kind: 'section'; id: string };

/** The areas of the narrow layouts: below 1100 pixels the library and the properties view share a side area. */
export type Panel = 'canvas' | 'library' | 'props';

export type WireMode = 'all' | 'selection' | 'off';

/** A short note that disappears on its own (specification 5.3: nothing to click away except critical errors). */
export type Notice = { serial: number; key: string; params: Record<string, string> };

export type StudioState = {
  document: StrategyDocument | null;
  /** The text of the document at the last opening or saving; a document that differs has unsaved changes. */
  savedText: string | null;
  /** The strategy exists in the object directory (the next save replaces it). */
  persisted: boolean;
  /** The findings of the last check; `null` until a check ran. */
  findings: Finding[] | null;
  selection: Selection;
  panel: Panel;
  wires: WireMode;
  /** The output of a step that was clicked: the next step that is clicked becomes its successor. */
  armed: { from: string; output: string } | null;
  /** The cards that show all their properties. */
  openCards: readonly string[];
  /** Counts up whenever a strategy is opened or created: the view of the drawing area is set anew. */
  openCount: number;
  /** An element the view is moved to if it is outside of the view. */
  reveal: { id: string; serial: number } | null;
  /** A field of the properties view the user is sent to by a finding. */
  focusField: { field: string; serial: number } | null;
  notice: Notice | null;
};

export const initialStudioState: StudioState = {
  document: null,
  savedText: null,
  persisted: false,
  findings: null,
  selection: { kind: 'strategy' },
  panel: 'canvas',
  wires: 'all',
  armed: null,
  openCards: [],
  openCount: 0,
  reveal: null,
  focusField: null,
  notice: null,
};

export type StudioAction =
  | { type: 'loaded'; document: StrategyDocument; persisted: boolean; findings: Finding[] | null }
  | { type: 'closed' }
  | {
      type: 'edited';
      change: (document: StrategyDocument) => StrategyDocument;
      selection?: Selection;
      reveal?: string;
    }
  | { type: 'saved'; saved: StrategyDocument; findings: Finding[]; replaceOpen: boolean }
  | { type: 'checked'; findings: Finding[] }
  | { type: 'select'; selection: Selection; panel?: Panel }
  | { type: 'panel'; panel: Panel }
  | { type: 'wires'; mode: WireMode }
  | { type: 'armed'; armed: StudioState['armed'] }
  | { type: 'toggleCard'; id: string }
  | { type: 'focusField'; field: string }
  | { type: 'notice'; key: string; params?: Record<string, string> };

export function documentText(document: StrategyDocument): string {
  return JSON.stringify(document);
}

/** Unsaved changes: the document differs from the saved one, or a new strategy was never saved. */
export function isDirty(state: StudioState): boolean {
  if (state.document === null) {
    return false;
  }
  return !state.persisted || state.savedText !== documentText(state.document);
}

let serial = 0;
const nextSerial = (): number => {
  serial += 1;
  return serial;
};

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'loaded':
      return {
        ...initialStudioState,
        wires: state.wires,
        document: action.document,
        savedText: action.persisted ? documentText(action.document) : null,
        persisted: action.persisted,
        findings: action.findings,
        openCount: state.openCount + 1,
      };
    case 'closed':
      return { ...initialStudioState, wires: state.wires, openCount: state.openCount };
    case 'edited': {
      if (state.document === null) {
        return state;
      }
      const document = action.change(state.document);
      if (document === state.document && action.selection === undefined) {
        return state;
      }
      return {
        ...state,
        document,
        selection: action.selection ?? state.selection,
        armed: null,
        reveal: action.reveal === undefined ? state.reveal : { id: action.reveal, serial: nextSerial() },
      };
    }
    case 'saved':
      return {
        ...state,
        document: action.replaceOpen ? action.saved : state.document,
        savedText: documentText(action.saved),
        persisted: true,
        findings: action.findings,
      };
    case 'checked':
      return { ...state, findings: action.findings };
    case 'select':
      return { ...state, selection: action.selection, armed: null, panel: action.panel ?? state.panel };
    case 'panel':
      return { ...state, panel: action.panel };
    case 'wires':
      return { ...state, wires: action.mode };
    case 'armed':
      return { ...state, armed: action.armed };
    case 'toggleCard':
      return {
        ...state,
        openCards: state.openCards.includes(action.id)
          ? state.openCards.filter((id) => id !== action.id)
          : [...state.openCards, action.id],
      };
    case 'focusField':
      return { ...state, focusField: { field: action.field, serial: nextSerial() } };
    case 'notice':
      return { ...state, notice: { serial: nextSerial(), key: action.key, params: action.params ?? {} } };
  }
}
