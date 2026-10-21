// Test accounts: create, edit, save and delete.
import { useEffect, useState } from 'react';
import { CURRENCIES, STANDARD_ACCOUNT, accountName } from './data';
import type { Account } from './data';
import { Field } from './fields';
import { fmtMoney } from './fmt';
import { clone } from './model';
import { setState, toast, upsertAccount, useApp } from './store';
import { Btn, Icon, NumberInput, Select, TextInput, useL } from './ui';

export function AccountsView() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const [selId, setSelId] = useState<string>(app.accounts[0]?.id ?? '');
  const [draft, setDraft] = useState<Account | null>(app.accounts[0] ? clone(app.accounts[0]) : null);
  const stored = app.accounts.find((a) => a.id === draft?.id);
  const isNew = !!draft && !stored;
  const dirty = !!draft && (isNew || JSON.stringify(draft) !== JSON.stringify(stored));
  const invalid = !draft || !draft.name.trim() || !(draft.capital > 0) || !(draft.leverage >= 1);

  useEffect(() => {
    // after a deletion the first account is shown
    if (draft && !isNew && !stored) {
      const a = app.accounts[0];
      setSelId(a?.id ?? '');
      setDraft(a ? clone(a) : null);
    }
  }, [app.accounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (a: Account) => { setSelId(a.id); setDraft(clone(a)); };
  const create = () => {
    const id = `a${Date.now().toString(36)}`;
    setSelId(id);
    setDraft({ ...clone(STANDARD_ACCOUNT), id, name: L('Neues Testkonto', 'New test account'), builtin: false });
  };
  const set = (fn: (a: Account) => void) => setDraft((d) => { if (!d) return d; const c = clone(d); fn(c); return c; });
  const save = () => {
    if (!draft || invalid) return;
    upsertAccount(draft);
    toast(`Testkonto „${draft.name}“ ist gespeichert.`, `Test account "${draft.name}" is saved.`);
  };

  return (
    <section className="region page" data-region="accounts" data-testid="accounts" aria-label={L('Testkonten', 'Test accounts')}>
      <div className="page-scroll">
        <header className="page-head">
          <h1>{L('Testkonten', 'Test accounts')}</h1>
          <p className="muted">{L('Ein Testkonto ist ein benannter, gespeicherter Satz von Werten für die Abwicklung eines Testlaufs: Anfangskapital, Währung, Hebel, Spread und Kommission. Es ist an kein Instrument gebunden.', 'A test account is a named, stored set of values for the settlement of a test run: initial capital, currency, leverage, spread and commission. It is not tied to an instrument.')}</p>
        </header>
        <div className="accounts-grid">
          <div className="card-box" data-testid="account-list">
            <h2>{L('Gespeicherte Testkonten', 'Stored test accounts')}</h2>
            {app.accounts.length === 0 && <p className="empty-note" data-testid="accounts-empty">{L('Es gibt kein Testkonto. Nächster Schritt: Legen Sie ein neues an.', 'There is no test account. Next step: create a new one.')}</p>}
            <ul className="acc-list">
              {app.accounts.map((a) => (
                <li key={a.id}>
                  <button type="button" className={`acc-item${selId === a.id ? ' on' : ''}`} onClick={() => choose(a)} data-testid="account-item" data-name={a.name}>
                    <Icon name="wallet" size={16} />
                    <span><b>{accountName(a, lang)}</b><small>{fmtMoney(a.capital, a.currency, lang, 0)} · 1:{a.leverage}</small></span>
                    {a.builtin && <span className="tag-own">{L('mitgeliefert', 'built in')}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <Btn icon="plus" testid="account-new" onClick={create}>{L('Neues Testkonto', 'New test account')}</Btn>
          </div>
          <div className="card-box" data-testid="account-form">
            {!draft ? (
              <p className="empty-note">{L('Nächster Schritt: Wählen Sie links ein Testkonto oder legen Sie ein neues an.', 'Next step: choose a test account on the left or create a new one.')}</p>
            ) : (
              <>
                <h2>{isNew ? L('Neues Testkonto', 'New test account') : L('Testkonto bearbeiten', 'Edit test account')}</h2>
                <Field label={L('Name', 'Name')} tip={L('Der Name, unter dem Sie das Testkonto im Testlauf wählen.', 'The name under which you choose the test account in a test run.')} required testid="acc-name">
                  <TextInput value={draft.name} onChange={(v) => set((a) => { a.name = v; })} ariaLabel={L('Name', 'Name')} testid="account-name" />
                </Field>
                <div className="grid2">
                  <Field label={L('Anfangskapital', 'Initial capital')} tip={L('Das Geld, mit dem ein Testlauf beginnt.', 'The money a test run starts with.')} required testid="acc-capital">
                    <NumberInput value={draft.capital} onChange={(v) => set((a) => { a.capital = v === '' ? 0 : v; })} ariaLabel={L('Anfangskapital', 'Initial capital')} testid="account-capital" />
                  </Field>
                  <Field label={L('Kontowährung', 'Account currency')} tip={L('Die Währung, in der Gewinn, Verlust und Kosten ausgewiesen werden.', 'The currency in which profit, loss and costs are shown.')} testid="acc-currency">
                    <Select value={draft.currency} onChange={(v) => set((a) => { a.currency = v; })} ariaLabel={L('Kontowährung', 'Account currency')} testid="account-currency">{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
                  </Field>
                  <Field label={L('Hebel', 'Leverage')} tip={L('Wie viel mehr Marktwert Sie mit dem Geld bewegen können; 30 bedeutet 1:30.', 'How much more market value you can move with the money; 30 means 1:30.')} required testid="acc-leverage">
                    <NumberInput value={draft.leverage} onChange={(v) => set((a) => { a.leverage = v === '' ? 0 : v; })} ariaLabel={L('Hebel', 'Leverage')} testid="account-leverage" unit=": 1" />
                  </Field>
                  <Field label={L('Kommission je Lot und Seite', 'Commission per lot and side')} tip={L('Gebühr je gehandeltem Lot, für Eröffnung und Schließung je einmal, in Kontowährung.', 'Fee per traded lot, once for opening and once for closing, in account currency.')} testid="acc-commission">
                    <NumberInput value={draft.commission} onChange={(v) => set((a) => { a.commission = v === '' ? 0 : v; })} ariaLabel={L('Kommission', 'Commission')} testid="account-commission" />
                  </Field>
                </div>
                <Field label={L('Spread', 'Spread')} tip={L('Der Spread ist der Abstand zwischen Kauf- und Verkaufskurs. „Aus den Kerzen“ nimmt den Spread, den der Broker je Kerze liefert; „fest“ rechnet mit einem festen Wert in Pips.', 'The spread is the distance between buy and sell price. "From the candles" takes the spread the broker delivers per candle; "fixed" uses a fixed value in pips.')} testid="acc-spread">
                  <div className="row">
                    <div className="seg" role="radiogroup" aria-label={L('Spread', 'Spread')}>
                      <button type="button" role="radio" aria-checked={draft.spreadMode === 'candle'} className={draft.spreadMode === 'candle' ? 'on' : ''} onClick={() => set((a) => { a.spreadMode = 'candle'; })} data-testid="account-spread-candle">{L('aus den Kerzen', 'from the candles')}</button>
                      <button type="button" role="radio" aria-checked={draft.spreadMode === 'fixed'} className={draft.spreadMode === 'fixed' ? 'on' : ''} onClick={() => set((a) => { a.spreadMode = 'fixed'; })} data-testid="account-spread-fixed">{L('fest', 'fixed')}</button>
                    </div>
                    {draft.spreadMode === 'fixed' && <NumberInput value={draft.spreadFixed} onChange={(v) => set((a) => { a.spreadFixed = v === '' ? 0 : v; })} ariaLabel={L('Fester Spread in Pips', 'Fixed spread in pips')} unit="Pips" testid="account-spread" />}
                  </div>
                </Field>
                {invalid && <p className="error-note" role="alert" data-testid="account-invalid"><Icon name="warn" size={14} />{L('Name, Anfangskapital (größer 0) und Hebel (mindestens 1) müssen angegeben sein.', 'Name, initial capital (above 0) and leverage (at least 1) must be given.')}</p>}
                <div className="btn-row">
                  <Btn kind="primary" icon="save" disabled={!dirty || invalid} testid="account-save" onClick={save}>{L('Speichern', 'Save')}</Btn>
                  <Btn kind="ghost" disabled={!dirty} testid="account-revert" onClick={() => { if (stored) setDraft(clone(stored)); else { const a = app.accounts[0]; if (a) choose(a); else setDraft(null); } }}>{L('Änderungen verwerfen', 'Discard changes')}</Btn>
                  <span className="spacer" />
                  <Btn kind="danger" icon="trash" disabled={isNew} testid="account-delete" onClick={() => setState({ dialog: { k: 'deleteAccount', id: draft.id } })}>{L('Löschen', 'Delete')}</Btn>
                </div>
                {dirty && <p className="muted" data-testid="account-dirty">{L('Ungespeicherte Änderungen.', 'Unsaved changes.')}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
