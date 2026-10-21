// Acquisition by hand (specification 5.4): the user names instrument, kind and period; pipwerk
// replay asks the source and imports what it delivers. The acquisition runs in the backend; the
// interface asks for its state until it is finished.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { INSTRUMENT_QUERY_KEY, OVERVIEW_QUERY_KEY, knownNames } from './dataQueries';
import { acquisitionErrorText, describeError } from './errors';
import { formatNumber, formatPeriod, isMinute, minuteToMoment } from './format';
import type { SupportedLanguage } from './i18n';
import {
  TIME_UNITS,
  fetchAcquisition,
  isTimeUnit,
  isValidName,
  startAcquisition,
  type AcquirePart,
  type Acquisition,
  type AcquisitionPart,
  type Overview,
  type TimeUnit,
} from './marketDataApi';
import { Btn, Field, Icon, Select, TextInput } from './ui';

type Kind = 'candles' | 'ticks' | 'instrument';

/** How often the state of a running acquisition is asked for. */
const POLL_INTERVAL_MS = 700;

/** `yyyy-mm-ddThh:mm`, the value of a field for date and time; read as UTC. */
function minuteValue(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/** The last seven whole days up to the start of today (UTC): the end is not included. */
function defaultPeriod(): { from: string; to: string } {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 7);
  return { from: minuteValue(from), to: minuteValue(to) };
}

export function AcquireCard({ overview }: { overview: Overview | undefined }) {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'de';
  const queryClient = useQueryClient();
  const names = knownNames(overview);

  const [instrument, setInstrument] = useState('');
  const [kind, setKind] = useState<Kind>('candles');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('h1');
  const [period, setPeriod] = useState(defaultPeriod);
  const [acquisitionId, setAcquisitionId] = useState<string | null>(null);

  const withPeriod = kind !== 'instrument';
  // `yyyy-mm-ddThh:mm` sorts like the moments it stands for.
  const periodValid =
    !withPeriod || (isMinute(period.from) && isMinute(period.to) && period.from < period.to);
  const ready = isValidName(instrument) && periodValid;

  const start = useMutation({
    mutationFn: async () => {
      let part: AcquirePart;
      if (kind === 'candles') {
        part = {
          kind,
          instrument,
          time_unit: timeUnit,
          start: minuteToMoment(period.from),
          end: minuteToMoment(period.to),
        };
      } else if (kind === 'ticks') {
        part = { kind, instrument, start: minuteToMoment(period.from), end: minuteToMoment(period.to) };
      } else {
        part = { kind, instrument };
      }
      return startAcquisition([part]);
    },
    onSuccess: (acquisition) => {
      setAcquisitionId(acquisition.id);
      queryClient.setQueryData(['acquisition', acquisition.id], acquisition);
    },
  });

  const state = useQuery({
    queryKey: ['acquisition', acquisitionId],
    queryFn: ({ signal }) => fetchAcquisition(acquisitionId ?? '', signal),
    enabled: acquisitionId !== null,
    refetchInterval: (query) => (query.state.data?.state === 'running' ? POLL_INTERVAL_MS : false),
    retry: false,
    networkMode: 'always',
  });

  const acquisition: Acquisition | undefined = acquisitionId === null ? undefined : state.data;
  const finished = acquisition?.state === 'finished';
  const running = start.isPending || (acquisitionId !== null && !finished && !state.isError);

  // Data that arrived are shown in the overview as soon as the acquisition is finished.
  const refreshed = useRef<string | null>(null);
  useEffect(() => {
    if (acquisition !== undefined && finished && refreshed.current !== acquisition.id) {
      refreshed.current = acquisition.id;
      void queryClient.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: INSTRUMENT_QUERY_KEY });
    }
  }, [acquisition, finished, queryClient]);

  function begin(): void {
    setAcquisitionId(null);
    start.reset();
    start.mutate();
  }

  return (
    <section className="card-box wide" data-testid="procure-card" aria-labelledby="acquire-title">
      <h2 id="acquire-title">
        <Icon name="download" size={16} />
        {t('acquire.title')}
      </h2>
      <p className="muted">{t('acquire.intro')}</p>
      <div className="grid3">
        <Field label={t('data.instrument')} tip={t('acquire.tip.instrument')} required testid="field-proc-instrument">
          {(id) => (
            <>
              <TextInput
                id={id}
                value={instrument}
                list="acquire-instruments"
                testid="proc-instrument"
                onChange={setInstrument}
              />
              <datalist id="acquire-instruments">
                {names.instruments.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field label={t('acquire.kind')} tip={t('acquire.tip.kind')} testid="field-proc-kind">
          {(id) => (
            <Select
              id={id}
              value={kind}
              testid="proc-kind"
              onChange={(value) => {
                setKind(value === 'ticks' ? 'ticks' : value === 'instrument' ? 'instrument' : 'candles');
              }}
            >
              <option value="candles">{t('data.candles')}</option>
              <option value="ticks">{t('data.ticks')}</option>
              <option value="instrument">{t('acquire.instrumentDetails')}</option>
            </Select>
          )}
        </Field>
        {kind === 'candles' && (
          <Field label={t('data.timeUnit')} tip={t('acquire.tip.timeUnit')} testid="field-proc-tf">
            {(id) => (
              <Select
                id={id}
                value={timeUnit}
                testid="proc-tf"
                onChange={(value) => {
                  if (isTimeUnit(value)) {
                    setTimeUnit(value);
                  }
                }}
              >
                {TIME_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit.toUpperCase()}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        {withPeriod && (
          <>
            <Field label={t('acquire.from')} tip={t('acquire.tip.from')} required testid="field-proc-from">
              {(id) => (
                <input
                  className="input"
                  id={id}
                  type="datetime-local"
                  value={period.from}
                  data-testid="proc-from"
                  onChange={(event) => {
                    setPeriod({ ...period, from: event.target.value });
                  }}
                />
              )}
            </Field>
            <Field label={t('acquire.to')} tip={t('acquire.tip.to')} required testid="field-proc-to">
              {(id) => (
                <input
                  className="input"
                  id={id}
                  type="datetime-local"
                  value={period.to}
                  data-testid="proc-to"
                  onChange={(event) => {
                    setPeriod({ ...period, to: event.target.value });
                  }}
                />
              )}
            </Field>
          </>
        )}
      </div>
      <div className="btn-row">
        <Btn kind="primary" icon="download" testid="proc-start" disabled={!ready || running} onClick={begin}>
          {t('acquire.start')}
        </Btn>
        {!ready && (
          <span className="muted" data-testid="proc-next-step">
            {periodValid ? t('acquire.nextStepInstrument') : t('acquire.periodInvalid')}
          </span>
        )}
      </div>

      {running && (
        <div data-testid="proc-running">
          <div
            className="progress progress-busy"
            role="progressbar"
            aria-label={t('acquire.running')}
            aria-valuetext={t('acquire.running')}
            data-testid="proc-progress"
          >
            <span />
          </div>
          <p className="muted">{t('acquire.running')}</p>
        </div>
      )}
      {start.isError && (
        <div className="finding error" role="alert" data-testid="proc-result" data-state="failed">
          <Icon name="warn" size={18} />
          <div className="finding-body">
            <strong>{t('acquire.failedTitle')}</strong>
            <p data-testid="proc-error-text">{describeError(t, start.error)}</p>
          </div>
        </div>
      )}
      {state.isError && !finished && (
        <div className="finding error" role="alert" data-testid="proc-result" data-state="failed">
          <Icon name="warn" size={18} />
          <div className="finding-body">
            <strong>{t('acquire.failedTitle')}</strong>
            <p data-testid="proc-error-text">{describeError(t, state.error)}</p>
          </div>
        </div>
      )}
      {acquisition !== undefined && finished &&
        acquisition.parts.map((part, index) => (
          <PartResult key={index} part={part} language={language} />
        ))}
    </section>
  );
}

function PartResult({ part, language }: { part: AcquisitionPart; language: SupportedLanguage }) {
  const { t } = useTranslation();
  if (part.state === 'succeeded' && part.result !== null) {
    const result = part.result;
    const n = (value: number) => formatNumber(value, language, 0);
    return (
      <div data-testid="proc-result" data-state="succeeded">
        <p className="ok-note" role="status">
          <Icon name="check" size={16} />
          <span data-testid="proc-summary">
            {result.kind === 'instrument'
              ? t('acquire.doneInstrument', { instrument: result.instrument, broker: result.broker })
              : t('acquire.done', {
                  accepted: n(result.accepted),
                  period:
                    result.periodStart !== null && result.periodEnd !== null
                      ? formatPeriod(result.periodStart, result.periodEnd, language)
                      : '–',
                })}
          </span>
        </p>
        <p className="muted" data-testid="proc-detail">
          {result.broker} · {result.instrument}
          {result.rejectedCount > 0 && ` · ${t('acquire.rejected', { count: n(result.rejectedCount) })}`}
          {part.omittedCount !== null && part.omittedCount > 0 &&
            ` · ${t('acquire.omitted', { count: n(part.omittedCount) })}`}
        </p>
      </div>
    );
  }
  const error = part.error;
  return (
    <div className="finding error" role="alert" data-testid="proc-result" data-state="failed" data-code={error?.code ?? ''}>
      <Icon name="warn" size={18} />
      <div className="finding-body">
        <strong>{t('acquire.failedTitle')}</strong>
        <p data-testid="proc-error-text">
          {error === null ? t('acquire.errors.acquisition_failed') : acquisitionErrorText(t, error.code, error.reason, error.fileError)}
        </p>
      </div>
    </div>
  );
}
