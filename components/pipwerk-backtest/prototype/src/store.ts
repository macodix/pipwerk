// State of the prototype and all actions. Test accounts, saved backtests, added data and the language
// live in the browser's local storage; on every start the strategies and the default test account are present.
import { useSyncExternalStore } from 'react';
import {
  STANDARD_ACCOUNT, checkNeeds, hasManualTrigger, initialRows, strategyEntries, usedTimeframes,
} from './data';
import type { Account, DataRow, NeedResult, RunSettings, StrategyEntry } from './data';
import type { Lang, Strategy, Txt } from './model';
import { clone } from './model';
import { Engine, runSync, summarize } from './sim/engine';import type { EquityPoint, Progress, Rejection, RunInput, Summary, Trade } from './sim/engine';
import { DAY, LAST_DAY, TF_MINUTES, instrumentInfo, isoDate, parseIsoDate } from './sim/market';
import type { InstrumentInfo } from './sim/market';
import { Replayer } from './sim/replay';
import type { Cursor, JumpResult } from './sim/replay';

export type Mode = 'single' | 'backtest';
export type View = 'test' | 'data' | 'accounts' | 'saved';
export type Phase = 'prepare' | 'checking' | 'blocked' | 'run' | 'btrun' | 'btresult';
export type RunPanel = 'flow' | 'charts' | 'values' | 'props';
export type ResPanel = 'summary' | 'curve' | 'trades' | 'chart';

export interface Prep {
  strategyId: string;
  instrument: string;
  broker: string;
  periods: Record<Mode, { from: string; to: string }>;
  accountId: string;
  acc: Account;
  instr: InstrumentInfo;
  params: Record<string, string | number | boolean>;
  /** Time of the trigger "Manual" (UTC, "YYYY-MM-DDTHH:mm"); empty means the start of the test period. */
  manualAt: string;
}

export interface CheckView {
  results: NeedResult[];
}

export interface BtResult {
  name: string;
  strategy: Strategy;
  strategyBadge: Txt;
  params: Record<string, string | number | boolean>;
  instrument: InstrumentInfo;
  broker: string;
  account: Account;
  from: string;
  to: string;
  tf: string;
  summary: Summary;
  trades: Trade[];
  rejections: Rejection[];
  rejectedTotal: number;
  equity: EquityPoint[];
  startCapital: number;
  savedId: string | null;
}

export interface SavedBacktest extends BtResult {
  id: string;
  savedAt: string;
}

export interface Single {
  rp: Replayer;
  cursor: Cursor;
  noActing: boolean;
  sel: string | null;
  bps: string[];
  why: JumpResult | 'start' | 'begin' | 'step';
  strategy: Strategy;
  tfs: string[];
  from: number;
  to: number;
}

export type Dialog =
  | { k: 'about' }
  | { k: 'import' }
  | { k: 'saveBt' }
  | { k: 'strategy'; savedId?: string }
  | { k: 'deleteAccount'; id: string }
  | { k: 'deleteSaved'; id: string }
  | { k: 'dirtyAccount' };

export interface Toast {
  id: number;
  de: string;
  en: string;
}

export interface State {
  settings: { lang: Lang };
  view: View;
  mode: Mode;
  phase: Phase;
  accounts: Account[];
  saved: SavedBacktest[];
  rows: DataRow[];
  /** Broker for test runs (setting of the data stock): the preset of the broker in the preparation. */
  testBroker: string;
  prep: Prep;
  check: CheckView | null;
  single: Single | null;
  bt: { progress: Progress | null; total: number } | null;
  result: BtResult | null;
  savedView: { k: 'list' } | { k: 'compare' } | { k: 'open'; id: string };
  compare: string[];
  dialog: Dialog | null;
  toast: Toast | null;
  menuOpen: boolean;
  runPanel: RunPanel;
  resPanel: ResPanel;
  /** Trade selected in the result: its place in the chart is shown. */
  selTrade: number | null;
  rejectedShown: number;
  tradesTab: 'trades' | 'rej';
}

const KEY = 'pipwerk-replay-prototype-v1';

interface Persisted {
  lang: Lang;
  accounts: Account[];
  saved: SavedBacktest[];
  rows: DataRow[];
  testBroker: string;
}

function readStorage(): Partial<Persisted> | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<Persisted>) : null;
  } catch {
    return null;
  }
}

function writeStorage(s: State) {
  try {
    const p: Persisted = { lang: s.settings.lang, accounts: s.accounts, saved: s.saved, rows: s.rows, testBroker: s.testBroker };
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage may be blocked or full; the prototype works without it */
  }
}

export const ENTRIES: StrategyEntry[] = strategyEntries();

export function entryOf(id: string): StrategyEntry {
  return ENTRIES.find((e) => e.id === id) ?? ENTRIES[0];
}

export const defaultPeriods = (): Record<Mode, { from: string; to: string }> => ({
  single: { from: isoDate(LAST_DAY - 29 * DAY), to: isoDate(LAST_DAY) },
  backtest: { from: '2024-10-21', to: isoDate(LAST_DAY) },
});

export function paramsOf(s: Strategy): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const p of s.params) out[p.id] = p.value;
  return out;
}

export function newPrep(strategyId: string, accounts: Account[], prev?: Prep, presetBroker = 'b1'): Prep {
  const e = entryOf(strategyId);
  const instrument = prev?.instrument ?? 'EURUSD';
  const broker = prev?.broker ?? presetBroker;
  const acc = accounts[0] ?? STANDARD_ACCOUNT;
  return {
    strategyId: e.id,
    instrument, broker,
    periods: prev?.periods ?? defaultPeriods(),
    accountId: prev && accounts.some((a) => a.id === prev.accountId) ? prev.accountId : acc.id,
    acc: prev ? prev.acc : clone(acc),
    instr: prev ? prev.instr : instrumentInfo(instrument, broker),
    params: paramsOf(e.strategy),
    manualAt: prev?.manualAt ?? '',
  };
}

function initialState(): State {
  const stored = readStorage();
  const accounts: Account[] = stored?.accounts && stored.accounts.length ? [...stored.accounts] : [clone(STANDARD_ACCOUNT)];
  if (!accounts.some((a) => a.id === STANDARD_ACCOUNT.id)) accounts.unshift(clone(STANDARD_ACCOUNT));
  const base = initialRows();
  const extra = (stored?.rows ?? []).filter((r) => r.origin === 'import');
  const rows = [...base, ...extra];
  const testBroker = stored?.testBroker && rows.some((r) => r.broker === stored.testBroker) ? stored.testBroker : 'b1';
  const std = ENTRIES[1];
  return {
    settings: { lang: stored?.lang === 'en' ? 'en' : 'de' },
    view: 'test', mode: 'single', phase: 'prepare', accounts, saved: stored?.saved ?? [], rows, testBroker,
    prep: newPrep(std.id, accounts, undefined, testBroker), check: null, single: null, bt: null, result: null, savedView: { k: 'list' }, compare: [], dialog: null, toast: null,
    menuOpen: false, runPanel: 'flow', resPanel: 'summary', selTrade: null, rejectedShown: 100, tradesTab: 'trades',
  };
}

let state: State = initialState();
const listeners = new Set<() => void>();
let runToken = 0;

export function getState(): State {
  return state;
}
export function setState(p: Partial<State>, persist = false) {
  state = { ...state, ...p };
  if (persist) writeStorage(state);
  listeners.forEach((l) => l());
}
export function useApp(): State {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
  );
}

let toastId = 0;
export function toast(de: string, en: string) {
  toastId += 1;
  const id = toastId;
  setState({ toast: { id, de, en } });
  setTimeout(() => {
    if (state.toast?.id === id) setState({ toast: null });
  }, 4200);
}

export function setLang(lang: Lang) {
  setState({ settings: { lang } }, true);
  document.documentElement.lang = lang;
}

export const isNarrow = (): boolean => typeof window !== 'undefined' && window.matchMedia('(max-width: 1099px)').matches;

// ---- navigation ---------------------------------------------------------------------------------------

function stopRun() {
  runToken += 1;
}

export function setView(view: View) {
  stopRun();
  setState({
    view, menuOpen: false,
    ...(view === 'test' && (state.phase === 'checking' || state.phase === 'btrun' || state.phase === 'blocked') ? { phase: 'prepare' as Phase, check: null, bt: null } : {}),
    ...(view === 'saved' ? { savedView: { k: 'list' } as State['savedView'] } : {}),
  });
}

export function setMode(mode: Mode) {
  if (mode === state.mode) {
    if (state.view !== 'test') setView('test');
    return;
  }
  stopRun();
  setState({ mode, view: 'test', phase: 'prepare', check: null, bt: null, single: null, result: null, menuOpen: false });
}

export function backToPrepare() {
  stopRun();
  setState({ phase: 'prepare', check: null, bt: null, view: 'test' });
}

// ---- preparation -----------------------------------------------------------------------------------------

export function updatePrep(fn: (p: Prep) => void) {
  const p = clone(state.prep);
  fn(p);
  setState({ prep: p, ...(state.phase === 'blocked' ? { phase: 'prepare' as Phase, check: null } : {}) });
}

export function selectStrategy(id: string) {
  setState({ prep: { ...newPrep(id, state.accounts, state.prep), params: paramsOf(entryOf(id).strategy) }, phase: 'prepare', check: null });
}

export function selectInstrument(instrument: string, broker = state.prep.broker) {
  updatePrep((p) => {
    p.instrument = instrument;
    p.broker = broker;
    p.instr = instrumentInfo(instrument, broker);
  });
}

/** The broker for test runs: stored, and the preset of the broker in the preparation. */
export function setTestBroker(id: string) {
  setState({ testBroker: id }, true);
  selectInstrument(state.prep.instrument, id);
}

export function selectAccount(id: string) {
  const a = state.accounts.find((x) => x.id === id);
  if (!a) return;
  updatePrep((p) => {
    p.accountId = id;
    p.acc = clone(a);
  });
}

export function accountChanged(): boolean {
  const a = state.accounts.find((x) => x.id === state.prep.accountId);
  if (!a) return true;
  const p = state.prep.acc;
  return a.capital !== p.capital || a.currency !== p.currency || a.leverage !== p.leverage || a.spreadMode !== p.spreadMode || a.spreadFixed !== p.spreadFixed || a.commission !== p.commission;
}

export function instrChanged(): boolean {
  return JSON.stringify(instrumentInfo(state.prep.instrument, state.prep.broker)) !== JSON.stringify(state.prep.instr);
}

/** Saves the changes of the account in the run explicitly as the stored test account. */
export function saveAccountFromRun(asNew: string | null) {
  const p = state.prep;
  if (asNew !== null) {
    const id = `a${Date.now().toString(36)}`;
    const a: Account = { ...clone(p.acc), id, name: asNew.trim() || (state.settings.lang === 'en' ? 'New test account' : 'Neues Testkonto'), builtin: false };
    setState({ accounts: [...state.accounts, a], prep: { ...p, accountId: id, acc: clone(a) } }, true);
    toast(`Testkonto „${a.name}“ ist gespeichert.`, `Test account "${a.name}" is saved.`);
  } else {
    const list = state.accounts.map((a) => (a.id === p.accountId ? { ...clone(p.acc), id: a.id, name: a.name, builtin: a.builtin } : a));
    setState({ accounts: list }, true);
    toast('Die Änderungen sind im Testkonto gespeichert.', 'The changes are saved in the test account.');
  }
}

export function periodError(p: Prep, mode: Mode): Txt | null {
  const per = p.periods[mode];
  const f = parseIsoDate(per.from);
  const t = parseIsoDate(per.to);
  if (!per.from || !per.to || Number.isNaN(f) || Number.isNaN(t)) {
    return { de: 'Bitte geben Sie Beginn und Ende des Testzeitraums an.', en: 'Please enter the start and end of the test period.' };
  }
  if (f > t) return { de: 'Der Beginn liegt nach dem Ende. Tauschen Sie die beiden Daten.', en: 'The start is after the end. Swap the two dates.' };
  if (t > LAST_DAY) {
    return {
      de: `Der Testzeitraum endet spätestens am letzten vollständigen Handelstag (${isoDate(LAST_DAY).split('-').reverse().join('.')}).`,
      en: `The test period ends at the latest on the last complete trading day (${isoDate(LAST_DAY)}).`,
    };
  }
  if (t - f < 2 * DAY) return { de: 'Der Testzeitraum sollte mindestens drei Tage umfassen.', en: 'The test period should cover at least three days.' };
  return null;
}

/** The time of the trigger "Manual" in milliseconds (UTC), or null for the start of the test period; NaN if incomplete. */
export function manualTime(p: Prep): number | null {
  if (!p.manualAt) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(p.manualAt);
  return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) : Number.NaN;
}

/** The reason why the time of the trigger "Manual" prevents the start, or null. */
export function manualError(p: Prep, mode: Mode): Txt | null {
  if (!hasManualTrigger(entryOf(p.strategyId).strategy) || !p.manualAt) return null;
  const t = manualTime(p);
  if (t === null || Number.isNaN(t)) return { de: 'Bitte geben Sie für „Manuell“ Datum und Uhrzeit vollständig an oder leeren Sie das Feld.', en: 'Please enter date and time for "Manual" completely or clear the field.' };
  const per = p.periods[mode];
  const f = parseIsoDate(per.from);
  const e = parseIsoDate(per.to) + DAY;
  if (Number.isNaN(f) || Number.isNaN(e)) return null;
  if (t < f || t >= e) {
    const de = (ms: number) => isoDate(ms).split('-').reverse().join('.');
    return {
      de: `Der Zeitpunkt für „Manuell“ liegt außerhalb des Testzeitraums (${de(f)} bis ${de(e - DAY)}, UTC). Der Testlauf startet nicht. Wählen Sie einen Zeitpunkt im Testzeitraum oder setzen Sie ihn auf den Beginn des Testzeitraums zurück.`,
      en: `The time for "Manual" is outside the test period (${isoDate(f)} to ${isoDate(e - DAY)}, UTC). The test run does not start. Choose a time within the test period or reset it to the start of the test period.`,
    };
  }
  return null;
}

export function runSettings(p: Prep, mode: Mode): RunSettings {
  const per = p.periods[mode];
  return { strategy: entryOf(p.strategyId).strategy, params: p.params, instrument: p.instrument, broker: p.broker, from: parseIsoDate(per.from), to: parseIsoDate(per.to) };
}

export function currentCheck(): NeedResult[] {
  const s = state;
  if (periodError(s.prep, s.mode)) return [];
  return checkNeeds(runSettings(s.prep, s.mode), s.rows);
}

// ---- starting a test run ----------------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function inputOf(p: Prep, mode: Mode, trace: boolean): RunInput {
  const rs = runSettings(p, mode);
  return {
    strategy: rs.strategy, params: p.params, instr: p.instr, brokerId: p.broker, account: p.acc, from: rs.from, to: rs.to, trace, manualAt: manualTime(p), manualExtra: [],
  };
}

export async function startTest() {
  const s = state;
  if (periodError(s.prep, s.mode) || manualError(s.prep, s.mode)) return;
  stopRun();
  const token = runToken;
  const mode = s.mode;
  const results = checkNeeds(runSettings(s.prep, mode), s.rows);
  // missing data stops the test run (the data stock is filled by import only)
  if (results.some((r) => r.status === 'missing')) {
    setState({ phase: 'blocked', check: { results } });
    return;
  }
  setState({ phase: 'checking', check: { results } });
  if (mode === 'single') await startSingle(token);
  else await startBacktest(token);
}

async function startSingle(token: number) {
  await sleep(30);
  if (token !== runToken) return;
  const input = inputOf(state.prep, 'single', true);
  const out = runSync(input);
  const rp = new Replayer(out);
  const first = rp.firstActing();
  const strategy = input.strategy;
  const single: Single = {
    rp, cursor: first ?? rp.first(), noActing: !first, sel: null, bps: [], why: first ? 'start' : 'begin', strategy,
    tfs: usedTimeframes(strategy, state.prep.params), from: input.from, to: input.to,
  };
  setState({ phase: 'run', single, check: null, runPanel: 'flow', result: null });
  if (!first) toast('Im Testzeitraum erreicht der Ablauf keine handelnde Stelle. „Einzelschritt“ geht von vorn Schritt für Schritt weiter.', 'The flow reaches no acting place in the test period. "Step" goes through the flow from the beginning.');
}

function downsample(eq: EquityPoint[], max: number): EquityPoint[] {
  if (eq.length <= max) return eq;
  const step = eq.length / max;
  const out: EquityPoint[] = [];
  for (let i = 0; i < max; i++) out.push(eq[Math.floor(i * step)]);
  out.push(eq[eq.length - 1]);
  return out;
}

async function startBacktest(token: number) {
  const input = inputOf(state.prep, 'backtest', false);
  const eng = new Engine(input);
  const it = eng.run(2500);
  setState({ phase: 'btrun', bt: { progress: null, total: 0 }, check: null, result: null });
  let r = it.next();
  while (!r.done) {
    setState({ bt: { progress: r.value, total: r.value.total } });
    await sleep(18);
    if (token !== runToken) return;
    r = it.next();
  }
  if (token !== runToken) return;
  const out = r.value;
  const p = state.prep;
  const e = entryOf(p.strategyId);
  const tfs = usedTimeframes(e.strategy, p.params).sort((a, b) => (TF_MINUTES[a] ?? 60) - (TF_MINUTES[b] ?? 60));
  const summary = summarize(out);
  const per = p.periods.backtest;
  const result: BtResult = {
    name: `${e.strategy.sample === 'auftraggeber' ? 'EMA-Trendfolge (Ihre Strategie)' : e.strategy.name} · ${p.instrument} · ${per.from} – ${per.to}`,
    strategy: clone(e.strategy), strategyBadge: e.badge, params: clone(p.params), instrument: clone(p.instr), broker: p.broker, account: clone(p.acc),
    from: per.from, to: per.to, tf: tfs[0] ?? 'h1', summary, trades: out.trades, rejections: out.rejections.slice(0, 400), rejectedTotal: out.rejections.length,
    equity: downsample(out.equity, 700), startCapital: out.startCapital, savedId: null,
  };
  setState({ phase: 'btresult', result, bt: null, resPanel: 'summary', selTrade: null, rejectedShown: 100 });
}

export function cancelBacktest() {
  stopRun();
  setState({ phase: 'prepare', bt: null });
  toast('Der Backtest ist abgebrochen. Es wurde nichts gespeichert.', 'The backtest was cancelled. Nothing was saved.');
}

// ---- single-step controls ---------------------------------------------------------------------------------------

export function stepOnce() {
  const sg = state.single;
  if (!sg) return;
  const n = sg.rp.next(sg.cursor);
  if (!n) { toast('Das war die letzte Auswertung des Testzeitraums.', 'That was the last evaluation of the test period.'); return; }
  setState({ single: { ...sg, cursor: n, why: 'step' } });
}

export function jumpNext() {
  const sg = state.single;
  if (!sg) return;
  const r = sg.rp.jump(sg.cursor, new Set(sg.bps));
  if (r.why === 'end') { toast('Bis zum Ende des Testzeitraums kommt keine handelnde Stelle und kein Haltepunkt mehr.', 'No acting place and no breakpoint follows until the end of the test period.'); return; }
  setState({ single: { ...sg, cursor: r.cursor, why: r.why } });
}

export function toBegin() {
  const sg = state.single;
  if (!sg) return;
  setState({ single: { ...sg, cursor: sg.rp.first(), why: 'begin' } });
}

export function toFirstActing() {
  const sg = state.single;
  if (!sg) return;
  const f = sg.rp.firstActing();
  if (f) setState({ single: { ...sg, cursor: f, why: 'start' } });
}

/** Whether the command "Trigger manually" is usable: the strategy has the trigger and the current evaluation is finished. */
export function canTriggerManual(sg: Single): boolean {
  const ev = sg.rp.evalAt(sg.cursor);
  return !!ev && sg.cursor.s >= ev.steps.length - 1;
}

/** Starts an evaluation "Manual" at the current point in time; it follows next. */
export function triggerManual() {
  const sg = state.single;
  if (!sg || !canTriggerManual(sg)) return;
  const input = sg.rp.out.engine.input;
  const evals = sg.rp.evals;
  let ordinal = 0;
  for (let i = 0; i <= sg.cursor.e; i++) if (!evals[i].extra) ordinal += 1;
  const out = runSync({ ...input, manualExtra: [...input.manualExtra, ordinal] });
  const rp = new Replayer(out);
  setState({ single: { ...sg, rp, why: 'step' } });
  toast('Eine Auswertung „Manuell“ folgt als Nächstes. „Einzelschritt“ geht hinein.', 'An evaluation "Manual" follows next. "Step" enters it.');
}

export function toggleBreakpoint(elId: string) {
  const sg = state.single;
  if (!sg) return;
  const bps = sg.bps.includes(elId) ? sg.bps.filter((x) => x !== elId) : [...sg.bps, elId];
  setState({ single: { ...sg, bps } });
}

export function selectEl(id: string | null, panel?: RunPanel) {
  const sg = state.single;
  if (!sg) return;
  const compact = typeof window !== 'undefined' && window.matchMedia('(max-width: 1499px)').matches;
  setState({ single: { ...sg, sel: id }, ...(panel ? { runPanel: panel } : compact && id ? { runPanel: 'props' as RunPanel } : {}) });
}

/** Moves the cursor to a given evaluation (list of the evaluations of a point in time). */
export function gotoEval(e: number) {
  const sg = state.single;
  if (!sg) return;
  setState({ single: { ...sg, cursor: { e, s: 0 }, why: 'step' } });
}

// ---- results, saving ----------------------------------------------------------------------------------------------

export function saveBacktest(name: string) {
  const r = state.result;
  if (!r) return;
  const id = `bt${Date.now().toString(36)}${state.saved.length}`;
  const rec: SavedBacktest = { ...clone(r), id, savedAt: new Date().toISOString(), name: name.trim() || r.name, savedId: id };
  setState({ saved: [...state.saved, rec], result: { ...r, savedId: id, name: rec.name }, dialog: null }, true);
  toast('Der Backtest ist gespeichert. Sie finden ihn unter „Gespeicherte Backtests“.', 'The backtest is saved. You find it under "Saved backtests".');
}

export function deleteSaved(id: string) {
  setState({
    saved: state.saved.filter((x) => x.id !== id), compare: state.compare.filter((x) => x !== id), dialog: null,
    savedView: state.savedView.k === 'open' && state.savedView.id === id ? { k: 'list' } : state.savedView,
    result: state.result?.savedId === id ? { ...state.result, savedId: null } : state.result,
  }, true);
  toast('Der gespeicherte Backtest ist gelöscht.', 'The saved backtest is deleted.');
}

export function toggleCompare(id: string) {
  setState({ compare: state.compare.includes(id) ? state.compare.filter((x) => x !== id) : [...state.compare, id] });
}

export function openSaved(id: string) {
  setState({ savedView: { k: 'open', id }, resPanel: 'summary', selTrade: null, rejectedShown: 100 });
}

export function currentResult(): BtResult | null {
  const s = state;
  if (s.view === 'saved' && s.savedView.k === 'open') {
    const id = s.savedView.id;
    return s.saved.find((x) => x.id === id) ?? null;
  }
  return s.view === 'test' && s.phase === 'btresult' ? s.result : null;
}

// ---- accounts --------------------------------------------------------------------------------------------------------

export function upsertAccount(a: Account) {
  const exists = state.accounts.some((x) => x.id === a.id);
  const list = exists ? state.accounts.map((x) => (x.id === a.id ? a : x)) : [...state.accounts, a];
  const prep = state.prep.accountId === a.id ? { ...state.prep, acc: clone(a) } : state.prep;
  setState({ accounts: list, prep }, true);
}

export function deleteAccount(id: string) {
  const list = state.accounts.filter((a) => a.id !== id);
  const prep = state.prep.accountId === id ? { ...state.prep, accountId: list[0]?.id ?? '', acc: clone(list[0] ?? STANDARD_ACCOUNT) } : state.prep;
  setState({ accounts: list, prep, dialog: null }, true);
  toast('Das Testkonto ist gelöscht.', 'The test account is deleted.');
}

// ---- data stock -------------------------------------------------------------------------------------------------------------

export function addDataRows(rows: DataRow[]) {
  setState({ rows: [...state.rows, ...rows] }, true);
}
