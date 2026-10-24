// Data stock of historical price data (specification 5.1, 5.3, 5.5, 8.3): a bar with the import and
// the broker for test runs, a compact table with one row per series (filtered and paged by the
// backend), and the details of a row after a click: all gaps, the contract data and the deletion
// of the series, of a period and of the contract data. With a filter on one broker, all data of
// the broker can be deleted.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ALL_DATA_IDS, dataLabel } from './dataLabels';
import { DeleteDialog, type DeleteTarget } from './DeleteDialog';
import {
  PAGE_SIZE,
  TEST_RUN_BROKER_QUERY_KEY,
  dataFilterParam,
  useBrokers,
  useSeries,
  useSeriesDetails,
  useTestRunBroker,
} from './dataQueries';
import { describeError } from './errors';
import { formatDays, formatNumber, formatPeriod, formatMoment } from './format';
import type { SupportedLanguage } from './i18n';
import { ImportDialog } from './ImportDialog';
import { updateTestRunBroker, type DeletionResult, type SeriesRow } from './marketDataApi';
import { Btn, Field, Icon, Select, TextInput } from './ui';
import { useDebounced } from './useDebounced';

/** How long the filter waits after the last key before it asks the backend. */
const FILTER_DELAY_MS = 300;

function languageOf(language: string): SupportedLanguage {
  return language === 'en' ? 'en' : 'de';
}

type RowKey = Pick<SeriesRow, 'broker' | 'instrument' | 'data'>;

function sameRow(a: RowKey | null, b: RowKey): boolean {
  return a !== null && a.broker === b.broker && a.instrument === b.instrument && a.data === b.data;
}

export function DataView({ onOpenSettings }: { onOpenSettings?: () => void } = {}) {
  const { t } = useTranslation();
  const [importOpen, setImportOpen] = useState(false);
  // What the last deletion removed, said in a line under the bar.
  const [deleted, setDeleted] = useState<DeletionResult | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // After the dialog is closed (and gone, so the page is not locked any more) the focus returns
  // to the button that opened it. It is set explicitly and does not depend on the browser.
  useEffect(() => {
    if (wasOpen.current && !importOpen) {
      barRef.current?.querySelector('button')?.focus();
    }
    wasOpen.current = importOpen;
  }, [importOpen]);

  return (
    <section className="region page" data-testid="data" aria-labelledby="data-title">
      <div className="page-scroll">
        <header className="page-head">
          <h1 id="data-title">{t('data.title')}</h1>
          <p className="muted">{t('data.intro')}</p>
        </header>
        <section className="card-box wide" data-testid="data-bar" aria-label={t('data.barLabel')}>
          <div className="data-bar" ref={barRef}>
            <Btn
              kind="primary"
              icon="upload"
              testid="import-open"
              tip={t('data.tip.import')}
              onClick={() => {
                setDeleted(null);
                setImportOpen(true);
              }}
            >
              {t('data.importOpen')}
            </Btn>
            <TestRunBrokerField />
          </div>
          {deleted !== null && <DeletedNotice result={deleted} />}
        </section>
        <StockCard onDeleted={setDeleted} />
      </div>
      {importOpen && (
        <ImportDialog
          onOpenSettings={onOpenSettings}
          onClose={() => {
            setImportOpen(false);
          }}
        />
      )}
    </section>
  );
}

/** The choice of the broker for test runs among the brokers of the data stock. */
function TestRunBrokerField() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const brokers = useBrokers();
  const current = useTestRunBroker();
  const mutation = useMutation({
    mutationFn: (broker: string | null) => updateTestRunBroker(broker),
    onSuccess: (stored) => {
      queryClient.setQueryData(TEST_RUN_BROKER_QUERY_KEY, stored);
    },
  });
  const chosen = current.data?.chosen === true;
  const applied = current.data?.broker ?? null;
  // The select shows the user's choice. Without a choice it says so, and the line below it names
  // the broker that applies then (the first one in alphabetical order, specification 5.1).
  const value = chosen ? (applied ?? '') : '';
  const names = brokers.data ?? [];
  // A broker that is chosen but not in the list (the list is older) is still shown.
  const options = value !== '' && !names.includes(value) ? [...names, value] : names;
  const failure = brokers.error ?? current.error ?? mutation.error;

  return (
    <div className="test-broker">
      <Field label={t('data.testBroker')} tip={t('data.tip.testBroker')} testid="field-test-broker">
        {(id) => (
          <Select
            id={id}
            value={value}
            testid="select-test-broker"
            disabled={options.length === 0 || mutation.isPending}
            onChange={(next) => {
              mutation.mutate(next === '' ? null : next);
            }}
          >
            <option value="">{options.length === 0 ? t('data.testBrokerNone') : t('data.testBrokerNotChosen')}</option>
            {options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {!chosen && applied !== null && current.data !== undefined && (
        <p className="muted" data-testid="test-broker-applies">
          {t('data.testBrokerApplies', { broker: applied })}
        </p>
      )}
      {failure !== null && (
        <p className="error-note" role="alert" data-testid="test-broker-error">
          <Icon name="warn" size={14} />
          {t('data.testBrokerError', { reason: describeError(t, failure) })}
        </p>
      )}
    </div>
  );
}

/** What a deletion has removed, in one line. */
function DeletedNotice({ result }: { result: DeletionResult }) {
  const { t, i18n } = useTranslation();
  const language = languageOf(i18n.language);
  const what = {
    broker: result.broker,
    instrument: result.instrument ?? '',
    data: result.data === null ? '' : dataLabel(t, result.data),
    start: result.start === null ? '' : formatMoment(result.start, language),
    end: result.end === null ? '' : formatMoment(result.end, language),
  };
  return (
    <p className="ok-note" role="status" data-testid="delete-notice">
      <Icon name="check" size={16} />
      {t(`delete.done.${result.kind}`, what)}
      {result.testRunBrokerReset ? ` ${t('delete.doneNoTestBroker')}` : ''}
    </p>
  );
}

function StockCard({ onDeleted }: { onDeleted: (result: DeletionResult) => void }) {
  const { t, i18n } = useTranslation();
  const language = languageOf(i18n.language);
  const brokers = useBrokers();
  const [broker, setBroker] = useState('');
  const [instrument, setInstrument] = useState('');
  const [data, setData] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<RowKey | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const typed = useMemo(() => ({ broker: broker.trim(), instrument: instrument.trim(), data }), [broker, instrument, data]);
  const delayed = useDebounced(typed, FILTER_DELAY_MS);
  const filter = useMemo(
    () => ({ broker: delayed.broker, instrument: delayed.instrument, data: dataFilterParam(delayed.data) }),
    [delayed],
  );
  const filtered = filter.broker !== '' || filter.instrument !== '' || filter.data !== '';
  // "Alle Daten dieses Brokers löschen" is offered when the filter names one broker of the stock.
  const brokerMatches =
    filter.broker === ''
      ? []
      : (brokers.data ?? []).filter((name) => name.toLowerCase().includes(filter.broker.toLowerCase()));
  const series = useSeries(filter, page);
  const result = series.data;
  const total = result?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // After an import the stock can have fewer rows than before: show the last page then.
  useEffect(() => {
    if (result !== undefined && result.items.length === 0 && result.total > 0 && page > 0) {
      setPage(Math.max(0, Math.ceil(result.total / PAGE_SIZE) - 1));
    }
  }, [result, page]);

  function changeFilter(set: (value: string) => void): (value: string) => void {
    return (value) => {
      set(value);
      setPage(0);
      setSelected(null);
    };
  }

  function toggle(row: SeriesRow): void {
    setSelected(sameRow(selected, row) ? null : { broker: row.broker, instrument: row.instrument, data: row.data });
  }

  /** The row that is open may be gone after a deletion; the details stay only if it is still there. */
  function afterDeletion(result: DeletionResult): void {
    const stays =
      (result.kind === 'period' && result.seriesCount === 0) ||
      (result.kind === 'contract' && selected !== null && selected.data !== 'contract');
    if (!stays) {
      setSelected(null);
    }
    onDeleted(result);
  }

  const empty = result !== undefined && total === 0 && !filtered;
  const showFilters = result !== undefined && !empty;
  const first = page * PAGE_SIZE + 1;
  const last = page * PAGE_SIZE + (result?.items.length ?? 0);

  return (
    <section className="card-box wide" data-testid="stock" aria-labelledby="stock-title">
      <h2 id="stock-title">
        <Icon name="database" size={16} />
        {t('data.seriesTitle')}
      </h2>
      {series.isPending && <p className="muted">{t('common.loading')}</p>}
      {series.isError && (
        <p className="error-note" role="alert" data-testid="stock-error">
          <Icon name="warn" size={14} />
          {t('data.loadError', { reason: describeError(t, series.error) })}
        </p>
      )}
      {empty && (
        <p className="empty-note" data-testid="stock-empty">
          {t('data.empty')}
        </p>
      )}
      {showFilters && (
        <>
          <div className="data-filters" data-testid="stock-filters">
            <Field label={t('data.broker')} tip={t('data.tip.filterBroker')} testid="field-filter-broker">
              {(id) => (
                <>
                  <TextInput id={id} value={broker} list="filter-brokers" testid="filter-broker" onChange={changeFilter(setBroker)} />
                  <datalist id="filter-brokers">
                    {(brokers.data ?? []).map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
            <Field label={t('data.instrument')} tip={t('data.tip.filterInstrument')} testid="field-filter-instrument">
              {(id) => <TextInput id={id} value={instrument} testid="filter-instrument" onChange={changeFilter(setInstrument)} />}
            </Field>
            <Field label={t('data.dataKind')} tip={t('data.tip.filterData')} testid="field-filter-data">
              {(id) => (
                <>
                  <TextInput id={id} value={data} list="filter-data-ids" testid="filter-data" onChange={changeFilter(setData)} />
                  <datalist id="filter-data-ids">
                    {ALL_DATA_IDS.map((dataId) => (
                      <option key={dataId} value={dataLabel(t, dataId)} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
          </div>
          {brokerMatches.length > 0 && (
            <div className="broker-delete" data-testid="broker-delete">
              {brokerMatches.length === 1 ? (
                <>
                  <Btn
                    kind="danger"
                    icon="trash"
                    testid="delete-broker-open"
                    tip={t('data.tip.deleteBroker')}
                    onClick={() => {
                      setDeleteTarget({ kind: 'broker', broker: brokerMatches[0] as string });
                    }}
                  >
                    {t('data.deleteBroker')}
                  </Btn>
                  <span className="muted" data-testid="delete-broker-name">
                    {brokerMatches[0]}
                  </span>
                </>
              ) : (
                <p className="muted" data-testid="delete-broker-hint">
                  {t('data.deleteBrokerSeveral')}
                </p>
              )}
            </div>
          )}
          <div className="tbl-wrap stock-table-wrap">
            <table className="tbl stock-table" data-testid="stock-table">
              <thead>
                <tr>
                  <th data-tip={t('data.tip.columnBroker')}>{t('data.broker')}</th>
                  <th data-tip={t('data.tip.columnInstrument')}>{t('data.instrument')}</th>
                  <th data-tip={t('data.tip.columnData')}>{t('data.dataKind')}</th>
                  <th data-tip={t('data.tip.columnPeriod')}>{t('data.period')}</th>
                  <th className="num" data-tip={t('data.tip.columnGaps')}>
                    {t('data.gaps')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(result?.items ?? []).map((row) => {
                  const open = sameRow(selected, row);
                  return (
                    <Fragment key={`${row.broker}|${row.instrument}|${row.data}`}>
                      <tr
                        data-testid="stock-row"
                        data-broker={row.broker}
                        data-instrument={row.instrument}
                        data-data={row.data}
                        data-gaps={row.first === null ? '' : row.gapCount}
                        tabIndex={0}
                        aria-expanded={open}
                        data-tip={t('data.rowTip')}
                        onClick={() => {
                          toggle(row);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggle(row);
                          }
                        }}
                      >
                        <td>{row.broker}</td>
                        <td>
                          <b>{row.instrument}</b>
                        </td>
                        <td className="nowrap">{dataLabel(t, row.data)}</td>
                        <td>{row.first !== null && row.last !== null ? formatDays(row.first, row.last, language) : t('data.none')}</td>
                        <td className="num">{row.first === null ? t('data.none') : formatNumber(row.gapCount, language, 0)}</td>
                      </tr>
                      {open && (
                        <tr className="detail-row" data-testid="stock-detail-row">
                          <td colSpan={5}>
                            <RowDetails row={row} language={language} onDelete={setDeleteTarget} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total === 0 && (
            <p className="empty-note" data-testid="stock-nomatch">
              {t('data.noMatch')}
            </p>
          )}
          <div className="pager" data-testid="stock-pager">
            <span className="muted" data-testid="stock-count">
              {total === 0
                ? t('data.countNone')
                : t(filtered ? 'data.countFiltered' : 'data.count', {
                    from: formatNumber(first, language, 0),
                    to: formatNumber(last, language, 0),
                    total: formatNumber(total, language, 0),
                  })}
            </span>
            <div className="btn-row">
              <Btn
                small
                icon="left"
                testid="page-prev"
                disabled={page === 0}
                onClick={() => {
                  setPage(page - 1);
                  setSelected(null);
                }}
              >
                {t('data.previous')}
              </Btn>
              <span className="muted" data-testid="page-no">
                {t('data.page', { page: page + 1, pages })}
              </span>
              <Btn
                small
                icon="right"
                testid="page-next"
                disabled={page >= pages - 1}
                onClick={() => {
                  setPage(page + 1);
                  setSelected(null);
                }}
              >
                {t('data.next')}
              </Btn>
            </div>
          </div>
          <p className="muted">{t('data.timesUtc')}</p>
        </>
      )}
      {deleteTarget !== null && (
        <DeleteDialog
          target={deleteTarget}
          onClose={() => {
            setDeleteTarget(null);
          }}
          onDeleted={afterDeletion}
        />
      )}
    </section>
  );
}

function weekdayText(t: (key: string) => string, weekday: string): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.includes(weekday) ? t(`data.weekday.${weekday}`) : weekday;
}

/** The details of a row: all gaps with start and end, and the contract data of the instrument at this broker. */
function RowDetails({
  row,
  language,
  onDelete,
}: {
  row: SeriesRow;
  language: SupportedLanguage;
  onDelete: (target: DeleteTarget) => void;
}) {
  const { t } = useTranslation();
  const details = useSeriesDetails(row);
  const info = details.data?.contract ?? null;
  const n = (value: number) => formatNumber(value, language, 8);
  const items: [string, string, string][] =
    info === null
      ? []
      : [
          ['tickSize', t('data.tickSize'), n(info.tickSize)],
          ['tickValue', t('data.tickValue'), `${n(info.tickValue)} ${info.tickValueCurrency}`],
          ['pip', t('data.pip'), n(info.pip)],
          ['point', t('data.point'), n(info.point)],
          ['spread', t('data.spread'), n(info.spread)],
          ['minVolume', t('data.minVolume'), n(info.minVolume)],
          ['volumeStep', t('data.volumeStep'), n(info.volumeStep)],
          ['contractSize', t('data.contractSize'), n(info.contractSize)],
          ['swap', t('data.swap'), `${n(info.swapLong)} / ${n(info.swapShort)}`],
          ['tripleSwap', t('data.tripleSwap'), weekdayText(t, info.swapTripleWeekday)],
          ['margin', t('data.margin'), info.marginPerLot === null ? t('data.none') : n(info.marginPerLot)],
          ['contractFrom', t('data.contractFrom'), formatMoment(info.acquiredAt, language)],
        ];

  return (
    <div className="detail" data-testid="stock-detail">
      <h3>
        {row.broker} · {row.instrument} · {dataLabel(t, row.data)}
      </h3>
      {details.isPending && <p className="muted">{t('data.detailsLoading')}</p>}
      {details.isError && (
        <p className="error-note" role="alert" data-testid="detail-error">
          <Icon name="warn" size={14} />
          {t('data.detailsError', { reason: describeError(t, details.error) })}
        </p>
      )}
      {details.data !== undefined && (
        <div className="detail-actions" data-testid="detail-actions">
          {row.data !== 'contract' && (
            <Btn
              kind="danger"
              icon="trash"
              small
              testid="delete-open"
              tip={t('data.tip.deleteOpen')}
              onClick={() => {
                onDelete({ kind: 'series', broker: row.broker, instrument: row.instrument, data: row.data });
              }}
            >
              {t('data.deleteOpen')}
            </Btn>
          )}
          {info !== null && (
            <Btn
              kind="danger"
              icon="trash"
              small
              testid="delete-contract-open"
              tip={t('data.tip.deleteContract')}
              onClick={() => {
                onDelete({ kind: 'contract', broker: row.broker, instrument: row.instrument });
              }}
            >
              {t('data.deleteContract')}
            </Btn>
          )}
        </div>
      )}
      {details.data !== undefined && (
        <div className="detail-cols">
          {row.data !== 'contract' && (
            <div data-testid="detail-gaps">
              <h3>{t('data.gapsTitle')}</h3>
              <p className="muted" data-testid="gaps-explain">
                {t('data.gapsExplain')}
              </p>
              {details.data.gaps.length === 0 ? (
                <p className="muted" data-testid="gaps-none">
                  {t('data.noGaps')}
                </p>
              ) : (
                <>
                  <ul className="gap-list">
                    {details.data.gaps.map((gap) => (
                      <li key={gap.start} data-testid="gap-item">
                        {formatPeriod(gap.start, gap.end, language)}
                      </li>
                    ))}
                  </ul>
                  {details.data.row.gapCount > details.data.gaps.length && (
                    <p className="muted" data-testid="gaps-cut">
                      {t('data.gapsCut', {
                        shown: formatNumber(details.data.gaps.length, language, 0),
                        total: formatNumber(details.data.row.gapCount, language, 0),
                      })}
                    </p>
                  )}
                  <p className="muted">{t('data.timesUtc')}</p>
                </>
              )}
            </div>
          )}
          <div data-testid="detail-contract">
            <h3>{t('data.contractTitle')}</h3>
            {info === null ? (
              <p className="muted" data-testid="contract-missing">
                {t('data.contractMissing')}
              </p>
            ) : (
              <dl className="contract-list">
                {items.map(([id, label, value]) => (
                  <Fragment key={id}>
                    <dt data-tip={t(`data.tip.${id}`)}>{label}</dt>
                    <dd data-testid={`contract-${id}`}>{value}</dd>
                  </Fragment>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
