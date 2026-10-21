// The single-step test: control bar, strategy as in the designer (read only), charts of the time
// frames the strategy uses, values of account, orders and positions, and the properties view.
import { useCallback, useMemo } from 'react';
import { DTYPE_LABEL, TYPES, fieldTip, fieldsOf, propsOf, tx, typeLabel } from './catalog';
import { CandleChart } from './Chart';
import type { ChartLine, ChartMarker, ChartPoint } from './Chart';
import { describe, print, refsOf, objName, propLabel } from './expr';
import { FlowView } from './FlowView';
import type { FlowOverlay, HoverContent } from './FlowView';
import { fmtMoney, fmtN, fmtVal } from './fmt';
import { scopeFor } from './findings';
import { kindClass } from './kinds';
import type { El, Lang, PropDef, Strategy } from './model';
import type { StepRec, Val } from './sim/engine';
import { fmtTime, seriesFor } from './sim/market';
import type { Cursor } from './sim/replay';
import {
  backToPrepare, gotoEval, jumpNext, selectEl, setState, stepOnce, toBegin, toFirstActing, toggleBreakpoint, useApp,
} from './store';
import type { RunPanel, Single } from './store';
import { bindingText } from './summary';
import { Btn, Icon, Info, Section, useL } from './ui';

function isCondition(el: El | undefined): boolean {
  return el?.type === 'flow.condition';
}

/** Everything the views need about the position of the cursor. */
function useCursorInfo(sg: Single, lang: Lang) {
  const rp = sg.rp;
  const c = sg.cursor;
  const prev = rp.prev(c);
  const eng = rp.out.engine;
  const digits = eng.input.instr.digits;
  const ev = rp.evalAt(c);
  const st = rp.stepAt(c);
  const show = (el: El | undefined, p: Pick<PropDef, 'id' | 'dtype' | 'choices'> | undefined, v: Val): string => {
    if (isCondition(el) && typeof v === 'boolean') return v ? (lang === 'en' ? 'true' : 'wahr') : lang === 'en' ? 'false' : 'falsch';
    return fmtVal(v, p, lang, digits);
  };
  const value = (obj: string, prop: string, at: Cursor | null): Val => (at ? rp.valueOf(obj, prop, at).value : null);
  const changed = (obj: string, prop: string): boolean => {
    if (!prev) return false;
    const a = value(obj, prop, c);
    const b = value(obj, prop, prev);
    return JSON.stringify(a) !== JSON.stringify(b);
  };
  return { rp, c, prev, eng, digits, ev, st, show, value, changed };
}

export function RunView() {
  const app = useApp();
  const sg = app.single as Single;
  const lang = app.settings.lang;
  const L = useL();
  const info = useCursorInfo(sg, lang);
  const { rp, c, ev, st, eng, digits } = info;
  const s = sg.strategy;

  const steps = useMemo(() => {
    const m = new Map<string, StepRec>();
    ev.steps.forEach((x, i) => { if (i <= c.s) m.set(x.el, x); });
    return m;
  }, [ev, c.s]);

  const world = rp.world(c);
  const inst = rp.instAt(c);
  const overlay: FlowOverlay = {
    now: st?.el ?? null,
    steps,
    activeFlow: ev.flow,
    instTag: inst ? inst.tag : ev.inst !== null ? `#${ev.inst}` : null,
    bps: new Set(sg.bps),
    sel: sg.sel,
    onSelect: (id) => selectEl(id),
    onToggleBp: toggleBreakpoint,
    follow: c.e * 1000 + c.s,
    nowExtra: st?.reject ? 250 : 0,
    reason: (x) => x.reject,
    cardValue: (elId, propId) => {
      const el = eng.byId.get(elId);
      const p = el ? propsOf(el).find((q) => q.id === propId) : undefined;
      const v = info.value(elId, propId, c);
      return { text: info.show(el, p, v), changed: info.changed(elId, propId) };
    },
    hover: (elId) => hoverContent(elId),
  };

  function hoverContent(elId: string): HoverContent | null {
    const el = eng.byId.get(elId);
    if (!el) return null;
    const d = TYPES[el.type];
    const rows: HoverContent['rows'] = [];
    const step = steps.get(elId);
    if (el.type === 'flow.condition' || el.type === 'flow.calculation') {
      const r = rp.resultAt(el.id, c);
      rows.push({ label: L('Ergebnis', 'Result'), value: r ? info.show(el, { id: 'ergebnis', dtype: el.type === 'flow.condition' ? 'boolean' : 'number' }, r.value) : L('noch nicht berechnet', 'not calculated yet'), changed: !!r?.fresh && info.changed(el.id, 'ergebnis') });
      if (r && !r.fresh) rows.push({ label: '', value: L('aus einer früheren Auswertung', 'from an earlier evaluation'), changed: false });
    } else if (el.type.startsWith('trigger.')) {
      rows.push({ label: L('Letzte Auslösung', 'Last trigger'), value: fmtTime(ev.t, lang), changed: false });
    } else if (step?.vals) {
      for (const [k, v] of Object.entries(step.vals)) {
        const f = fieldsOf(el).find((q) => q.id === k);
        if (f && v !== null) rows.push({ label: tx(f, lang), value: fmtVal(v, f, lang, digits), changed: false });
      }
    } else if (d && propsOf(el).length > 0) {
      for (const p of propsOf(el).slice(0, 4)) {
        rows.push({ label: tx(p, lang), value: info.show(el, p, info.value(elId, p.id, c)), changed: info.changed(elId, p.id) });
      }
    }
    const note = step?.reject ? tx(step.reject, lang) : step?.note ? tx(step.note, lang) : step?.effect ? tx(step.effect, lang) : undefined;
    if (rows.length === 0 && !note) rows.push({ label: '', value: L('Noch nicht erreicht.', 'Not reached yet.'), changed: false });
    return { title: el.name, rows, note };
  }

  const tab = app.runPanel;
  return (
    <div className="run" data-panel={tab} data-testid="run">
      <RunBar sg={sg} info={info} />
      <section className="region r-flow" data-region="flow" aria-label={L('Strategie', 'Strategy')}>
        <FlowView strategy={s} overlay={overlay} testid="flow" />
      </section>
      <ChartsRegion sg={sg} info={info} />
      <ValuesRegion sg={sg} info={info} />
      <section className="region r-props" data-region="props" data-testid="props" aria-label={L('Eigenschaftenansicht', 'Properties view')}>
        <SideTabs />
        <div className="props-scroll"><PropsView sg={sg} info={info} /></div>
      </section>
      <RunTabs />
      <span hidden>{world?.seq}</span>
    </div>
  );
}

type Info = ReturnType<typeof useCursorInfo>;

// ---- control bar ----------------------------------------------------------------------------------------

function RunBar({ sg, info }: { sg: Single; info: Info }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const { rp, c, ev, st } = info;
  const eng = rp.out.engine;
  const trg = ev.trig ? eng.byId.get(ev.trig) : undefined;
  const same = rp.evals.map((e, i) => ({ e, i })).filter((x) => x.e.t === ev.t && x.e.kind === ev.kind);
  const pos = same.findIndex((x) => x.i === c.e);
  const stepEl = st ? eng.byId.get(st.el) : undefined;
  const whyText: Record<string, string> = {
    start: L('Der Test ist an der ersten handelnden Stelle angehalten.', 'The test stopped at the first acting place.'),
    acting: L('Angehalten an der nächsten handelnden Stelle.', 'Stopped at the next acting place.'),
    breakpoint: L('Angehalten an einem Haltepunkt.', 'Stopped at a breakpoint.'),
    begin: L('Am Beginn des Testzeitraums: Indikatoren haben noch keine Werte.', 'At the start of the test period: indicators have no values yet.'),
    step: '',
    end: '',
  };
  const tfLabel = ev.kind === 'manual' ? L('Start von Hand', 'Start by hand') : ev.kind === 'tick' ? 'Tick' : `${L('Kerzenschluss', 'Candle close')} ${(ev.tf ?? '').toUpperCase()}`;
  const flowLabel = ev.flow === null ? L('Hauptablauf', 'Main flow') : `${L('Verwaltung der Order', 'Management of order')} ${ev.inst !== null ? `#${ev.inst}` : ''}`;
  return (
    <header className="region run-bar" data-region="bar" data-testid="run-bar">
      <div className="run-controls" role="toolbar" aria-label={L('Steuerung des Einzelschritt-Tests', 'Controls of the single-step test')}>
        <Btn kind="primary" icon="step" testid="btn-step" onClick={stepOnce} tip={L('Geht zum nächsten Element des Ablaufs. Am Ende einer Auswertung folgt die nächste Auswertung.', 'Goes to the next element of the flow. At the end of an evaluation the next evaluation follows.')}>
          {L('Einzelschritt', 'Step')}
        </Btn>
        <Btn icon="jump" testid="btn-jump" onClick={jumpNext} tip={L('Läuft bis zur nächsten handelnden Stelle oder bis zum nächsten Haltepunkt, je nachdem, was zuerst kommt.', 'Runs to the next acting place or the next breakpoint, whichever comes first.')}>
          {L('Nächste handelnde Stelle', 'Next acting place')}
        </Btn>
        <Btn icon="home" kind="ghost" testid="btn-begin" onClick={toBegin} tip={L('Zurück an den Beginn des Testzeitraums, zum ersten Element der ersten Auswertung.', 'Back to the start of the test period, the first element of the first evaluation.')}>
          {L('Zum Testbeginn', 'To test start')}
        </Btn>
        <Btn icon="flag" kind="ghost" testid="btn-first" disabled={sg.noActing} onClick={toFirstActing} tip={L('Zurück an die erste handelnde Stelle des Testzeitraums.', 'Back to the first acting place of the test period.')}>
          {L('Erste handelnde Stelle', 'First acting place')}
        </Btn>
        {sg.bps.length > 0 && (
          <Btn kind="quiet" icon="x" testid="btn-clear-bps" onClick={() => setState({ single: { ...sg, bps: [] } })} tip={L('Entfernt alle Haltepunkte.', 'Removes all breakpoints.')}>
            {L(`${sg.bps.length} Haltepunkt(e) entfernen`, `Remove ${sg.bps.length} breakpoint(s)`)}
          </Btn>
        )}
        <span className="spacer" />
        <Btn kind="quiet" icon="left" testid="btn-end" onClick={backToPrepare} tip={L('Beendet den Testlauf und kehrt zur Vorbereitung zurück.', 'Ends the test run and returns to the preparation.')}>
          {L('Zur Vorbereitung', 'Back to preparation')}
        </Btn>
      </div>
      <div className="run-status" data-testid="run-status">
        <span className="rs-time" data-testid="eval-time"><Icon name="clock" size={14} />{fmtTime(ev.t, lang)}</span>
        <span className="rs-chip" data-testid="eval-trigger">{tfLabel}</span>
        <span className={`rs-chip ${ev.flow === null ? 'main' : 'mgmt'}`} data-testid="eval-flow">{flowLabel}</span>
        {st && stepEl && <span className="rs-el" data-testid="eval-element">{L('Element', 'Element')}: <b>{stepEl.name}</b>{c.s + 1 > 0 ? ` (${c.s + 1}/${ev.steps.length})` : ''}</span>}
        {ev.acting && <span className="rs-chip acting" data-testid="eval-acting"><Icon name="flag" size={12} />{L('handelnde Stelle', 'acting place')}</span>}
        {ev.steps.some((x) => x.reject) && <span className="rs-chip reject" data-testid="eval-reject" data-tip={L('In dieser Auswertung lehnt die interne Abwicklung eine Order ab. Gehen Sie mit „Einzelschritt“ bis zum Element „Order aufgeben“, dort steht der Grund.', 'In this evaluation the internal settlement rejects an order. Go with "Step" to the element "Place order", the reason is shown there.')}><Icon name="warn" size={12} />{L('endet mit abgelehnter Order', 'ends with a rejected order')}</span>}
        {sg.why in whyText && whyText[sg.why] && <span className="rs-why" data-testid="run-why">{whyText[sg.why]}</span>}
      </div>
      {same.length > 1 && (
        <ol className="eval-order" data-testid="eval-order" aria-label={L('Auswertungen zu diesem Zeitpunkt', 'Evaluations at this point in time')}>
          <li className="eo-title">{L('Zu diesem Zeitpunkt, in dieser Reihenfolge:', 'At this point in time, in this order:')}</li>
          {same.map((x, k) => (
            <li key={x.i} className={x.i === c.e ? 'on' : ''}>
              <button type="button" onClick={() => gotoEval(x.i)} data-testid="eval-order-item" data-pos={k + 1}>
                {k + 1}. {x.e.flow === null ? L('Hauptablauf', 'Main flow') : `${L('Verwaltung', 'Management')} ${x.e.inst !== null ? `#${x.e.inst}` : ''}`}
                {x.e.acting ? ' ◆' : ''}
              </button>
            </li>
          ))}
          <li className="eo-note"><Info tip={L('Bei demselben Auslöser wird zuerst die Verwaltung der Orders ausgewertet, danach der Hauptablauf.', 'With the same trigger the management of the orders is evaluated first, then the main flow.')} /></li>
        </ol>
      )}
      <span hidden>{pos}{trg?.name}</span>
    </header>
  );
}

// ---- charts -------------------------------------------------------------------------------------------------

function ChartsRegion({ sg, info }: { sg: Single; info: Info }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const { rp, c, ev, eng, digits } = info;
  const input = eng.input;
  const seq = rp.seqAt(c);
  const serieses = useMemo(() => sg.tfs.map((tf) => seriesFor(input.instr.id, tf, sg.from, sg.to, input.brokerId)), [sg.tfs, sg.from, sg.to, input.instr.id, input.brokerId]);
  const acting = useMemo(() => rp.evals.filter((e) => e.acting).map((e): ChartMarker => ({
    id: `a${e.id}`, t: Math.max(sg.from, e.t - 1), kind: 'acting',
    title: `${L('Handelnde Stelle', 'Acting place')}: ${fmtTime(e.t, lang)}${e.flow === null ? '' : ` (${L('Verwaltung', 'Management')})`}`,
  })), [rp, sg.from, lang, L]);
  const events = rp.out.events.filter((e) => e.seq <= seq);
  const rejected: ChartMarker[] = events.filter((e) => e.kind === 'rejected' && e.price !== null).slice(-30).map((e) => ({
    id: `r${e.seq}`, t: Math.max(sg.from, e.t - 1), kind: 'reject', price: e.price as number, title: tx(e.text, lang),
  }));
  const markers = [...acting, ...rejected];
  if (input.manualStart) markers.push({ id: 'manual', t: sg.from, kind: 'manual', title: L('Start von Hand (Vorschlag: einmal zu Beginn des Testzeitraums)', 'Start by hand (proposal: once at the start of the test period)') });
  const points: ChartPoint[] = events.filter((e) => e.kind !== 'rejected' && e.price !== null).slice(-120).map((e) => ({
    id: `p${e.seq}`, t: Math.max(sg.from, e.t - 1), price: e.price as number, kind: e.kind as ChartPoint['kind'], dir: e.dir, title: tx(e.text, lang),
  }));
  const world = rp.world(c);
  const placed = new Map<number, number>();
  for (const e of rp.out.events) if (e.kind === 'placed' && e.orderId !== null && e.seq <= seq) placed.set(e.orderId, e.t);
  const lines: ChartLine[] = [];
  for (const i of world?.insts ?? []) {
    const live = i.status === 'wartend' || i.posOpen;
    if (!live) continue;
    const from = placed.get(i.id) ?? ev.t;
    if (i.status === 'wartend' && i.price !== null) lines.push({ id: `o${i.id}`, price: i.price, fromT: from, toT: ev.t, kind: 'order', label: `${i.tag} ${i.dir === 'buy' ? L('Kauf', 'Buy') : L('Verkauf', 'Sell')}-Stop ${fmtN(i.price, digits, lang)}` });
    if (i.posOpen && i.entry !== null) lines.push({ id: `e${i.id}`, price: i.entry, fromT: from, toT: ev.t, kind: 'entry', label: `${i.tag} ${L('Einstieg', 'Entry')} ${fmtN(i.entry, digits, lang)}` });
    if (i.sl !== null) lines.push({ id: `s${i.id}`, price: i.sl, fromT: from, toT: ev.t, kind: 'sl', label: `${i.tag} SL ${fmtN(i.sl, digits, lang)}` });
    if (i.tp !== null) lines.push({ id: `t${i.id}`, price: i.tp, fromT: from, toT: ev.t, kind: 'tp', label: `${i.tag} TP ${fmtN(i.tp, digits, lang)}` });
  }
  const focusKey = c.e * 1000 + c.s;
  return (
    <section className="region r-charts" data-region="charts" data-testid="charts" aria-label={L('Chart', 'Chart')}>
      <div className="charts-stack">
        {serieses.map((ser) => (
          <CandleChart
            key={ser.tf} series={ser} digits={digits} lang={lang} title={`${input.instr.id}`} now={ev.t} markers={markers} lines={lines} points={points}
            focusKey={focusKey} testid="chart"
          />
        ))}
      </div>
      <details className="chart-legend-box">
        <summary>{L('Zeichen im Chart', 'Symbols in the chart')}</summary>
        <ul className="chart-legend">
          <li><span className="lg acting" />{L('handelnde Stelle', 'acting place')}</li>
          <li><span className="lg placed" />{L('Order gestellt', 'order placed')}</li>
          <li><span className="lg filled" />{L('ausgeführt', 'filled')}</li>
          <li><span className="lg closed" />{L('Position geschlossen', 'position closed')}</li>
          <li><span className="lg reject" />{L('abgelehnt', 'rejected')}</li>
          <li><span className="lg up" />{L('steigende Kerze', 'rising candle')}</li>
          <li><span className="lg down" />{L('fallende Kerze', 'falling candle')}</li>
        </ul>
      </details>
    </section>
  );
}

// ---- values: account, orders, positions, log ---------------------------------------------------------------------

function ValuesRegion({ sg, info }: { sg: Single; info: Info }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const { rp, c, prev, ev, digits, eng } = info;
  const cur = eng.input.account.currency;
  const acc = rp.account(c);
  const pacc = prev ? rp.account(prev) : null;
  const world = rp.world(c);
  const seq = rp.seqAt(c);
  const log = rp.out.events.filter((e) => e.seq <= seq).slice(-8).reverse();
  const insts = (world?.insts ?? []).slice(-8).reverse();
  const ins = eng.input.instr;
  const pl = (i: { dir: 'buy' | 'sell'; entry: number | null; vol: number }) => {
    if (i.entry === null) return 0;
    const dist = i.dir === 'buy' ? ev.bid - i.entry : i.entry - ev.ask;
    return (dist / ins.tickgroesse) * ins.tickwert * i.vol;
  };
  const stat = (label: string, v: number, p: number | null, key: string, tip: string, signed = false) => (
    <div className={`stat${p !== null && Math.abs(p - v) > 1e-9 ? ' changed' : ''}`} data-testid={key} data-tip={tip}>
      <span>{label}</span>
      <b>{signed && v > 0 ? '+' : ''}{fmtMoney(v, cur, lang)}</b>
    </div>
  );
  return (
    <section className="region r-values" data-region="values" data-testid="values" aria-label={L('Konto, Orders und Positionen', 'Account, orders and positions')}>
      <SideTabs />
      <div className="values-scroll">
        <h3 className="vh">{L('Konto', 'Account')}</h3>
        <div className="stats">
          {stat(L('Kontostand', 'Balance'), acc.balance, pacc ? pacc.balance : null, 'val-balance', L('Das Geld auf dem Konto ohne offene Positionen. Es ändert sich, wenn eine Position geschlossen wird oder Kommission anfällt.', 'The money on the account without open positions. It changes when a position is closed or commission is charged.'))}
          {stat(L('Offener Gewinn/Verlust', 'Open profit/loss'), acc.open, pacc ? pacc.open : null, 'val-open', L('Gewinn oder Verlust der offenen Positionen beim aktuellen Kurs.', 'Profit or loss of the open positions at the current price.'), true)}
          {stat(L('Kapital', 'Equity'), acc.equity, pacc ? pacc.equity : null, 'val-equity', L('Kontostand plus offener Gewinn oder Verlust. Die Risikoregel rechnet mit diesem Wert.', 'Balance plus open profit or loss. The risk rule uses this value.'))}
        </div>
        <h3 className="vh">{L('Orders', 'Orders')}</h3>
        {insts.length === 0 ? (
          <p className="empty-note" data-testid="no-orders">{L('Noch keine Order. Sie entsteht an einer handelnden Stelle: „Nächste handelnde Stelle“ geht dorthin.', 'No order yet. It arises at an acting place: "Next acting place" goes there.')}</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl" data-testid="orders-table">
              <thead><tr><th>{L('Nr.', 'No.')}</th><th>{L('Art', 'Type')}</th><th>{L('Richtung', 'Direction')}</th><th>{L('Volumen', 'Volume')}</th><th>{L('Preis', 'Price')}</th><th>SL</th><th>TP</th><th>{L('Status', 'Status')}</th></tr></thead>
              <tbody>
                {insts.map((i) => (
                  <tr key={i.id} className={i.status === 'wartend' ? 'live' : ''} data-testid="order-row" data-status={i.status}>
                    <td>{i.tag}</td>
                    <td>{i.type === 'MarketOrder' ? L('Markt', 'Market') : i.type === 'StopOrder' ? 'Stop' : i.type}</td>
                    <td>{i.dir === 'buy' ? L('Kauf', 'Buy') : L('Verkauf', 'Sell')}</td>
                    <td>{fmtN(i.vol, 2, lang)}</td>
                    <td>{i.price === null ? L('Markt', 'market') : fmtN(i.price, digits, lang)}</td>
                    <td>{i.sl === null ? '–' : fmtN(i.sl, digits, lang)}</td>
                    <td>{i.tp === null ? '–' : fmtN(i.tp, digits, lang)}</td>
                    <td>{fmtVal(i.status, undefined, lang, digits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <h3 className="vh">{L('Positionen', 'Positions')}</h3>
        {insts.filter((i) => i.posOpen).length === 0 ? (
          <p className="empty-note" data-testid="no-positions">{L('Keine offene Position.', 'No open position.')}</p>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl" data-testid="positions-table">
              <thead><tr><th>{L('Nr.', 'No.')}</th><th>{L('Richtung', 'Direction')}</th><th>{L('Volumen', 'Volume')}</th><th>{L('Einstieg', 'Entry')}</th><th>SL</th><th>TP</th><th>{L('Offen G/V', 'Open P/L')}</th></tr></thead>
              <tbody>
                {insts.filter((i) => i.posOpen).map((i) => {
                  const v = pl(i);
                  return (
                    <tr key={i.id} data-testid="position-row">
                      <td>{i.tag}</td><td>{i.dir === 'buy' ? L('Kauf', 'Buy') : L('Verkauf', 'Sell')}</td><td>{fmtN(i.vol, 2, lang)}</td>
                      <td>{i.entry === null ? '–' : fmtN(i.entry, digits, lang)}</td><td>{i.sl === null ? '–' : fmtN(i.sl, digits, lang)}</td><td>{i.tp === null ? '–' : fmtN(i.tp, digits, lang)}</td>
                      <td className={v >= 0 ? 'pos' : 'neg'}>{v > 0 ? '+' : ''}{fmtN(v, 2, lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <h3 className="vh">{L('Protokoll', 'Log')}</h3>
        {log.length === 0 ? (
          <p className="empty-note">{L('Noch nichts geschehen. Das Protokoll füllt sich, sobald eine Order gestellt, geändert, gelöscht oder abgelehnt wird.', 'Nothing has happened yet. The log fills as soon as an order is placed, modified, deleted or rejected.')}</p>
        ) : (
          <ul className="log" data-testid="log">
            {log.map((e) => (
              <li key={e.seq} className={e.kind === 'rejected' ? 'bad' : ''} data-kind={e.kind}>
                <span className="log-t">{fmtTime(e.t, lang)}</span>
                <span>{tx(e.text, lang)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span hidden>{sg.bps.length}</span>
    </section>
  );
}

// ---- properties view --------------------------------------------------------------------------------------------------

function PropsView({ sg, info }: { sg: Single; info: Info }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const s = sg.strategy;
  const { rp, c, ev, eng, digits, st } = info;
  const el = sg.sel ? s.els.find((e) => e.id === sg.sel) : undefined;
  const sc = useMemo(() => scopeFor(s, lang, el ?? null, true), [s, lang, el]);

  if (!el) {
    return (
      <div className="props" data-testid="props-strategy">
        <header className="props-head">
          <div className="badge b-strategy"><Icon name="chart" size={20} /></div>
          <div className="props-title"><span className="props-kind">{L('Strategie', 'Strategy')}</span><h2>{s.name}</h2></div>
        </header>
        <p className="hint-box"><Icon name="info" size={16} /><span>{L('Nächster Schritt: Wählen Sie ein Element auf der Fläche. Hier erscheinen dann seine Parameter, Eigenschaften und Ergebnisse mit den Werten des aktuellen Schritts.', 'Next step: choose an element on the canvas. Its parameters, properties and results then appear here with the values of the current step.')}</span></p>
        <Section title={L('Strategieparameter dieses Testlaufs', 'Strategy parameters of this test run')}>
          <ul className="prop-list">
            {s.params.map((p) => (
              <li key={p.id} className="prop-row" data-tip={L('Der Wert gilt für diesen Testlauf. Die Strategie bleibt unverändert.', 'The value applies to this test run. The strategy stays unchanged.')}>
                <span className="prop-name">{p.name}</span>
                <span className="val">{String(eng.input.params[p.id] ?? p.value).toUpperCase() === String(eng.input.params[p.id] ?? p.value) && p.dtype === 'time_unit' ? String(eng.input.params[p.id] ?? p.value).toUpperCase() : String(eng.input.params[p.id] ?? p.value)}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title={L('Regeln der Strategie', 'Rules of the strategy')}>
          {s.rules.length === 0 ? <p className="empty-note">{L('Keine Regeln.', 'No rules.')}</p> : (
            <ul className="prop-list">{s.rules.map((r) => <li key={r.id} className="prop-row"><span className="prop-name">{r.name}</span><span className="muted">{r.builtin ? L('Risiko je Trade, Risikogrenze 1 %', 'Risk per trade, risk limit 1 %') : r.origin.type}</span></li>)}</ul>
          )}
        </Section>
      </div>
    );
  }

  const d = TYPES[el.type];
  const step = ev.steps.slice(0, c.s + 1).find((x) => x.el === el.id);
  const isNow = st?.el === el.id;
  const k = kindClass(el.type);
  const fields = fieldsOf(el);
  const props = propsOf(el);
  const expr = el.bind.ausdruck;
  const refs = expr && expr.k === 'expr' ? refsOf(expr.e) : [];
  const valRow = (obj: string, prop: string, label: string, p?: PropDef) => {
    const v = info.value(obj, prop, c);
    const ch = info.changed(obj, prop);
    const oel = eng.byId.get(obj);
    return (
      <li key={`${obj}.${prop}`} className={`prop-row val-row${ch ? ' changed' : ''}`} data-testid="value-row" data-prop={prop} data-changed={ch ? '1' : '0'} data-tip={fieldTip(prop, lang, 'p')}>
        <span className="prop-name">{label}</span>
        <span className="val" data-testid="value">{info.show(oel, p ?? props.find((q) => q.id === prop), v)}</span>
        {ch && <span className="chg">{L('geändert', 'changed')}</span>}
      </li>
    );
  };
  const resultOf = (): React.ReactNode => {
    if (el.type === 'flow.condition' || el.type === 'flow.calculation') {
      const r = rp.resultAt(el.id, c);
      const text = r ? info.show(el, { id: 'ergebnis', dtype: el.type === 'flow.condition' ? 'boolean' : 'number' }, r.value) : L('noch nicht berechnet', 'not calculated yet');
      return (
        <Section title={L('Ergebnis', 'Result')} testid="sec-result">
          <ul className="prop-list">
            <li className={`prop-row val-row big${r?.fresh ? ' changed' : ''}`} data-testid="value-row" data-prop="ergebnis" data-changed={r?.fresh ? '1' : '0'}>
              <span className="prop-name">{el.type === 'flow.condition' ? L('Bedingung ist', 'Condition is') : L('Ergebnis', 'Result')}</span>
              <span className="val" data-testid="value">{text}</span>
              {r && !r.fresh && <span className="muted">{L('aus früherer Auswertung', 'from an earlier evaluation')}</span>}
            </li>
          </ul>
          {step?.noValue && <p className="hint-box warn" data-testid="no-value-note"><Icon name="info" size={16} /><span>{step.note ? tx(step.note, lang) : ''}</span></p>}
          {step?.note && !step.noValue && <p className="muted">{tx(step.note, lang)}</p>}
        </Section>
      );
    }
    return null;
  };

  return (
    <div className="props" data-testid="props-element" data-kind={el.type} data-name={el.name}>
      <header className="props-head">
        <div className={`badge b-${k}`}><Icon name={d?.icon ?? 'warn'} size={20} /></div>
        <div className="props-title"><span className="props-kind">{d ? typeLabel(el.type, lang) : el.type}</span><h2>{el.name}</h2></div>
        <Btn small kind={sg.bps.includes(el.id) ? 'danger' : 'default'} icon="flag" testid="props-bp" onClick={() => toggleBreakpoint(el.id)} tip={L('Setzt oder entfernt einen Haltepunkt an diesem Element.', 'Sets or removes a breakpoint at this element.')}>
          {sg.bps.includes(el.id) ? L('Haltepunkt entfernen', 'Remove breakpoint') : L('Haltepunkt setzen', 'Set breakpoint')}
        </Btn>
      </header>
      <p className="type-tip">{fieldTip(`type:${el.type}`, lang, 'f') ?? ''}</p>
      {isNow ? (
        <p className="now-note" data-testid="now-note"><Icon name="play" size={13} />{L('Dieses Element läuft gerade.', 'This element is running now.')}{step?.out ? ` ${L('Ausgang', 'Exit')}: ${step.out}` : ''}</p>
      ) : step ? (
        <p className="now-note done"><Icon name="check" size={13} />{L('In dieser Auswertung schon durchlaufen.', 'Already passed in this evaluation.')}</p>
      ) : (
        <p className="now-note idle">{L('In dieser Auswertung noch nicht erreicht. Die Werte sind die des aktuellen Schritts.', 'Not reached yet in this evaluation. The values are those of the current step.')}</p>
      )}
      {step?.reject && (
        <div className="finding error" data-testid="props-reject" role="alert">
          <Icon name="warn" size={18} />
          <div className="finding-body"><strong>{L('Order abgelehnt', 'Order rejected')}</strong><p>{tx(step.reject, lang)}</p></div>
        </div>
      )}
      {step?.effect && !step.reject && <p className="ok-note"><Icon name="check" size={15} />{tx(step.effect, lang)}</p>}

      {(el.type === 'flow.condition' || el.type === 'flow.calculation') && expr && expr.k === 'expr' && (
        <Section title={el.type === 'flow.condition' ? L('Bedingung', 'Condition') : L('Berechnung', 'Calculation')} testid="sec-expression">
          <p className="ep-sentence" data-testid="expr-sentence"><Icon name="info" size={14} /><span>{describe(expr.e, sc)}</span></p>
          <pre className="formula" data-testid="expr-formula">{print(expr.e, sc)}</pre>
        </Section>
      )}
      {resultOf()}

      {refs.length > 0 && (
        <Section title={L('Verwendete Werte', 'Values used')} testid="sec-used">
          <ul className="prop-list">{refs.map((r) => valRow(r.obj, r.prop, `${objName(r.obj, sc)} › ${propLabel(r.obj, r.prop, sc)}`))}</ul>
        </Section>
      )}

      {fields.filter((f) => f.dtype !== 'expression' && f.section === 'param').length > 0 && (
        <Section title={L('Parameter', 'Parameters')} testid="sec-params">
          <ul className="prop-list">
            {fields.filter((f) => f.dtype !== 'expression' && f.section === 'param').map((f) => (
              <li key={f.id} className="prop-row" data-tip={fieldTip(f.id, lang)}>
                <span className="prop-name">{tx(f, lang)}</span>
                <span className="val">{bindingText(el.bind[f.id], f, s, sc)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {el.type === 'flow.place_order' && (
        <Section title={L('Eigenschaften der Order', 'Properties of the order')} testid="sec-order">
          <ul className="prop-list">
            {fields.filter((f) => f.section === 'order').map((f) => {
              const v = step?.vals?.[f.id];
              return (
                <li key={f.id} className="prop-row val-row" data-testid="order-field" data-prop={f.id} data-tip={fieldTip(f.id, lang)}>
                  <span className="prop-name">{tx(f, lang)}</span>
                  <span className="val" data-testid="value">{v !== undefined && v !== null ? fmtVal(v, f, lang, digits) : step ? '–' : bindingText(el.bind[f.id], f, s, sc)}</span>
                </li>
              );
            })}
          </ul>
          {(s.rules.length + el.rules.length > 0) && (
            <p className="muted">{L('Regeln: ', 'Rules: ')}{[...s.rules, ...el.rules].map((r) => r.name).join(', ')}</p>
          )}
        </Section>
      )}

      {(el.type === 'flow.modify_order' || el.type === 'flow.modify_position') && step?.vals && (
        <Section title={L('Neue Werte', 'New values')}>
          <ul className="prop-list">
            {Object.entries(step.vals).map(([id, v]) => (
              <li key={id} className="prop-row val-row" data-prop={id}><span className="prop-name">{tx(fields.find((f) => f.id === id) ?? { de: id, en: id }, lang)}</span><span className="val">{v === null ? '–' : fmtVal(v, undefined, lang, digits)}</span></li>
            ))}
          </ul>
        </Section>
      )}

      {props.length > 0 && el.type !== 'flow.condition' && el.type !== 'flow.calculation' && (
        <Section title={L('Ergebnisse (Werte des aktuellen Schritts)', 'Results (values of the current step)')} testid="sec-results">
          <ul className="prop-list">
            {props.map((p) => valRow(el.id, p.id, tx(p, lang), p))}
          </ul>
          <p className="muted">{L('Gelb hinterlegt: der Wert hat sich seit dem letzten Schritt geändert.', 'Highlighted: the value has changed since the last step.')}</p>
        </Section>
      )}

      {el.type.startsWith('trigger.') && (
        <Section title={L('Auslösung', 'Trigger')}>
          <ul className="prop-list">
            <li className="prop-row"><span className="prop-name">{L('Zeitpunkt der aktuellen Auswertung', 'Time of the current evaluation')}</span><span className="val">{fmtTime(ev.t, lang)}</span></li>
            <li className="prop-row"><span className="prop-name">{L('Geld / Brief', 'Bid / ask')}</span><span className="val">{fmtN(ev.bid, digits, lang)} / {fmtN(ev.ask, digits, lang)}</span></li>
          </ul>
        </Section>
      )}
      <span hidden>{DTYPE_LABEL.number.de}</span>
    </div>
  );
}

// ---- tabs for narrow windows --------------------------------------------------------------------------------------------------

/** In the middle layout values and properties share one area; these tabs switch between them. */
function SideTabs() {
  const app = useApp();
  const L = useL();
  const on = app.runPanel === 'props' ? 'props' : 'values';
  return (
    <div className="panel-tabs" role="tablist" aria-label={L('Bereich wählen', 'Choose area')}>
      <button type="button" role="tab" aria-selected={on === 'values'} className={on === 'values' ? 'on' : ''} onClick={() => setState({ runPanel: 'values' })} data-testid="tab-values">{L('Konto und Orders', 'Account and orders')}</button>
      <button type="button" role="tab" aria-selected={on === 'props'} className={on === 'props' ? 'on' : ''} onClick={() => setState({ runPanel: 'props' })} data-testid="tab-props">{L('Eigenschaften', 'Properties')}</button>
    </div>
  );
}

function RunTabs() {
  const app = useApp();
  const L = useL();
  const tabs: [RunPanel, string, string][] = [
    ['flow', L('Strategie', 'Strategy'), 'grid'], ['charts', L('Chart', 'Chart'), 'chart'], ['values', L('Werte', 'Values'), 'wallet'], ['props', L('Eigenschaften', 'Properties'), 'sliders'],
  ];
  const go = useCallback((id: RunPanel) => setState({ runPanel: id }), []);
  return (
    <nav className="region tabbar" data-region="tabbar" role="tablist" aria-label={L('Bereiche', 'Areas')} data-testid="tabbar">
      {tabs.map(([id, label, icon]) => (
        <button key={id} type="button" role="tab" aria-selected={app.runPanel === id} className={`tab-${id}${app.runPanel === id ? ' on' : ''}`} onClick={() => go(id)} data-testid={`bar-${id}`}>
          <Icon name={icon} size={18} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export type { Strategy };
