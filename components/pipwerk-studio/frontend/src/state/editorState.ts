import type { Finding } from '../api/objects';
import type { FrameRects } from '../canvas/layout';
import { serializeDocument } from '../document/parse';
import { getRule } from '../document/ops';
import type { RulePath, StrategyDocument } from '../document/types';

/**
 * State of the open strategy. The strategy document is the authoritative state
 * (specification E3); the rest is view state: what is selected, which frames
 * are collapsed and where the frames stand.
 */

export type Selection =
  | { kind: 'strategy' }
  | { kind: 'elements'; ids: string[] }
  | { kind: 'rule'; path: RulePath };

export type EditorState = {
  document: StrategyDocument | null;
  /** The document as text when it was last saved, opened or created; the comparison shows unsaved changes. */
  savedText: string | null;
  /** The strategy has been saved at least once, so the next save replaces it. */
  persisted: boolean;
  selection: Selection;
  selectedEdges: string[];
  /** Owners whose frame is collapsed. */
  collapsed: string[];
  frames: FrameRects;
  /** Findings of the last check or save; `null` if there is none for the open strategy. */
  findings: Finding[] | null;
  /** Counts up when a strategy is opened, created or closed. The drawing area then fits the view. */
  generation: number;
};

export const initialEditorState: EditorState = {
  document: null,
  savedText: null,
  persisted: false,
  selection: { kind: 'strategy' },
  selectedEdges: [],
  collapsed: [],
  frames: {},
  findings: null,
  generation: 0,
};

export type EditorAction =
  | { type: 'loaded'; document: StrategyDocument; persisted: boolean; findings: Finding[] | null }
  | { type: 'closed' }
  | { type: 'edited'; change: (document: StrategyDocument) => StrategyDocument }
  | {
      type: 'canvasChanged';
      document: StrategyDocument;
      frames: FrameRects;
      selectedNodes: string[];
      selectedEdges: string[];
    }
  | { type: 'framesSynced'; frames: FrameRects }
  /** The frames grow around the elements that were put into them (after an element was dropped or inserted). */
  | { type: 'framesGrow'; grow: (document: StrategyDocument, frames: FrameRects) => FrameRects }
  | { type: 'select'; selection: Selection }
  | { type: 'toggleCollapse'; ownerId: string }
  | { type: 'saved'; saved: StrategyDocument; findings: Finding[]; replaceOpen: boolean }
  | { type: 'checked'; findings: Finding[] };

/** Whether the open strategy has changes that were not saved. */
export function isDirty(state: EditorState): boolean {
  return state.document !== null && serializeDocument(state.document) !== state.savedText;
}

function sameFrames(a: FrameRects, b: FrameRects): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }
  return keys.every((key) => {
    const left = a[key];
    const right = b[key];
    return (
      left !== undefined &&
      right !== undefined &&
      left.x === right.x &&
      left.y === right.y &&
      left.width === right.width &&
      left.height === right.height
    );
  });
}

/** Drops from the selection what no longer exists in the document. */
function pruneSelection(state: EditorState, document: StrategyDocument): Pick<EditorState, 'selection' | 'selectedEdges'> {
  const selection = state.selection;
  if (selection.kind === 'elements') {
    const existing = new Set(document.elements.map((element) => element.id));
    const ids = selection.ids.filter((id) => existing.has(id));
    return {
      selection: ids.length === 0 ? { kind: 'strategy' } : { kind: 'elements', ids },
      selectedEdges: state.selectedEdges,
    };
  }
  if (selection.kind === 'rule' && getRule(document, selection.path) === undefined) {
    return { selection: { kind: 'strategy' }, selectedEdges: state.selectedEdges };
  }
  return { selection, selectedEdges: state.selectedEdges };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'loaded':
      return {
        document: action.document,
        savedText: serializeDocument(action.document),
        persisted: action.persisted,
        selection: { kind: 'strategy' },
        selectedEdges: [],
        collapsed: [],
        frames: {},
        findings: action.findings,
        generation: state.generation + 1,
      };
    case 'closed':
      return { ...initialEditorState, generation: state.generation + 1 };
    case 'edited': {
      if (state.document === null) {
        return state;
      }
      const document = action.change(state.document);
      return document === state.document ? state : { ...state, document, ...pruneSelection(state, document) };
    }
    case 'canvasChanged': {
      let selection = state.selection;
      if (action.selectedNodes.length > 0) {
        selection = { kind: 'elements', ids: action.selectedNodes };
      } else if (selection.kind === 'elements') {
        selection = { kind: 'strategy' };
      }
      const next: EditorState = {
        ...state,
        document: action.document,
        frames: action.frames,
        selection,
        selectedEdges: action.selectedEdges,
      };
      return { ...next, ...pruneSelection(next, action.document), selectedEdges: action.selectedEdges };
    }
    case 'framesSynced':
      return sameFrames(state.frames, action.frames) ? state : { ...state, frames: action.frames };
    case 'framesGrow': {
      if (state.document === null) {
        return state;
      }
      const frames = action.grow(state.document, state.frames);
      return sameFrames(state.frames, frames) ? state : { ...state, frames };
    }
    case 'select':
      return { ...state, selection: action.selection, selectedEdges: [] };
    case 'toggleCollapse':
      return {
        ...state,
        collapsed: state.collapsed.includes(action.ownerId)
          ? state.collapsed.filter((id) => id !== action.ownerId)
          : [...state.collapsed, action.ownerId],
      };
    case 'saved': {
      if (state.document === null) {
        return state;
      }
      // If the open document was changed while it was being saved, it stays as it is (with the identifier
      // the backend gave) and so counts as changed; otherwise the saved version, as the backend wrote it,
      // takes its place.
      const document = action.replaceOpen ? action.saved : { ...state.document, id: action.saved.id };
      return {
        ...state,
        document,
        savedText: serializeDocument(action.saved),
        persisted: true,
        findings: action.findings,
        ...pruneSelection(state, document),
      };
    }
    case 'checked':
      return { ...state, findings: action.findings };
  }
}
