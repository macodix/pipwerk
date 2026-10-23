// Preparing a test run: strategy, instrument, test period, test account, strategy parameters,
// the check of the price data and the start.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ENTRIES, accountChanged, currentCheck, defaultPeriods, entryOf, instrChanged, manualError, periodError, saveAccountFromRun, selectAccount, selectInstrument, selectStrategy, setView, startTest, updatePrep, useApp } from './store';
import { Field, ParamInput, paramTip } from './fields';
import { CURRENCIES, accountName, brokerName, dataLabel, fmtRange, hasManualTrigger, stockBrokers, usedTimeframes, usesTicks } from './data';
import type { NeedResult } from './data';
import { fmtN } from './fmt';
import { INSTRUMENTS, instrumentInfo, parseIsoDate } from './sim/market';
import { Btn, Icon, NumberInput, Select, TextInput, useL } from './ui';
import type { Lang } from './model';
import { tx } from './catalog';

export function Prepare() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const p = app.prep;
  const mode = app.mode;
  const e = entryOf(p.strategyId);
  const s = e.strategy;
  const per = p.periods[mode];
  const err = periodError(p, mode);
  const defaults = defaultPeriods()[mode];
  const periodChanged = per.from !== defaults.from || per.to !== defaults.to;
  const accChanged = accountChanged();
  const insChanged = instrChanged();
  const [saveName, setSaveName] = useState<string | null>(null);
  const tfs = usedTimeframes(s, p.params);
  const ticks = usesTicks(s);
  const days = !err ? Math.round((parseIsoDate(per.to) - parseIsoDate(per.from)) / 86400000) + 1 : 0;
  const acc = app.accounts.find((a) => a.id === p.accountId);

  return (
    <section className="region prepare" data-region="prepare" data-testid="prepare" aria-label={L('Testlauf vorbereiten', 'Prepare the test run')}>
      <div className="prepare-scroll">
        <header className="prepare-head">
          <h1>{mode === 'single' ? L('Einzelschritt-Test vorbereiten', 'Prepare the single-step test') : L('Backtest vorbereiten', 'Prepare the backtest')}</h1>
          <p>
            {mode === 'single'
              ? L('Die Strategie läuft an historischen Kursen Schritt für Schritt. Sie sehen, ob sie arbeitet wie gedacht. Nächster Schritt: Wählen Sie unten Strategie und Zeitraum und starten Sie den Testlauf.', 'The strategy runs on historical prices step by step. You see whether it works as intended. Next step: choose strategy and period below and start the test run.')
              : L('Die Strategie läuft ohne Unterbrechung über den ganzen Testzeitraum. Ergebnis sind Kontoentwicklung, Trades und Kennzahlen. Nächster Schritt: Wählen Sie unten Strategie und Zeitraum und starten Sie den Backtest.', 'The strategy runs without interruption over the whole test period. The result is account development, trades and key figures. Next step: choose strategy and period below and start the backtest.')}
          </p>
        </header>
        <div className="cards">
          {/* 1 strategy */}
          <section className="card-box" data-testid="card-strategy">
            <h2><span className="step-no">1</span>{L('Strategie', 'Strategy')}</h2>
            <Field label={L('Strategie', 'Strategy')} tip={L('Die Strategie, die getestet wird. Sie bleibt unverändert; bearbeiten können Sie sie im Strategiedesigner.', 'The strategy to be tested. It stays unchanged; you can edit it in the strategy designer.')} testid="field-strategy">
              <Select value={p.strategyId} onChange={selectStrategy} ariaLabel={L('Strategie', 'Strategy')} testid="select-strategy">
                {ENTRIES.map((x) => <option key={x.id} value={x.id}>{x.strategy.name} · {tx(x.badge, lang)}</option>)}
              </Select>
            </Field>
            <p className="muted" data-testid="strategy-description">{s.description}</p>
            <p className="facts">
              <span className="fact"><Icon name="clock" size={13} />{tfs.map((t) => t.toUpperCase()).join(', ') || '–'}</span>
              <span className="fact"><Icon name="dots" size={13} />{ticks ? L('braucht Ticks', 'needs ticks') : L('nur Kerzen', 'candles only')}</span>
              <span className="fact"><Icon name="layers" size={13} />{s.els.length} {L('Elemente', 'elements')}</span>
            </p>
          </section>

          {/* 2 instrument */}
          <section className="card-box" data-testid="card-instrument">
            <h2><span className="step-no">2</span>{L('Instrument', 'Instrument')}</h2>
            <Field label={L('Instrument der Anwendung', 'Instrument of the application')} tip={L('Das Instrument, auf dem die Strategie handelt, zum Beispiel EURUSD. Weitere Instrumente der Strategie kommen aus ihren Strategieparametern.', 'The instrument the strategy trades, for example EURUSD. Further instruments of the strategy come from its strategy parameters.')} testid="field-instrument">
              <Select value={p.instrument} onChange={(v) => selectInstrument(v)} ariaLabel={L('Instrument', 'Instrument')} testid="select-instrument">
                {INSTRUMENTS.map((i) => <option key={i.id} value={i.id}>{i.id} – {i.bezeichnung}</option>)}
              </Select>
            </Field>
            <Field label={L('Broker der Kursdaten', 'Broker of the price data')} tip={L('Von welchem Broker die Kerzen und die Angaben zum Instrument stammen. Jeder Broker hat eigene Kurse und eigene Angaben. Vorbelegt mit „Broker für Testläufe“ aus dem Datenbestand; hier gilt die Wahl nur für diesen Testlauf.', 'Which broker the candles and the instrument details come from. Every broker has its own prices and details. Preset with "Broker for test runs" from the data stock; here the choice applies to this test run only.')} testid="field-broker">
              <Select value={p.broker} onChange={(v) => selectInstrument(p.instrument, v)} ariaLabel={L('Broker', 'Broker')} testid="select-broker">
                {stockBrokers(app.rows).map((b) => <option key={b} value={b}>{brokerName(b)}</option>)}
              </Select>
            </Field>
            <details className="more" data-testid="instr-details" open={insChanged}>
              <summary>{L('Angaben zum Instrument', 'Instrument details')} <span className={`src-tag${insChanged ? ' changed' : ''}`}>{insChanged ? L('für diesen Testlauf geändert', 'changed for this test run') : L('aus dem Datenbestand', 'from the data stock')}</span></summary>
              <p className="muted">{L('Vorbelegt aus dem Datenbestand. Eine Änderung gilt nur für diesen Testlauf und wird nicht gespeichert.', 'Preset from the data stock. A change applies only to this test run and is not saved.')}</p>
              <div className="grid2">
                {([
                  ['tickgroesse', L('Tickgröße', 'Tick size'), L('Kleinste Kursänderung des Instruments.', 'Smallest price change of the instrument.')],
                  ['tickwert', L('Tickwert', 'Tick value'), L('Wert einer Kursänderung um einen Tick bei einem Lot, in Kontowährung.', 'Value of a price change by one tick for one lot, in account currency.')],
                  ['punkt', L('Punkt', 'Point'), L('Ein Punkt als Kursdifferenz.', 'One point as price difference.')],
                  ['pip', L('Pip', 'Pip'), L('Ein Pip als Kursdifferenz. Puffer und Abstände der Strategien sind oft in Pips angegeben.', 'One pip as price difference. Buffers and distances of strategies are often given in pips.')],
                  ['spread', L('Spread', 'Spread'), L('Üblicher Abstand zwischen Brief- und Geldkurs. Im Testlauf gilt der Spread des Testkontos.', 'Usual distance between ask and bid. In the test run the spread of the test account applies.')],
                  ['mindestvolumen', L('Mindestvolumen', 'Minimum volume'), L('Kleinstes handelbares Volumen in Lot.', 'Smallest tradable volume in lots.')],
                  ['volumenschritt', L('Volumenschritt', 'Volume step'), L('Kleinste Stufe, in der sich das Volumen ändern lässt.', 'Smallest step in which the volume can change.')],
                  ['kontraktgroesse', L('Kontraktgröße', 'Contract size'), L('Wie viele Einheiten ein Lot umfasst, zum Beispiel 100.000 Euro bei EURUSD.', 'How many units one lot contains, for example 100,000 euros for EURUSD.')],
                  ['swapLong', L('Swap Kauf', 'Swap long'), L('Gebühr oder Ertrag für eine über Nacht gehaltene Kaufposition. Der Prototyp rechnet ihn nicht ein.', 'Fee or income for a long position held overnight. The prototype does not include it.')],
                  ['swapShort', L('Swap Verkauf', 'Swap short'), L('Gebühr oder Ertrag für eine über Nacht gehaltene Verkaufsposition. Der Prototyp rechnet ihn nicht ein.', 'Fee or income for a short position held overnight. The prototype does not include it.')],
                  ['margin', L('Margin-Anforderung (%)', 'Margin requirement (%)'), L('Anteil des Positionswerts, der als Sicherheit gebunden wird. Der Hebel des Testkontos bestimmt die Margin im Testlauf.', 'Share of the position value tied up as collateral. In the test run the leverage of the test account determines the margin.')],
                ] as [keyof typeof p.instr, string, string][]).map(([key, label, tip]) => {
                  const base = instrumentInfo(p.instrument, p.broker);
                  return (
                    <Field key={key} label={label} tip={tip} changed={p.instr[key] !== base[key]} testid={`instr-${key}`}>
                      <NumberInput value={p.instr[key] as number} onChange={(v) => updatePrep((q) => { (q.instr[key] as number) = v === '' ? 0 : v; })} ariaLabel={label} testid={`input-instr-${key}`} />
                    </Field>
                  );
                })}
              </div>
              {insChanged && <Btn small kind="ghost" icon="refresh" testid="instr-reset" onClick={() => updatePrep((q) => { q.instr = instrumentInfo(q.instrument, q.broker); })}>{L('Zurücksetzen auf den Datenbestand', 'Reset to the data stock')}</Btn>}
            </details>
          </section>

          {/* 3 period */}
          <section className="card-box" data-testid="card-period">
            <h2><span className="step-no">3</span>{L('Testzeitraum', 'Test period')}</h2>
            <p className="muted">{mode === 'single'
              ? L('Vorbelegt: die letzten 30 Tage bis zum letzten vollständigen Handelstag.', 'Preset: the last 30 days up to the last complete trading day.')
              : L('Vorbelegt: die letzten 2 Jahre bis zum letzten vollständigen Handelstag.', 'Preset: the last 2 years up to the last complete trading day.')}</p>
            <div className="grid2">
              <Field label={L('Beginn', 'Start')} tip={L('Erster Tag des Testzeitraums. Der Test beginnt mit der ersten Kerze dieses Tages.', 'First day of the test period. The test begins with the first candle of this day.')} changed={per.from !== defaults.from} testid="field-from">
                <input className="input" type="date" value={per.from} max={per.to} onChange={(ev) => updatePrep((q) => { q.periods[mode].from = ev.target.value; })} aria-label={L('Beginn des Testzeitraums', 'Start of the test period')} data-testid="input-from" />
              </Field>
              <Field label={L('Ende', 'End')} tip={L('Letzter Tag des Testzeitraums. Frühestens bis zum letzten vollständigen Handelstag.', 'Last day of the test period. At most up to the last complete trading day.')} changed={per.to !== defaults.to} testid="field-to">
                <input className="input" type="date" value={per.to} onChange={(ev) => updatePrep((q) => { q.periods[mode].to = ev.target.value; })} aria-label={L('Ende des Testzeitraums', 'End of the test period')} data-testid="input-to" />
              </Field>
            </div>
            {err ? <p className="error-note" role="alert" data-testid="period-error"><Icon name="warn" size={15} />{tx(err, lang)}</p>
              : <p className="muted" data-testid="period-info">{L(`${days} Kalendertage`, `${days} calendar days`)}</p>}
            <div className="btn-row">
              <Btn small kind="ghost" icon="refresh" disabled={!periodChanged} testid="period-reset" onClick={() => updatePrep((q) => { q.periods[mode] = { ...defaults }; })} tip={L('Setzt den Zeitraum auf die Vorbelegung zurück.', 'Resets the period to the preset.')}>{L('Vorbelegung', 'Preset')}</Btn>
              <Btn small kind="ghost" testid="period-30" onClick={() => updatePrep((q) => { q.periods[mode] = { ...defaultPeriods().single }; })}>{L('Letzte 30 Tage', 'Last 30 days')}</Btn>
              <Btn small kind="ghost" testid="period-2y" onClick={() => updatePrep((q) => { q.periods[mode] = { ...defaultPeriods().backtest }; })}>{L('Letzte 2 Jahre', 'Last 2 years')}</Btn>
            </div>
          </section>

          {/* 4 test account */}
          <section className="card-box" data-testid="card-account">
            <h2><span className="step-no">4</span>{L('Testkonto', 'Test account')}</h2>
            {app.accounts.length === 0 ? (
              <p className="empty-note" data-testid="no-accounts">{L('Es gibt kein Testkonto. Nächster Schritt: Legen Sie eines unter „Testkonten“ an.', 'There is no test account. Next step: create one under "Test accounts".')}
                <Btn small kind="primary" icon="plus" onClick={() => setView('accounts')} testid="goto-accounts">{L('Testkonten', 'Test accounts')}</Btn></p>
            ) : (
              <>
                <Field label={L('Testkonto', 'Test account')} tip={L('Ein benannter Satz von Werten für die Abwicklung: Kapital, Hebel, Spread, Kommission. Das Standard-Testkonto ist immer da.', 'A named set of values for the settlement: capital, leverage, spread, commission. The default test account is always there.')} testid="field-account">
                  <Select value={p.accountId} onChange={selectAccount} ariaLabel={L('Testkonto', 'Test account')} testid="select-account">
                    {app.accounts.map((a) => <option key={a.id} value={a.id}>{accountName(a, lang)}</option>)}
                  </Select>
                </Field>
                <div className="grid2">
                  <Field label={L('Anfangskapital', 'Initial capital')} tip={L('Das Geld, mit dem der Testlauf beginnt.', 'The money the test run starts with.')} changed={!!acc && acc.capital !== p.acc.capital} testid="field-capital">
                    <NumberInput value={p.acc.capital} onChange={(v) => updatePrep((q) => { q.acc.capital = v === '' ? 0 : v; })} ariaLabel={L('Anfangskapital', 'Initial capital')} testid="input-capital" />
                  </Field>
                  <Field label={L('Kontowährung', 'Account currency')} tip={L('Die Währung, in der Gewinn, Verlust und Kosten ausgewiesen werden.', 'The currency in which profit, loss and costs are shown.')} changed={!!acc && acc.currency !== p.acc.currency} testid="field-currency">
                    <Select value={p.acc.currency} onChange={(v) => updatePrep((q) => { q.acc.currency = v; })} ariaLabel={L('Kontowährung', 'Account currency')} testid="select-currency">
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </Field>
                  <Field label={L('Hebel', 'Leverage')} tip={L('Wie viel mehr Marktwert Sie mit dem Geld bewegen können; 30 bedeutet 1:30. Ein höherer Hebel bindet weniger Margin.', 'How much more market value you can move with the money; 30 means 1:30. A higher leverage ties up less margin.')} changed={!!acc && acc.leverage !== p.acc.leverage} testid="field-leverage">
                    <NumberInput value={p.acc.leverage} onChange={(v) => updatePrep((q) => { q.acc.leverage = v === '' || v <= 0 ? 1 : v; })} ariaLabel={L('Hebel', 'Leverage')} testid="input-leverage" unit=": 1" />
                  </Field>
                  <Field label={L('Kommission', 'Commission')} tip={L('Gebühr je gehandeltem Lot und Seite in Kontowährung. Eröffnung und Schließung kosten je einmal.', 'Fee per traded lot and side in account currency. Opening and closing cost once each.')} changed={!!acc && acc.commission !== p.acc.commission} testid="field-commission">
                    <NumberInput value={p.acc.commission} onChange={(v) => updatePrep((q) => { q.acc.commission = v === '' ? 0 : v; })} ariaLabel={L('Kommission', 'Commission')} testid="input-commission" />
                  </Field>
                </div>
                <Field label={L('Spread', 'Spread')} tip={L('Der Spread ist der Abstand zwischen Kauf- und Verkaufskurs. „Aus den Kerzen“ nimmt den Spread, den der Broker je Kerze liefert; „fest“ rechnet mit einem festen Wert in Pips.', 'The spread is the distance between buy and sell price. "From the candles" takes the spread the broker delivers per candle; "fixed" uses a fixed value in pips.')} changed={!!acc && (acc.spreadMode !== p.acc.spreadMode || acc.spreadFixed !== p.acc.spreadFixed)} testid="field-spread">
                  <div className="row">
                    <div className="seg" role="radiogroup" aria-label={L('Spread', 'Spread')}>
                      <button type="button" role="radio" aria-checked={p.acc.spreadMode === 'candle'} className={p.acc.spreadMode === 'candle' ? 'on' : ''} onClick={() => updatePrep((q) => { q.acc.spreadMode = 'candle'; })} data-testid="spread-candle">{L('aus den Kerzen', 'from the candles')}</button>
                      <button type="button" role="radio" aria-checked={p.acc.spreadMode === 'fixed'} className={p.acc.spreadMode === 'fixed' ? 'on' : ''} onClick={() => updatePrep((q) => { q.acc.spreadMode = 'fixed'; })} data-testid="spread-fixed">{L('fest', 'fixed')}</button>
                    </div>
                    {p.acc.spreadMode === 'fixed' && <NumberInput value={p.acc.spreadFixed} onChange={(v) => updatePrep((q) => { q.acc.spreadFixed = v === '' ? 0 : v; })} ariaLabel={L('Fester Spread in Pips', 'Fixed spread in pips')} unit="Pips" testid="input-spread" />}
                  </div>
                </Field>
                <p className={`save-note${accChanged ? ' changed' : ''}`} data-testid="account-note">
                  {accChanged
                    ? L('Die Werte sind für diesen Testlauf geändert. Das gespeicherte Testkonto bleibt unverändert, solange Sie nicht ausdrücklich speichern.', 'The values are changed for this test run. The stored test account stays unchanged unless you save explicitly.')
                    : L('Die Werte sind die des gespeicherten Testkontos.', 'The values are those of the stored test account.')}
                </p>
                <div className="btn-row">
                  <Btn small icon="save" disabled={!accChanged} testid="account-save" onClick={() => saveAccountFromRun(null)} tip={L('Speichert die geänderten Werte im gewählten Testkonto.', 'Saves the changed values in the chosen test account.')}>{L('Änderung im Testkonto speichern', 'Save change in the test account')}</Btn>
                  <Btn small kind="ghost" icon="plus" testid="account-save-new" onClick={() => setSaveName(saveName === null ? '' : null)} tip={L('Speichert die Werte als neues, benanntes Testkonto.', 'Saves the values as a new, named test account.')}>{L('Als neues Testkonto speichern …', 'Save as new test account …')}</Btn>
                </div>
                {saveName !== null && (
                  <div className="inline-new">
                    <TextInput value={saveName} onChange={setSaveName} placeholder={L('Name des neuen Testkontos', 'Name of the new test account')} ariaLabel={L('Name des neuen Testkontos', 'Name of the new test account')} testid="account-new-name" autoFocus />
                    <Btn small kind="primary" disabled={!saveName.trim()} testid="account-new-ok" onClick={() => { saveAccountFromRun(saveName); setSaveName(null); }}>{L('Speichern', 'Save')}</Btn>
                  </div>
                )}
              </>
            )}
          </section>

          {/* 5 parameters */}
          <section className="card-box" data-testid="card-params">
            <h2><span className="step-no">5</span>{L('Strategieparameter', 'Strategy parameters')}</h2>
            <p className="muted">{L('Vorbelegt mit den Werten der Strategie. Eine Änderung gilt nur für diesen Testlauf; die Strategie bleibt unverändert.', 'Preset with the values of the strategy. A change applies only to this test run; the strategy stays unchanged.')}</p>
            {s.params.length === 0 && <p className="empty-note">{L('Diese Strategie hat keine Strategieparameter. Nächster Schritt: weiter mit den Kursdaten unten.', 'This strategy has no strategy parameters. Next step: continue with the price data below.')}</p>}
            {s.params.map((sp) => {
              const changed = p.params[sp.id] !== sp.value;
              return (
                <Field key={sp.id} label={sp.name} tip={paramTip(sp, lang)} changed={changed} testid={`field-param-${sp.id}`}
                  note={changed ? <button type="button" className="link" data-testid={`param-reset-${sp.id}`} onClick={() => updatePrep((q) => { q.params[sp.id] = sp.value; })}>{L(`Zurück auf ${String(sp.value).toUpperCase()}`, `Back to ${String(sp.value).toUpperCase()}`)}</button> : undefined}>
                  <ParamInput p={sp} value={p.params[sp.id]} onChange={(v) => updatePrep((q) => { q.params[sp.id] = v; })} lang={lang} />
                </Field>
              );
            })}
          </section>

          {/* setting of the trigger "Manual", only for strategies that have it */}
          {hasManualTrigger(s) && <ManualSetting />}
        </div>

        <DataCheck />
      </div>
    </section>
  );
}

/** The setting "Trigger Manual": shown only if the chosen strategy has the trigger "Manual". */
function ManualSetting() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const at = app.prep.manualAt;
  const err = manualError(app.prep, app.mode);
  return (
    <section className="card-box" data-testid="card-manual">
      <h2><Icon name="hand" size={16} />{L('Auslöser Manuell', 'Trigger Manual')}</h2>
      <p className="muted" data-testid="manual-text">{L('„Manuell“ tritt einmal ein, standardmäßig zu Beginn des Testzeitraums vor der ersten Kerze. Wahlweise geben Sie einen Zeitpunkt im Testzeitraum an (Datum und Uhrzeit, UTC).', '"Manual" occurs once, by default at the start of the test period before the first candle. Optionally you enter a point in time within the test period (date and time, UTC).')}</p>
      <div className="timeline" aria-hidden="true">
        <span className="tl-mark"><Icon name="hand" size={12} /></span>
        <span className="tl-bar" />
        <span className="tl-end" />
      </div>
      <p className="muted tl-labels"><span>{L('Beginn: Manuell', 'Start: Manual')}</span><span>{L('Ende des Testzeitraums', 'End of the test period')}</span></p>
      <Field label={L('Zeitpunkt (UTC)', 'Point in time (UTC)')} tip={L('Wann „Manuell“ im Testlauf eintritt. Leer heißt: zu Beginn des Testzeitraums, vor der ersten Kerze. Der Zeitpunkt muss im Testzeitraum liegen, sonst startet der Testlauf nicht.', 'When "Manual" occurs in the test run. Empty means: at the start of the test period, before the first candle. The point in time must lie within the test period, otherwise the test run does not start.')} changed={!!at} testid="field-manual-at">
        <input className="input" type="datetime-local" value={at} onChange={(ev) => updatePrep((q) => { q.manualAt = ev.target.value; })} aria-label={L('Zeitpunkt für Manuell, UTC', 'Point in time for Manual, UTC')} data-testid="input-manual-at" />
      </Field>
      {err && <p className="error-note" role="alert" data-testid="manual-error"><Icon name="warn" size={15} />{tx(err, lang)}</p>}
      <div className="btn-row">
        <Btn small kind="ghost" icon="refresh" disabled={!at} testid="manual-reset" onClick={() => updatePrep((q) => { q.manualAt = ''; })} tip={L('Setzt „Manuell“ auf den Beginn des Testzeitraums zurück.', 'Resets "Manual" to the start of the test period.')}>{L('Zu Beginn des Testzeitraums', 'At the start of the test period')}</Btn>
      </div>
    </section>
  );
}

// ---- check of the price data ----------------------------------------------------------------------------------------

function needLabel(r: NeedResult, lang: Lang): string {
  return dataLabel(r.need.kind, r.need.tf, lang);
}

export function DataCheck() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const mode = app.mode;
  const live = useMemo(() => currentCheck(), [app.prep, app.rows, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const results = app.check?.results ?? live;
  const missing = results.filter((r) => r.status === 'missing');
  const err = periodError(app.prep, mode);
  const merr = manualError(app.prep, mode);
  const busy = app.phase === 'checking';
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    // the message about missing data must not stay out of sight
    if (app.phase === 'blocked') box.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [app.phase]);
  const stateText = (r: NeedResult): string => (r.status === 'present' ? L('vorhanden', 'available') : L('fehlt', 'missing'));
  const missingText = (r: NeedResult): string => (r.missing.length ? r.missing.map((m) => fmtRange(m, lang)).join('; ') : '–');
  return (
    <section className="data-check" data-testid="data-check" ref={box} aria-label={L('Kursdaten prüfen', 'Check the price data')}>
      <h2><Icon name="database" size={18} />{L('Kursdaten für diesen Testlauf', 'Price data for this test run')}</h2>
      <p className="muted">{L('Der Strategietester liest Kursdaten nur aus dem Datenbestand. Fehlt etwas, startet der Testlauf nicht.', 'The strategy tester reads price data only from the data stock. If anything is missing, the test run does not start.')}</p>
      {err ? <p className="empty-note">{L('Nächster Schritt: Korrigieren Sie den Testzeitraum, dann erscheint hier die Prüfung.', 'Next step: correct the test period, then the check appears here.')}</p> : (
        <div className="tbl-wrap">
          <table className="tbl need-table" data-testid="need-table">
            <thead><tr><th>{L('Instrument', 'Instrument')}</th><th>{L('Daten', 'Data')}</th><th>{L('Gebraucht', 'Needed')}</th><th>{L('Stand', 'State')}</th><th>{L('Fehlender Zeitraum', 'Missing period')}</th></tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.need.key} data-testid="need-row" data-status={r.status} data-kind={r.need.kind} data-instrument={r.need.instrument} className={r.status}>
                  <td><b>{r.need.instrument}</b></td>
                  <td>{needLabel(r, lang)}<div className="why">{tx(r.need.why, lang)}</div></td>
                  <td>{r.need.kind === 'contract' ? '–' : fmtRange({ from: r.need.from, to: r.need.to }, lang)}</td>
                  <td><span className={`state-chip ${r.status}`}><Icon name={r.status === 'present' ? 'check' : 'warn'} size={13} />{stateText(r)}</span></td>
                  <td>{missingText(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {app.phase === 'blocked' && missing.length > 0 && (
        <div className="finding error big" role="alert" data-testid="blocked-message">
          <Icon name="warn" size={20} />
          <div className="finding-body">
            <strong>{L('Der Testlauf startet nicht: Es fehlen Kursdaten.', 'The test run does not start: price data is missing.')}</strong>
            <ul>
              {missing.map((r) => (
                <li key={r.need.key} data-testid="blocked-item">
                  <b>{r.need.instrument} · {needLabel(r, lang)}</b>: {r.need.kind === 'contract' ? L('fehlen.', 'missing.') : `${L('es fehlt', 'missing')} ${missingText(r)}.`}
                </li>
              ))}
            </ul>
            <p className="fix"><b>{L('So kommen Sie weiter: ', 'How to go on: ')}</b>{L('Holen Sie die Daten mit pipwerk-fetch-mt5 auf dem Rechner von MetaTrader 5 und importieren Sie die Dateien im Datenbestand.', 'Get the data with pipwerk-fetch-mt5 on the computer of MetaTrader 5 and import the files in the data stock.')}</p>
            <div className="btn-row">
              <Btn small icon="database" testid="goto-data" onClick={() => setView('data')}>{L('Zum Datenbestand', 'To the data stock')}</Btn>
              <Btn small kind="ghost" testid="blocked-close" onClick={() => updatePrep(() => undefined)}>{L('Meldung schließen', 'Close message')}</Btn>
            </div>
          </div>
        </div>
      )}
      <div className="start-row">
        <Btn kind="primary" icon="play" testid="start-test" disabled={!!err || !!merr || busy || app.accounts.length === 0} onClick={() => { void startTest(); }}
          tip={mode === 'single' ? L('Prüft die Kursdaten und läuft bis zur ersten handelnden Stelle. Fehlt etwas, startet der Testlauf nicht.', 'Checks the price data and runs to the first acting place. If anything is missing, the test run does not start.') : L('Prüft die Kursdaten und lässt die Strategie über den ganzen Testzeitraum laufen. Fehlt etwas, startet der Testlauf nicht.', 'Checks the price data and lets the strategy run over the whole test period. If anything is missing, the test run does not start.')}>
          {mode === 'single' ? L('Einzelschritt-Test starten', 'Start single-step test') : L('Backtest starten', 'Start backtest')}
        </Btn>
        <span className="muted" data-testid="start-hint">
          {merr ? L('Der Start ist gesperrt: Der Zeitpunkt für „Manuell“ liegt nicht im Testzeitraum oder ist unvollständig (siehe Karte „Auslöser Manuell“).', 'The start is blocked: the time for "Manual" is not within the test period or incomplete (see the card "Trigger Manual").') : ''}
          {missing.length > 0 && app.phase !== 'blocked' ? L('Mindestens ein Datensatz fehlt; der Start meldet das.', 'At least one data set is missing; the start reports this.') : ''}
        </span>
      </div>
      <span hidden>{brokerName(app.prep.broker)}{fmtN(0, 0, lang)}</span>
    </section>
  );
}
