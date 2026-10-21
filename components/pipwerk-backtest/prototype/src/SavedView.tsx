// Saved backtests: list, opening one, and comparing two or more side by side.
import { useMemo } from 'react';
import { LineChart } from './Chart';
import type { LineSeries } from './Chart';
import { accountName } from './data';
import { fmtDate } from './ui';
import { fmtMoney, fmtN, fmtPct } from './fmt';
import { ResultView, KEYFIGS } from './ResultView';
import { tx } from './catalog';
import { fmtTime } from './sim/market';
import { currentResult, openSaved, setMode, setState, setView, toggleCompare, useApp } from './store';
import type { SavedBacktest } from './store';
import { Btn, Icon, Info, useL } from './ui';

const COLORS = ['#1f5f9e', '#c2410c', '#15803d', '#a21caf', '#0e7490', '#b45309'];

export function SavedView() {
  const app = useApp();
  const L = useL();
  const sv = app.savedView;
  if (sv.k === 'open') {
    const r = currentResult();
    if (r) return <ResultView result={r} onBack={() => setState({ savedView: { k: 'list' } })} backLabel={L('Zur Liste', 'To the list')} />;
  }
  if (sv.k === 'compare') return <Compare />;
  return <SavedList />;
}

function SavedList() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const sel = app.compare.filter((id) => app.saved.some((s) => s.id === id));
  return (
    <section className="region page" data-region="saved" data-testid="saved" aria-label={L('Gespeicherte Backtests', 'Saved backtests')}>
      <div className="page-scroll">
        <header className="page-head">
          <h1>{L('Gespeicherte Backtests', 'Saved backtests')}</h1>
          <p className="muted">{L('Wählen Sie zwei oder mehr Backtests und vergleichen Sie sie nebeneinander mit Kennzahlen und übereinandergelegten Kontokurven.', 'Choose two or more backtests and compare them side by side with key figures and overlaid account curves.')}</p>
          <div className="btn-row">
            <Btn kind="primary" icon="compare" testid="btn-compare" disabled={sel.length < 2} onClick={() => setState({ savedView: { k: 'compare' } })} tip={L('Vergleicht die angehakten Backtests. Dafür brauchen Sie mindestens zwei.', 'Compares the ticked backtests. You need at least two.')}>
              {L(`Vergleichen (${sel.length})`, `Compare (${sel.length})`)}
            </Btn>
            {sel.length < 2 && app.saved.length > 0 && <span className="muted" data-testid="compare-hint">{L('Haken Sie mindestens zwei Backtests an.', 'Tick at least two backtests.')}</span>}
          </div>
        </header>
        {app.saved.length === 0 ? (
          <div className="empty-card flat" data-testid="saved-empty">
            <Icon name="save" size={26} />
            <h2>{L('Noch kein Backtest gespeichert', 'No backtest saved yet')}</h2>
            <p>{L('Nächster Schritt: Starten Sie einen Backtest und wählen Sie im Ergebnis „Backtest speichern“. Danach erscheint er hier.', 'Next step: start a backtest and choose "Save backtest" in the result. It then appears here.')}</p>
            <Btn kind="primary" icon="chart" testid="saved-goto-backtest" onClick={() => setMode('backtest')}>{L('Zum Backtest', 'To the backtest')}</Btn>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl saved-table" data-testid="saved-table">
              <thead>
                <tr><th /><th>{L('Name', 'Name')}</th><th>{L('Instrument', 'Instrument')}</th><th>{L('Zeitraum', 'Period')}</th><th>{L('Trades', 'Trades')}</th><th>{L('Nettogewinn', 'Net profit')}</th><th>{L('Gespeichert', 'Saved')}</th><th /></tr>
              </thead>
              <tbody>
                {app.saved.map((s) => (
                  <tr key={s.id} data-testid="saved-row" data-name={s.name} className={app.compare.includes(s.id) ? 'selected' : ''}>
                    <td><input type="checkbox" checked={app.compare.includes(s.id)} onChange={() => toggleCompare(s.id)} aria-label={L(`${s.name} zum Vergleich wählen`, `Choose ${s.name} for comparison`)} data-testid="saved-check" data-tip={L('Haken setzen, um diesen Backtest mit anderen zu vergleichen.', 'Tick to compare this backtest with others.')} /></td>
                    <td><b>{s.name}</b><div className="why">{tx(s.strategyBadge, lang)}</div></td>
                    <td>{s.instrument.id}</td>
                    <td>{s.from} – {s.to}</td>
                    <td>{s.summary.trades}</td>
                    <td className={s.summary.net >= 0 ? 'pos' : 'neg'}>{s.summary.net > 0 ? '+' : ''}{fmtMoney(s.summary.net, s.account.currency, lang)}</td>
                    <td>{fmtDate(s.savedAt, lang)}</td>
                    <td className="actions">
                      <Btn small icon="eye" testid="saved-open" onClick={() => openSaved(s.id)}>{L('Öffnen', 'Open')}</Btn>
                      <Btn small kind="quiet" icon="trash" title={L('Löschen', 'Delete')} testid="saved-delete" onClick={() => setState({ dialog: { k: 'deleteSaved', id: s.id } })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Compare() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const list: SavedBacktest[] = app.compare.map((id) => app.saved.find((s) => s.id === id)).filter((s): s is SavedBacktest => !!s);
  const series: LineSeries[] = useMemo(() => list.map((s, i) => {
    const t0 = s.equity.length ? s.equity[0].t : 0;
    return { id: s.id, name: s.name, color: COLORS[i % COLORS.length], pts: s.equity.map((p) => ({ x: (p.t - t0) / 86400000, y: p.eq })) };
  }), [list]);
  const rows = list.map((s) => KEYFIGS(s.summary, s.account.currency, lang, L));
  const best = (id: string, higher: boolean): number => {
    const vals = list.map((s) => {
      const sm = s.summary;
      switch (id) {
        case 'net': return sm.net;
        case 'hit': return sm.hitRate ?? -Infinity;
        case 'pf': return sm.profitFactor ?? -Infinity;
        case 'dd': return -sm.maxDd;
        case 'avgwin': return sm.avgWin ?? -Infinity;
        case 'avgloss': return sm.avgLoss ?? -Infinity;
        default: return 0;
      }
    });
    const target = higher ? Math.max(...vals) : Math.min(...vals);
    return vals.indexOf(target);
  };
  const bestIds = ['net', 'hit', 'pf', 'dd', 'avgwin', 'avgloss'];
  return (
    <div className="compare" data-testid="compare">
      <header className="region res-bar" data-region="bar">
        <div className="res-title">
          <h1>{L('Vergleich gespeicherter Backtests', 'Comparison of saved backtests')}</h1>
          <p className="muted">{L(`${list.length} Backtests nebeneinander`, `${list.length} backtests side by side`)}</p>
        </div>
        <div className="run-controls"><Btn kind="ghost" icon="left" testid="compare-back" onClick={() => setState({ savedView: { k: 'list' } })}>{L('Zur Liste', 'To the list')}</Btn></div>
      </header>
      <section className="region cmp-chart" data-region="compare-chart" data-testid="compare-chart" aria-label={L('Kontokurven', 'Account curves')}>
        <LineChart
          testid="chart-compare" title={L('Kontokurven übereinandergelegt (Tage seit Beginn des jeweiligen Testzeitraums)', 'Account curves overlaid (days since the start of each test period)')} lang={lang} series={series}
          xFmt={(v) => `${fmtN(v, 0, lang)} ${L('Tage', 'days')}`} yFmt={(v) => fmtN(v, 0, lang)}
        />
        <ul className="cmp-legend" data-testid="compare-legend">
          {list.map((s, i) => <li key={s.id}><span className="lg-sw" style={{ background: COLORS[i % COLORS.length] }} />{s.name}</li>)}
        </ul>
      </section>
      <section className="region cmp-table" data-region="compare-table" data-testid="compare-table" aria-label={L('Kennzahlen im Vergleich', 'Key figures compared')}>
        <div className="tbl-wrap">
          <table className="tbl cmp" data-testid="cmp-table">
            <thead>
              <tr>
                <th />
                {list.map((s, i) => (
                  <th key={s.id} style={{ borderTop: `3px solid ${COLORS[i % COLORS.length]}` }} data-testid="cmp-head">
                    <div>{s.name}</div>
                    <Btn small kind="ghost" icon="file" testid="cmp-view-strategy" onClick={() => setState({ dialog: { k: 'strategy', savedId: s.id } })} tip={L('Zeigt die getestete Fassung der Strategie, nur zum Ansehen.', 'Shows the tested version of the strategy, view only.')}>{L('Getestete Fassung', 'Tested version')}</Btn>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th>{L('Strategie', 'Strategy')}</th>{list.map((s) => <td key={s.id}>{s.strategy.name}<div className="why">{tx(s.strategyBadge, lang)}</div></td>)}</tr>
              <tr><th>{L('Instrument', 'Instrument')}</th>{list.map((s) => <td key={s.id}>{s.instrument.id}</td>)}</tr>
              <tr><th>{L('Testzeitraum', 'Test period')}</th>{list.map((s) => <td key={s.id}>{s.from} – {s.to}</td>)}</tr>
              <tr><th>{L('Testkonto', 'Test account')}</th>{list.map((s) => <td key={s.id}>{accountName(s.account, lang)}<div className="why">{fmtMoney(s.startCapital, s.account.currency, lang, 0)}, 1:{s.account.leverage}</div></td>)}</tr>
              <tr><th>{L('Strategieparameter', 'Strategy parameters')}</th>{list.map((s) => <td key={s.id} className="small">{s.strategy.params.map((p) => `${p.name}: ${String(s.params[p.id] ?? p.value).toUpperCase() === String(s.params[p.id] ?? p.value).toUpperCase() && p.dtype === 'time_unit' ? String(s.params[p.id] ?? p.value).toUpperCase() : String(s.params[p.id] ?? p.value)}`).join(' · ')}</td>)}</tr>
              {rows[0]?.map((f, ri) => (
                <tr key={f.id} data-testid={`cmp-${f.id}`}>
                  <th data-tip={f.tip}>{f.label}<Info tip={f.tip} /></th>
                  {rows.map((r, ci) => {
                    const isBest = bestIds.includes(f.id) && best(f.id, true) === ci && list.length > 1;
                    return <td key={list[ci].id} className={`${r[ri].cls}${isBest ? ' best' : ''}`} data-testid="cmp-value" data-best={isBest ? '1' : '0'}>{r[ri].value}{isBest && <span className="best-tag">{L('beste', 'best')}</span>}</td>;
                  })}
                </tr>
              ))}
              <tr><th>{L('Abgelehnte Orders', 'Rejected orders')}</th>{list.map((s) => <td key={s.id}>{fmtN(s.rejectedTotal, 0, lang)}</td>)}</tr>
              <tr><th>{L('Endstand', 'Final balance')}</th>{list.map((s) => <td key={s.id}>{fmtMoney(s.summary.endBalance, s.account.currency, lang)}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </section>
      <span hidden>{fmtPct(0, lang)}{fmtTime(0, lang)}{setView.name}</span>
    </div>
  );
}
