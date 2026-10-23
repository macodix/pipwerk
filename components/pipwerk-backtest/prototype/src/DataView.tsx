// Data stock of historical price data: a bar with the import and the broker for test runs, a compact table with
// one line per series (filterable, paged), and the details of a series after a click. All of it is simulated.
import { Fragment, useMemo, useState } from 'react';
import { TIME_UNITS } from './catalog';
import { brokerName, dataLabel, fmtRange, hasContract, stockBrokers, stockLines } from './data';
import type { Kind, StockLine } from './data';
import { fmtN } from './fmt';
import { Field } from './fields';
import { INSTRUMENTS, instrumentInfo } from './sim/market';
import { setState, setTestBroker, useApp } from './store';
import { Btn, Icon, Select, useL } from './ui';

const PAGE = 10;

const dataKey = (kind: Kind, tf: string | null) => (kind === 'candles' ? `candles:${tf}` : kind);

export function DataView() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const lines = useMemo(() => stockLines(app.rows), [app.rows]);
  const brokers = stockBrokers(app.rows);
  const [fb, setFb] = useState('');
  const [fi, setFi] = useState('');
  const [fd, setFd] = useState('');
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string | null>(null);

  const instruments = INSTRUMENTS.map((i) => i.id).filter((id) => lines.some((l) => l.instrument === id));
  const datas = [
    ...TIME_UNITS.map((u) => ({ key: `candles:${u.id}`, kind: 'candles' as Kind, tf: u.id })),
    { key: 'ticks', kind: 'ticks' as Kind, tf: null },
    { key: 'contract', kind: 'contract' as Kind, tf: null },
  ].filter((d) => lines.some((l) => dataKey(l.kind, l.tf) === d.key));
  const shown = lines.filter((l) => (!fb || l.broker === fb) && (!fi || l.instrument === fi) && (!fd || dataKey(l.kind, l.tf) === fd));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const part = shown.slice(cur * PAGE, cur * PAGE + PAGE);
  const filtered = !!(fb || fi || fd);
  const onFilter = (set: (v: string) => void) => (v: string) => { set(v); setPage(0); setSel(null); };
  const toggle = (key: string) => setSel(sel === key ? null : key);

  return (
    <section className="region page" data-region="data" data-testid="data" aria-label={L('Datenbestand', 'Data stock')}>
      <div className="page-scroll">
        <header className="page-head">
          <h1>{L('Datenbestand', 'Data stock')}</h1>
          <p className="muted">{L('Die historischen Kursdaten, aus denen die Testläufe lesen.', 'The historical price data the test runs read from.')}</p>
        </header>

        <section className="card-box wide" data-testid="data-bar">
          <div className="data-bar">
            <Btn kind="primary" icon="upload" testid="import-open" onClick={() => setState({ dialog: { k: 'import' } })}
              tip={L('Öffnet den Dialog, in dem Sie Dateien im Format JSON oder CSV wählen und importieren.', 'Opens the dialog in which you choose files in JSON or CSV format and import them.')}>
              {L('Datei importieren …', 'Import file …')}
            </Btn>
            <Field label={L('Broker für Testläufe', 'Broker for test runs')} tip={L('Der Broker, dessen Kursdaten ein Testlauf standardmäßig liest. In der Vorbereitung eines Testlaufs ist er vorbelegt und lässt sich dort für einen Testlauf ändern. Zur Wahl stehen die Broker, die im Datenbestand vorkommen.', 'The broker whose price data a test run reads by default. It is preset in the preparation of a test run and can be changed there for one test run. You can choose among the brokers that occur in the data stock.')} testid="field-test-broker">
              <Select value={app.testBroker} onChange={setTestBroker} ariaLabel={L('Broker für Testläufe', 'Broker for test runs')} testid="select-test-broker">
                {brokers.map((b) => <option key={b} value={b}>{brokerName(b)}</option>)}
              </Select>
            </Field>
          </div>
        </section>

        <section className="card-box wide" data-testid="stock">
          <h2><Icon name="database" size={16} />{L('Datenreihen', 'Data series')}</h2>
          {lines.length === 0 ? (
            <p className="empty-note" data-testid="stock-empty">{L('Noch keine Kursdaten. Importieren Sie Dateien mit „Datei importieren …“.', 'No price data yet. Import files with "Import file …".')}</p>
          ) : (
            <>
              <div className="data-filters" data-testid="stock-filters">
                <Field label={L('Broker', 'Broker')} tip={L('Zeigt nur die Reihen dieses Brokers.', 'Shows only the series of this broker.')} testid="field-filter-broker">
                  <Select value={fb} onChange={onFilter(setFb)} ariaLabel={L('Filter Broker', 'Filter broker')} testid="filter-broker">
                    <option value="">{L('alle', 'all')}</option>
                    {brokers.map((b) => <option key={b} value={b}>{brokerName(b)}</option>)}
                  </Select>
                </Field>
                <Field label={L('Instrument', 'Instrument')} tip={L('Zeigt nur die Reihen dieses Instruments.', 'Shows only the series of this instrument.')} testid="field-filter-instrument">
                  <Select value={fi} onChange={onFilter(setFi)} ariaLabel={L('Filter Instrument', 'Filter instrument')} testid="filter-instrument">
                    <option value="">{L('alle', 'all')}</option>
                    {instruments.map((id) => <option key={id} value={id}>{id}</option>)}
                  </Select>
                </Field>
                <Field label={L('Daten', 'Data')} tip={L('Zeigt nur Reihen dieser Art: Kerzen einer Zeiteinheit, Ticks oder Kontraktdaten.', 'Shows only series of this kind: candles of a time unit, ticks or contract data.')} testid="field-filter-data">
                  <Select value={fd} onChange={onFilter(setFd)} ariaLabel={L('Filter Daten', 'Filter data')} testid="filter-data">
                    <option value="">{L('alle', 'all')}</option>
                    {datas.map((d) => <option key={d.key} value={d.key}>{dataLabel(d.kind, d.tf, lang)}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="tbl-wrap stock-table-wrap">
                <table className="tbl stock-table" data-testid="stock-table">
                  <thead>
                    <tr>
                      <th>{L('Broker', 'Broker')}</th><th>{L('Instrument', 'Instrument')}</th><th>{L('Daten', 'Data')}</th><th>{L('Zeitraum', 'Period')}</th><th className="num">{L('Lücken', 'Gaps')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {part.map((l) => (
                      <Fragment key={l.key}>
                        <tr
                          data-testid="stock-row" data-broker={l.broker} data-instrument={l.instrument} data-kind={l.kind} data-tf={l.tf ?? ''} data-gaps={l.span ? l.gaps.length : ''}
                          tabIndex={0} aria-expanded={sel === l.key} onClick={() => toggle(l.key)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(l.key); } }}
                          data-tip={L('Klicken zeigt die Einzelheiten dieser Reihe.', 'Click to show the details of this series.')}
                        >
                          <td>{brokerName(l.broker)}</td>
                          <td><b>{l.instrument}</b></td>
                          <td className="nowrap">{dataLabel(l.kind, l.tf, lang)}</td>
                          <td>{l.span ? fmtRange(l.span, lang) : '–'}</td>
                          <td className="num">{l.span ? fmtN(l.gaps.length, 0, lang) : '–'}</td>
                        </tr>
                        {sel === l.key && (
                          <tr className="detail-row" data-testid="stock-detail-row"><td colSpan={5}><Detail line={l} /></td></tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {shown.length === 0 && <p className="empty-note" data-testid="stock-nomatch">{L('Keine Reihe passt zum Filter. Wählen Sie bei einem Filter „alle“.', 'No series matches the filter. Choose "all" in a filter.')}</p>}
              <div className="pager" data-testid="stock-pager">
                <span className="muted" data-testid="stock-count">
                  {shown.length === 0 ? '0' : `${cur * PAGE + 1}–${cur * PAGE + part.length}`} {L('von', 'of')} {shown.length}{filtered ? ` ${L('Reihen (gefiltert)', 'series (filtered)')}` : ` ${L('Reihen', 'series')}`}
                </span>
                <div className="btn-row">
                  <Btn small icon="left" testid="page-prev" disabled={cur === 0} onClick={() => { setPage(cur - 1); setSel(null); }}>{L('Zurück', 'Previous')}</Btn>
                  <span className="muted" data-testid="page-no">{L('Seite', 'Page')} {cur + 1} {L('von', 'of')} {pages}</span>
                  <Btn small icon="right" testid="page-next" disabled={cur >= pages - 1} onClick={() => { setPage(cur + 1); setSel(null); }}>{L('Weiter', 'Next')}</Btn>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}

/** The details of a series: all gaps with start and end, and the contract data of the instrument at this broker. */
function Detail({ line }: { line: StockLine }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const has = hasContract(app.rows, line.broker, line.instrument);
  const x = instrumentInfo(line.instrument, line.broker);
  const d = x.digits;
  const items: [string, string, string, string][] = [
    [L('Tickgröße', 'Tick size'), fmtN(x.tickgroesse, d, lang), L('Kleinste Kursänderung des Instruments.', 'Smallest price change of the instrument.'), 'tickgroesse'],
    [L('Tickwert', 'Tick value'), fmtN(x.tickwert, 2, lang), L('Wert einer Kursänderung um einen Tick bei einem Lot, in Kontowährung.', 'Value of a price change by one tick for one lot, in account currency.'), 'tickwert'],
    [L('Pip', 'Pip'), fmtN(x.pip, d - 1, lang), L('Ein Pip als Kursdifferenz. Puffer und Abstände der Strategien sind oft in Pips angegeben.', 'One pip as price difference. Buffers and distances of strategies are often given in pips.'), 'pip'],
    [L('Punkt', 'Point'), fmtN(x.punkt, d, lang), L('Ein Punkt als Kursdifferenz.', 'One point as price difference.'), 'punkt'],
    [L('Spread', 'Spread'), fmtN(x.spread, d, lang), L('Üblicher Abstand zwischen Brief- und Geldkurs.', 'Usual distance between ask and bid.'), 'spread'],
    [L('Mindestvolumen', 'Minimum volume'), fmtN(x.mindestvolumen, 2, lang), L('Kleinstes handelbares Volumen in Lot.', 'Smallest tradable volume in lots.'), 'mindestvolumen'],
    [L('Volumenschritt', 'Volume step'), fmtN(x.volumenschritt, 2, lang), L('Kleinste Stufe, in der sich das Volumen ändern lässt.', 'Smallest step in which the volume can change.'), 'volumenschritt'],
    [L('Kontraktgröße', 'Contract size'), fmtN(x.kontraktgroesse, 0, lang), L('Wie viele Einheiten ein Lot umfasst, zum Beispiel 100.000 Euro bei EURUSD.', 'How many units one lot contains, for example 100,000 euros for EURUSD.'), 'kontraktgroesse'],
    [L('Swap Kauf / Verkauf', 'Swap long / short'), `${fmtN(x.swapLong, 1, lang)} / ${fmtN(x.swapShort, 1, lang)}`, L('Gebühr oder Ertrag für eine über Nacht gehaltene Position.', 'Fee or income for a position held overnight.'), 'swap'],
    [L('Margin-Anforderung (%)', 'Margin requirement (%)'), fmtN(x.margin, 2, lang), L('Anteil des Positionswerts, der als Sicherheit gebunden wird.', 'Share of the position value tied up as collateral.'), 'margin'],
  ];
  return (
    <div className="detail" data-testid="stock-detail">
      <h3>{brokerName(line.broker)} · {line.instrument} · {dataLabel(line.kind, line.tf, lang)}</h3>
      <div className="detail-cols">
        {line.span && (
          <div data-testid="detail-gaps">
            <h3>{L('Lücken', 'Gaps')}</h3>
            {line.gaps.length === 0 ? (
              <p className="muted" data-testid="gaps-none">{L('Keine Lücken.', 'No gaps.')}</p>
            ) : (
              <ul className="gap-list">
                {line.gaps.map((g) => <li key={g.from} data-testid="gap-item">{fmtRange(g, lang)}</li>)}
              </ul>
            )}
          </div>
        )}
        <div data-testid="detail-contract">
          <h3>{L('Kontraktdaten', 'Contract data')}</h3>
          {has ? (
            <dl className="contract-list">
              {items.map(([label, value, tip, id]) => (
                <Fragment key={id}><dt data-tip={tip}>{label}</dt><dd data-testid={`contract-${id}`}>{value}</dd></Fragment>
              ))}
            </dl>
          ) : (
            <p className="muted" data-testid="contract-missing">
              {L('Für dieses Instrument liegen bei diesem Broker keine Kontraktdaten vor. Ein Testlauf mit diesem Instrument startet dann nicht. Importieren Sie sie mit „Datei importieren …“.', 'There is no contract data for this instrument at this broker. A test run with this instrument does not start then. Import it with "Import file …".')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
