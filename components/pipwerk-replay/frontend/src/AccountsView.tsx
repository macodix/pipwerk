// Test accounts: create, edit, save, delete (specification 6.2 and 8.3).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_ACCOUNT_NAME,
  NEW_ACCOUNT_VALUES,
  checkAccountForm,
  formFromAccount,
  sameForm,
  valuesFromForm,
  type AccountForm,
} from './accountForm';
import { createAccount, deleteAccount, fetchAccounts, updateAccount, type Account } from './accountsApi';
import { describeError } from './errors';
import { formatNumber } from './format';
import type { SupportedLanguage } from './i18n';
import { Modal } from './Modal';
import { Btn, Field, Icon, NumberInput, TextInput } from './ui';

export const ACCOUNTS_QUERY_KEY = ['accounts'];

const CURRENCY_SUGGESTIONS = ['EUR', 'USD', 'GBP', 'CHF', 'JPY'];

type Draft = {
  /** The identifier of the stored test account; `null` for a new one. */
  id: string | null;
  form: AccountForm;
};

function useAccountName(): (account: Pick<Account, 'name' | 'isDefault'>) => string {
  const { t } = useTranslation();
  // The default test account is stored with its German name; the interface shows its own text.
  return (account) =>
    account.isDefault && account.name === DEFAULT_ACCOUNT_NAME ? t('accounts.defaultName') : account.name;
}

export function AccountsView() {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'de';
  const queryClient = useQueryClient();
  const accountName = useAccountName();
  const accountsQuery = useQuery({ queryKey: ACCOUNTS_QUERY_KEY, queryFn: ({ signal }) => fetchAccounts(signal) });
  const accounts = accountsQuery.data;

  const [draft, setDraft] = useState<Draft | null>(null);
  const [started, setStarted] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const storedId = draft?.id ?? null;
  const stored = storedId === null ? undefined : accounts?.find((a) => a.id === storedId);
  const isNew = draft !== null && draft.id === null;
  const problems = draft === null ? [] : checkAccountForm(draft.form);
  const dirty = draft !== null && (isNew || stored === undefined || !sameForm(draft.form, formFromAccount(stored)));

  function choose(account: Account): void {
    setDraft({ id: account.id, form: formFromAccount(account) });
    setSavedNote(null);
    saveMutation.reset();
  }

  // The first test account is shown at the start and after the shown one is gone (deleted).
  useEffect(() => {
    if (accounts === undefined) {
      return;
    }
    const shownGone = draft !== null && draft.id !== null && !accounts.some((a) => a.id === draft.id);
    if (!started || shownGone) {
      setStarted(true);
      const first = accounts[0];
      setDraft(first === undefined ? null : { id: first.id, form: formFromAccount(first) });
    }
    // `draft` is read, but only its identifier decides; choosing sets it.
  }, [accounts, started]);

  const saveMutation = useMutation({
    mutationFn: async (current: Draft) => {
      const values = valuesFromForm(current.form);
      return current.id === null ? createAccount(values) : updateAccount(current.id, values);
    },
    onSuccess: async (account) => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
      setDraft({ id: account.id, form: formFromAccount(account) });
      setSavedNote(t('accounts.saved', { name: accountName(account) }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: async () => {
      setDeleteOpen(false);
      setSavedNote(null);
      await queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  function create(): void {
    setDraft({ id: null, form: { name: t('accounts.newName'), ...NEW_ACCOUNT_VALUES } });
    setSavedNote(null);
    saveMutation.reset();
  }

  function change(patch: Partial<AccountForm>): void {
    setDraft((current) => (current === null ? current : { ...current, form: { ...current.form, ...patch } }));
    setSavedNote(null);
  }

  function discard(): void {
    if (stored !== undefined) {
      setDraft({ id: stored.id, form: formFromAccount(stored) });
    } else {
      const first = accounts?.[0];
      setDraft(first === undefined ? null : { id: first.id, form: formFromAccount(first) });
    }
    setSavedNote(null);
    saveMutation.reset();
  }

  const form = draft?.form;
  const problemText = problems.map((problem) => t(`accounts.problem.${problem}`));

  return (
    <section className="region page" data-testid="accounts" aria-labelledby="accounts-title">
      <div className="page-scroll">
        <header className="page-head">
          <h1 id="accounts-title">{t('accounts.title')}</h1>
          <p className="muted">{t('accounts.intro')}</p>
        </header>
        {accountsQuery.isError && (
          <p className="error-note" role="alert" data-testid="accounts-error">
            <Icon name="warn" size={14} />
            {t('accounts.loadError')}{' '}
            <Btn
              onClick={() => {
                void accountsQuery.refetch();
              }}
            >
              {t('common.retry')}
            </Btn>
          </p>
        )}
        <div className="accounts-grid">
          <div className="card-box" data-testid="account-list">
            <h2>{t('accounts.listTitle')}</h2>
            {accountsQuery.isPending && <p className="muted">{t('common.loading')}</p>}
            {accounts !== undefined && accounts.length === 0 && draft === null && (
              <p className="empty-note" data-testid="accounts-empty">
                {t('accounts.empty')}
              </p>
            )}
            <ul className="acc-list">
              {(accounts ?? []).map((account) => (
                <li key={account.id}>
                  <button
                    type="button"
                    className={`acc-item${draft?.id === account.id ? ' on' : ''}`}
                    aria-current={draft?.id === account.id ? 'true' : undefined}
                    onClick={() => {
                      choose(account);
                    }}
                    data-testid="account-item"
                    data-name={account.name}
                  >
                    <Icon name="wallet" size={16} />
                    <span>
                      <b>{accountName(account)}</b>
                      <small>
                        {formatNumber(account.initialCapital, language, 0)} {account.currency} · 1:{account.leverage}
                      </small>
                    </span>
                    {account.isDefault && <span className="tag-own">{t('accounts.builtIn')}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <Btn icon="plus" testid="account-new" onClick={create}>
              {t('accounts.new')}
            </Btn>
          </div>

          <div className="card-box" data-testid="account-form">
            {form === undefined || draft === null ? (
              <p className="empty-note" data-testid="account-form-empty">
                {t('accounts.formEmpty')}
              </p>
            ) : (
              <>
                <h2>{isNew ? t('accounts.new') : t('accounts.edit')}</h2>
                <Field label={t('accounts.name')} tip={t('accounts.tip.name')} required testid="field-name">
                  {(id) => (
                    <TextInput
                      id={id}
                      value={form.name}
                      testid="account-name"
                      onChange={(name) => {
                        change({ name });
                      }}
                    />
                  )}
                </Field>
                <div className="grid2">
                  <Field label={t('accounts.capital')} tip={t('accounts.tip.capital')} required testid="field-capital">
                    {(id) => (
                      <NumberInput
                        id={id}
                        value={form.initialCapital}
                        testid="account-capital"
                        onChange={(initialCapital) => {
                          change({ initialCapital });
                        }}
                      />
                    )}
                  </Field>
                  <Field label={t('accounts.currency')} tip={t('accounts.tip.currency')} required testid="field-currency">
                    {(id) => (
                      <>
                        <input
                          className="input"
                          id={id}
                          list="currency-suggestions"
                          value={form.currency}
                          maxLength={3}
                          autoComplete="off"
                          spellCheck={false}
                          data-testid="account-currency"
                          onChange={(event) => {
                            change({ currency: event.target.value.toUpperCase() });
                          }}
                        />
                        <datalist id="currency-suggestions">
                          {CURRENCY_SUGGESTIONS.map((currency) => (
                            <option key={currency} value={currency} />
                          ))}
                        </datalist>
                      </>
                    )}
                  </Field>
                  <Field label={t('accounts.leverage')} tip={t('accounts.tip.leverage')} required testid="field-leverage">
                    {(id) => (
                      <NumberInput
                        id={id}
                        value={form.leverage}
                        unit=": 1"
                        testid="account-leverage"
                        onChange={(leverage) => {
                          change({ leverage });
                        }}
                      />
                    )}
                  </Field>
                  <Field label={t('accounts.commission')} tip={t('accounts.tip.commission')} testid="field-commission">
                    {(id) => (
                      <NumberInput
                        id={id}
                        value={form.commissionPerLotSide}
                        testid="account-commission"
                        onChange={(commissionPerLotSide) => {
                          change({ commissionPerLotSide });
                        }}
                      />
                    )}
                  </Field>
                </div>
                <Field label={t('accounts.spread')} tip={t('accounts.tip.spread')} group testid="field-spread">
                  {(groupId) => (
                    <div className="row">
                      <div className="seg" role="radiogroup" aria-labelledby={groupId}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={form.spreadMode === 'candle'}
                          className={form.spreadMode === 'candle' ? 'on' : ''}
                          data-testid="account-spread-candle"
                          onClick={() => {
                            change({ spreadMode: 'candle' });
                          }}
                        >
                          {t('accounts.spreadCandle')}
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={form.spreadMode === 'fixed'}
                          className={form.spreadMode === 'fixed' ? 'on' : ''}
                          data-testid="account-spread-fixed"
                          onClick={() => {
                            change({ spreadMode: 'fixed' });
                          }}
                        >
                          {t('accounts.spreadFixed')}
                        </button>
                      </div>
                      {form.spreadMode === 'fixed' && (
                        <label className="inline-label">
                          <span className="visually-hidden">{t('accounts.spreadValue')}</span>
                          <NumberInput
                            value={form.spreadPoints}
                            unit={t('accounts.points')}
                            testid="account-spread"
                            onChange={(spreadPoints) => {
                              change({ spreadPoints });
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </Field>
                {problemText.length > 0 && (
                  <ul className="error-note problems" role="alert" data-testid="account-invalid">
                    {problemText.map((text) => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                )}
                {saveMutation.isError && (
                  <p className="error-note" role="alert" data-testid="account-save-error">
                    <Icon name="warn" size={14} />
                    {t('accounts.saveError', { reason: describeError(t, saveMutation.error) })}
                  </p>
                )}
                {deleteMutation.isError && (
                  <p className="error-note" role="alert" data-testid="account-delete-error">
                    <Icon name="warn" size={14} />
                    {t('accounts.deleteError', { reason: describeError(t, deleteMutation.error) })}
                  </p>
                )}
                <div className="btn-row">
                  <Btn
                    kind="primary"
                    icon="save"
                    disabled={!dirty || problems.length > 0 || saveMutation.isPending}
                    testid="account-save"
                    onClick={() => {
                      saveMutation.mutate(draft);
                    }}
                  >
                    {t('accounts.save')}
                  </Btn>
                  <Btn kind="ghost" disabled={!dirty} testid="account-revert" onClick={discard}>
                    {t('accounts.discard')}
                  </Btn>
                  <span className="spacer" />
                  <Btn
                    kind="danger"
                    icon="trash"
                    disabled={isNew || deleteMutation.isPending}
                    testid="account-delete"
                    onClick={() => {
                      deleteMutation.reset();
                      setDeleteOpen(true);
                    }}
                  >
                    {t('accounts.delete')}
                  </Btn>
                </div>
                {dirty && !saveMutation.isPending && (
                  <p className="muted" data-testid="account-dirty">
                    {t('accounts.unsaved')}
                  </p>
                )}
                {savedNote !== null && !dirty && (
                  <p className="ok-note" role="status" data-testid="account-saved">
                    <Icon name="check" size={16} />
                    {savedNote}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Modal
        open={deleteOpen && stored !== undefined}
        onClose={() => {
          setDeleteOpen(false);
        }}
        title={t('accounts.deleteTitle')}
        icon="trash"
        testid="dialog-delete-account"
        footer={
          <>
            <Btn
              testid="delete-cancel"
              onClick={() => {
                setDeleteOpen(false);
              }}
            >
              {t('common.cancel')}
            </Btn>
            <Btn
              kind="danger"
              icon="trash"
              testid="delete-ok"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (stored !== undefined) {
                  deleteMutation.mutate(stored.id);
                }
              }}
            >
              {t('accounts.delete')}
            </Btn>
          </>
        }
      >
        <p>{t('accounts.deleteText', { name: stored === undefined ? '' : accountName(stored) })}</p>
        {stored?.isDefault === true && <p className="hint-box">{t('accounts.deleteDefaultHint')}</p>}
      </Modal>
    </section>
  );
}
