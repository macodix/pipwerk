// Data stock of historical price data (specification 5.1 to 5.4, 8.3): overview with periods and
// gaps, details of the instruments, default source, import of a file and acquisition by hand.
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AcquireCard } from './AcquireCard';
import {
  DEFAULT_SOURCE_QUERY_KEY,
  INSTRUMENT_QUERY_KEY,
  knownNames,
  useOverview,
} from './dataQueries';
import { describeError } from './errors';
import { formatMoment, formatNumber, formatPeriod } from './format';
import type { SupportedLanguage } from './i18n';
import { ImportCard } from './ImportCard';
import {
  fetchDefaultSource,
  fetchInstrument,
  isValidName,
  updateDefaultSource,
  type InstrumentInfo,
  type Overview,
  type Series,
} from './marketDataApi';
import { Btn, Field, Icon, TextInput } from './ui';

/** How many periods or gaps of a series are listed in a table cell. */
const SHOWN_PERIODS = 3;

function languageOf(language: string): SupportedLanguage {
  return language === 'en' ? 'en' : 'de';
}

export function DataView() {
  const { t } = useTranslation();
  const overview = useOverview();

  return (
    <section className="region page" data-testid="data" aria-labelledby="data-title">
      <div className="page-scroll">
        <header className="page-head">
          <h1 id="data-title">{t('data.title')}</h1>
          <p className="muted">{t('data.intro')}</p>
        </header>
        <StockCard overview={overview} />
        <InstrumentsCard overview={overview.data} />
        <DefaultSourceCard overview={overview.data} />
        <ImportCard overview={overview.data} />
        <AcquireCard overview={overview.data} />
      </div>
    </section>
  );
}

function dataLabel(t: (key: string) => string, unit: string): string {
  return unit === 'ticks' ? t('data.ticks') : `${t('data.candles')} ${unit.toUpperCase()}`;
}

function StockCard({ overview }: { overview: ReturnType<typeof useOverview> }) {
  const { t, i18n } = useTranslation();
  const language = languageOf(i18n.language);
  const data = overview.data;

  return (
    <section className="card-box wide" data-testid="stock" aria-labelledby="stock-title">
      <div className="card-head">
        <h2 id="stock-title">
          <Icon name="database" size={16} />
          {t('data.stockTitle')}
        </h2>
        <Btn
          icon="refresh"
          testid="stock-refresh"
          disabled={overview.isFetching}
          onClick={() => {
            void overview.refetch();
          }}
        >
          {t('common.refresh')}
        </Btn>
      </div>
      {overview.isPending && <p className="muted">{t('common.loading')}</p>}
      {overview.isError && (
        <p className="error-note" role="alert" data-testid="stock-error">
          <Icon name="warn" size={14} />
          {t('data.loadError', { reason: describeError(t, overview.error) })}
        </p>
      )}
      {data !== undefined && data.series.length === 0 && (
        <p className="empty-note" data-testid="stock-empty">
          {t('data.stockEmpty')}
        </p>
      )}
      {data !== undefined && data.series.length > 0 && (
        <>
          <div className="tbl-wrap">
            <table className="tbl" data-testid="stock-table">
              <thead>
                <tr>
                  <th>{t('data.broker')}</th>
                  <th>{t('data.instrument')}</th>
                  <th>{t('data.dataKind')}</th>
                  <th>{t('data.periods')}</th>
                  <th>{t('data.gaps')}</th>
                  <th>{t('data.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {data.series.map((series) => (
                  <StockRow key={`${series.broker}|${series.instrument}|${series.unit}`} series={series} language={language} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">{t('data.timesUtc')}</p>
          {data.seriesTotal > data.series.length && (
            <p className="muted" data-testid="stock-cut">
              {t('data.cut', { shown: data.series.length, total: data.seriesTotal })}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function StockRow({ series, language }: { series: Series; language: SupportedLanguage }) {
  const { t } = useTranslation();
  const hiddenPeriods = series.coveredCount - Math.min(series.covered.length, SHOWN_PERIODS);
  const gaps = series.missing;
  const hiddenGaps = series.missingCount - Math.min(gaps.length, SHOWN_PERIODS);
  return (
    <tr
      data-testid="stock-row"
      data-broker={series.broker}
      data-instrument={series.instrument}
      data-unit={series.unit}
    >
      <td>{series.broker}</td>
      <td>
        <b>{series.instrument}</b>
      </td>
      <td>{dataLabel(t, series.unit)}</td>
      <td data-testid="stock-periods">
        <ul className="plain">
          {series.covered.slice(0, SHOWN_PERIODS).map((period) => (
            <li key={period.start}>{formatPeriod(period.start, period.end, language)}</li>
          ))}
          {hiddenPeriods > 0 && <li className="muted">{t('data.more', { count: hiddenPeriods })}</li>}
        </ul>
      </td>
      <td data-testid="stock-gaps" data-gap-count={series.missingCount}>
        {series.missingCount === 0 ? (
          <span className="state-chip present">{t('data.noGaps')}</span>
        ) : (
          <ul className="plain">
            {gaps.slice(0, SHOWN_PERIODS).map((gap) => (
              <li key={gap.start} className="gap">
                <Icon name="warn" size={13} />
                {formatPeriod(gap.start, gap.end, language)}
              </li>
            ))}
            {hiddenGaps > 0 && <li className="muted">{t('data.more', { count: hiddenGaps })}</li>}
          </ul>
        )}
      </td>
      <td>{formatNumber(series.count, language, 0)}</td>
    </tr>
  );
}

function weekdayText(t: (key: string) => string, weekday: string): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.includes(weekday) ? t(`data.weekday.${weekday}`) : weekday;
}

function InstrumentsCard({ overview }: { overview: Overview | undefined }) {
  const { t, i18n } = useTranslation();
  const language = languageOf(i18n.language);
  const entries = overview?.instruments ?? [];
  const details = useQueries({
    queries: entries.map((entry) => ({
      // The time of the acquisition is part of the key: newer details replace the shown ones.
      queryKey: [...INSTRUMENT_QUERY_KEY, entry.broker, entry.instrument, entry.acquiredAt],
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchInstrument(entry.broker, entry.instrument, signal),
    })),
  });
  const infos: (InstrumentInfo | undefined)[] = details.map((query) => query.data);
  const failed = details.some((query) => query.isError);
  const n = (value: number) => formatNumber(value, language, 8);

  return (
    <section className="card-box wide" data-testid="instr-table-card" aria-labelledby="instr-title">
      <h2 id="instr-title">
        <Icon name="list" size={16} />
        {t('data.instrumentsTitle')}
      </h2>
      <p className="muted">{t('data.instrumentsIntro')}</p>
      {entries.length === 0 ? (
        <p className="empty-note" data-testid="instr-empty">
          {t('data.instrumentsEmpty')}
        </p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl" data-testid="instr-table">
            <thead>
              <tr>
                <th>{t('data.broker')}</th>
                <th>{t('data.instrument')}</th>
                <th>{t('data.acquiredAt')}</th>
                <th>{t('data.tickSize')}</th>
                <th>{t('data.tickValue')}</th>
                <th>{t('data.pip')}</th>
                <th>{t('data.point')}</th>
                <th>{t('data.spread')}</th>
                <th>{t('data.minVolume')}</th>
                <th>{t('data.volumeStep')}</th>
                <th>{t('data.contractSize')}</th>
                <th>{t('data.swap')}</th>
                <th>{t('data.tripleSwap')}</th>
                <th>{t('data.margin')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const info = infos[index];
                return (
                  <tr
                    key={`${entry.broker}|${entry.instrument}`}
                    data-testid="instr-row"
                    data-instrument={entry.instrument}
                  >
                    <td>{entry.broker}</td>
                    <td>
                      <b>{entry.instrument}</b>
                    </td>
                    <td>{formatMoment(entry.acquiredAt, language)}</td>
                    {info === undefined ? (
                      <td colSpan={11} className="muted">
                        {details[index]?.isError === true ? t('data.detailsError') : t('common.loading')}
                      </td>
                    ) : (
                      <>
                        <td>{n(info.tickSize)}</td>
                        <td>
                          {n(info.tickValue)} {info.tickValueCurrency}
                        </td>
                        <td>{n(info.pip)}</td>
                        <td>{n(info.point)}</td>
                        <td>{n(info.spread)}</td>
                        <td>{n(info.minVolume)}</td>
                        <td>{n(info.volumeStep)}</td>
                        <td>{n(info.contractSize)}</td>
                        <td>
                          {n(info.swapLong)} / {n(info.swapShort)}
                        </td>
                        <td>{weekdayText(t, info.swapTripleWeekday)}</td>
                        <td>{info.marginPerLot === null ? '–' : n(info.marginPerLot)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {failed && (
        <p className="error-note" role="alert">
          <Icon name="warn" size={14} />
          {t('data.detailsError')}
        </p>
      )}
      {overview !== undefined && overview.instrumentsTotal > entries.length && (
        <p className="muted">{t('data.cut', { shown: entries.length, total: overview.instrumentsTotal })}</p>
      )}
    </section>
  );
}

function DefaultSourceCard({ overview }: { overview: Overview | undefined }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: DEFAULT_SOURCE_QUERY_KEY,
    queryFn: ({ signal }) => fetchDefaultSource(signal),
  });
  const [typed, setTyped] = useState<string | null>(null);
  const current = query.data ?? null;
  const value = typed ?? current ?? '';
  const mutation = useMutation({
    mutationFn: (broker: string | null) => updateDefaultSource(broker),
    onSuccess: async (broker) => {
      queryClient.setQueryData(DEFAULT_SOURCE_QUERY_KEY, broker);
      setTyped(null);
    },
  });
  const names = knownNames(overview).brokers;
  const valid = isValidName(value);
  const changed = value !== (current ?? '');

  return (
    <section className="card-box wide" data-testid="default-source-card" aria-labelledby="source-title">
      <h2 id="source-title">
        <Icon name="database" size={16} />
        {t('data.sourceTitle')}
      </h2>
      <p className="muted">{t('data.sourceIntro')}</p>
      {query.isError ? (
        <p className="error-note" role="alert">
          <Icon name="warn" size={14} />
          {t('data.sourceLoadError')}
        </p>
      ) : (
        <p data-testid="default-source-current">
          {current === null ? t('data.sourceNone') : t('data.sourceCurrent', { broker: current })}
        </p>
      )}
      {names.length === 0 && current === null && (
        <p className="empty-note" data-testid="source-empty">
          {t('data.sourceEmpty')}
        </p>
      )}
      <div className="grid3">
        <Field label={t('data.broker')} tip={t('data.tip.sourceBroker')} testid="field-source-broker">
          {(id) => (
            <>
              <TextInput
                id={id}
                value={value}
                list="source-brokers"
                testid="source-broker"
                onChange={(next) => {
                  setTyped(next);
                }}
              />
              <datalist id="source-brokers">
                {names.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </>
          )}
        </Field>
      </div>
      <div className="btn-row">
        <Btn
          kind="primary"
          icon="check"
          testid="source-set"
          disabled={!valid || !changed || mutation.isPending}
          onClick={() => {
            mutation.mutate(value);
          }}
        >
          {t('data.sourceSet')}
        </Btn>
        <Btn
          testid="source-clear"
          disabled={current === null || mutation.isPending}
          onClick={() => {
            mutation.mutate(null);
          }}
        >
          {t('data.sourceClear')}
        </Btn>
        {value !== '' && !valid && (
          <span className="error-note" role="alert">
            <Icon name="warn" size={14} />
            {t('data.sourceInvalid')}
          </span>
        )}
      </div>
      {mutation.isError && (
        <p className="error-note" role="alert" data-testid="source-error">
          <Icon name="warn" size={14} />
          {t('data.sourceSaveError', { reason: describeError(t, mutation.error) })}
        </p>
      )}
    </section>
  );
}
