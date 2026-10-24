// The choice of files in the import directory of the backend (specification 5.3): the files and
// subdirectories of one directory with name, size and time of the last change, subdirectories
// first, page by page. The user opens subdirectories and goes back up to the import directory,
// never above it, and ticks any number of files, also from different directories. The ticks stay
// when the directory changes. Nothing is read or copied here; the backend lists, the dialog takes
// the chosen paths over.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { describeError } from './errors';
import { formatBytes, formatMoment } from './format';
import { ApiError } from './http';
import type { SupportedLanguage } from './i18n';
import { DIRECTORY_PAGE_SIZE, fetchImportDirectory, type DirectoryEntry } from './marketDataApi';
import { Btn, Icon } from './ui';

/** A file chosen in the import directory: the path relative to it, and its size. */
export type PickedFile = { path: string; size: number };

export const IMPORT_DIRECTORY_QUERY_KEY = ['import-directory'];

function join(path: string, name: string): string {
  return path === '' ? name : `${path}/${name}`;
}

function status(error: unknown): number | null {
  return error instanceof ApiError ? error.status : null;
}

export function DirectoryPicker({
  directory,
  picked,
  taken,
  onToggle,
  onToggleAll,
  onOpenSettings,
}: {
  /** The import directory on the computer of the backend (for the messages); `null` if unknown. */
  directory: string | null;
  picked: PickedFile[];
  /** Paths that are in the list of the dialog already. */
  taken: ReadonlySet<string>;
  onToggle: (file: PickedFile) => void;
  /** Ticks (`true`) or unticks (`false`) all files of the page. */
  onToggleAll: (files: PickedFile[], on: boolean) => void;
  onOpenSettings?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language === 'en' ? 'en' : 'de';
  const [path, setPath] = useState('');
  const [offset, setOffset] = useState(0);
  const headRef = useRef<HTMLDivElement>(null);
  const listing = useQuery({
    queryKey: [...IMPORT_DIRECTORY_QUERY_KEY, path, offset],
    queryFn: ({ signal }) => fetchImportDirectory(path, offset, DIRECTORY_PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
    // A listing is read again every time: files are put into the directory and removed there
    // by the user, and an answer like "not readable" is not worth a second try.
    gcTime: 0,
    retry: false,
  });

  useEffect(() => {
    headRef.current?.focus();
  }, []);

  function go(next: string): void {
    setPath(next);
    setOffset(0);
  }

  const segments = path === '' ? [] : path.split('/');
  const entries = listing.data?.items ?? [];
  const total = listing.data?.total ?? 0;
  const files: PickedFile[] = entries
    .filter((entry) => entry.kind === 'file' && !taken.has(join(path, entry.name)))
    .map((entry) => ({ path: join(path, entry.name), size: entry.size ?? 0 }));
  const allOnPage = files.length > 0 && files.every((file) => picked.some((one) => one.path === file.path));
  const error = listing.error;
  const shownFrom = total === 0 ? 0 : offset + 1;
  const shownTo = Math.min(offset + entries.length, total);

  return (
    <div className="picker" data-testid="picker">
      <div className="picker-head" ref={headRef} tabIndex={-1}>
        <h3>{t('picker.title')}</h3>
        <p className="muted" data-testid="picker-directory">
          {directory === null ? t('picker.directoryUnknown') : t('picker.directory', { directory })}
        </p>
      </div>
      <nav className="picker-crumbs" aria-label={t('picker.where')} data-testid="picker-crumbs">
        <Btn
          small
          kind="ghost"
          icon="left"
          testid="picker-up"
          tip={t('picker.tip.up')}
          disabled={path === ''}
          onClick={() => {
            go(segments.slice(0, -1).join('/'));
          }}
        >
          {t('picker.up')}
        </Btn>
        <button
          type="button"
          className="crumb"
          data-testid="picker-crumb"
          data-path=""
          aria-current={path === '' ? 'location' : undefined}
          onClick={() => {
            go('');
          }}
        >
          {t('picker.root')}
        </button>
        {segments.map((segment, index) => {
          const target = segments.slice(0, index + 1).join('/');
          return (
            <span key={target} className="crumb-part">
              <span aria-hidden="true">/</span>
              <button
                type="button"
                className="crumb"
                data-testid="picker-crumb"
                data-path={target}
                aria-current={index === segments.length - 1 ? 'location' : undefined}
                onClick={() => {
                  go(target);
                }}
              >
                {segment}
              </button>
            </span>
          );
        })}
      </nav>

      {error !== null && <PickerError error={error} directory={directory} onRoot={() => { go(''); }} onOpenSettings={onOpenSettings} />}

      {error === null && listing.data !== undefined && total === 0 && (
        <p className="empty-note" data-testid="picker-empty">
          {path === ''
            ? directory === null
              ? t('picker.emptyRootUnknown')
              : t('picker.emptyRoot', { directory })
            : t('picker.emptySub')}
          {path === '' && onOpenSettings !== undefined && (
            <Btn small testid="picker-settings" tip={t('picker.tip.settings')} icon="gear" onClick={onOpenSettings}>
              {t('picker.settings')}
            </Btn>
          )}
        </p>
      )}

      {error === null && listing.isPending && (
        <p className="muted" role="status" data-testid="picker-loading">
          {t('common.loading')}
        </p>
      )}

      {error === null && entries.length > 0 && (
        <>
          <div className="picker-actions">
            <Btn
              small
              testid="picker-select-page"
              tip={t('picker.tip.selectPage')}
              disabled={files.length === 0}
              onClick={() => {
                onToggleAll(files, !allOnPage);
              }}
            >
              {allOnPage ? t('picker.unselectPage') : t('picker.selectPage')}
            </Btn>
          </div>
          <ul className="picker-list" data-testid="picker-list">
            {entries.map((entry) => (
              <PickerRow
                key={`${entry.kind}:${entry.name}`}
                entry={entry}
                path={join(path, entry.name)}
                language={language}
                chosen={picked.some((one) => one.path === join(path, entry.name))}
                inList={taken.has(join(path, entry.name))}
                onOpen={() => {
                  go(join(path, entry.name));
                }}
                onToggle={() => {
                  onToggle({ path: join(path, entry.name), size: entry.size ?? 0 });
                }}
              />
            ))}
          </ul>
          <div className="pager" data-testid="picker-pager">
            <span className="muted" data-testid="picker-count">
              {t('picker.count', { from: shownFrom, to: shownTo, total })}
            </span>
            <div className="btn-row">
              <Btn
                small
                testid="picker-previous"
                disabled={offset === 0}
                onClick={() => {
                  setOffset(Math.max(0, offset - DIRECTORY_PAGE_SIZE));
                }}
              >
                {t('data.previous')}
              </Btn>
              <Btn
                small
                testid="picker-next"
                disabled={offset + DIRECTORY_PAGE_SIZE >= total}
                onClick={() => {
                  setOffset(offset + DIRECTORY_PAGE_SIZE);
                }}
              >
                {t('data.next')}
              </Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PickerError({
  error,
  directory,
  onRoot,
  onOpenSettings,
}: {
  error: unknown;
  directory: string | null;
  onRoot: () => void;
  onOpenSettings?: () => void;
}) {
  const { t } = useTranslation();
  const code = status(error);
  let text: string;
  let toSettings = false;
  let toRoot = false;
  if (code === 409) {
    text = directory === null ? t('picker.unavailableUnknown') : t('picker.unavailable', { directory });
    toSettings = true;
  } else if (code === 404) {
    text = t('picker.gone');
    toRoot = true;
  } else {
    text = t('picker.loadError', { reason: describeError(t, error) });
  }
  return (
    <div className="error-note" role="alert" data-testid="picker-error">
      <Icon name="warn" size={14} />
      <span>{text}</span>
      {toSettings && onOpenSettings !== undefined && (
        <Btn small testid="picker-settings" tip={t('picker.tip.settings')} icon="gear" onClick={onOpenSettings}>
          {t('picker.settings')}
        </Btn>
      )}
      {toRoot && (
        <Btn small testid="picker-to-root" onClick={onRoot}>
          {t('picker.toRoot')}
        </Btn>
      )}
    </div>
  );
}

function PickerRow({
  entry,
  path,
  language,
  chosen,
  inList,
  onOpen,
  onToggle,
}: {
  entry: DirectoryEntry;
  path: string;
  language: SupportedLanguage;
  chosen: boolean;
  inList: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const modified = formatMoment(entry.modifiedAt, language);
  if (entry.kind === 'directory') {
    return (
      <li className="picker-row picker-dir" data-testid="picker-dir" data-name={entry.name} data-path={path}>
        <button type="button" className="picker-open" data-testid="picker-open" onClick={onOpen}>
          <Icon name="folder" size={16} />
          <span className="picker-name">{entry.name}</span>
        </button>
        <span className="muted picker-size">{t('picker.directoryKind')}</span>
        <span className="muted picker-time">{modified}</span>
      </li>
    );
  }
  return (
    <li className="picker-row picker-file" data-testid="picker-file" data-name={entry.name} data-path={path}>
      <label className="picker-pick">
        <input
          type="checkbox"
          checked={chosen || inList}
          disabled={inList}
          data-testid="picker-check"
          onChange={onToggle}
        />
        <Icon name="file" size={16} />
        <span className="picker-name">{entry.name}</span>
        {inList && <span className="muted">{t('picker.inList')}</span>}
      </label>
      <span className="muted picker-size">{entry.size === null ? '' : formatBytes(entry.size, language)}</span>
      <span className="muted picker-time">{modified}</span>
    </li>
  );
}
