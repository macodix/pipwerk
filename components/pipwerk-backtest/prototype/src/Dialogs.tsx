// Dialogs: about, save backtest, tested version of the strategy, questions before deleting.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import licenseText from '../../../../LICENSE?raw';
import { tx } from './catalog';
import { accountName } from './data';
import { FlowView } from './FlowView';
import { currentResult, deleteAccount, deleteSaved, saveBacktest, setState, useApp } from './store';
import { Btn, Icon, TextInput, useL } from './ui';

function Modal({
  title, children, footer, onClose, wide, testid, icon,
}: { title: string; children: ReactNode; footer: ReactNode; onClose: () => void; wide?: boolean; testid: string; icon?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey);
    const first = ref.current?.querySelector('input, select, textarea') as HTMLElement | null;
    (first ?? (ref.current?.querySelector('button.btn-primary') as HTMLElement | null))?.focus();
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="modal-back" data-testid="modal-back">
      <div className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} data-testid={testid}>
        <header className="modal-head">
          {icon && <Icon name={icon} size={20} />}
          <h2>{title}</h2>
        </header>
        <div className="modal-body">{children}</div>
        <footer className="modal-foot">{footer}</footer>
      </div>
    </div>
  );
}

const close = () => setState({ dialog: null });

export function Dialogs() {
  const app = useApp();
  const d = app.dialog;
  if (!d) return null;
  switch (d.k) {
    case 'about': return <AboutDialog />;
    case 'saveBt': return <SaveBtDialog />;
    case 'strategy': return <StrategyDialog savedId={d.savedId} />;
    case 'deleteAccount': return <DeleteAccountDialog id={d.id} />;
    case 'deleteSaved': return <DeleteSavedDialog id={d.id} />;
    default: return null;
  }
}

function AboutDialog() {
  const L = useL();
  return (
    <Modal title={L('Über pipwerk replay', 'About pipwerk replay')} icon="info" onClose={close} testid="dialog-about" footer={<Btn kind="primary" onClick={close} testid="about-close">{L('Schließen', 'Close')}</Btn>}>
      <dl className="about-list">
        <dt>{L('Produkt', 'Product')}</dt><dd>pipwerk replay · {L('der Strategietester von pipwerk', 'the strategy tester of pipwerk')}</dd>
        <dt>{L('Betriebsarten', 'Modes')}</dt><dd>{L('Einzelschritt-Test und Backtest', 'Single-step test and backtest')}</dd>
        <dt>{L('Stand', 'Version')}</dt><dd>{L('Prototyp 2026-10-21, simulierte Daten', 'Prototype 2026-10-21, simulated data')}</dd>
      </dl>
      <p className="hint-box"><Icon name="info" size={16} /><span>{L('Dies ist ein klickbarer Prototyp. Kurse, Indikatoren und Ergebnisse sind simuliert und nicht berechnet wie im fertigen Produkt. Gespeichertes bleibt in diesem Browser.', 'This is a clickable prototype. Prices, indicators and results are simulated and not calculated as in the finished product. Saved data stays in this browser.')}</span></p>
      <h3 className="sub-h">{L('Lizenz', 'License')}</h3>
      <pre className="license" data-testid="license-text">{licenseText}</pre>
    </Modal>
  );
}

function SaveBtDialog() {
  const app = useApp();
  const L = useL();
  const r = app.result;
  const [name, setName] = useState(r?.name ?? '');
  return (
    <Modal title={L('Backtest speichern', 'Save backtest')} icon="save" onClose={close} testid="dialog-save-bt"
      footer={<><Btn onClick={close} testid="save-bt-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="primary" icon="save" disabled={!name.trim()} onClick={() => saveBacktest(name)} testid="save-bt-ok">{L('Speichern', 'Save')}</Btn></>}>
      <p>{L('Gespeichert werden eine Kopie der getesteten Strategie, die Werte der Strategieparameter, das Testkonto mit seinen Werten, das Instrument mit seinen Angaben, der Testzeitraum und das Ergebnis.', 'Saved are a copy of the tested strategy, the values of the strategy parameters, the test account with its values, the instrument with its details, the test period and the result.')}</p>
      <label className="field">
        <span className="field-label" data-tip={L('Unter diesem Namen finden Sie den Backtest in der Liste.', 'Under this name you find the backtest in the list.')}>{L('Name', 'Name')}</span>
        <TextInput value={name} onChange={setName} ariaLabel={L('Name des Backtests', 'Name of the backtest')} testid="save-bt-name" />
      </label>
    </Modal>
  );
}

function StrategyDialog({ savedId }: { savedId?: string }) {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const r = savedId ? app.saved.find((s) => s.id === savedId) ?? null : currentResult() ?? app.result;
  if (!r) return null;
  return (
    <Modal title={L('Getestete Fassung der Strategie', 'Tested version of the strategy')} icon="file" onClose={close} wide testid="dialog-strategy" footer={<Btn kind="primary" onClick={close} testid="strategy-close">{L('Schließen', 'Close')}</Btn>}>
      <p className="muted">{L('So war die Strategie beim Test: eine Kopie, nur zum Ansehen. Bearbeiten geht im Strategiedesigner.', 'This is how the strategy was at the test: a copy, view only. Editing is done in the strategy designer.')}</p>
      <p className="facts" data-testid="strategy-params">
        <b>{r.strategy.name}</b> · {tx(r.strategyBadge, lang)}
        {r.strategy.params.map((p) => <span key={p.id} className="fact">{p.name}: <b>{String(r.params[p.id] ?? p.value).toUpperCase() === String(r.params[p.id] ?? p.value) ? String(r.params[p.id] ?? p.value) : String(r.params[p.id] ?? p.value)}</b></span>)}
        <span className="fact">{accountName(r.account, lang)}</span>
      </p>
      <div className="flow-modal"><FlowView strategy={r.strategy} testid="flow-tested" /></div>
    </Modal>
  );
}

function DeleteAccountDialog({ id }: { id: string }) {
  const app = useApp();
  const L = useL();
  const a = app.accounts.find((x) => x.id === id);
  return (
    <Modal title={L('Testkonto löschen?', 'Delete test account?')} icon="trash" onClose={close} testid="dialog-delete-account"
      footer={<><Btn onClick={close} testid="delete-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="danger" icon="trash" onClick={() => deleteAccount(id)} testid="delete-ok">{L('Löschen', 'Delete')}</Btn></>}>
      <p>{L(`Das Testkonto „${a?.name ?? ''}“ wird gelöscht. Gespeicherte Backtests behalten ihre Kopie der Werte.`, `The test account "${a?.name ?? ''}" is deleted. Saved backtests keep their copy of the values.`)}</p>
    </Modal>
  );
}

function DeleteSavedDialog({ id }: { id: string }) {
  const app = useApp();
  const L = useL();
  const s = app.saved.find((x) => x.id === id);
  return (
    <Modal title={L('Gespeicherten Backtest löschen?', 'Delete saved backtest?')} icon="trash" onClose={close} testid="dialog-delete-saved"
      footer={<><Btn onClick={close} testid="delete-cancel">{L('Abbrechen', 'Cancel')}</Btn><Btn kind="danger" icon="trash" onClick={() => deleteSaved(id)} testid="delete-ok">{L('Löschen', 'Delete')}</Btn></>}>
      <p>{L(`Der Backtest „${s?.name ?? ''}“ wird gelöscht. Das lässt sich nicht rückgängig machen.`, `The backtest "${s?.name ?? ''}" is deleted. This cannot be undone.`)}</p>
    </Modal>
  );
}
