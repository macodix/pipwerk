// Deleting from the data stock (specification 5.5): a whole series or a period of it, the contract
// data of an instrument, or all data of a broker. Every time the backend is asked first what would
// be deleted (`confirm` false); the question names it and says that deleting cannot be undone;
// only after the user confirmed, the data are deleted (`confirm` true).
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { dataLabel } from './dataLabels';
import {
  BROKERS_QUERY_KEY,
  DETAILS_QUERY_KEY,
  SERIES_QUERY_KEY,
  TEST_RUN_BROKER_QUERY_KEY,
} from './dataQueries';
import { describeError } from './errors';
import { formatMoment, formatNumber } from './format';
import type { SupportedLanguage } from './i18n';
import { deleteData, type DeletionRequest, type DeletionResult } from './marketDataApi';
import { Modal } from './Modal';
import { Btn, Field, Icon } from './ui';

/** What the user chose to delete; a series is asked about further (whole, or a period). */
export type DeleteTarget =
  | { kind: 'series'; broker: string; instrument: string; data: string }
  | { kind: 'contract'; broker: string; instrument: string }
  | { kind: 'broker'; broker: string };

/** The value of a field `datetime-local` (`2026-01-05T08:00`) as a moment in UTC. */
function utcMoment(value: string): string | null {
  return /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value) ? `${value}:00Z` : null;
}

/** The period is valid for the backend: both moments, the beginning before the end, 1970 to 2100. */
export function periodProblem(start: string, end: string): boolean {
  const from = utcMoment(start);
  const to = utcMoment(end);
  return from === null || to === null || start >= end || start < '1970-01-01T00:00' || end > '2100-01-01T00:00';
}

export function DeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: DeleteTarget;
  onClose: () => void;
  /** The data are deleted; the argument is what the backend says it deleted. */
  onDeleted: (result: DeletionResult) => void;
}) {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'de';
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<'series' | 'period'>('series');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  // The question: what would be deleted. `null` until the backend has told.
  const [question, setQuestion] = useState<{ request: DeletionRequest; result: DeletionResult } | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<unknown>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>(null);

  function requestOf(): DeletionRequest | null {
    if (target.kind !== 'series') {
      return target;
    }
    if (scope === 'series') {
      return target;
    }
    const from = utcMoment(start);
    const to = utcMoment(end);
    if (from === null || to === null) {
      return null;
    }
    return { ...target, kind: 'period', start: from, end: to };
  }

  async function ask(request: DeletionRequest): Promise<void> {
    setAsking(true);
    setAskError(null);
    try {
      setQuestion({ request, result: await deleteData(request, false) });
    } catch (error) {
      setAskError(error);
    } finally {
      setAsking(false);
    }
  }

  // The contract data and the broker have nothing to choose: the question comes at once.
  useEffect(() => {
    if (target.kind !== 'series') {
      void ask(target);
    }
    // Once, when the dialog opens.
  }, []);

  async function confirm(): Promise<void> {
    if (question === null) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteData(question.request, true);
      // The broker for test runs after the deletion is in the answer.
      queryClient.setQueryData(TEST_RUN_BROKER_QUERY_KEY, result.testRunBroker);
      for (const queryKey of [SERIES_QUERY_KEY, DETAILS_QUERY_KEY, BROKERS_QUERY_KEY, TEST_RUN_BROKER_QUERY_KEY]) {
        void queryClient.invalidateQueries({ queryKey });
      }
      onDeleted(result);
      onClose();
    } catch (error) {
      setDeleteError(error);
      setDeleting(false);
    }
  }

  const choosing = target.kind === 'series' && question === null && askError === null;
  const request = requestOf();
  const periodBad = scope === 'period' && periodProblem(start, end);
  const kind = question?.result.kind ?? (target.kind === 'series' ? 'series' : target.kind);

  let footer;
  if (choosing) {
    footer = (
      <>
        <Btn testid="delete-cancel" onClick={onClose}>
          {t('common.cancel')}
        </Btn>
        <Btn
          kind="primary"
          testid="delete-next"
          disabled={asking || request === null || periodBad}
          onClick={() => {
            if (request !== null) {
              void ask(request);
            }
          }}
        >
          {t('delete.next')}
        </Btn>
      </>
    );
  } else if (question === null) {
    footer = (
      <Btn testid="delete-cancel" onClick={onClose}>
        {t('delete.close')}
      </Btn>
    );
  } else {
    footer = (
      <>
        <Btn testid="delete-cancel" onClick={onClose}>
          {t('common.cancel')}
        </Btn>
        <Btn kind="danger" icon="trash" testid="delete-confirm" disabled={deleting} onClick={() => void confirm()}>
          {t('delete.confirm')}
        </Btn>
      </>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={choosing ? t('delete.chooseTitle') : t(`delete.title.${kind}`)}
      icon="trash"
      testid="dialog-delete"
      initialFocus={choosing ? 'first-field' : 'footer'}
      footer={footer}
    >
      {choosing && (
        <>
          <p>
            {t('delete.chooseIntro', {
              broker: target.broker,
              instrument: target.kind === 'series' ? target.instrument : '',
              data: target.kind === 'series' ? dataLabel(t, target.data) : '',
            })}
          </p>
          <fieldset className="delete-scope" aria-label={t('delete.scope')}>
            <label>
              <input
                type="radio"
                name="delete-scope"
                checked={scope === 'series'}
                data-testid="delete-scope-series"
                onChange={() => {
                  setScope('series');
                }}
              />{' '}
              {t('delete.scopeSeries')}
            </label>
            <label>
              <input
                type="radio"
                name="delete-scope"
                checked={scope === 'period'}
                data-testid="delete-scope-period"
                onChange={() => {
                  setScope('period');
                }}
              />{' '}
              {t('delete.scopePeriod')}
            </label>
          </fieldset>
          {scope === 'period' && (
            <div className="grid2">
              <Field label={t('delete.start')} tip={t('delete.tip.start')} required testid="field-delete-start">
                {(id) => (
                  <input
                    className="input"
                    id={id}
                    type="datetime-local"
                    step={60}
                    value={start}
                    data-testid="delete-start"
                    onChange={(event) => {
                      setStart(event.target.value);
                    }}
                  />
                )}
              </Field>
              <Field label={t('delete.end')} tip={t('delete.tip.end')} required testid="field-delete-end">
                {(id) => (
                  <input
                    className="input"
                    id={id}
                    type="datetime-local"
                    step={60}
                    value={end}
                    data-testid="delete-end"
                    onChange={(event) => {
                      setEnd(event.target.value);
                    }}
                  />
                )}
              </Field>
            </div>
          )}
          {scope === 'period' && periodBad && (
            <p className="muted" data-testid="delete-period-hint">
              {t('delete.periodHint')}
            </p>
          )}
        </>
      )}
      {asking && (
        <p className="muted" role="status" data-testid="delete-checking">
          {t('delete.checking')}
        </p>
      )}
      {askError !== null && (
        <p className="error-note" role="alert" data-testid="delete-ask-error">
          <Icon name="warn" size={14} />
          {t('delete.askError', { reason: describeError(t, askError) })}
        </p>
      )}
      {question !== null && <Question result={question.result} language={language} />}
      {deleteError !== null && (
        <p className="error-note" role="alert" data-testid="delete-error">
          <Icon name="warn" size={14} />
          {t('delete.deleteError', { reason: describeError(t, deleteError) })}
        </p>
      )}
    </Modal>
  );
}

/** What would be deleted, in words, and that it cannot be undone. */
function Question({ result, language }: { result: DeletionResult; language: SupportedLanguage }) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, language, 0);
  const ticks = result.data === 'ticks';
  const facts: [string, string][] = [['broker', result.broker]];
  if (result.instrument !== null) {
    facts.push(['instrument', result.instrument]);
  }
  if (result.data !== null) {
    facts.push(['data', dataLabel(t, result.data)]);
  }
  if (result.kind === 'period' && result.start !== null && result.end !== null) {
    facts.push(['period', `${formatMoment(result.start, language)} – ${formatMoment(result.end, language)}`]);
  }

  let extent: string;
  if (result.kind === 'broker') {
    extent = t('delete.extent.broker', {
      series: t('delete.count.series', { count: result.seriesCount, n: n(result.seriesCount) }),
      candles: t('delete.count.candles', { count: result.candleCount, n: n(result.candleCount) }),
      ticks: t('delete.count.ticks', { count: result.tickCount, n: n(result.tickCount) }),
      instruments: t('delete.count.instruments', { count: result.instrumentCount, n: n(result.instrumentCount) }),
    });
  } else if (result.kind === 'contract') {
    extent = t('delete.extent.contract', { instrument: result.instrument ?? '' });
  } else if (ticks) {
    extent = t('delete.extent.ticks', { count: result.tickCount, n: n(result.tickCount) });
  } else {
    extent = t('delete.extent.candles', { count: result.candleCount, n: n(result.candleCount) });
  }

  return (
    <div className="delete-question" data-testid="delete-question">
      <dl className="contract-list" data-testid="delete-facts">
        {facts.map(([id, value]) => (
          <div key={id} className="delete-fact">
            <dt>{t(`delete.fact.${id}`)}</dt>
            <dd data-testid={`delete-fact-${id}`}>{value}</dd>
          </div>
        ))}
      </dl>
      <p data-testid="delete-extent">
        <b>{extent}</b>
      </p>
      {result.kind === 'period' && result.seriesCount > 0 && <p>{t('delete.seriesEnds')}</p>}
      {result.brokerRemoved && (
        <p data-testid="delete-broker-goes">{t('delete.brokerGoes', { broker: result.broker })}</p>
      )}
      {result.testRunBrokerReset && (
        <p data-testid="delete-test-broker">{t('delete.testBrokerReset', { broker: result.broker })}</p>
      )}
      <p className="hint-box" data-testid="delete-irreversible">
        <Icon name="warn" size={16} />
        {t('delete.irreversible')}
      </p>
    </div>
  );
}
