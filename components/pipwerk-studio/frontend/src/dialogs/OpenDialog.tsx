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
 * The list of the stored strategies (item 8 of the order): title, description
 * and time of the last change. A file that cannot be read is listed with that
 * mark and cannot be opened.
 */
export function OpenDialog({ onOpen, onCancel }: OpenDialogProps) {
  const { t } = useTranslation();
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
    const cause = describeCause(t, query.error);
    body = (
      <div role="alert">
        <p>{t('openDialog.loadFailed')}</p>
        <p>{cause.summary}</p>
        {cause.backendText !== null ? <p lang="en">{cause.backendText}</p> : null}
        <button
          type="button"
          onClick={() => {
            void query.refetch();
          }}
        >
          {t('openDialog.retry')}
        </button>
      </div>
    );
  } else if (query.data.length === 0) {
    body = <p>{t('openDialog.empty')}</p>;
  } else {
    body = (
      <table className="open-table">
        <thead>
          <tr>
            <th scope="col">{t('openDialog.columnTitle')}</th>
            <th scope="col">{t('openDialog.columnDescription')}</th>
            <th scope="col">{t('openDialog.columnModified')}</th>
          </tr>
        </thead>
        <tbody>
          {query.data.map((entry) => (
            <tr key={entry.id} className={entry.unreadable ? 'is-unreadable' : undefined}>
              <td>
                {entry.unreadable ? (
                  <span className="unreadable-mark">{t('openDialog.unreadable')}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onOpen(entry.id);
                    }}
                  >
                    {entry.title !== null && entry.title !== '' ? entry.title : t('openDialog.untitled')}
                  </button>
                )}
              </td>
              <td>{entry.description ?? ''}</td>
              <td>{modified(entry)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <ModalDialog labelledBy={titleId} onClose={onCancel} className="open-dialog">
      <h2 id={titleId}>{t('openDialog.title')}</h2>
      {body}
      <div className="dialog-actions">
        <button type="button" onClick={onCancel}>
          {t('openDialog.cancel')}
        </button>
      </div>
    </ModalDialog>
  );
}
