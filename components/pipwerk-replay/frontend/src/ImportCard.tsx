// Import of a file by hand (specification 5.3): JSON or CSV; for CSV the user says broker,
// instrument, time unit and time zone, because the file does not contain them.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DEFAULT_SOURCE_QUERY_KEY,
  INSTRUMENT_QUERY_KEY,
  OVERVIEW_QUERY_KEY,
  knownNames,
} from './dataQueries';
import { describeError, rejectReasonText } from './errors';
import { formatBytes, formatNumber, formatPeriod } from './format';
import type { SupportedLanguage } from './i18n';
import {
  TIME_UNITS,
  fetchDefaultSource,
  importCsv,
  importJson,
  isTimeUnit,
  isValidName,
  type ImportResult,
  type Overview,
  type TimeUnit,
} from './marketDataApi';
import { Btn, Field, Icon, Select, TextInput } from './ui';

type FileFormat = 'csv' | 'json';

export function formatOfFile(name: string): FileFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json')) {
    return 'json';
  }
  if (lower.endsWith('.csv')) {
    return 'csv';
  }
  return null;
}

/** The IANA time zone names the browser knows, with `UTC`, for suggestions. */
function timeZoneNames(): string[] {
  let names: string[] = [];
  try {
    names = Intl.supportedValuesOf('timeZone');
  } catch {
    names = [];
  }
  return names.includes('UTC') ? names : ['UTC', ...names];
}

export function ImportCard({ overview }: { overview: Overview | undefined }) {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'de';
  const queryClient = useQueryClient();
  const names = knownNames(overview);
  const defaultSource = useQuery({
    queryKey: DEFAULT_SOURCE_QUERY_KEY,
    queryFn: ({ signal }) => fetchDefaultSource(signal),
  });

  const [file, setFile] = useState<File | null>(null);
  // `null`: not typed yet, the default source is proposed for the broker.
  const [brokerTyped, setBrokerTyped] = useState<string | null>(null);
  const [instrument, setInstrument] = useState('');
  const [kind, setKind] = useState<'candles' | 'ticks'>('candles');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('h1');
  const [timezone, setTimezone] = useState('');
  const [inputKey, setInputKey] = useState(0);

  const format = file === null ? null : formatOfFile(file.name);
  const broker = brokerTyped ?? defaultSource.data ?? '';

  const mutation = useMutation({
    mutationFn: async (): Promise<ImportResult> => {
      if (file === null) {
        throw new Error('No file chosen');
      }
      if (format === 'json') {
        return importJson(file);
      }
      return importCsv(file, {
        kind,
        broker,
        instrument,
        timeUnit: kind === 'candles' ? timeUnit : null,
        timezone: timezone.trim(),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: INSTRUMENT_QUERY_KEY });
    },
  });

  const csvReady =
    isValidName(broker) && isValidName(instrument) && timezone.trim() !== '' && (kind === 'ticks' || isTimeUnit(timeUnit));
  const ready = file !== null && format !== null && (format === 'json' || csvReady);

  function chooseFile(chosen: File | null): void {
    setFile(chosen);
    mutation.reset();
  }

  function clearFile(): void {
    setFile(null);
    mutation.reset();
    // A file input keeps its file name; a new element lets the same file be chosen again.
    setInputKey((key) => key + 1);
  }

  return (
    <section className="card-box wide" data-testid="import-card" aria-labelledby="import-title">
      <h2 id="import-title">
        <Icon name="upload" size={16} />
        {t('import.title')}
      </h2>
      <p className="muted">{t('import.intro')}</p>
      <div className="btn-row">
        <label className="btn btn-default" data-tip={t('import.tip.choose')}>
          <Icon name="folder" size={17} />
          <span>{t('import.choose')}</span>
          <input
            key={inputKey}
            type="file"
            accept=".csv,.json"
            className="visually-hidden"
            data-testid="import-file"
            onChange={(event) => {
              chooseFile(event.target.files?.[0] ?? null);
            }}
          />
        </label>
        {file !== null && (
          <Btn kind="ghost" testid="import-clear" onClick={clearFile}>
            {t('import.clear')}
          </Btn>
        )}
      </div>

      {file === null && (
        <p className="empty-note" data-testid="import-empty">
          {t('import.empty')}
        </p>
      )}

      {file !== null && (
        <div className="import-box" data-testid="import-box">
          <h3 data-testid="import-name">
            {file.name} · {formatBytes(file.size, language)}
          </h3>
          {format === null ? (
            <p className="error-note" role="alert" data-testid="import-format-unknown">
              <Icon name="warn" size={14} />
              {t('import.formatUnknown')}
            </p>
          ) : (
            <p className="muted" data-testid="import-format">
              {t('import.formatKnown', { format: format.toUpperCase() })}
            </p>
          )}

          {format === 'csv' && (
            <>
              <p className="muted">{t('import.csvNote')}</p>
              <div className="grid3">
                <Field label={t('data.broker')} tip={t('import.tip.broker')} required testid="field-import-broker">
                  {(id) => (
                    <>
                      <TextInput
                        id={id}
                        value={broker}
                        list="import-brokers"
                        testid="import-broker"
                        onChange={setBrokerTyped}
                      />
                      <datalist id="import-brokers">
                        {names.brokers.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </>
                  )}
                </Field>
                <Field label={t('data.instrument')} tip={t('import.tip.instrument')} required testid="field-import-instrument">
                  {(id) => (
                    <>
                      <TextInput
                        id={id}
                        value={instrument}
                        list="import-instruments"
                        testid="import-instrument"
                        onChange={setInstrument}
                      />
                      <datalist id="import-instruments">
                        {names.instruments.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </>
                  )}
                </Field>
                <Field label={t('import.kind')} tip={t('import.tip.kind')} testid="field-import-kind">
                  {(id) => (
                    <Select
                      id={id}
                      value={kind}
                      testid="import-kind"
                      onChange={(value) => {
                        setKind(value === 'ticks' ? 'ticks' : 'candles');
                      }}
                    >
                      <option value="candles">{t('data.candles')}</option>
                      <option value="ticks">{t('data.ticks')}</option>
                    </Select>
                  )}
                </Field>
                {kind === 'candles' && (
                  <Field label={t('data.timeUnit')} tip={t('import.tip.timeUnit')} testid="field-import-time-unit">
                    {(id) => (
                      <Select
                        id={id}
                        value={timeUnit}
                        testid="import-time-unit"
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
                <Field label={t('import.timezone')} tip={t('import.tip.timezone')} required testid="field-import-timezone">
                  {(id) => (
                    <>
                      <TextInput
                        id={id}
                        value={timezone}
                        list="import-timezones"
                        placeholder="Europe/Athens"
                        testid="import-timezone"
                        onChange={setTimezone}
                      />
                      <datalist id="import-timezones">
                        {timeZoneNames().map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </>
                  )}
                </Field>
              </div>
            </>
          )}

          {format === 'json' && <p className="muted">{t('import.jsonNote')}</p>}

          {!mutation.isSuccess && (
            <div className="btn-row">
              <Btn
                kind="primary"
                icon="download"
                disabled={!ready || mutation.isPending}
                testid="import-run"
                onClick={() => {
                  mutation.mutate();
                }}
              >
                {mutation.isPending ? t('import.running') : t('import.run')}
              </Btn>
              {!ready && format !== null && <span className="muted">{t('import.nextStep')}</span>}
            </div>
          )}
        </div>
      )}

      {mutation.isError && (
        <div className="finding error" role="alert" data-testid="import-error">
          <Icon name="warn" size={18} />
          <div className="finding-body">
            <strong>{t('import.refused')}</strong>
            <p>{describeError(t, mutation.error)}</p>
          </div>
        </div>
      )}
      {mutation.isSuccess && <ImportResultBox result={mutation.data} language={language} />}
    </section>
  );
}

function ImportResultBox({ result, language }: { result: ImportResult; language: SupportedLanguage }) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, language, 0);
  const series =
    result.kind === 'ticks'
      ? t('data.ticks')
      : result.kind === 'candles'
        ? `${t('data.candles')} ${(result.unit ?? '').toUpperCase()}`
        : t('import.instrumentDetails');
  return (
    <div className="import-result" data-testid="import-result">
      <p className="ok-note" role="status">
        <Icon name="check" size={16} />
        <span data-testid="import-summary">
          {result.kind === 'instrument'
            ? t('import.resultInstrument', { instrument: result.instrument, broker: result.broker })
            : t('import.result', { accepted: n(result.accepted), replaced: n(result.replaced) })}
        </span>
      </p>
      <dl className="about-list">
        <dt>{t('import.resultSeries')}</dt>
        <dd data-testid="import-series">
          {result.broker} · {result.instrument} · {series}
        </dd>
        {result.periodStart !== null && result.periodEnd !== null && (
          <>
            <dt>{t('import.resultPeriod')}</dt>
            <dd data-testid="import-period">{formatPeriod(result.periodStart, result.periodEnd, language)} (UTC)</dd>
          </>
        )}
        <dt>{t('import.resultRejected')}</dt>
        <dd data-testid="import-rejected-count">{n(result.rejectedCount)}</dd>
      </dl>
      {result.rejectedCount > 0 && (
        <>
          <div className="tbl-wrap">
            <table className="tbl" data-testid="import-rejected">
              <thead>
                <tr>
                  <th>{t('import.rejectedRow')}</th>
                  <th>{t('import.rejectedReason')}</th>
                </tr>
              </thead>
              <tbody>
                {result.rejected.map((rejected) => (
                  <tr key={`${rejected.row}|${rejected.reason}`} data-testid="import-rejected-row" data-reason={rejected.reason}>
                    <td>{n(rejected.row)}</td>
                    <td>{rejectReasonText(t, rejected.reason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.rejectedCount > result.rejected.length && (
            <p className="muted">
              {t('import.rejectedCut', { shown: n(result.rejected.length), total: n(result.rejectedCount) })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
