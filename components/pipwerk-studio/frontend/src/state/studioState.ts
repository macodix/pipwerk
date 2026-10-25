import type { Finding } from '../api/objects';
import type { StrategyDocument } from '../document/types';

/** The expression a finding refers to: the field as the check names it, the rule it belongs to, the kind of finding. */
export type ExpressionFocus = { field: string; subject: string | null; code: string };

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

/**
 * The guided setup of a new strategy (specification 5.5): the step it is at and the elements it laid out so far, so
 * that going back and changing a step replaces what that step made.
 */
export type WizardState = {
  step: number;
  /** The element the trigger step made. */
  trigger: string | null;
  /** The objects the indicator step made. */
  indicators: readonly string[];
  /** The element the condition step made. */
  condition: string | null;
  /**
   * The user chose something else (an element, the strategy, an entry of the library) while the assistant was running:
   * the properties view shows the choice, and above it "Assistent, Schritt n von 5" with "Assistent fortsetzen".
   */
  paused: boolean;
};

export const initialWizard: WizardState = { step: 1, trigger: null, indicators: [], condition: null, paused: false };

export type StudioState = {
  document: StrategyDocument | null;
  /** The guided setup is open; `null` when the user works by hand. */
  wizard: WizardState | null;
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
  /**
   * A field of the properties view the user is sent to by a finding. A finding in an expression also names the place:
   * the formula view of that expression opens and marks the spot (specification 5.5).
   */
  focusField: { field: string; serial: number; place: ExpressionFocus | null } | null;
  notice: Notice | null;
};

export const initialStudioState: StudioState = {
  document: null,
  wizard: null,
  savedText: null,
  persisted: false,
  findings: null,
  selection: { kind: 'strategy' },
  // Without an open strategy the properties view is shown first in the narrow layouts (specification 5.1).
  panel: 'props',
  // The switch "Weitere Verwendungen" starts with "Auswahl" (specification 5.3): "Alle" lays long lines across the area.
  wires: 'selection',
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
  | { type: 'focusField'; field: string; place?: ExpressionFocus }
  | { type: 'wizard'; wizard: Partial<WizardState> | null }
  | { type: 'wizardPaused'; paused: boolean }
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
        panel: 'canvas',
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
      return {
        ...state,
        selection: action.selection,
        armed: null,
        panel: action.panel ?? state.panel,
        // A choice of the user leaves the assistant where it is; "Assistent fortsetzen" takes it up again.
        wizard: state.wizard === null ? null : { ...state.wizard, paused: true },
      };
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
      return { ...state, focusField: { field: action.field, serial: nextSerial(), place: action.place ?? null } };
    case 'wizard':
      return {
        ...state,
        wizard: action.wizard === null ? null : { ...(state.wizard ?? initialWizard), ...action.wizard },
      };
    case 'wizardPaused':
      return state.wizard === null ? state : { ...state, wizard: { ...state.wizard, paused: action.paused } };
    case 'notice':
      return { ...state, notice: { serial: nextSerial(), key: action.key, params: action.params ?? {} } };
  }
}
