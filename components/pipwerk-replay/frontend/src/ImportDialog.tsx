// Dialog "Datei importieren" (specification 5.3, 8.3): any number of files at once, JSON and CSV
// mixed. One broker for all files, one time zone for all CSV files, instrument and data per file
// (preset from the preview of the web API: the name of a CSV file, the content of a JSON file).
// One click on "Importieren" imports all of them in one import process, one request per file; the
// dialog shows the state of each file and the number of files done, and the import can be
// cancelled. The result is listed per file.
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CSV_DATA_IDS, dataLabel } from './dataLabels';
import {
  BROKERS_QUERY_KEY,
  DETAILS_QUERY_KEY,
  SERIES_QUERY_KEY,
  TEST_RUN_BROKER_QUERY_KEY,
  useBrokers,
} from './dataQueries';
import { describeError, fileErrorText, rejectReasonText } from './errors';
import { formatBytes, formatNumber, formatPeriod } from './format';
import type { SupportedLanguage } from './i18n';
import { readFiles, runImportProcess, type Failure, type FileResult } from './importProcess';
import { isValidName, type FileHint, type FileOutcome, type ImportResult } from './marketDataApi';
import { Modal } from './Modal';
import { Btn, Field, Icon, Select, TextInput } from './ui';

/** Where a file is: before an import (`idle`) or in the run of one. */
type Phase = 'idle' | 'waiting' | 'importing' | 'taken' | 'refused' | 'skipped';

/** A file of the dialog with what is known about it. */
type Item = {
  uid: number;
  file: File;
  hint: FileHint;
  /** The instrument of the file; the user may change it. */
  instrument: string;
  /** The identifier of the data; for a CSV file the user may change it. */
  data: string;
  phase: Phase;
  /** What the import said about the file (taken over or refused); `null` before. */
  outcome: FileOutcome | null;
  /** Why the request of the file failed, if it did. */
  failure: Failure | null;
};

type ItemState = 'needs' | 'ready' | Exclude<Phase, 'idle'>;

/** A file whose content cannot be read gets no input: it is refused by the import anyway. */
function needsInput(item: Item): boolean {
  return item.hint.error === null && (item.instrument.trim() === '' || item.data === '');
}

function stateOf(item: Item): ItemState {
  if (item.phase !== 'idle') {
    return item.phase;
  }
  return needsInput(item) ? 'needs' : 'ready';
}

/** What a result does to the file. */
function afterResult(result: FileResult): Pick<Item, 'phase' | 'outcome' | 'failure'> {
  switch (result.kind) {
    case 'taken':
      return { phase: 'taken', outcome: result.outcome, failure: null };
    case 'refused':
      return { phase: 'refused', outcome: result.outcome, failure: null };
    case 'failed':
      return { phase: 'refused', outcome: null, failure: result.failure };
    case 'skipped':
      return { phase: 'skipped', outcome: null, failure: null };
  }
}

/** The broker that all readable JSON files name, if they all name the same one; else empty. */
function commonBroker(items: Item[]): string {
  const names = new Set<string>();
  for (const item of items) {
    if (item.hint.format === 'json' && item.hint.error === null) {
      if (item.hint.broker === null) {
        return '';
      }
      names.add(item.hint.broker);
    }
  }
  const [only] = [...names];
  return names.size === 1 && only !== undefined ? only : '';
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

type Run = {
  state: 'idle' | 'running' | 'cancelling';
  /** Files in the run, and files that were taken over before it (not part of it). */
  total: number;
  base: number;
  /** A run has ended and its summary is shown. */
  finished: boolean;
  /** The request that stopped the run. */
  failure: Failure | null;
};

const NO_RUN: Run = { state: 'idle', total: 0, base: 0, finished: false, failure: null };

function failureText(t: ReturnType<typeof useTranslation>['t'], failure: Failure): string {
  return failure.kind === 'ended' ? t('import.processEnded') : describeError(t, failure.error);
}

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'de';
  const queryClient = useQueryClient();
  const brokers = useBrokers();
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const mounted = useRef(true);
  const cancelled = useRef(false);
  const closeAfter = useRef(false);
  const [items, setItems] = useState<Item[]>([]);
  // `null`: the user has not typed; the broker is then the one the JSON files name.
  const [brokerTyped, setBrokerTyped] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('');
  const [reading, setReading] = useState<{ done: number; total: number } | null>(null);
  const [readError, setReadError] = useState<unknown>(null);
  const [run, setRun] = useState<Run>(NO_RUN);
  const [askClose, setAskClose] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      // The dialog is gone (the view changed): a run that is going on ends after its current file.
      mounted.current = false;
      cancelled.current = true;
    };
  }, []);

  const running = run.state !== 'idle';
  const broker = (brokerTyped ?? commonBroker(items)).trim();
  const pending = items.filter((item) => item.phase !== 'taken');
  const anyCsv = items.some((item) => item.hint.format === 'csv');
  const csvPending = pending.some((item) => item.hint.format === 'csv');
  const waiting = pending.filter(needsInput);
  const brokerBad = !isValidName(broker);
  const zoneBad = csvPending && timezone.trim() === '';
  const blocked = pending.length === 0 || waiting.length > 0 || brokerBad || zoneBad;

  const taken = items.filter((item) => item.phase === 'taken').length;
  const refused = items.filter((item) => item.phase === 'refused').length;
  const skipped = items.filter((item) => item.phase === 'skipped').length;
  const done = taken + refused + skipped - run.base;

  function patch(uid: number, changes: Partial<Item>): void {
    setItems((current) => current.map((item) => (item.uid === uid ? { ...item, ...changes } : item)));
  }

  async function choose(files: File[]): Promise<void> {
    if (files.length === 0) {
      return;
    }
    setReadError(null);
    setRun((current) => ({ ...current, finished: false }));
    setReading({ done: 0, total: files.length });
    const read = await readFiles(
      files,
      (count) => {
        setReading({ done: count, total: files.length });
      },
      () => !mounted.current,
    );
    if (!mounted.current) {
      return;
    }
    const added = read.hints.map((hint, index): Item => {
      counter.current += 1;
      return {
        uid: counter.current,
        file: files[index] as File,
        hint,
        instrument: hint.instrument ?? '',
        data: hint.data ?? '',
        phase: 'idle',
        outcome: null,
        failure: null,
      };
    });
    setItems((current) => [...current, ...added]);
    setReading(null);
    setReadError(read.error);
  }

  async function start(): Promise<void> {
    const batch = pending;
    const base = items.length - batch.length;
    cancelled.current = false;
    closeAfter.current = false;
    setAskClose(false);
    setItems((current) =>
      current.map((item) =>
        item.phase === 'taken' ? item : { ...item, phase: 'waiting', outcome: null, failure: null },
      ),
    );
    setRun({ state: 'running', total: batch.length, base, finished: false, failure: null });
    const end = await runImportProcess({
      broker,
      timezone: timezone.trim(),
      files: batch.map((item) => ({
        uid: item.uid,
        file: item.file,
        format: item.hint.format,
        instrument: item.instrument.trim(),
        data: item.data,
      })),
      isCancelled: () => cancelled.current,
      onStart: (uid) => {
        patch(uid, { phase: 'importing' });
      },
      onResult: (uid, result) => {
        patch(uid, afterResult(result));
      },
    });
    // Behind the dialog the table, the details and the brokers are read again. The dialog does not
    // wait for it (a read that fails is tried again for some seconds and must not hold back the result).
    for (const queryKey of [SERIES_QUERY_KEY, DETAILS_QUERY_KEY, BROKERS_QUERY_KEY, TEST_RUN_BROKER_QUERY_KEY]) {
      void queryClient.invalidateQueries({ queryKey });
    }
    if (!mounted.current) {
      return;
    }
    setRun((current) => ({ ...current, state: 'idle', finished: true, failure: end.failure }));
    if (closeAfter.current) {
      onClose();
    }
  }

  function cancel(): void {
    cancelled.current = true;
    setRun((current) => (current.state === 'running' ? { ...current, state: 'cancelling' } : current));
  }

  function requestClose(): void {
    if (run.state === 'idle') {
      onClose();
    } else {
      setAskClose(true);
    }
  }

  function abortAndClose(): void {
    closeAfter.current = true;
    setAskClose(false);
    cancel();
  }

  function change(uid: number, changes: Partial<Pick<Item, 'instrument' | 'data'>>): void {
    // A changed file is no longer the refused one: its old result is dropped.
    patch(uid, { ...changes, phase: 'idle', outcome: null, failure: null });
  }

  function remove(uid: number): void {
    setItems((current) => current.filter((item) => item.uid !== uid));
  }

  let hint = '';
  if (items.length > 0 && !running) {
    if (pending.length === 0) {
      hint = '';
    } else if (brokerBad) {
      hint = t('import.nextBroker');
    } else if (waiting.length > 0) {
      hint = t('import.nextFiles');
    } else if (zoneBad) {
      hint = t('import.nextTimezone');
    } else {
      hint = pending.some((item) => item.phase === 'refused' || item.phase === 'skipped')
        ? t('import.nextAgain')
        : t('import.nextRun');
    }
  }

  const summary = [
    t('import.summary', { imported: taken - run.base, total: run.total }),
    refused > 0 ? t('import.summaryRefused', { count: refused }) : '',
    skipped > 0 ? t('import.summarySkipped', { count: skipped }) : '',
  ]
    .filter((part) => part !== '')
    .join(' ');

  return (
    <Modal
      open
      wide
      title={t('import.title')}
      icon="upload"
      testid="dialog-import"
      initialFocus="first-button"
      onClose={onClose}
      onEscape={running ? () => { setAskClose(true); } : undefined}
      footer={
        askClose && running ? (
          <>
            <p className="close-ask" role="alert" data-testid="import-close-ask">
              {t('import.closeAsk')}
            </p>
            <Btn
              testid="import-keep"
              onClick={() => {
                setAskClose(false);
              }}
            >
              {t('import.keep')}
            </Btn>
            <Btn kind="danger" testid="import-abort-close" onClick={abortAndClose}>
              {t('import.abortClose')}
            </Btn>
          </>
        ) : (
          <>
            <Btn testid="import-close" onClick={requestClose}>
              {t('import.close')}
            </Btn>
            {running && (
              <Btn
                kind="danger"
                icon="x"
                testid="import-cancel"
                tip={t('import.tip.cancel')}
                disabled={run.state === 'cancelling'}
                onClick={cancel}
              >
                {run.state === 'cancelling' ? t('import.cancelling') : t('import.cancel')}
              </Btn>
            )}
            <Btn
              kind="primary"
              icon="download"
              testid="import-run"
              disabled={blocked || running || reading !== null}
              onClick={() => {
                void start();
              }}
            >
              {running ? t('import.running') : t('import.run')}
            </Btn>
          </>
        )
      }
    >
      <p className="muted">{t('import.intro')}</p>
      <div className="imp-pick">
        <Btn
          icon="folder"
          testid="import-choose"
          tip={t('import.tip.choose')}
          disabled={reading !== null || running}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          {t('import.choose')}
        </Btn>
        {reading !== null && (
          <span className="muted" role="status" data-testid="import-reading">
            {t('import.reading', { done: reading.done, total: reading.total })}
          </span>
        )}
      </div>
      {readError !== null && (
        <p className="error-note" role="alert" data-testid="import-read-error">
          <Icon name="warn" size={14} />
          {t('import.readError', { reason: describeError(t, readError) })}
        </p>
      )}

      {items.length === 0 && reading === null && (
        <p className="empty-note" data-testid="import-empty">
          {t('import.empty')}
        </p>
      )}

      <div className="imp-fields">
        <Field label={t('import.broker')} tip={t('import.tip.broker')} required testid="field-import-broker">
          {(id) => (
            <>
              <TextInput
                id={id}
                value={brokerTyped ?? commonBroker(items)}
                list="import-brokers"
                testid="import-broker"
                disabled={running}
                onChange={setBrokerTyped}
              />
              <datalist id="import-brokers">
                {(brokers.data ?? []).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        {anyCsv && (
          <Field label={t('import.timezone')} tip={t('import.tip.timezone')} required testid="field-import-timezone">
            {(id) => (
              <>
                <TextInput
                  id={id}
                  value={timezone}
                  list="import-timezones"
                  placeholder="Europe/Athens"
                  testid="import-timezone"
                  disabled={running}
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
        )}
      </div>

      {(running || run.finished) && run.total > 0 && (
        <p className="imp-progress" role="status" data-testid="import-progress">
          {run.state === 'cancelling'
            ? `${t('import.progress', { done, total: run.total })} ${t('import.cancelNote')}`
            : t('import.progress', { done, total: run.total })}
        </p>
      )}

      {items.length > 0 && (
        <ul className="imp-list" data-testid="import-list">
          {items.map((item) => (
            <ImportItem
              key={item.uid}
              item={item}
              state={stateOf(item)}
              language={language}
              locked={running}
              onChange={(changes) => {
                change(item.uid, changes);
              }}
              onRemove={() => {
                remove(item.uid);
              }}
            />
          ))}
        </ul>
      )}

      {run.finished && run.failure !== null && (
        <p className="error-note" role="alert" data-testid="import-error">
          <Icon name="warn" size={14} />
          {t('import.importError', { reason: failureText(t, run.failure) })}
        </p>
      )}
      {run.finished && run.total > 0 && (
        <p
          className={refused > 0 || skipped > 0 ? 'error-note' : 'ok-note'}
          role="status"
          data-testid="import-summary"
        >
          <Icon name={refused > 0 || skipped > 0 ? 'warn' : 'check'} size={16} />
          {summary}
        </p>
      )}
      {hint !== '' && (
        <p className="muted" data-testid="import-hint">
          {hint}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".csv,.json"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        data-testid="import-files"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          // The same file can be chosen again.
          event.target.value = '';
          void choose(files);
        }}
      />
    </Modal>
  );
}

function ImportItem({
  item,
  state,
  language,
  locked,
  onChange,
  onRemove,
}: {
  item: Item;
  state: ItemState;
  language: SupportedLanguage;
  locked: boolean;
  onChange: (changes: Partial<Pick<Item, 'instrument' | 'data'>>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const taken = state === 'taken';
  const readable = item.hint.error === null;
  return (
    <li className={`imp-item ${state === 'ready' ? '' : state}`} data-testid="import-item" data-name={item.file.name} data-state={state}>
      <div className="imp-head">
        <span className="imp-name">
          {item.file.name}{' '}
          <span className="muted">
            · {t('import.fileInfo', { format: item.hint.format.toUpperCase(), size: formatBytes(item.file.size, language) })}
          </span>
        </span>
        {item.phase !== 'idle' && (
          <span className={`imp-status imp-status-${item.phase}`} data-testid="import-status">
            {t(`import.status.${item.phase}`)}
          </span>
        )}
        {!taken && (
          <Btn small kind="ghost" icon="x" testid="import-remove" title={t('import.remove')} disabled={locked} onClick={onRemove} />
        )}
      </div>
      {readable && (
        <div className="grid2">
          <Field label={t('import.instrument')} tip={t('import.tip.instrument')} required testid="field-import-instrument">
            {(id) => (
              <TextInput
                id={id}
                value={item.instrument}
                testid="import-instrument"
                disabled={taken || locked}
                onChange={(instrument) => {
                  onChange({ instrument });
                }}
              />
            )}
          </Field>
          <Field
            label={t('import.data')}
            tip={t('import.tip.data')}
            required
            group={item.hint.format === 'json'}
            testid="field-import-data"
          >
            {(id) =>
              item.hint.format === 'json' ? (
                <span aria-labelledby={id} className="static-value" data-testid="import-data">
                  {item.data === '' ? t('data.none') : dataLabel(t, item.data)}
                </span>
              ) : (
                <Select
                  id={id}
                  value={item.data}
                  testid="import-data"
                  disabled={taken || locked}
                  onChange={(data) => {
                    onChange({ data });
                  }}
                >
                  <option value="">{t('import.choosePlaceholder')}</option>
                  {CSV_DATA_IDS.map((dataId) => (
                    <option key={dataId} value={dataId}>
                      {dataLabel(t, dataId)}
                    </option>
                  ))}
                </Select>
              )
            }
          </Field>
        </div>
      )}
      {item.hint.format === 'json' && readable && <p className="muted">{t('import.jsonData')}</p>}
      {state === 'needs' && (
        <p className="error-note" data-testid="import-missing">
          <Icon name="warn" size={14} />
          {t('import.missing')}
        </p>
      )}
      {!readable && item.phase === 'idle' && (
        <p className="error-note" data-testid="import-unreadable">
          <Icon name="warn" size={14} />
          {t('import.unreadable', { reason: fileErrorText(t, item.hint.error, item.hint.limit, language) })}
        </p>
      )}
      {item.phase === 'skipped' && (
        <p className="muted" data-testid="import-skipped">
          {t('import.skipped')}
        </p>
      )}
      {item.failure !== null && (
        <div className="imp-result" data-testid="import-result" data-state="refused">
          <b>
            <Icon name="warn" size={14} /> {t('import.resultRefused', { reason: failureText(t, item.failure) })}
          </b>
        </div>
      )}
      {item.outcome !== null && <ItemResult outcome={item.outcome} language={language} />}
    </li>
  );
}

function ItemResult({ outcome, language }: { outcome: FileOutcome; language: SupportedLanguage }) {
  const { t } = useTranslation();
  const n = (value: number) => formatNumber(value, language, 0);
  const result: ImportResult | null = outcome.result;
  if (outcome.refused || result === null) {
    return (
      <div className="imp-result" data-testid="import-result" data-state="refused">
        <b>
          <Icon name="warn" size={14} />{' '}
          {t('import.resultRefused', { reason: fileErrorText(t, outcome.error, outcome.limit, language) })}
        </b>
      </div>
    );
  }
  const period =
    result.periodStart !== null && result.periodEnd !== null
      ? formatPeriod(result.periodStart, result.periodEnd, language)
      : '';
  return (
    <div className="imp-result" data-testid="import-result" data-state="taken">
      <b>
        <Icon name="check" size={14} />{' '}
        {result.kind === 'instrument'
          ? t('import.resultContract')
          : t('import.resultTaken', { accepted: n(result.accepted), replaced: n(result.replaced), period })}
      </b>
      {result.rejectedCount > 0 && (
        <>
          <span data-testid="import-rejected">{t('import.rejectedCount', { count: n(result.rejectedCount) })}</span>
          <ul>
            {result.rejected.map((rejected) => (
              <li key={`${rejected.row}|${rejected.reason}`} data-testid="import-rejected-row" data-reason={rejected.reason}>
                {t('import.rejectedRow', { row: n(rejected.row), reason: rejectReasonText(t, rejected.reason) })}
              </li>
            ))}
            {result.rejectedCount > result.rejected.length && (
              <li>{t('import.rejectedMore', { count: n(result.rejectedCount - result.rejected.length) })}</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
