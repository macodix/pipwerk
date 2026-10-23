// Dialog "Datei importieren" (specification 5.3, 8.3): any number of files at once, JSON and CSV
// mixed. One broker for all files, one time zone for all CSV files, instrument and data per file
// (preset from the preview of the web API: the name of a CSV file, the content of a JSON file),
// one click imports all of them, and the result is listed per file.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
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
import {
  importFiles,
  isValidName,
  previewImport,
  type FileHint,
  type FileOutcome,
  type ImportResult,
} from './marketDataApi';
import { Modal } from './Modal';
import { Btn, Field, Icon, Select, TextInput } from './ui';

/** A file of the dialog with what is known about it. */
type Item = {
  uid: number;
  file: File;
  hint: FileHint;
  /** The instrument of the file; the user may change it. */
  instrument: string;
  /** The identifier of the data; for a CSV file the user may change it. */
  data: string;
  /** What the last import said about the file; `null` before. */
  outcome: FileOutcome | null;
};

type ItemState = 'done' | 'failed' | 'needs' | 'ready';

function isDone(item: Item): boolean {
  return item.outcome !== null && !item.outcome.refused;
}

/** A file whose content cannot be read gets no input: it is refused by the import anyway. */
function needsInput(item: Item): boolean {
  return item.hint.error === null && (item.instrument.trim() === '' || item.data === '');
}

function stateOf(item: Item): ItemState {
  if (item.outcome !== null) {
    return item.outcome.refused ? 'failed' : 'done';
  }
  return needsInput(item) ? 'needs' : 'ready';
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

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'de';
  const queryClient = useQueryClient();
  const brokers = useBrokers();
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const [items, setItems] = useState<Item[]>([]);
  // `null`: the user has not typed; the broker is then the one the JSON files name.
  const [brokerTyped, setBrokerTyped] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('');

  const broker = (brokerTyped ?? commonBroker(items)).trim();
  const pending = items.filter((item) => !isDone(item));
  const anyCsv = items.some((item) => item.hint.format === 'csv');
  const csvPending = pending.some((item) => item.hint.format === 'csv');
  const waiting = pending.filter(needsInput);
  const brokerBad = !isValidName(broker);
  const zoneBad = csvPending && timezone.trim() === '';
  const blocked = pending.length === 0 || waiting.length > 0 || brokerBad || zoneBad;

  const reading = useMutation({
    mutationFn: async (files: File[]): Promise<Item[]> => {
      const hints = await previewImport(files);
      return files.map((file, index): Item => {
        const hint = hints[index] as FileHint;
        counter.current += 1;
        return {
          uid: counter.current,
          file,
          hint,
          instrument: hint.instrument ?? '',
          data: hint.data ?? '',
          outcome: null,
        };
      });
    },
    onSuccess: (added) => {
      setItems((current) => [...current, ...added]);
    },
  });

  const run = useMutation({
    mutationFn: (batch: Item[]) =>
      importFiles(
        broker,
        batch.some((item) => item.hint.format === 'csv') ? timezone.trim() : '',
        batch.map((item) => ({ file: item.file, instrument: item.instrument.trim(), data: item.data })),
      ),
    onSuccess: async (outcome, batch) => {
      const byUid = new Map(batch.map((item, index) => [item.uid, outcome.files[index] ?? null]));
      setItems((current) =>
        current.map((item) => (byUid.has(item.uid) ? { ...item, outcome: byUid.get(item.uid) ?? null } : item)),
      );
      await Promise.all(
        [SERIES_QUERY_KEY, DETAILS_QUERY_KEY, BROKERS_QUERY_KEY, TEST_RUN_BROKER_QUERY_KEY].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });

  function choose(files: FileList | null): void {
    if (files === null || files.length === 0) {
      return;
    }
    run.reset();
    reading.mutate(Array.from(files));
  }

  function change(uid: number, patch: Partial<Pick<Item, 'instrument' | 'data'>>): void {
    // A changed file is no longer the refused one: its old result is dropped.
    setItems((current) => current.map((item) => (item.uid === uid ? { ...item, ...patch, outcome: null } : item)));
  }

  function remove(uid: number): void {
    setItems((current) => current.filter((item) => item.uid !== uid));
  }

  const importedNow = run.data?.importedCount ?? 0;
  const refusedNow = run.data?.refusedCount ?? 0;
  let hint = '';
  if (items.length > 0) {
    if (pending.length === 0) {
      hint = '';
    } else if (brokerBad) {
      hint = t('import.nextBroker');
    } else if (waiting.length > 0) {
      hint = t('import.nextFiles');
    } else if (zoneBad) {
      hint = t('import.nextTimezone');
    } else {
      hint = items.some((item) => item.outcome?.refused === true) ? t('import.nextAgain') : t('import.nextRun');
    }
  }

  return (
    <Modal
      open
      wide
      title={t('import.title')}
      icon="upload"
      testid="dialog-import"
      initialFocus="first-button"
      onClose={onClose}
      footer={
        <>
          <Btn testid="import-close" onClick={onClose}>
            {t('import.close')}
          </Btn>
          <Btn
            kind="primary"
            icon="download"
            testid="import-run"
            disabled={blocked || run.isPending || reading.isPending}
            onClick={() => {
              run.mutate(pending);
            }}
          >
            {run.isPending ? t('import.running') : t('import.run')}
          </Btn>
        </>
      }
    >
      <p className="muted">{t('import.intro')}</p>
      <div className="imp-pick">
        <Btn
          icon="folder"
          testid="import-choose"
          tip={t('import.tip.choose')}
          disabled={reading.isPending || run.isPending}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          {t('import.choose')}
        </Btn>
        {reading.isPending && (
          <span className="muted" role="status" data-testid="import-reading">
            {t('import.reading')}
          </span>
        )}
      </div>
      {reading.isError && (
        <p className="error-note" role="alert" data-testid="import-read-error">
          <Icon name="warn" size={14} />
          {t('import.readError', { reason: describeError(t, reading.error) })}
        </p>
      )}

      {items.length === 0 && !reading.isPending && (
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

      {items.length > 0 && (
        <ul className="imp-list" data-testid="import-list">
          {items.map((item) => (
            <ImportItem
              key={item.uid}
              item={item}
              state={stateOf(item)}
              language={language}
              locked={run.isPending}
              onChange={(patch) => {
                change(item.uid, patch);
              }}
              onRemove={() => {
                remove(item.uid);
              }}
            />
          ))}
        </ul>
      )}

      {run.isError && (
        <p className="error-note" role="alert" data-testid="import-error">
          <Icon name="warn" size={14} />
          {t('import.importError', { reason: describeError(t, run.error) })}
        </p>
      )}
      {run.isSuccess && (
        <p className={refusedNow > 0 ? 'error-note' : 'ok-note'} role="status" data-testid="import-summary">
          <Icon name={refusedNow > 0 ? 'warn' : 'check'} size={16} />
          {refusedNow > 0
            ? t('import.summaryRefused', { imported: importedNow, total: importedNow + refusedNow, refused: refusedNow })
            : t('import.summary', { imported: importedNow, total: importedNow + refusedNow })}
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
          choose(event.target.files);
          // The same file can be chosen again.
          event.target.value = '';
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
  onChange: (patch: Partial<Pick<Item, 'instrument' | 'data'>>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const done = state === 'done';
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
        {!done && (
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
                disabled={done || locked}
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
                  disabled={done || locked}
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
      {!readable && item.outcome === null && (
        <p className="error-note" data-testid="import-unreadable">
          <Icon name="warn" size={14} />
          {t('import.unreadable', { reason: fileErrorText(t, item.hint.error) })}
        </p>
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
          <Icon name="warn" size={14} /> {t('import.resultRefused', { reason: fileErrorText(t, outcome.error) })}
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
