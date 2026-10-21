// Data stock of historical price data: overview, instrument details per broker, import of a file by hand
// with check and result, and procurement by hand. All of it is simulated.
import { useState } from 'react';
import { tx } from './catalog';
import { BROKERS, DAY, INSTRUMENTS, LAST_DAY, instrumentInfo, isoDate, parseIsoDate } from './sim/market';
import { addDataRows, toast, useApp } from './store';
import { addRows, brokerName, classifyNeed, countOf, fmtRange, stockLines, tradingDays } from './data';
import type { DataRow, Kind, Need, NeedResult } from './data';
import { fmtN } from './fmt';
import { TIME_UNITS } from './catalog';
import { Field } from './fields';
import { Btn, Icon, Select, useL } from './ui';
import type { Lang } from './model';

const SAMPLE_NAME = 'EURUSD_M15_2024-10-21_2025-03-02.csv';

interface ImportCheck {
  name: string;
  size: number;
  format: 'csv' | 'json' | null;
  instrument: string;
  kind: Kind;
  tf: string;
  from: string;
  to: string;
  rows: number;
  bad: number;
  dup: number;
  ok: boolean;
  done: { added: number; skipped: number } | null;
}

function guess(name: string): { instrument: string; kind: Kind; tf: string; from: string; to: string } {
  const up = name.toUpperCase();
  const instrument = INSTRUMENTS.find((i) => up.includes(i.id))?.id ?? 'EURUSD';
  const kind: Kind = up.includes('TICK') ? 'ticks' : 'candles';
  const tf = TIME_UNITS.find((u) => up.split(/[^A-Z0-9]+/).includes(u.id.toUpperCase()))?.id ?? 'h1';
  const dates = name.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  return { instrument, kind, tf, from: dates[0] ?? '2024-10-01', to: dates[1] ?? isoDate(LAST_DAY) };
}

export function DataView() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const lines = stockLines(app.rows);
  const [imp, setImp] = useState<ImportCheck | null>(null);
  const [broker, setBroker] = useState('b1');

  const check = (name: string, size: number) => {
    const ext = name.toLowerCase().endsWith('.json') ? 'json' : name.toLowerCase().endsWith('.csv') ? 'csv' : null;
    const g = guess(name);
    const days = tradingDays({ from: parseIsoDate(g.from), to: parseIsoDate(g.to) });
    const rows = g.kind === 'ticks' ? Math.round(size / 36) : Math.max(1, Math.round(size / 52));
    const have = app.rows.filter((r) => r.broker === 'b1' && r.instrument === g.instrument && r.kind === g.kind && (g.kind === 'ticks' || r.tf === g.tf));
    const overlap = have.some((r) => parseIsoDate(r.from) <= parseIsoDate(g.to) && parseIsoDate(r.to) >= parseIsoDate(g.from));
    setImp({
      name, size, format: ext, ...g, rows, bad: ext ? size % 3 : 0, dup: overlap ? Math.round(rows * 0.04) : 0, ok: ext !== null && days > 0, done: null,
    });
  };

  return (
    <section className="region page" data-region="data" data-testid="data" aria-label={L('Datenbestand historischer Kursdaten', 'Data stock of historical price data')}>
      <div className="page-scroll">
        <header className="page-head">
          <h1>{L('Datenbestand historischer Kursdaten', 'Data stock of historical price data')}</h1>
          <p className="muted">{L('Der Strategietester liest Kursdaten nur aus diesem Datenbestand. Hier sehen Sie, was vorliegt, und können Dateien von Hand importieren oder Daten von Hand beschaffen.', 'The strategy tester reads price data only from this data stock. Here you see what is available, and you can import files by hand or fetch data by hand.')}</p>
        </header>

        <section className="card-box wide" data-testid="stock">
          <h2><Icon name="database" size={16} />{L('Was vorliegt', 'What is available')}</h2>
          {lines.length === 0 ? (
            <p className="empty-note" data-testid="stock-empty">{L('Der Datenbestand ist leer. Nächster Schritt: Importieren Sie unten eine Datei oder stoßen Sie die Beschaffung an.', 'The data stock is empty. Next step: import a file below or start the procurement.')}</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl" data-testid="stock-table">
                <thead><tr><th>{L('Broker', 'Broker')}</th><th>{L('Instrument', 'Instrument')}</th><th>{L('Daten', 'Data')}</th><th>{L('Zeiträume', 'Periods')}</th><th>{L('Menge', 'Amount')}</th></tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} data-testid="stock-row" data-instrument={l.instrument} data-kind={l.kind} data-tf={l.tf ?? ''} data-broker={l.broker}>
                      <td>{brokerName(l.broker)}</td>
                      <td><b>{l.instrument}</b></td>
                      <td>{l.kind === 'ticks' ? 'Ticks' : `${L('Kerzen', 'Candles')} ${(l.tf ?? '').toUpperCase()}`}</td>
                      <td>{l.ranges.map((r) => fmtRange(r, lang)).join('; ')}</td>
                      <td>{fmtN(l.count, 0, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card-box wide" data-testid="instr-table-card">
          <h2><Icon name="list" size={16} />{L('Angaben zum Instrument je Broker', 'Instrument details per broker')}</h2>
          <p className="muted">{L('Diese Angaben belegen die Angaben zum Instrument im Testlauf vor. Dort lassen sie sich für einen Testlauf ändern.', 'These details preset the instrument details in a test run. There they can be changed for one test run.')}</p>
          <div className="tbl-wrap">
            <table className="tbl" data-testid="instr-table">
              <thead>
                <tr>
                  <th>{L('Broker', 'Broker')}</th><th>{L('Instrument', 'Instrument')}</th><th>{L('Tickgröße', 'Tick size')}</th><th>{L('Tickwert', 'Tick value')}</th><th>Pip</th><th>{L('Punkt', 'Point')}</th>
                  <th>Spread</th><th>{L('Min.-Vol.', 'Min. vol.')}</th><th>{L('Schritt', 'Step')}</th><th>{L('Kontrakt', 'Contract')}</th><th>Swap L/S</th><th>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {BROKERS.flatMap((b) => INSTRUMENTS.map((i) => {
                  const x = instrumentInfo(i.id, b.id);
                  return (
                    <tr key={`${b.id}-${i.id}`} data-testid="instr-row" data-instrument={i.id}>
                      <td>{b.name}</td><td><b>{i.id}</b><div className="why">{i.bezeichnung}</div></td>
                      <td>{fmtN(x.tickgroesse, x.digits, lang)}</td><td>{fmtN(x.tickwert, 2, lang)}</td><td>{fmtN(x.pip, x.digits - 1, lang)}</td><td>{fmtN(x.punkt, x.digits, lang)}</td>
                      <td>{fmtN(x.spread, x.digits, lang)}</td><td>{fmtN(x.mindestvolumen, 2, lang)}</td><td>{fmtN(x.volumenschritt, 2, lang)}</td><td>{fmtN(x.kontraktgroesse, 0, lang)}</td>
                      <td>{fmtN(x.swapLong, 1, lang)} / {fmtN(x.swapShort, 1, lang)}</td><td>{fmtN(x.margin, 2, lang)}</td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card-box wide" data-testid="import-card">
          <h2><Icon name="upload" size={16} />{L('Datei von Hand importieren', 'Import a file by hand')}</h2>
          <p className="muted">{L('Der Import liest eine Datei im Format JSON oder CSV, prüft sie und übernimmt die Daten. Zum Beispiel ein Export aus MetaTrader oder eine Datei von Ihrer Festplatte.', 'The import reads a file in JSON or CSV format, checks it and takes over the data. For example an export from MetaTrader or a file from your hard disk.')}</p>
          <div className="btn-row">
            <label className="btn btn-default" data-tip={L('Wählt eine Datei von Ihrer Festplatte. Der Prototyp liest nur Name und Größe.', 'Chooses a file from your hard disk. The prototype only reads name and size.')}>
              <Icon name="folder" size={17} /><span>{L('Datei wählen …', 'Choose file …')}</span>
              <input type="file" accept=".csv,.json" className="visually-hidden" data-testid="import-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) check(f.name, f.size); e.target.value = ''; }} />
            </label>
            <Btn kind="ghost" icon="file" testid="import-sample" onClick={() => check(SAMPLE_NAME, 3_100_000)} tip={L('Nimmt eine Beispieldatei mit M15-Kerzen von EURUSD, die eine Lücke im Datenbestand schließt.', 'Takes a sample file with M15 candles of EURUSD that closes a gap in the data stock.')}>{L('Beispieldatei verwenden', 'Use sample file')}</Btn>
          </div>
          {!imp && <p className="empty-note" data-testid="import-empty">{L('Noch keine Datei gewählt. Nächster Schritt: Wählen Sie eine Datei oder nehmen Sie die Beispieldatei.', 'No file chosen yet. Next step: choose a file or take the sample file.')}</p>}
          {imp && <ImportBox imp={imp} lang={lang} onDone={(d) => setImp({ ...imp, done: d })} />}
        </section>

        <ProcureBox broker={broker} setBroker={setBroker} lang={lang} />
      </div>
    </section>
  );
}

function ImportBox({ imp, lang, onDone }: { imp: ImportCheck; lang: Lang; onDone: (d: { added: number; skipped: number }) => void }) {
  const L = useL();
  const run = () => {
    const row: DataRow = {
      id: `i${Date.now().toString(36)}`, broker: 'b1', instrument: imp.instrument, kind: imp.kind, tf: imp.kind === 'ticks' ? null : imp.tf, from: imp.from, to: imp.to, origin: 'import',
    };
    addDataRows([row]);
    onDone({ added: imp.rows - imp.bad - imp.dup, skipped: imp.bad + imp.dup });
    toast('Die Daten sind importiert und stehen im Datenbestand.', 'The data is imported and is in the data stock.');
  };
  return (
    <div className="import-box" data-testid="import-box">
      <h3>{L('Prüfung', 'Check')}: {imp.name}</h3>
      <ul className="checks" data-testid="import-checks">
        <li className={imp.format ? 'ok' : 'bad'}><Icon name={imp.format ? 'check' : 'warn'} size={14} />{imp.format ? L(`Format erkannt: ${imp.format.toUpperCase()}`, `Format recognised: ${imp.format.toUpperCase()}`) : L('Format nicht erkannt. Erlaubt sind JSON und CSV.', 'Format not recognised. JSON and CSV are allowed.')}</li>
        {imp.format && (
          <>
            <li className="ok"><Icon name="check" size={14} />{L(`Erkannt: ${imp.instrument}, ${imp.kind === 'ticks' ? 'Ticks' : `Kerzen ${imp.tf.toUpperCase()}`}, ${fmtRange({ from: parseIsoDate(imp.from), to: parseIsoDate(imp.to) }, lang)}`, `Recognised: ${imp.instrument}, ${imp.kind === 'ticks' ? 'ticks' : `candles ${imp.tf.toUpperCase()}`}, ${fmtRange({ from: parseIsoDate(imp.from), to: parseIsoDate(imp.to) }, lang)}`)}</li>
            <li className="ok"><Icon name="check" size={14} />{L(`${fmtN(imp.rows, 0, lang)} Zeilen gelesen`, `${fmtN(imp.rows, 0, lang)} rows read`)}</li>
            <li className={imp.bad ? 'warn' : 'ok'}><Icon name={imp.bad ? 'info' : 'check'} size={14} />{imp.bad ? L(`${imp.bad} fehlerhafte Zeilen werden übersprungen (Hoch unter Tief oder fehlender Wert).`, `${imp.bad} faulty rows will be skipped (high below low or missing value).`) : L('Keine fehlerhaften Zeilen', 'No faulty rows')}</li>
            <li className={imp.dup ? 'warn' : 'ok'}><Icon name={imp.dup ? 'info' : 'check'} size={14} />{imp.dup ? L(`${fmtN(imp.dup, 0, lang)} Zeilen liegen schon im Datenbestand und werden nicht doppelt übernommen.`, `${fmtN(imp.dup, 0, lang)} rows are already in the data stock and are not taken over twice.`) : L('Keine Überschneidung mit vorhandenen Daten', 'No overlap with existing data')}</li>
          </>
        )}
      </ul>
      {!imp.done && (
        <div className="btn-row">
          <Btn kind="primary" icon="download" disabled={!imp.ok} testid="import-run" onClick={run}>{L('Importieren', 'Import')}</Btn>
          {!imp.ok && <span className="muted">{L('Nächster Schritt: Wählen Sie eine Datei im Format JSON oder CSV.', 'Next step: choose a file in JSON or CSV format.')}</span>}
        </div>
      )}
      {imp.done && (
        <p className="ok-note" data-testid="import-result"><Icon name="check" size={16} />{L(`Ergebnis: ${fmtN(imp.done.added, 0, lang)} Zeilen übernommen, ${fmtN(imp.done.skipped, 0, lang)} übersprungen. Der Datenbestand ist aktualisiert.`, `Result: ${fmtN(imp.done.added, 0, lang)} rows taken over, ${fmtN(imp.done.skipped, 0, lang)} skipped. The data stock is updated.`)}</p>
      )}
    </div>
  );
}

function ProcureBox({ broker, setBroker, lang }: { broker: string; setBroker: (b: string) => void; lang: Lang }) {
  const app = useApp();
  const L = useL();
  const [instrument, setInstrument] = useState('EURUSD');
  const [kind, setKind] = useState<Kind>('candles');
  const [tf, setTf] = useState('h1');
  const [from, setFrom] = useState('2024-10-21');
  const [to, setTo] = useState(isoDate(LAST_DAY));
  const [state, setState] = useState<{ k: 'idle' } | { k: 'run'; p: number; res: NeedResult } | { k: 'done'; res: NeedResult }>({ k: 'idle' });
  const need: Need = { key: 'manual', instrument, kind, tf: kind === 'ticks' ? null : tf, from: parseIsoDate(from), to: parseIsoDate(to), why: { de: '', en: '' } };
  const bad = parseIsoDate(from) > parseIsoDate(to) || parseIsoDate(to) > LAST_DAY;
  const start = async () => {
    const res = classifyNeed(need, app.rows, broker);
    if (res.status === 'present') { setState({ k: 'done', res }); return; }
    if (res.fetchable.length === 0) { setState({ k: 'done', res }); return; }
    for (let i = 1; i <= 8; i++) {
      setState({ k: 'run', p: i / 8, res });
      await new Promise((r) => setTimeout(r, 70));
    }
    addDataRows(addRows([], broker, [res]));
    setState({ k: 'done', res });
  };
  return (
    <section className="card-box wide" data-testid="procure-card">
      <h2><Icon name="download" size={16} />{L('Beschaffung von Hand anstoßen', 'Start procurement by hand')}</h2>
      <p className="muted">{L('Die Beschaffung holt Kursdaten aus einer Quelle und liefert sie dem Import. Fehlende Daten eines Testlaufs werden automatisch beschafft; hier stoßen Sie es selbst an. Die erste Quelle ist MetaTrader 5, es läuft auf dem Rechner, auf dem MetaTrader 5 läuft.', 'The procurement gets price data from a source and hands it to the import. Missing data of a test run is fetched automatically; here you start it yourself. The first source is MetaTrader 5, it runs on the computer where MetaTrader 5 runs.')}</p>
      <div className="grid3">
        <Field label={L('Quelle', 'Source')} tip={L('Woher die Daten kommen. Weitere Quellen lassen sich später ergänzen.', 'Where the data comes from. More sources can be added later.')} testid="field-source">
          <Select value="mt5" onChange={() => undefined} ariaLabel={L('Quelle', 'Source')} testid="proc-source"><option value="mt5">MetaTrader 5</option></Select>
        </Field>
        <Field label={L('Broker', 'Broker')} tip={L('Zu welchem Broker die Daten im Datenbestand gehören.', 'Which broker the data belongs to in the data stock.')} testid="field-proc-broker">
          <Select value={broker} onChange={setBroker} ariaLabel={L('Broker', 'Broker')} testid="proc-broker">{BROKERS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
        </Field>
        <Field label={L('Instrument', 'Instrument')} tip={L('Das Instrument, dessen Daten Sie holen wollen.', 'The instrument whose data you want to get.')} testid="field-proc-instrument">
          <Select value={instrument} onChange={setInstrument} ariaLabel={L('Instrument', 'Instrument')} testid="proc-instrument">{INSTRUMENTS.map((i) => <option key={i.id} value={i.id}>{i.id}</option>)}</Select>
        </Field>
        <Field label={L('Art der Daten', 'Kind of data')} tip={L('Kerzen einer Zeiteinheit oder Ticks. Ticks werden nicht aus Kerzen gebildet; sie müssen vorliegen, wenn eine Strategie den Auslöser „Tick“ hat.', 'Candles of a time unit or ticks. Ticks are not built from candles; they must be there if a strategy has the trigger "Tick".')} testid="field-proc-kind">
          <Select value={kind} onChange={(v) => setKind(v as Kind)} ariaLabel={L('Art der Daten', 'Kind of data')} testid="proc-kind"><option value="candles">{L('Kerzen', 'Candles')}</option><option value="ticks">Ticks</option></Select>
        </Field>
        {kind === 'candles' && (
          <Field label={L('Zeiteinheit', 'Time unit')} tip={L('Die Kerzenlänge, zum Beispiel H1 für Stundenkerzen.', 'The candle length, for example H1 for hourly candles.')} testid="field-proc-tf">
            <Select value={tf} onChange={setTf} ariaLabel={L('Zeiteinheit', 'Time unit')} testid="proc-tf">{TIME_UNITS.map((u) => <option key={u.id} value={u.id}>{u.de}</option>)}</Select>
          </Field>
        )}
        <Field label={L('Von', 'From')} tip={L('Erster Tag der gewünschten Daten.', 'First day of the wanted data.')} testid="field-proc-from">
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={L('Von', 'From')} data-testid="proc-from" />
        </Field>
        <Field label={L('Bis', 'To')} tip={L('Letzter Tag der gewünschten Daten, höchstens der letzte vollständige Handelstag.', 'Last day of the wanted data, at most the last complete trading day.')} testid="field-proc-to">
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label={L('Bis', 'To')} data-testid="proc-to" />
        </Field>
      </div>
      <div className="btn-row">
        <Btn kind="primary" icon="download" testid="proc-start" disabled={bad || state.k === 'run'} onClick={() => { void start(); }}>{L('Beschaffung anstoßen', 'Start procurement')}</Btn>
        {bad && <span className="error-note"><Icon name="warn" size={14} />{L('Der Zeitraum ist ungültig.', 'The period is invalid.')}</span>}
      </div>
      {state.k === 'run' && <div className="progress" role="progressbar" aria-valuenow={Math.round(state.p * 100)} aria-valuemin={0} aria-valuemax={100} data-testid="proc-progress"><span style={{ width: `${Math.round(state.p * 100)}%` }} /></div>}
      {state.k === 'done' && <ProcResult res={state.res} lang={lang} />}
      <span hidden>{DAY}{countOf('ticks', null, { from: 0, to: 0 })}</span>
    </section>
  );
}

function ProcResult({ res, lang }: { res: NeedResult; lang: Lang }) {
  const L = useL();
  if (res.status === 'present') return <p className="ok-note" data-testid="proc-result"><Icon name="check" size={16} />{L('Diese Daten liegen schon vollständig vor. Es gibt nichts zu beschaffen.', 'This data is already complete. There is nothing to fetch.')}</p>;
  if (res.status === 'fetchable') return <p className="ok-note" data-testid="proc-result"><Icon name="check" size={16} />{L(`Beschafft und importiert: ${res.fetchable.map((r) => fmtRange(r, lang)).join('; ')}.`, `Fetched and imported: ${res.fetchable.map((r) => fmtRange(r, lang)).join('; ')}.`)}</p>;
  return (
    <div className="finding error" role="alert" data-testid="proc-result">
      <Icon name="warn" size={18} />
      <div className="finding-body">
        <strong>{L('Nicht beschaffbar', 'Cannot be fetched')}</strong>
        <p>{res.blocked.map((r) => fmtRange(r, lang)).join('; ')}: {res.reason ? tx(res.reason, lang) : ''}</p>
        {res.fetchable.length > 0 && <p>{L('Der beschaffbare Teil wurde importiert: ', 'The part that can be fetched was imported: ')}{res.fetchable.map((r) => fmtRange(r, lang)).join('; ')}</p>}
      </div>
    </div>
  );
}
