import { describe, expect, it } from 'vitest';

import { newStrategy } from '../document/build';
import { setStrategyName } from '../document/ops';
import { initialStudioState, isDirty, studioReducer, type StudioState } from './studioState';

const document = newStrategy('S');

function opened(persisted: boolean): StudioState {
  return studioReducer(initialStudioState, { type: 'loaded', document, persisted, findings: null });
}

describe('the state of the open strategy (specification E3)', () => {
  it('has unsaved changes when the document differs from the saved one, and a new strategy always counts as unsaved', () => {
    expect(isDirty(initialStudioState)).toBe(false);
    expect(isDirty(opened(true))).toBe(false);
    expect(isDirty(opened(false))).toBe(true);

    const changed = studioReducer(opened(true), { type: 'edited', change: (current) => setStrategyName(current, 'T') });
    expect(isDirty(changed)).toBe(true);
    const back = studioReducer(changed, { type: 'edited', change: (current) => setStrategyName(current, 'S') });
    expect(isDirty(back)).toBe(false);
  });

  it('counts selecting, folding in a frame of the view and the choice of the lines as no change', () => {
    let state = opened(true);
    state = studioReducer(state, { type: 'select', selection: { kind: 'element', id: 'x' } });
    // a selected line of the flow is a selection of the properties view, no change of the strategy
    state = studioReducer(state, { type: 'select', selection: { kind: 'connection', id: 'c1' } });
    expect(state.selection).toEqual({ kind: 'connection', id: 'c1' });
    state = studioReducer(state, { type: 'wires', mode: 'off' });
    state = studioReducer(state, { type: 'toggleCard', id: 'c' });

    expect(isDirty(state)).toBe(false);
  });

  it('keeps the document after saving unless it was changed while saving, and clears the answer for the findings', () => {
    const changed = studioReducer(opened(false), { type: 'edited', change: (current) => setStrategyName(current, 'T') });
    const saved = studioReducer(changed, { type: 'saved', saved: setStrategyName(document, 'S'), findings: [], replaceOpen: false });

    expect(saved.document?.name).toBe('T');
    expect(saved.persisted).toBe(true);
    expect(isDirty(saved)).toBe(true);
    const replaced = studioReducer(changed, { type: 'saved', saved: setStrategyName(document, 'T'), findings: [], replaceOpen: true });
    expect(isDirty(replaced)).toBe(false);
    expect(replaced.findings).toEqual([]);
  });

  it('starts anew when a strategy is opened: selection, armed output and cards are reset, the view is asked to fit', () => {
    let state = opened(true);
    state = studioReducer(state, { type: 'select', selection: { kind: 'frame', id: 'f' } });
    state = studioReducer(state, { type: 'armed', armed: { from: 'a', output: 'o' } });
    const count = state.openCount;

    state = studioReducer(state, { type: 'loaded', document, persisted: true, findings: null });

    expect(state.selection).toEqual({ kind: 'strategy' });
    expect(state.armed).toBeNull();
    expect(state.openCount).toBe(count + 1);
  });

  it('does not move the view when something is edited: only an explicit reveal asks for it', () => {
    const state = studioReducer(opened(true), { type: 'edited', change: (current) => setStrategyName(current, 'T') });
    expect(state.reveal).toBeNull();

    const revealed = studioReducer(state, { type: 'edited', change: (current) => current, selection: { kind: 'element', id: 'x' }, reveal: 'x' });
    expect(revealed.reveal?.id).toBe('x');
  });

  it('closes everything on "closed" but keeps the choice of the lines', () => {
    let state = studioReducer(opened(true), { type: 'wires', mode: 'selection' });
    state = studioReducer(state, { type: 'closed' });

    expect(state.document).toBeNull();
    expect(state.wires).toBe('selection');
  });
});
