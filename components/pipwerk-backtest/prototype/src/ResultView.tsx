// Backtest: progress and result (account curve with drawdown, trades, key figures, chart with markers).
import { useMemo } from 'react';
import { CandleChart, LineChart } from './Chart';
import type { ChartTrade } from './Chart';
import { fmtMoney, fmtN, fmtPct } from './fmt';
import { tx } from './catalog';
import { accountName, brokerName } from './data';
import type { Lang } from './model';
import { drawdownSeries } from './sim/engine';
import type { Summary } from './sim/engine';
import { fmtTime, seriesFor, parseIsoDate } from './sim/market';
import { Btn, Icon, Info, useL } from './ui';
import { backToPrepare, cancelBacktest, entryOf, setState, useApp } from './store';
import type { BtResult, ResPanel } from './store';

export function BtProgress() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const pr = app.bt?.progress;
  const pct = pr ? Math.round((pr.done / pr.total) * 100) : 0;
  const cur = app.prep.acc.currency;
  return (
    <section className="region bt-progress" data-region="progress" data-testid="bt-progress" aria-label={L('Fortschritt des Backtests', 'Progress of the backtest')}>
      <div className="progress-card">
        <Icon name="chart" size={30} />
        <h1>{L('Der Backtest läuft', 'The backtest is running')}</h1>
        <p className="muted">{L('Die Strategie läuft ohne Unterbrechung über den Testzeitraum. Sie können abbrechen; dabei wird nichts gespeichert.', 'The strategy runs without interruption over the test period. You can cancel; nothing is saved then.')}</p>
        <div className="progress big" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} data-testid="bt-bar"><span style={{ width: `${pct}%` }} /></div>
        <p className="progress-facts" data-testid="bt-facts">
          <b>{pct} %</b>
          <span>{pr ? fmtTime(pr.t, lang, false) : '–'}</span>
          <span>{pr ? pr.trades : 0} {L('Trades', 'trades')}</span>
          <span>{pr ? fmtMoney(pr.equity, cur, lang, 0) : '–'}</span>
        </p>
        <Btn icon="stop" kind="danger" testid="btn-cancel" onClick={cancelBacktest}>{L('Abbrechen', 'Cancel')}</Btn>
      </div>
    </section>
  );
}

export const KEYFIGS = (sm: Summary, cur: string, lang: Lang, L: (d: string, e: string) => string) => [
  { id: 'net', label: L('Nettogewinn', 'Net profit'), value: `${sm.net > 0 ? '+' : ''}${fmtMoney(sm.net, cur, lang)}`, cls: sm.net >= 0 ? 'pos' : 'neg', tip: L('Endstand des Kontos minus Anfangskapital, nach Spread und Kommission.', 'Final balance of the account minus initial capital, after spread and commission.') },
  { id: 'trades', label: L('Anzahl der Trades', 'Number of trades'), value: fmtN(sm.trades, 0, lang), cls: '', tip: L('Wie viele Positionen eröffnet und wieder geschlossen wurden.', 'How many positions were opened and closed again.') },
  { id: 'hit', label: L('Trefferquote', 'Hit rate'), value: fmtPct(sm.hitRate, lang), cls: '', tip: L('Anteil der Trades mit Gewinn.', 'Share of the trades with a profit.') },
  { id: 'pf', label: L('Gewinn zu Verlust', 'Profit to loss'), value: sm.profitFactor === null ? '–' : sm.profitFactor === Infinity ? '∞' : fmtN(sm.profitFactor, 2, lang), cls: '', tip: L('Gesamtgewinn geteilt durch Gesamtverlust. Über 1 heißt: die Gewinne waren größer als die Verluste.', 'Total profit divided by total loss. Above 1 means the profits were larger than the losses.') },
  { id: 'dd', label: L('Größter Rückgang', 'Largest drawdown'), value: `${fmtMoney(sm.maxDd, cur, lang, 0)} (${fmtPct(sm.maxDdPct, lang)})`, cls: 'neg', tip: L('Der größte Rückgang des Kontos vom jeweils letzten Höchststand.', 'The largest decline of the account from the most recent peak.') },
  { id: 'avgwin', label: L('Ø Gewinn je Trade', 'Avg. win per trade'), value: sm.avgWin === null ? '–' : fmtMoney(sm.avgWin, cur, lang), cls: 'pos', tip: L('Durchschnittlicher Gewinn der Gewinn-Trades.', 'Average profit of the winning trades.') },
  { id: 'avgloss', label: L('Ø Verlust je Trade', 'Avg. loss per trade'), value: sm.avgLoss === null ? '–' : fmtMoney(sm.avgLoss, cur, lang), cls: 'neg', tip: L('Durchschnittlicher Verlust der Verlust-Trades.', 'Average loss of the losing trades.') },
];

export function ResultView({ result, onBack, backLabel }: { result: BtResult; onBack: () => void; backLabel: string }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const cur = result.account.currency;
  const digits = result.instrument.digits;
  const from = parseIsoDate(result.from);
  const to = parseIsoDate(result.to);
  const series = useMemo(() => seriesFor(result.instrument.id, result.tf, from, to, result.broker), [result.instrument.id, result.tf, from, to, result.broker]);
  const sel = app.selTrade;
  const selTrade = result.trades.find((t) => t.id === sel) ?? null;
  const focus = selTrade ?? result.trades[0] ?? null;
  const eq = useMemo(() => result.equity.map((p) => ({ x: p.t, y: p.eq })), [result.equity]);
  const dd = useMemo(() => drawdownSeries(result.equity, result.startCapital).map((p) => ({ x: p.t, y: -p.dd })), [result.equity, result.startCapital]);
  const tradesForChart: ChartTrade[] = useMemo(() => result.trades.map((t) => ({
    id: t.id, dir: t.dir, openT: t.openT, closeT: t.closeT, entry: t.entry, exit: t.exit, profit: t.profit, selected: t.id === sel,
  })), [result.trades, sel]);
  const figs = KEYFIGS(result.summary, cur, lang, L);
  const e = entryOf(result.strategy.id);
  const tab = app.resPanel;
  const setTab = (id: ResPanel) => setState({ resPanel: id });
  const tabs: [ResPanel, string, string][] = [
    ['summary', L('Kennzahlen', 'Key figures'), 'list'], ['curve', L('Kurve', 'Curve'), 'wave'], ['trades', L('Trades', 'Trades'), 'order'], ['chart', L('Chart', 'Chart'), 'chart'],
  ];
  return (
    <div className="result" data-panel={tab} data-testid="result">
      <header className="region res-bar" data-region="bar" data-testid="result-bar">
        <div className="res-title">
          <h1 data-testid="result-title">{result.name}</h1>
          <p className="muted">
            {tx(result.strategyBadge, lang)} · {result.instrument.id} · {result.from} – {result.to} · {accountName(result.account, lang)} · {brokerName(result.broker)}
          </p>
        </div>
        <div className="run-controls">
          {result.savedId
            ? <span className="rs-chip saved" data-testid="saved-tag"><Icon name="check" size={13} />{L('gespeichert', 'saved')}</span>
            : <Btn kind="primary" icon="save" testid="btn-save-bt" onClick={() => setState({ dialog: { k: 'saveBt' } })} tip={L('Ein Backtest wird nur gespeichert, wenn Sie es verlangen. Gespeichert werden die getestete Strategie, die Werte, das Ergebnis und die Trades.', 'A backtest is only saved when you ask for it. The tested strategy, the values, the result and the trades are saved.')}>{L('Backtest speichern', 'Save backtest')}</Btn>}
          <Btn icon="file" testid="btn-view-strategy" onClick={() => setState({ dialog: { k: 'strategy' } })} tip={L('Zeigt die getestete Fassung der Strategie wie im Strategiedesigner, nur zum Ansehen.', 'Shows the tested version of the strategy as in the strategy designer, view only.')}>{L('Getestete Fassung ansehen', 'View tested version')}</Btn>
          <Btn kind="ghost" icon="left" testid="btn-back" onClick={onBack}>{backLabel}</Btn>
        </div>
      </header>

      <section className="region res-summary" data-region="summary" data-testid="summary" aria-label={L('Kennzahlen', 'Key figures')}>
        <div className="figs">
          {figs.map((f) => (
            <div key={f.id} className={`fig ${f.cls}`} data-testid={`fig-${f.id}`} data-tip={f.tip}>
              <span className="fig-label">{f.label}</span>
              <b className="fig-value" data-testid="fig-value">{f.value}</b>
            </div>
          ))}
          <div className="fig" data-testid="fig-rejected" data-tip={L('Wie oft die interne Abwicklung eine Order wie ein Broker abgelehnt hat. Die Liste mit Gründen steht bei den Trades.', 'How often the internal settlement rejected an order like a broker. The list with reasons is next to the trades.')}>
            <span className="fig-label">{L('Abgelehnte Orders', 'Rejected orders')}</span>
            <b className="fig-value">{fmtN(result.rejectedTotal, 0, lang)}</b>
          </div>
        </div>
        <p className="muted res-meta">
          {L('Anfangskapital', 'Initial capital')} {fmtMoney(result.startCapital, cur, lang, 0)} · {L('Endstand', 'Final balance')} {fmtMoney(result.summary.endBalance, cur, lang)} · {L('Strategie', 'Strategy')} {e.strategy.name}
        </p>
      </section>

      <section className="region res-curve" data-region="curve" data-testid="curve" aria-label={L('Kontoentwicklung', 'Account development')}>
        <div className="curve-stack">
          <LineChart
            testid="chart-equity" title={L('Kontoentwicklung', 'Account development')} lang={lang} series={[{ id: 'eq', name: L('Konto', 'Account'), color: '#1f5f9e', pts: eq }]}
            xFmt={(v) => fmtTime(v, lang, false)} yFmt={(v) => fmtN(v, 0, lang)} baseline={result.startCapital} markX={selTrade ? selTrade.closeT : null}
          />
          <LineChart
            testid="chart-drawdown" title={L('Rückgang vom Höchststand', 'Drawdown from the peak')} lang={lang} series={[{ id: 'dd', name: L('Rückgang', 'Drawdown'), color: '#c2271d', pts: dd }]}
            xFmt={(v) => fmtTime(v, lang, false)} yFmt={(v) => fmtN(v, 0, lang)} area zeroTop markX={selTrade ? selTrade.closeT : null}
          />
        </div>
      </section>

      <section className="region res-trades" data-region="trades" data-testid="trades" aria-label={L('Trades', 'Trades')}>
        <TradesPanel result={result} />
      </section>

      <section className="region res-chart" data-region="chart" data-testid="result-chart" aria-label={L('Chart mit Trades', 'Chart with trades')}>
        <CandleChart
          series={series} digits={digits} lang={lang} title={result.instrument.id} now={null} trades={tradesForChart}
          focusKey={sel ?? -1} focusT={focus ? focus.openT : null} testid="chart-trades"
          onSelectTrade={(id) => setState({ selTrade: id })}
        />
        <p className="chart-hint muted">{L('Pfeile: Eröffnung, Kreise: Schließung, Linie dazwischen: grün bei Gewinn, rot bei Verlust. Klick auf einen Trade in der Liste zeigt seine Stelle.', 'Arrows: opening, circles: closing, line between: green for profit, red for loss. A click on a trade in the list shows its place.')}</p>
      </section>

      <nav className="region tabbar" data-region="tabbar" role="tablist" aria-label={L('Bereiche', 'Areas')} data-testid="tabbar">
        {tabs.map(([id, label, icon]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)} data-testid={`bar-${id}`}>
            <Icon name={icon} size={18} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function TradesPanel({ result }: { result: BtResult }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const cur = result.account.currency;
  const digits = result.instrument.digits;
  const tab = app.tradesTab;
  const setTab = (t: 'trades' | 'rej') => setState({ tradesTab: t });
  const shownRej = app.rejectedShown;
  const reasonText: Record<string, string> = { sl: 'Stop-Loss', tp: 'Take-Profit', strategy: L('Strategie', 'Strategy'), end: L('Testende', 'End of test') };
  return (
    <div className="trades-panel">
      <div className="seg tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'trades'} className={tab === 'trades' ? 'on' : ''} onClick={() => setTab('trades')} data-testid="tab-trades">{L('Trades', 'Trades')} ({result.trades.length})</button>
        <button type="button" role="tab" aria-selected={tab === 'rej'} className={tab === 'rej' ? 'on' : ''} onClick={() => setTab('rej')} data-testid="tab-rejected">{L('Abgelehnte Orders', 'Rejected orders')} ({result.rejectedTotal})</button>
        <Info tip={L('Die interne Abwicklung verhält sich wie ein Broker. Eine Order, die ein Broker ablehnen würde, wird abgelehnt; der Grund steht in der Liste.', 'The internal settlement behaves like a broker. An order a broker would reject is rejected; the reason is in the list.')} />
      </div>
      {tab === 'trades' ? (
        result.trades.length === 0 ? (
          <p className="empty-note" data-testid="no-trades">{L('Die Strategie hat in diesem Zeitraum keinen Trade eröffnet. Nächster Schritt: Sehen Sie bei „Abgelehnte Orders“ nach, warum, oder ändern Sie Zeitraum oder Strategieparameter.', 'The strategy opened no trade in this period. Next step: look at "Rejected orders" to see why, or change the period or strategy parameters.')}</p>
        ) : (
          <div className="tbl-wrap grow">
            <table className="tbl trade-table" data-testid="trade-table">
              <thead>
                <tr>
                  <th>#</th><th>{L('Richtung', 'Direction')}</th><th>{L('Volumen', 'Volume')}</th><th>{L('Eröffnung', 'Opened')}</th><th>{L('Preis', 'Price')}</th><th>{L('Schließung', 'Closed')}</th><th>{L('Preis', 'Price')}</th>
                  <th>{L('Grund', 'Reason')}</th><th>{L('Gewinn/Verlust', 'Profit/loss')}</th><th>{L('Kosten', 'Costs')}</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.map((t) => (
                  <tr key={t.id} className={app.selTrade === t.id ? 'selected' : ''} onClick={() => setState({ selTrade: t.id })} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setState({ selTrade: t.id }); }} data-testid="trade-row" data-trade={t.id} aria-selected={app.selTrade === t.id}>
                    <td>{t.id}</td>
                    <td>{t.dir === 'buy' ? L('Kauf', 'Buy') : L('Verkauf', 'Sell')}</td>
                    <td>{fmtN(t.vol, 2, lang)}</td>
                    <td>{fmtTime(t.openT, lang)}</td>
                    <td>{fmtN(t.entry, digits, lang)}</td>
                    <td>{fmtTime(t.closeT, lang)}</td>
                    <td>{fmtN(t.exit, digits, lang)}</td>
                    <td>{reasonText[t.reason]}</td>
                    <td className={t.profit >= 0 ? 'pos' : 'neg'}>{t.profit > 0 ? '+' : ''}{fmtN(t.profit, 2, lang)}</td>
                    <td>{fmtN(t.cost, 2, lang)} {cur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : result.rejectedTotal === 0 ? (
        <p className="empty-note" data-testid="no-rejected">{L('Keine Order wurde abgelehnt. Nächster Schritt: Wechseln Sie zu „Trades“.', 'No order was rejected. Next step: switch to "Trades".')}</p>
      ) : (
        <div className="tbl-wrap grow">
          <table className="tbl" data-testid="rejected-table">
            <thead><tr><th>{L('Zeitpunkt', 'Time')}</th><th>{L('Element', 'Element')}</th><th>{L('Richtung', 'Direction')}</th><th>{L('Grund der Ablehnung', 'Reason for the rejection')}</th></tr></thead>
            <tbody>
              {result.rejections.slice(0, shownRej).map((r, i) => (
                <tr key={i} data-testid="rejected-row">
                  <td>{fmtTime(r.t, lang)}</td><td>{r.elName}</td><td>{r.dir === null ? '–' : r.dir === 'buy' ? L('Kauf', 'Buy') : L('Verkauf', 'Sell')}</td><td>{tx(r.reason, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.rejections.length > shownRej && (
            <Btn small kind="ghost" testid="rejected-more" onClick={() => setState({ rejectedShown: shownRej + 200 })}>{L(`Weitere anzeigen (${result.rejections.length - shownRej})`, `Show more (${result.rejections.length - shownRej})`)}</Btn>
          )}
          {result.rejectedTotal > result.rejections.length && <p className="muted">{L(`Gespeichert und gezeigt werden die ersten ${result.rejections.length} von ${result.rejectedTotal} Ablehnungen.`, `The first ${result.rejections.length} of ${result.rejectedTotal} rejections are stored and shown.`)}</p>}
        </div>
      )}
      <span hidden>{digits}{backToPrepare.name}</span>
    </div>
  );
}
