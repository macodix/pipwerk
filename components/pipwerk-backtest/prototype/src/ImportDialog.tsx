// Dialog "Import file": any number of files at once (JSON and CSV mixed), one broker and one time zone for all,
// instrument and data per file (recognised from the name or, for JSON, from the content), one click imports all.
import { useState } from 'react';
import { brokerIdOf, brokerName, fmtRange, stockBrokers } from './data';
import type { DataRow } from './data';
import { Field } from './fields';
import { fmtN } from './fmt';
import { DATA_CHOICES, importFile, needsInput, readItem, sampleFiles, tzValid } from './importing';
import type { ImportItem } from './importing';
import { Modal } from './Modal';
import { INSTRUMENTS, parseIsoDate } from './sim/market';
import { addDataRows, setState, toast, useApp } from './store';
import { Btn, Icon, Select, useL } from './ui';

const close = () => setState({ dialog: null });

/** The broker that all JSON files name, if they all name the same one. */
function commonBroker(items: ImportItem[]): string {
  const js = items.filter((i) => i.format === 'json' && !i.fileError);
  const names = new Set(js.map((i) => i.jsonBroker));
  return js.length > 0 && names.size === 1 && js[0].jsonBroker !== '' ? js[0].jsonBroker : '';
}

export function ImportDialog() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const [items, setItems] = useState<ImportItem[]>([]);
  const [broker, setBroker] = useState(brokerName(app.testBroker));
  const [touched, setTouched] = useState(false);
  const [tz, setTz] = useState('UTC');

  const add = (list: ImportItem[]) => {
    const all = [...items, ...list];
    setItems(all);
    const common = commonBroker(all);
    if (!touched && common) setBroker(common);
  };
  const pick = async (files: FileList | null) => {
    if (!files) return;
    const read: ImportItem[] = [];
    for (const f of Array.from(files)) read.push(readItem(f.name, f.size, await f.text()));
    add(read);
  };
  const sample = (n: 0 | 1) => {
    const s = sampleFiles()[n];
    add([readItem(s.name, s.text.length, s.text)]);
  };
  const change = (uid: string, patch: Partial<ImportItem>) => setItems(items.map((i) => (i.uid === uid ? { ...i, ...patch } : i)));

  const pending = items.filter((i) => !i.result);
  const csvPending = pending.some((i) => i.format === 'csv' && !i.fileError);
  const anyCsv = items.some((i) => i.format === 'csv');
  const waiting = pending.filter(needsInput);
  const tzBad = csvPending && !tzValid(tz);
  const brokerBad = broker.trim() === '';
  const blocked = pending.length === 0 || waiting.length > 0 || tzBad || brokerBad;
  const hint = pending.length === 0
    ? (items.length ? '' : L('Nächster Schritt: Wählen Sie Dateien oder nehmen Sie die Beispieldateien.', 'Next step: choose files or take the sample files.'))
    : brokerBad ? L('Nächster Schritt: Geben Sie den Broker an.', 'Next step: enter the broker.')
      : waiting.length > 0 ? L('Nächster Schritt: Ergänzen Sie Instrument und Daten der markierten Dateien oder entfernen Sie die Dateien.', 'Next step: complete instrument and data of the marked files or remove the files.')
        : tzBad ? L('Nächster Schritt: Geben Sie eine gültige Zeitzone an, zum Beispiel Europe/Athens.', 'Next step: enter a valid time zone, for example Europe/Athens.') : '';

  const run = () => {
    const id = brokerIdOf(broker, app.rows);
    const rows: DataRow[] = [];
    const next = items.map((i) => {
      if (i.result) return i;
      const result = importFile(i, id, tz);
      if (result.row) rows.push(result.row);
      return { ...i, result };
    });
    setItems(next);
    if (rows.length) addDataRows(rows);
    const ok = next.filter((i) => i.result?.row).length;
    toast(`${ok} von ${next.length} Dateien sind importiert.`, `${ok} of ${next.length} files are imported.`);
  };

  const suggestions = stockBrokers(app.rows).map(brokerName);
  return (
    <Modal
      title={L('Datei importieren', 'Import file')} icon="upload" wide onClose={close} testid="dialog-import"
      footer={(
        <>
          <Btn onClick={close} testid="import-close">{L('Schließen', 'Close')}</Btn>
          <Btn kind="primary" icon="download" disabled={blocked} testid="import-run" onClick={run}>{L('Importieren', 'Import')}</Btn>
        </>
      )}
    >
      <div className="imp-pick">
        <label className="btn btn-default" data-tip={L('Wählt eine oder mehrere Dateien von Ihrer Festplatte, JSON und CSV gemischt.', 'Chooses one or more files from your hard disk, JSON and CSV mixed.')}>
          <Icon name="folder" size={17} /><span>{L('Dateien wählen …', 'Choose files …')}</span>
          <input type="file" multiple accept=".csv,.json" className="visually-hidden" data-testid="import-files" onChange={(e) => { void pick(e.target.files); e.target.value = ''; }} />
        </label>
        <Btn kind="ghost" icon="file" testid="import-sample-1" onClick={() => sample(0)} tip={L('Fügt eine Beispieldatei hinzu: M15-Kerzen von EURUSD als CSV-Export von MetaTrader 5, mit drei fehlerhaften Zeilen.', 'Adds a sample file: M15 candles of EURUSD as CSV export of MetaTrader 5, with three faulty rows.')}>{L('Beispiel CSV', 'Sample CSV')}</Btn>
        <Btn kind="ghost" icon="file" testid="import-sample-2" onClick={() => sample(1)} tip={L('Fügt eine zweite Beispieldatei hinzu: H1-Kerzen von XAUUSD als JSON, wie pipwerk-fetch-mt5 sie schreibt, mit einer fehlerhaften Zeile.', 'Adds a second sample file: H1 candles of XAUUSD as JSON, as pipwerk-fetch-mt5 writes it, with one faulty row.')}>{L('Beispiel JSON', 'Sample JSON')}</Btn>
      </div>

      {items.length === 0 && <p className="empty-note" data-testid="import-empty">{L('Noch keine Datei gewählt. Wählen Sie Dateien oder nehmen Sie die Beispieldateien.', 'No file chosen yet. Choose files or take the sample files.')}</p>}

      <div className="imp-fields">
        <Field label={L('Broker', 'Broker')} required tip={L('Der Broker, zu dem alle Dateien gehören. Wählen Sie einen Namen aus dem Datenbestand oder geben Sie einen neuen ein. Nennen alle JSON-Dateien denselben Broker, ist er vorbelegt.', 'The broker all files belong to. Choose a name from the data stock or enter a new one. If all JSON files name the same broker, it is preset.')} testid="field-import-broker">
          <input className="input" list="import-brokers" value={broker} onChange={(e) => { setBroker(e.target.value); setTouched(true); }} aria-label={L('Broker', 'Broker')} data-testid="import-broker" />
          <datalist id="import-brokers">{suggestions.map((b) => <option key={b} value={b} />)}</datalist>
        </Field>
        {anyCsv && (
          <Field label={L('Zeitzone der CSV-Dateien', 'Time zone of the CSV files')} required tip={L('Die Zeitzone, in der MetaTrader 5 die Zeiten der CSV-Dateien schreibt (Serverzeit des Brokers), als Name wie Europe/Athens. Zeiten in JSON-Dateien sind UTC.', 'The time zone in which MetaTrader 5 writes the times of the CSV files (server time of the broker), as a name such as Europe/Athens. Times in JSON files are UTC.')} testid="field-import-tz">
            <input className="input" list="import-zones" value={tz} onChange={(e) => setTz(e.target.value)} aria-label={L('Zeitzone', 'Time zone')} data-testid="import-tz" />
            <datalist id="import-zones">{['UTC', 'Europe/Athens', 'Europe/Berlin', 'Europe/London', 'America/New_York'].map((z) => <option key={z} value={z} />)}</datalist>
          </Field>
        )}
      </div>

      {items.length > 0 && (
        <ul className="imp-list" data-testid="import-list">
          {items.map((i) => {
            const r = i.result;
            const wait = needsInput(i);
            const cls = r ? (r.row ? 'done' : 'failed') : wait ? 'needs' : '';
            return (
              <li key={i.uid} className={`imp-item ${cls}`} data-testid="import-item" data-name={i.name} data-state={r ? (r.row ? 'done' : 'failed') : wait ? 'needs' : 'ready'}>
                <div className="imp-head">
                  <span className="imp-name">{i.name} <span className="muted">· {i.format ? i.format.toUpperCase() : '?'} · {fmtN(Math.round(i.size / 1024), 0, lang)} KB</span></span>
                  {!r && <Btn small kind="ghost" icon="x" testid="import-remove" title={L('Datei aus der Liste entfernen', 'Remove file from the list')} onClick={() => setItems(items.filter((x) => x.uid !== i.uid))} />}
                </div>
                {i.format !== null && !i.fileError && (
                  <div className="grid2">
                    <Field label={L('Instrument', 'Instrument')} tip={L('Das Instrument der Datei. Vorbelegt aus dem Dateinamen, bei JSON aus dem Inhalt.', 'The instrument of the file. Preset from the file name, for JSON from the content.')} changed={false}>
                      <Select value={i.instrument} onChange={(v) => change(i.uid, { instrument: v })} ariaLabel={L('Instrument', 'Instrument')} testid="import-instrument" disabled={!!r}>
                        <option value="">{L('– wählen –', '– choose –')}</option>
                        {INSTRUMENTS.map((x) => <option key={x.id} value={x.id}>{x.id}</option>)}
                      </Select>
                    </Field>
                    <Field label={L('Daten', 'Data')} tip={L('Was die Datei enthält: Kerzen einer Zeiteinheit, Ticks oder Kontraktdaten. Vorbelegt aus dem Dateinamen, bei JSON aus dem Inhalt.', 'What the file contains: candles of a time unit, ticks or contract data. Preset from the file name, for JSON from the content.')} changed={false}>
                      <Select value={i.data} onChange={(v) => change(i.uid, { data: v })} ariaLabel={L('Daten', 'Data')} testid="import-data" disabled={!!r}>
                        <option value="">{L('– wählen –', '– choose –')}</option>
                        {DATA_CHOICES.map((d) => <option key={d.id} value={d.id}>{L(d.de, d.en)}</option>)}
                      </Select>
                    </Field>
                  </div>
                )}
                {wait && <p className="error-note" data-testid="import-missing"><Icon name="warn" size={14} />{L('Instrument oder Daten nicht erkannt. Ergänzen Sie die Angabe.', 'Instrument or data not recognised. Complete the entry.')}</p>}
                {!r && i.fileError && <p className="error-note"><Icon name="warn" size={14} />{L(i.fileError.de, i.fileError.en)} {L('Die Datei wird abgelehnt.', 'The file will be refused.')}</p>}
                {r && (
                  <div className="imp-result" data-testid="import-result">
                    {r.error ? (
                      <b><Icon name="warn" size={14} /> {L('Abgelehnt', 'Refused')}: {L(r.error.de, r.error.en)}</b>
                    ) : (
                      <b><Icon name="check" size={14} /> {r.row?.kind === 'contract'
                        ? L('Kontraktdaten übernommen', 'Contract data taken over')
                        : L(`${fmtN(r.accepted, 0, lang)} Zeilen übernommen, Zeitraum ${fmtRange({ from: parseIsoDate(r.from), to: parseIsoDate(r.to) }, lang)}`, `${fmtN(r.accepted, 0, lang)} rows taken over, period ${fmtRange({ from: parseIsoDate(r.from), to: parseIsoDate(r.to) }, lang)}`)}
                      </b>
                    )}
                    {r.rejectedCount > 0 && (
                      <>
                        <span data-testid="import-rejected">{L(`${fmtN(r.rejectedCount, 0, lang)} Zeilen abgelehnt:`, `${fmtN(r.rejectedCount, 0, lang)} rows rejected:`)}</span>
                        <ul>
                          {r.rejected.map((x) => <li key={x.line}>{L('Zeile', 'Row')} {x.line}: {L(x.reason.de, x.reason.en)}</li>)}
                          {r.rejectedCount > r.rejected.length && <li>{L(`und ${fmtN(r.rejectedCount - r.rejected.length, 0, lang)} weitere`, `and ${fmtN(r.rejectedCount - r.rejected.length, 0, lang)} more`)}</li>}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {hint && <p className="muted" data-testid="import-hint">{hint}</p>}
    </Modal>
  );
}
