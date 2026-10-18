import { describe, expect, it } from 'vitest';

import { loadTestcase } from '../testing/fixtures';
import { addRule, setStrategyText, updateElement } from '../document/ops';
import {
  editorReducer,
  initialEditorState,
  isDirty,
  type EditorAction,
  type EditorState,
} from './editorState';

function run(state: EditorState, ...actions: EditorAction[]): EditorState {
  return actions.reduce(editorReducer, state);
}

function opened(persisted = true): EditorState {
  return run(initialEditorState, { type: 'loaded', document: loadTestcase('str-03'), persisted, findings: null });
}

describe('loading and closing', () => {
  it('makes a strategy the open one, unchanged, with the strategy selected and the view reset', () => {
    const state = opened();

    expect(state.document).toEqual(loadTestcase('str-03'));
    expect(isDirty(state)).toBe(false);
    expect(state.persisted).toBe(true);
    expect(state.selection).toEqual({ kind: 'strategy' });
    expect(state.collapsed).toEqual([]);
    expect(state.frames).toEqual({});
    expect(state.findings).toBeNull();
    expect(state.generation).toBe(initialEditorState.generation + 1);
  });

  it('counts the generation up when a strategy is closed or another one is opened', () => {
    const opened1 = opened();
    const closed = run(opened1, { type: 'closed' });
    const opened2 = run(closed, { type: 'loaded', document: loadTestcase('str-01'), persisted: true, findings: null });

    expect(closed.document).toBeNull();
    expect(closed.generation).toBe(opened1.generation + 1);
    expect(opened2.generation).toBe(closed.generation + 1);
  });

  it('forgets the view state of the strategy that was open', () => {
    const state = run(
      opened(),
      { type: 'toggleCollapse', ownerId: 'x' },
      { type: 'framesSynced', frames: { x: { x: 1, y: 2, width: 3, height: 4 } } },
      { type: 'loaded', document: loadTestcase('str-01'), persisted: true, findings: null },
    );

    expect(state.collapsed).toEqual([]);
    expect(state.frames).toEqual({});
  });
});

describe('unsaved changes', () => {
  it('are there after an edit and gone when the change is undone', () => {
    const state = opened();
    const changed = run(state, { type: 'edited', change: (document) => setStrategyText(document, 'title', 'anders') });

    expect(isDirty(changed)).toBe(true);
    expect(isDirty(run(changed, { type: 'edited', change: (document) => setStrategyText(document, 'title', loadTestcase('str-03').title) }))).toBe(false);
  });

  it('count moving an element', () => {
    const state = opened();
    const id = state.document!.elements[0]!.id;

    expect(isDirty(run(state, { type: 'edited', change: (document) => updateElement(document, id, { x: 1234 }) }))).toBe(true);
  });

  it('are not there for a new strategy that has not been changed', () => {
    const state = run(initialEditorState, { type: 'loaded', document: loadTestcase('str-01'), persisted: false, findings: null });

    expect(isDirty(state)).toBe(false);
    expect(state.persisted).toBe(false);
  });

  it('are none without an open strategy', () => {
    expect(isDirty(initialEditorState)).toBe(false);
  });

  it('keep the state object if an edit changes nothing', () => {
    const state = opened();

    expect(run(state, { type: 'edited', change: (document) => document })).toBe(state);
    expect(run(initialEditorState, { type: 'edited', change: (document) => document })).toBe(initialEditorState);
  });
});

describe('saving', () => {
  it('takes over the document as the backend wrote it and counts it as saved', () => {
    const state = opened(false);
    const edited = run(state, { type: 'edited', change: (document) => setStrategyText(document, 'title', 'Neu') });
    const backendVersion = { ...edited.document!, id: 'from-backend', title: 'Neu' };

    const saved = run(edited, { type: 'saved', saved: backendVersion, findings: [], replaceOpen: true });

    expect(saved.document).toBe(backendVersion);
    expect(isDirty(saved)).toBe(false);
    expect(saved.persisted).toBe(true);
    expect(saved.findings).toEqual([]);
  });

  it('keeps changes that were made while it was being saved, and so still counts as changed', () => {
    const state = opened(false);
    const sent = state.document!;
    const edited = run(state, { type: 'edited', change: (document) => setStrategyText(document, 'title', 'während des Speicherns') });

    const saved = run(edited, { type: 'saved', saved: { ...sent, id: 'from-backend' }, findings: [], replaceOpen: false });

    expect(saved.document).toMatchObject({ id: 'from-backend', title: 'während des Speicherns' });
    expect(isDirty(saved)).toBe(true);
    expect(saved.persisted).toBe(true);
  });

  it('ignores a save answer when nothing is open', () => {
    const state = run(initialEditorState, { type: 'saved', saved: loadTestcase('str-03'), findings: [], replaceOpen: true });

    expect(state).toBe(initialEditorState);
  });

  it('shows the findings of a check', () => {
    const finding = { level: 'error' as const, code: 'flow.no_order_reachable', element: null, subject: null, details: {} };

    expect(run(opened(), { type: 'checked', findings: [finding] }).findings).toEqual([finding]);
  });
});

describe('selection', () => {
  it('follows the drawing area: elements selected, nothing selected is the strategy', () => {
    const state = opened();
    const id = state.document!.elements[0]!.id;

    const selected = run(state, {
      type: 'canvasChanged',
      document: state.document!,
      frames: {},
      selectedNodes: [id],
      selectedEdges: [],
    });
    expect(selected.selection).toEqual({ kind: 'elements', ids: [id] });

    const cleared = run(selected, { type: 'canvasChanged', document: state.document!, frames: {}, selectedNodes: [], selectedEdges: [] });
    expect(cleared.selection).toEqual({ kind: 'strategy' });
  });

  it('keeps a selected rule when the drawing area reports no selected element', () => {
    const state = opened();
    const withRule = run(state, {
      type: 'select',
      selection: { kind: 'rule', path: { owner: { kind: 'strategy' }, indices: [0] } },
    });

    const next = run(withRule, { type: 'canvasChanged', document: state.document!, frames: {}, selectedNodes: [], selectedEdges: [] });

    expect(next.selection.kind).toBe('rule');
  });

  it('drops an element that no longer exists, and a rule that no longer exists', () => {
    const state = opened();
    const id = state.document!.elements[0]!.id;
    const selected = run(state, { type: 'select', selection: { kind: 'elements', ids: [id] } });
    const withoutElement = run(selected, {
      type: 'edited',
      change: (document) => ({ ...document, elements: document.elements.filter((element) => element.id !== id) }),
    });
    expect(withoutElement.selection).toEqual({ kind: 'strategy' });

    const ruleSelected = run(state, {
      type: 'select',
      selection: { kind: 'rule', path: { owner: { kind: 'strategy' }, indices: [0] } },
    });
    const withoutRule = run(ruleSelected, { type: 'edited', change: (document) => ({ ...document, rules: [] }) });
    expect(withoutRule.selection).toEqual({ kind: 'strategy' });
  });

  it('keeps a rule that still exists after a change', () => {
    const state = opened();
    const rule = { name: 'n', object_type: 'Regel' };
    const added = run(state, { type: 'edited', change: (document) => addRule(document, { kind: 'strategy' }, rule) });
    const path = { owner: { kind: 'strategy' } as const, indices: [added.document!.rules.length - 1] };

    const selected = run(added, { type: 'select', selection: { kind: 'rule', path } });

    expect(run(selected, { type: 'edited', change: (document) => setStrategyText(document, 'title', 'x') }).selection).toEqual({ kind: 'rule', path });
  });

  it('clears the selected edges when something else is selected', () => {
    const state = run(opened(), {
      type: 'canvasChanged',
      document: opened().document!,
      frames: {},
      selectedNodes: [],
      selectedEdges: ['e1'],
    });
    expect(state.selectedEdges).toEqual(['e1']);

    expect(run(state, { type: 'select', selection: { kind: 'strategy' } }).selectedEdges).toEqual([]);
  });
});

describe('frames and collapsing', () => {
  it('collapses and expands a frame', () => {
    const collapsed = run(opened(), { type: 'toggleCollapse', ownerId: 'a' }, { type: 'toggleCollapse', ownerId: 'b' });
    expect(collapsed.collapsed).toEqual(['a', 'b']);

    expect(run(collapsed, { type: 'toggleCollapse', ownerId: 'a' }).collapsed).toEqual(['b']);
  });

  it('does not collapse anything in the document (the elements stay)', () => {
    const state = opened();

    expect(run(state, { type: 'toggleCollapse', ownerId: 'a' }).document).toBe(state.document);
    expect(isDirty(run(state, { type: 'toggleCollapse', ownerId: 'a' }))).toBe(false);
  });

  it('keeps the state object if the synchronised frames are the same', () => {
    const frames = { a: { x: 1, y: 2, width: 3, height: 4 } };
    const state = run(opened(), { type: 'framesSynced', frames });

    expect(run(state, { type: 'framesSynced', frames: { a: { ...frames.a } } })).toBe(state);
    expect(run(state, { type: 'framesSynced', frames: { a: { ...frames.a, width: 5 } } })).not.toBe(state);
  });
});
