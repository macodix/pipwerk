// State of the prototype and all actions. Saved strategies, templates and settings live in
// the browser's local storage (simulated object directory); on every start the client's
// strategy and the test cases are present again.
import { useSyncExternalStore } from 'react';
import { TYPES, fieldsOf, isFlowEl, isObjectEl, isTrigger, methodOf, propsOf } from './catalog';
import { EMPTY, mapExpr, refsOf, sameMember } from './expr';
import { exprsOfEl, flowElementOf, placements, useKey } from './uses';
import {
  BUILTIN_RISK_ID, builtinTemplates, defaultBinding, defaultName, instanceFromTemplate, newEl, newOwnRule, newRuleFromTemplate, newStrategy, uniqueName,
} from './factory';
import { clone, emptyOwn, uid } from './model';
import { nameContent, takenNames } from './names';
import type { Binding, Conn, El, Expr, Lang, RuleInst, Section, Settings, Strategy, Template, Use } from './model';
import { sampleStrategies, sampleTemplates } from './samples';
import type { Dir } from './scene';

export type Sel =
  | { k: 'strategy' }
  | { k: 'el'; id: string }
  | { k: 'frame'; id: string }
  | { k: 'rule'; owner: string | null; id: string };

export type Panel = 'canvas' | 'library' | 'props' | 'params';

export interface TplView {
  tpl: Template;
  isNew: boolean;
  dirty: boolean;
  checked: boolean;
}

export type Dialog =
  | { k: 'open' }
  | { k: 'settings' }
  | { k: 'about' }
  | { k: 'dirty'; what: 'strategy' | 'template'; then: () => void }
  | { k: 'deleteStrategy' }
  | { k: 'deleteTemplate'; id: string }
  | { k: 'saveTemplate'; elId: string }
  | { k: 'newObject' }
  | { k: 'moveFiles'; dir: string }
  | { k: 'removeEl'; id: string }
  | { k: 'removeParam'; id: string };

export interface Wizard {
  step: number;
  trigger?: string;
  inds?: string[];
  cond?: string;
  order?: string;
}

export interface Toast {
  id: number;
  de: string;
  en: string;
}

export interface State {
  settings: Settings;
  saved: Strategy[];
  templates: Template[];
  strategy: Strategy | null;
  dirty: boolean;
  sel: Sel;
  checked: boolean;
  tplView: TplView | null;
  wizard: Wizard | null;
  dialog: Dialog | null;
  panel: Panel;
  orient: Dir;
  wires: 'all' | 'sel' | 'off';
  armed: { from: string; out: string } | null;
  lastAdded: string | null;
  toast: Toast | null;
  focusField: string | null;
  menuOpen: boolean;
  /** Bumps whenever a strategy is opened so the canvas fits its view. */
  openCount: number;
}

const KEY = 'pipwerk-studio-prototype-v2';

interface Persisted {
  saved: Strategy[];
  templates: Template[];
  settings: Settings;
  orient?: Dir;
}

function readStorage(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

function writeStorage(s: State) {
  try {
    const p: Persisted = { saved: s.saved, templates: s.templates, settings: s.settings, orient: s.orient };
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage may be blocked; the prototype still works without it */
  }
}

export const DEFAULT_DIR = '/var/lib/pipwerk/studio/objects';

function initialState(): State {
  const stored = readStorage();
  const samples = sampleStrategies();
  const saved = stored?.saved ? [...stored.saved] : [];
  for (const sm of samples) if (!saved.some((x) => x.id === sm.id)) saved.push(sm);
  const templates = stored?.templates ? [...stored.templates] : sampleTemplates();
  // the templates of order 03 are present on every start, like the test cases
  for (const t of sampleTemplates()) if (t.id !== 'tpl-eigen-ema9' && !templates.some((x) => x.id === t.id)) templates.push(t);
  const settings: Settings = stored?.settings ?? { lang: 'de', objectDir: DEFAULT_DIR };
  const first = clone(saved.find((x) => x.sample === 'auftraggeber') as Strategy);
  return {
    settings, saved, templates, strategy: first, dirty: false, sel: { k: 'strategy' }, checked: false, tplView: null, wizard: null,
    dialog: null, panel: 'canvas', orient: stored?.orient ?? 'v', wires: 'sel', armed: null, lastAdded: null, toast: null, focusField: null,
    menuOpen: false, openCount: 1,
  };
}

let state: State = initialState();
const listeners = new Set<() => void>();

export function getState(): State {
  return state;
}
export function setState(p: Partial<State>, persist = false) {
  state = { ...state, ...p };
  if (persist) writeStorage(state);
  listeners.forEach((l) => l());
}
export function resetForTests() {
  try { window.localStorage.removeItem(KEY); } catch { /* ignore */ }
  state = initialState();
  listeners.forEach((l) => l());
}
export function useApp(): State {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
  );
}

export const allTemplates = (s: State): Template[] => [...builtinTemplates(), ...s.templates];

// ---- helpers -----------------------------------------------------------------

let toastId = 0;
export function toast(de: string, en: string) {
  toastId += 1;
  const id = toastId;
  setState({ toast: { id, de, en } });
  setTimeout(() => {
    if (state.toast?.id === id) setState({ toast: null });
  }, 4200);
}

/** Change the open strategy. */
export function update(fn: (s: Strategy) => void) {
  if (!state.strategy) return;
  const s = clone(state.strategy);
  fn(s);
  setState({ strategy: s, dirty: true });
}

export function langOf(): Lang {
  return state.settings.lang;
}

/** The element a selection stands for in the flow: the element itself, or the element an instance lies at. */
export function selectedFlowElement(): string | null {
  const s = state.strategy;
  if (!s) return null;
  const sel = state.sel;
  const id = sel.k === 'el' ? sel.id : sel.k === 'rule' ? sel.owner : null;
  if (!id) return null;
  return flowElementOf(id, placements(s), new Map(s.els.map((e) => [e.id, e])));
}

export function currentFlow(): string | null {
  const s = state.strategy;
  if (!s) return null;
  if (state.sel.k === 'frame') return state.sel.id;
  if (state.sel.k === 'el') {
    const id = selectedFlowElement();
    return s.els.find((e) => e.id === id)?.mgmt ?? null;
  }
  if (state.sel.k === 'rule' && state.sel.owner) return s.els.find((e) => e.id === (state.sel as { owner: string }).owner)?.mgmt ?? null;
  return null;
}

export function isMid(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 700px) and (max-width: 1099px)').matches;
}
export function isNarrow(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches;
}

/** Selecting something: in the middle layout the side area switches to the properties. */
export function select(sel: Sel, panel?: Panel) {
  setState({ sel, armed: null, ...(panel ? { panel } : isMid() && state.panel === 'library' ? { panel: 'props' as Panel } : {}) });
}

// ---- strategy lifecycle ---------------------------------------------------------

function guard(what: 'strategy' | 'template', then: () => void) {
  const dirty = what === 'strategy' ? state.dirty && !!state.strategy : !!state.tplView?.dirty;
  if (dirty) setState({ dialog: { k: 'dirty', what, then } });
  else then();
}

export function guardStrategy(then: () => void) {
  guard('strategy', then);
}

export function newStrategyAction() {
  const go = () => {
    const names = state.saved.map((x) => x.name);
    const s = newStrategy(uniqueName(state.settings.lang === 'en' ? 'New strategy' : 'Neue Strategie', names));
    setState({
      strategy: s, dirty: true, sel: { k: 'strategy' }, checked: false, wizard: { step: 1 }, dialog: null, panel: 'props',
      openCount: state.openCount + 1, armed: null, menuOpen: false,
    });
  };
  guard('strategy', go);
}

export function openStrategy(id: string) {
  const go = () => {
    const s = state.saved.find((x) => x.id === id);
    if (!s) return;
    setState({
      strategy: clone(s), dirty: false, sel: { k: 'strategy' }, checked: false, wizard: null, dialog: null, panel: 'canvas',
      openCount: state.openCount + 1, armed: null, menuOpen: false,
    });
  };
  guard('strategy', go);
}

export function saveStrategy(): boolean {
  const s = state.strategy;
  if (!s) return false;
  const saved = clone(s);
  saved.savedAt = new Date().toISOString();
  const list = state.saved.some((x) => x.id === s.id) ? state.saved.map((x) => (x.id === s.id ? saved : x)) : [...state.saved, saved];
  setState({ strategy: saved, saved: list, dirty: false, checked: true }, true);
  toast('Gespeichert. Die Prüfung ist gelaufen.', 'Saved. The check has run.');
  return true;
}

export function closeStrategy() {
  guard('strategy', () => {
    setState({ strategy: null, dirty: false, sel: { k: 'strategy' }, wizard: null, checked: false, dialog: null, armed: null, menuOpen: false });
  });
}

export function deleteStrategyConfirmed() {
  const s = state.strategy;
  if (!s) return;
  setState({
    saved: state.saved.filter((x) => x.id !== s.id), strategy: null, dirty: false, dialog: null, wizard: null, checked: false,
  }, true);
  toast('Die Strategie ist gelöscht.', 'The strategy has been deleted.');
}

export function runCheck() {
  setState({ checked: true, menuOpen: false });
}

export function setLang(lang: Lang) {
  setState({ settings: { ...state.settings, lang } }, true);
  document.documentElement.lang = lang;
}

export function setOrient(o: Dir) {
  setState({ orient: o }, true);
}

// ---- adding things from the library ----------------------------------------------

export type LibEntry = { k: 'type'; id: string } | { k: 'tpl'; id: string };

function firstFreeOutput(s: Strategy, from: El): string | null {
  const d = TYPES[from.type];
  if (!d) return null;
  for (const o of d.outputs) {
    if (o.management) continue;
    if (!s.conns.some((c) => c.from === from.id && c.out === o.id)) return o.id;
  }
  return null;
}

export interface AddOptions {
  after?: string;
  flow?: string | null;
  /** An instance is connected with this element at once (dropped onto it). */
  host?: string;
  /** An instance lies where it was dropped on free space until the user connects it. */
  free?: { x: number; y: number };
}

/** Entries that become an instance with a first use: indicators, trends, objects of the application. */
export function isObjectEntry(entry: LibEntry): boolean {
  if (entry.k === 'tpl') {
    const t = allTemplates(state).find((x) => x.id === entry.id);
    return !!t && (t.kind === 'indicator' || t.kind === 'trend');
  }
  const d = TYPES[entry.id];
  return !!d && (d.kind === 'indicator' || d.kind === 'trend' || d.kind === 'app');
}

/** The value a new connection passes on: the main value of the object type. */
function defaultUse(el: El): Use | null {
  const main = TYPES[el.type]?.main;
  const prop = propsOf(el).find((p) => p.id === main) ?? propsOf(el)[0];
  return prop ? { obj: el.id, prop: prop.id, auto: true } : null;
}

/** Connects an instance with the element of its first use. The connection carries the main value. */
function connectFirst(s: Strategy, el: El, targetId: string) {
  el.host = targetId;
  const target = s.els.find((e) => e.id === targetId);
  const u = defaultUse(el);
  if (target && u && !target.inputs.some((i) => i.obj === u.obj)) target.inputs.push(u);
}

/** "Connection" in the library: the selected step is the start, the next click the end. */
function startConnection() {
  const s = state.strategy;
  if (!s) {
    toast('Öffnen Sie zuerst eine Strategie oder legen Sie eine neue an.', 'Open a strategy first or create a new one.');
    return;
  }
  const from = s.els.find((e) => e.id === selectedFlowElement());
  if (!from || !isFlowEl(from.type)) {
    toast('Wählen Sie zuerst den Schritt, von dem die Verbindung ausgeht, und klicken Sie dann „Verbindung“.', 'First select the step the connection starts at, then click "Connection".');
    return;
  }
  const out = firstFreeOutput(s, from);
  if (!out) {
    toast('Alle Ausgänge dieses Schritts sind schon verbunden. Ziehen Sie vom Anschluss, um anders zu verbinden.', 'All exits of this step are connected already. Drag from the port to connect differently.');
    return;
  }
  setState({ armed: { from: from.id, out } });
}

export function addEntry(entry: LibEntry, opts: AddOptions = {}): string | null {
  const s0 = state.strategy;
  if (!s0) {
    toast('Öffnen Sie zuerst eine Strategie oder legen Sie eine neue an.', 'Open a strategy first or create a new one.');
    return null;
  }
  const lang = state.settings.lang;
  const sel = state.sel;
  let newId: string | null = null;
  if (entry.k === 'type' && TYPES[entry.id]?.kind === 'tool') {
    startConnection();
    return null;
  }
  const isObj = isObjectEntry(entry);
  const target = isObj && !opts.free ? opts.host ?? selectedFlowElement() : null;
  const place = (s: Strategy, el: El) => {
    if (opts.free) { el.fx = opts.free.x; el.fy = opts.free.y; }
    if (target) connectFirst(s, el, target);
  };

  if (entry.k === 'tpl') {
    const t = allTemplates(state).find((x) => x.id === entry.id);
    if (!t) return null;
    if (t.kind === 'rule' || t.kind === 'ruleset') {
      return addRule(t);
    }
    update((s) => {
      const taken = takenNames(s);
      const el = instanceFromTemplate(t, defaultName(t.type, lang, taken));
      el.name = uniqueName(t.name, taken);
      // contained instances and rules: "<name of the new instance> <former name>" (req-ablauf-003)
      nameContent(el.own, el.name, [...taken, el.name]);
      s.els.push(el);
      place(s, el);
      newId = el.id;
    });
  } else {
    const d = TYPES[entry.id];
    if (!d) return null;
    if (d.kind === 'rule' || d.kind === 'ruleset') return addRule(null, entry.id);
    update((s) => {
      const flow = opts.flow !== undefined ? opts.flow : currentFlow();
      const flowLike = isFlowEl(entry.id);
      const el = newEl(entry.id, defaultName(entry.id, lang, flowLike && !TYPES[entry.id].named ? [] : s.els.map((e) => e.name)), {
        mgmt: flowLike ? flow : null,
      });
      if (flowLike && el.type === 'flow.condition') el.bind.ausdruck = { k: 'expr', e: EMPTY };
      s.els.push(el);
      newId = el.id;
      if (flowLike && !isTrigger(entry.id)) {
        const afterId = opts.after ?? selectedFlowElement() ?? (sel.k === 'el' ? sel.id : null);
        const from = afterId ? s.els.find((e) => e.id === afterId) : undefined;
        if (from && isFlowEl(from.type) && (from.mgmt ?? null) === (flow ?? null)) {
          const out = firstFreeOutput(s, from);
          if (out) s.conns.push({ from: from.id, out, to: el.id });
        }
      }
      if (isObj) place(s, el);
      // keep named elements unique
      if (TYPES[entry.id].named) el.name = uniqueName(el.name, s.els.filter((e) => e !== el).map((e) => e.name));
    });
  }
  if (newId) {
    setState({ sel: { k: 'el', id: newId }, lastAdded: newId });
    const name = state.strategy?.els.find((e) => e.id === newId)?.name ?? '';
    if (isObj) {
      const host = target ? state.strategy?.els.find((e) => e.id === target)?.name ?? '' : '';
      if (target) toast(`„${name}“ ist mit „${host}“ verbunden und liegt dort.`, `"${name}" is connected to "${host}" and lies there.`);
      else toast(`„${name}“ ist noch mit keinem Element verbunden. Ziehen Sie es auf das Element, das es zuerst verwendet.`, `"${name}" is not connected to an element yet. Drag it onto the element that uses it first.`);
    } else if (isNarrow()) {
      toast(`„${name}“ ist eingefügt. Sie sehen es auf der Zeichenfläche.`, `"${name}" is inserted. You can see it on the canvas.`);
    }
  }
  return newId;
}

// ---- uses of objects ------------------------------------------------------------------------

/** Walks up the chain of first uses: true when `start` hangs, directly or indirectly, at `obj`. */
function hangsAt(s: Strategy, start: string, obj: string): boolean {
  const pl = placements(s);
  let cur: string | undefined = start;
  for (let i = 0; i < 12 && cur; i++) {
    if (cur === obj) return true;
    cur = pl.get(cur)?.host;
  }
  return false;
}

/**
 * The user connects a value of an object with an element: dropping the card, dragging a line from a row,
 * choosing the element in the properties. For an instance without a first use this is the first use, the
 * instance lies at the element from then on. Otherwise it is a further use: a data connection.
 */
export function connectObject(objId: string, targetId: string, use?: Use): 'first' | 'further' | null {
  const s = state.strategy;
  const o = s?.els.find((e) => e.id === objId);
  const t = s?.els.find((e) => e.id === targetId);
  if (!s || !o || !t || objId === targetId || !isObjectEl(o.type)) return null;
  if (isObjectEl(t.type) && hangsAt(s, targetId, objId)) {
    toast('Dieses Objekt hängt selbst an dem Ziel. Eine Verbindung im Kreis ist nicht möglich.', 'This object itself hangs at the target. A connection in a circle is not possible.');
    return null;
  }
  const placeNow = placements(s).get(objId);
  const had = !!placeNow;
  const u: Use = use ?? defaultUse(o) ?? { obj: objId, prop: '' };
  const m = methodOf(o.type, u.prop);
  const withArgs: Use = m && !u.args ? { ...u, args: [...m.defaults] } : u;
  update((st) => {
    const oo = st.els.find((e) => e.id === objId) as El;
    const tt = st.els.find((e) => e.id === targetId) as El;
    // the first use stays where it is, even if the new use lies earlier in the flow
    if (!had) oo.host = targetId;
    else if (!oo.host && placeNow) oo.host = placeNow.host;
    if (withArgs.prop && !tt.inputs.some((i) => i.obj === objId && sameMember(i, withArgs))) tt.inputs.push(withArgs);
  });
  setState({ sel: { k: 'el', id: targetId } });
  if (!had) toast(`„${o.name}“ ist jetzt mit „${t.name}“ verbunden und liegt dort.`, `"${o.name}" is now connected to "${t.name}" and lies there.`);
  else toast(`Der Wert ist jetzt ein Eingang von „${t.name}“. Verwenden Sie ihn in der Bedingung oder Berechnung.`, `The value is now an input of "${t.name}". Use it in the condition or calculation.`);
  return had ? 'further' : 'first';
}

/** Properties view: the element of the first use. */
export function setHost(objId: string, hostId: string | null) {
  update((s) => {
    const o = s.els.find((e) => e.id === objId);
    if (!o) return;
    o.host = hostId;
    const h = hostId ? s.els.find((e) => e.id === hostId) : undefined;
    const u = defaultUse(o);
    if (h && u && !h.inputs.some((i) => i.obj === objId) && !exprsOfEl(h).some((x) => refsOf(x).some((r) => r.obj === objId))) h.inputs.push(u);
    if (!hostId) { delete o.fx; delete o.fy; }
  });
}

/** Blocks and the formula view: the element uses values; they become connections. */
export function noteValues(elId: string, e: Expr) {
  const s = state.strategy;
  if (!s) return;
  const refs = refsOf(e);
  if (refs.length === 0) return;
  update((st) => {
    const el = st.els.find((x) => x.id === elId);
    if (!el) return;
    const pl = placements(st);
    for (const r of refs) {
      const o = st.els.find((q) => q.id === r.obj);
      if (!o || !isObjectEl(o.type) || o.id === elId) continue;
      if (!methodOf(o.type, r.prop) && !el.inputs.some((i) => i.obj === r.obj && sameMember(i, r))) el.inputs.push({ obj: r.obj, prop: r.prop });
      const place = pl.get(o.id);
      if (!o.host) o.host = place ? place.host : elId;
    }
  });
}

export function setRefresh(elId: string, key: string, on: boolean) {
  update((s) => {
    const e = s.els.find((x) => x.id === elId);
    if (!e) return;
    const set = new Set(e.refresh ?? []);
    if (on) set.add(key); else set.delete(key);
    e.refresh = [...set];
  });
}

/** Maps every expression of an element. */
function mapElExprs(e: El, f: (x: Expr) => Expr) {
  for (const [k, b] of Object.entries(e.bind)) if (b.k === 'expr') e.bind[k] = { k: 'expr', e: f(b.e) };
  for (const r of e.rules) r.e = f(r.e);
  if (e.own) {
    for (const p of e.own.props) p.e = f(p.e);
    if (e.own.direction) e.own.direction = f(e.own.direction);
  }
}

/** Properties view: another property or method for a use (also in the expressions of the element). */
export function changeUse(elId: string, from: Use, to: Use) {
  update((s) => {
    const e = s.els.find((x) => x.id === elId);
    if (!e) return;
    const fk = useKey(from);
    const tk = useKey(to);
    e.inputs = e.inputs.map((i) => (i.obj === from.obj && sameMember(i, from) ? { ...to } : i)).filter((i, n, a) => a.findIndex((q) => q.obj === i.obj && sameMember(q, i)) === n);
    mapElExprs(e, (x) => mapExpr(x, (y) => (y.t === 'ref' && y.obj === from.obj && sameMember(y, from) ? { t: 'ref', obj: to.obj, prop: to.prop, ...(to.args ? { args: to.args } : {}) } : undefined)));
    if (e.refresh?.includes(fk)) e.refresh = [...e.refresh.filter((k) => k !== fk), tk];
  });
}

/** Properties view: removes the connection the user made (a use in an expression stays). */
export function removeUse(elId: string, u: Use) {
  update((s) => {
    const e = s.els.find((x) => x.id === elId);
    if (e) e.inputs = e.inputs.filter((i) => !(i.obj === u.obj && sameMember(i, u)));
  });
}

function addRule(t: Template | null, typeId?: string): string | null {
  const sel = state.sel;
  const s0 = state.strategy;
  const owner = sel.k === 'el' ? s0?.els.find((e) => e.id === sel.id) : undefined;
  return addRuleTo(owner && TYPES[owner.type]?.rulesAllowed ? owner.id : null, t, typeId);
}

export function addRuleTo(owner_: string | null, t: Template | null, typeId?: string): string | null {
  const lang = state.settings.lang;
  let ownerId: string | null = null;
  let created: RuleInst | null = null;
  update((s) => {
    const owner = owner_ ? s.els.find((e) => e.id === owner_) : undefined;
    const target: RuleInst[] = owner ? owner.rules : s.rules;
    ownerId = owner ? owner.id : null;
    const taken = takenNames(s);
    if (t) {
      const r = newRuleFromTemplate(t, uniqueName(t.builtin ? (lang === 'en' ? 'Risk' : 'Risiko') : t.name, taken));
      nameContent(r.own, r.name, [...taken, r.name]);
      target.push(r);
      created = r;
    } else {
      const kind = typeId === 'Regelwerk' ? 'ruleset' : 'rule';
      const r = newOwnRule(uniqueName(kind === 'rule' ? (lang === 'en' ? 'Rule' : 'Regel') : (lang === 'en' ? 'Rule set' : 'Regelwerk'), taken), kind);
      target.push(r);
      created = r;
    }
  });
  if (created) {
    setState({ sel: { k: 'rule', owner: ownerId, id: (created as RuleInst).id }, panel: 'props' });
    toast(
      ownerId ? 'Die Regel gilt für das gewählte Element.' : 'Die Regel gilt für die ganze Strategie.',
      ownerId ? 'The rule applies to the selected element.' : 'The rule applies to the whole strategy.',
    );
    return (created as RuleInst).id;
  }
  return null;
}

// ---- flow connections ----------------------------------------------------------------

export function connect(from: string, out: string, to: string) {
  const s = state.strategy;
  if (!s) return;
  const a = s.els.find((e) => e.id === from);
  const b = s.els.find((e) => e.id === to);
  if (!a || !b || from === to) return;
  if (!isFlowEl(a.type) || !isFlowEl(b.type) || isTrigger(b.type)) {
    toast('Ein Auslöser hat keinen Eingang, und Objekte werden nicht im Ablauf verbunden.', 'A trigger has no input, and objects are not connected in the flow.');
    return;
  }
  if ((a.mgmt ?? null) !== (b.mgmt ?? null)) {
    toast('Die Verwaltung einer Order ist von ihrem Hauptablauf getrennt: Verbinden Sie nur Schritte im selben Rahmen.', 'The management of an order is separate from the main flow: connect only steps in the same frame.');
    return;
  }
  update((st) => {
    st.conns = st.conns.filter((c) => !(c.from === from && c.out === out));
    st.conns.push({ from, out, to });
  });
  setState({ armed: null });
}

export function disconnect(from: string, out: string, to: string) {
  update((st) => {
    st.conns = st.conns.filter((c) => !(c.from === from && c.out === out && c.to === to));
  });
}

// ---- removing, with consequences ---------------------------------------------------

export interface RemoveInfo {
  el: El;
  users: { id: string; name: string }[];
  managed: El[];
  /** Instances whose first use is this element: they are not connected afterwards. */
  hosted: El[];
}

export function removeInfo(id: string): RemoveInfo | null {
  const s = state.strategy;
  const el = s?.els.find((e) => e.id === id);
  if (!s || !el) return null;
  const users = s.els
    .filter((e) => e.id !== id)
    .filter((e) => {
      const hit = (x: Binding) => (x.k === 'expr' && JSON.stringify(x.e).includes(`"obj":"${id}"`)) || (x.k === 'ref' && x.obj === id);
      return Object.values(e.bind).some(hit) || e.inputs.some((i) => i.obj === id) || e.rules.some((r) => JSON.stringify(r.e).includes(`"obj":"${id}"`));
    })
    .map((e) => ({ id: e.id, name: e.name }));
  const managed = el.type === 'flow.place_order' ? s.els.filter((e) => e.mgmt === id) : [];
  const pl = placements(s);
  const hosted = s.els.filter((e) => e.id !== id && pl.get(e.id)?.host === id && !managed.some((m) => m.id === e.id));
  return { el, users, managed, hosted };
}

/** Removes an element. Expressions that used it get an empty block, the finding tells the user. */
export function removeEl(id: string) {
  update((s) => {
    const el = s.els.find((e) => e.id === id);
    if (!el) return;
    const ids = new Set<string>([id]);
    if (el.type === 'flow.place_order') s.els.filter((e) => e.mgmt === id).forEach((e) => ids.add(e.id));
    // bridge the flow when the element has exactly one way in and one way out
    const ins = s.conns.filter((c) => c.to === id);
    const outs = s.conns.filter((c) => c.from === id);
    s.conns = s.conns.filter((c) => !ids.has(c.from) && !ids.has(c.to));
    if (ins.length === 1 && outs.length === 1 && el.type !== 'flow.place_order') {
      s.conns.push({ from: ins[0].from, out: ins[0].out, to: outs[0].to });
    }
    s.els = s.els.filter((e) => !ids.has(e.id));
    const fix = (e: Expr0) => mapExpr(e, (x) => (x.t === 'ref' && ids.has(x.obj) ? EMPTY : undefined));
    for (const e of s.els) {
      e.inputs = e.inputs.filter((i) => !ids.has(i.obj));
      if (e.refresh) e.refresh = e.refresh.filter((k) => !ids.has(k.split('|')[0]));
      if (e.host && ids.has(e.host)) e.host = null;
      for (const [k, b] of Object.entries(e.bind)) {
        if (b.k === 'expr') e.bind[k] = { k: 'expr', e: fix(b.e) };
        else if (b.k === 'ref' && ids.has(b.obj)) e.bind[k] = { k: 'unset' };
      }
      for (const r of e.rules) r.e = fix(r.e);
    }
    for (const r of s.rules) r.e = fix(r.e);
    s.sections.forEach((sec) => { sec.els = sec.els.filter((x) => !ids.has(x)); });
    s.sections = s.sections.filter((sec) => sec.els.length > 0);
    s.collapsedMgmt = s.collapsedMgmt.filter((x) => !ids.has(x));
  });
  setState({ sel: { k: 'strategy' }, dialog: null });
}
type Expr0 = import('./model').Expr;

export function requestRemove(id: string) {
  const info = removeInfo(id);
  if (!info) return;
  if (info.users.length > 0 || info.managed.length > 0 || info.hosted.length > 0) setState({ dialog: { k: 'removeEl', id } });
  else removeEl(id);
}

// ---- strategy parameters ----------------------------------------------------------------

export function addParam(name: string, dtype: import('./model').SPType = 'number'): string {
  const id = uid('p');
  const initial = dtype === 'time_unit' ? 'h1' : dtype === 'boolean' ? false : dtype === 'text' ? '' : 0;
  update((s) => {
    s.params.push({ id, name: uniqueName(name, s.params.map((p) => p.name)), dtype, value: initial, atApplication: false });
  });
  return id;
}

export function removeParamConfirmed(id: string) {
  update((s) => {
    s.params = s.params.filter((p) => p.id !== id);
    const fix = (e: Expr0) => mapExpr(e, (x) => (x.t === 'sp' && x.id === id ? EMPTY : undefined));
    for (const e of s.els) {
      for (const [k, b] of Object.entries(e.bind)) {
        if (b.k === 'param' && b.id === id) e.bind[k] = { k: 'unset' };
        if (b.k === 'expr') e.bind[k] = { k: 'expr', e: fix(b.e) };
      }
    }
  });
  setState({ dialog: null });
}

export function paramUsers(id: string): string[] {
  const s = state.strategy;
  if (!s) return [];
  return s.els
    .filter((e) => Object.values(e.bind).some((b) => (b.k === 'param' && b.id === id) || (b.k === 'expr' && JSON.stringify(b.e).includes(`"sp","id":"${id}"`))))
    .map((e) => e.name);
}

// ---- sections ----------------------------------------------------------------------------

export function setSection(elId: string, secId: string | 'new' | '' , newName = '') {
  update((s) => {
    const el = s.els.find((e) => e.id === elId);
    if (!el) return;
    s.sections.forEach((sec) => { sec.els = sec.els.filter((x) => x !== elId); });
    if (secId === 'new') {
      const sec: Section = {
        id: uid('sec'), name: newName || (langOf() === 'en' ? 'Section' : 'Abschnitt'), flow: el.mgmt, collapsed: false, els: [elId],
      };
      s.sections.push(sec);
    } else if (secId) {
      s.sections.find((x) => x.id === secId)?.els.push(elId);
    }
    s.sections = s.sections.filter((sec) => sec.els.length > 0);
  });
}

// ---- templates ---------------------------------------------------------------------------

/** A delivered object type shown like a template: read-only, with its default values. */
function typeAsTemplate(typeId: string): Template | null {
  const d = TYPES[typeId];
  if (!d) return null;
  const defaults: Record<string, Binding> = {};
  for (const f of fieldsOf({ type: typeId, bind: {}, own: null })) {
    const b = defaultBinding(f);
    if (b.k !== 'unset') defaults[f.id] = b;
  }
  return {
    id: `type:${typeId}`, kind: d.kind === 'trend' ? 'trend' : 'indicator', type: typeId, name: d.de, description: '', builtin: true, defaults,
    own: null, e: EMPTY, determines: null, cmp: 'max', savedAt: null,
  };
}

export function openTemplate(id: string) {
  const t = id.startsWith('type:') ? typeAsTemplate(id.slice(5)) : allTemplates(state).find((x) => x.id === id);
  if (!t) return;
  guard('template', () => setState({ tplView: { tpl: clone(t), isNew: false, dirty: false, checked: false }, panel: 'props', dialog: null }));
}

export function newObject(kind: Template['kind']) {
  const lang = state.settings.lang;
  const names = allTemplates(state).map((t) => t.name);
  const type = { indicator: 'Indikator', trend: 'Trend', rule: 'Regel', ruleset: 'Regelwerk' }[kind];
  const base = { indicator: ['Neuer Indikator', 'New indicator'], trend: ['Neuer Trend', 'New trend'], rule: ['Neue Regel', 'New rule'], ruleset: ['Neues Regelwerk', 'New rule set'] }[kind];
  const t: Template = {
    id: uid('tpl'), kind, type, name: uniqueName(lang === 'en' ? base[1] : base[0], names), description: '', defaults: {},
    own: emptyOwn(), e: EMPTY, determines: null, cmp: 'max', savedAt: null,
  };
  guard('template', () => setState({ tplView: { tpl: t, isNew: true, dirty: true, checked: false }, dialog: null, panel: 'props' }));
}

export function updateTemplate(fn: (t: Template) => void) {
  const v = state.tplView;
  if (!v) return;
  const t = clone(v.tpl);
  fn(t);
  setState({ tplView: { ...v, tpl: t, dirty: true } });
}

export function saveTemplate() {
  const v = state.tplView;
  if (!v || v.tpl.builtin) return;
  const t = { ...clone(v.tpl), savedAt: new Date().toISOString() };
  const list = state.templates.some((x) => x.id === t.id) ? state.templates.map((x) => (x.id === t.id ? t : x)) : [...state.templates, t];
  setState({ templates: list, tplView: { tpl: t, isNew: false, dirty: false, checked: true } }, true);
  toast('Die Vorlage ist gespeichert und steht in der Elementbibliothek.', 'The template is saved and available in the element library.');
}

export function closeTemplate() {
  guard('template', () => setState({ tplView: null, dialog: null }));
}

export function templateUsages(id: string): { strategies: string[]; templates: string[] } {
  const strategies: string[] = [];
  const all = [...state.saved];
  if (state.strategy && !all.some((x) => x.id === state.strategy?.id)) all.push(state.strategy);
  for (const s of all) {
    const hit = s.els.some((e) => e.origin?.tplId === id) || s.rules.some((r) => r.origin.tplId === id) || s.els.some((e) => e.rules.some((r) => r.origin.tplId === id));
    if (hit) strategies.push(s.name);
  }
  const templates = state.templates
    .filter((t) => t.id !== id && ((t.own?.includes ?? []).some((i) => i.tpl === id) || (t.own?.rules ?? []).some((r) => r.origin.tplId === id)))
    .map((t) => t.name);
  return { strategies, templates };
}

export function deleteTemplateConfirmed(id: string) {
  setState({ templates: state.templates.filter((t) => t.id !== id), tplView: state.tplView?.tpl.id === id ? null : state.tplView, dialog: null }, true);
  toast('Die Vorlage ist gelöscht. Instanzen in Strategien bleiben unverändert.', 'The template is deleted. Instances in strategies stay unchanged.');
}

export function saveAsTemplate(elId: string, name: string) {
  const s = state.strategy;
  const el = s?.els.find((e) => e.id === elId);
  if (!s || !el) return;
  const kindMap: Record<string, Template['kind']> = { indicator: 'indicator', trend: 'trend' };
  const kind = kindMap[TYPES[el.type]?.kind ?? ''] ?? 'indicator';
  const t: Template = {
    id: uid('tpl'), kind, type: el.type, name, description: '', defaults: clone(el.bind), own: el.own ? clone(el.own) : null,
    e: EMPTY, determines: null, cmp: 'max', savedAt: new Date().toISOString(),
  };
  // Standard values only: connections to other objects do not belong into a template
  for (const [k, b] of Object.entries(t.defaults)) if (b.k === 'ref' || b.k === 'expr') t.defaults[k] = { k: 'unset' };
  setState({ templates: [...state.templates, t], dialog: null }, true);
  toast(`„${name}“ steht jetzt in der Elementbibliothek.`, `"${name}" is now in the element library.`);
}

export function templateLibraryGroup(t: Template): string {
  return t.kind === 'indicator' ? 'indicators' : t.kind === 'trend' ? 'trends' : 'rules';
}

// ---- settings ---------------------------------------------------------------------------

export function setObjectDir(dir: string) {
  setState({ settings: { ...state.settings, objectDir: dir }, dialog: null }, true);
}

export { isObjectEl, BUILTIN_RISK_ID };
export type { Conn };
