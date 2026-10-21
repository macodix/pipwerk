import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { listObjects, type ObjectListEntry } from '../api/objects';
import { describeCause } from '../errors';
import { localDateTimeParts } from '../format';
import { ModalDialog } from './ModalDialog';

type OpenDialogProps = {
  onOpen: (id: string) => void;
  onCancel: () => void;
};

/**
 * The list of the stored strategies (specification 5.5): name, description and time of the last change. A file that
 * cannot be read is listed with that mark and cannot be opened. An empty list names the next step.
 */
export function OpenDialog({ onOpen, onCancel }: OpenDialogProps) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const query = useQuery({
    queryKey: ['objects', 'strategies', 'open-dialog'],
    queryFn: ({ signal }) => listObjects('strategies', signal),
    retry: false,
    gcTime: 0,
    networkMode: 'always',
  });

  function modified(entry: ObjectListEntry): string {
    const parts = localDateTimeParts(entry.modified);
    return parts === null ? entry.modified : t('openDialog.modifiedValue', parts);
  }

  let body;
  if (query.isPending) {
    body = <p>{t('openDialog.loading')}</p>;
  } else if (query.isError) {
    body = (
      <div role="alert">
        <p>{t('openDialog.loadFailed')}</p>
        <p>{describeCause(t, i18n, query.error).summary}</p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void query.refetch();
          }}
        >
          {t('openDialog.retry')}
        </button>
      </div>
    );
  } else if (query.data.length === 0) {
    body = (
      <p className="empty-note" data-testid="open-empty">
        {t('openDialog.empty')}
      </p>
    );
  } else {
    body = (
      <table className="open-table" data-testid="open-list">
        <thead>
          <tr>
            <th scope="col">{t('openDialog.columnName')}</th>
            <th scope="col">{t('openDialog.columnDescription')}</th>
            <th scope="col">{t('openDialog.columnModified')}</th>
          </tr>
        </thead>
        <tbody>
          {query.data.map((entry) => (
            <tr key={entry.id} className={entry.unreadable ? 'is-unreadable' : undefined} data-testid="open-row" data-name={entry.name ?? ''}>
              <td>
                {entry.unreadable ? (
                  <span className="unreadable-mark">{t('openDialog.unreadable')}</span>
                ) : (
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      onOpen(entry.id);
                    }}
                  >
                    {entry.name !== null && entry.name !== '' ? entry.name : t('openDialog.untitled')}
                  </button>
                )}
              </td>
              <td>{entry.description ?? ''}</td>
              <td>{entry.unreadable ? '' : modified(entry)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <ModalDialog labelledBy={titleId} onClose={onCancel} className="open-dialog">
      <h2 id={titleId}>{t('openDialog.title')}</h2>
      <div className="dialog-body">{body}</div>
      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onCancel} data-testid="dialog-cancel">
          {t('openDialog.cancel')}
        </button>
      </div>
    </ModalDialog>
  );
}
