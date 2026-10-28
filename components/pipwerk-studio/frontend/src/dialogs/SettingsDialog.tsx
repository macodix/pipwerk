import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  causeOf,
  fetchObjectDirectory,
  updateObjectDirectory,
  type ErrorCause,
  type ObjectDirectory,
} from '../api/objectDirectory';
import { describeCause } from '../errors';
import { LanguageSelect } from '../LanguageSelect';
import type { StudioLanguageState } from '../useStudioLanguage';
import { ModalDialog } from './ModalDialog';

type SettingsDialogProps = {
  languageState: StudioLanguageState;
  onClose: () => void;
};

const DIRECTORY_KEY = ['object-directory'];

type SaveState =
  | { phase: 'idle' }
  | { phase: 'asking'; path: string }
  | { phase: 'saving' }
  | { phase: 'saved' }
  | { phase: 'failed'; error: unknown; cause: ErrorCause };

/**
 * The settings (item 8 of the order): the language of the interface and the
 * object directory. A new directory is asked for "move the files?" (yes, no,
 * cancel); the cause of an error of the backend is shown in the dialog. An open
 * strategy stays open (specification 4.1).
 */
export function SettingsDialog({ languageState, onClose }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const titleId = useId();
  const pathId = useId();
  const [text, setText] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ phase: 'idle' });
  const directory = useQuery({
    queryKey: DIRECTORY_KEY,
    queryFn: ({ signal }) => fetchObjectDirectory(signal),
    retry: false,
    gcTime: 0,
    networkMode: 'always',
  });

  const current: ObjectDirectory | undefined = directory.data;
  const value = text ?? current?.path ?? '';

  async function store(path: string, move: boolean): Promise<void> {
    setSave({ phase: 'saving' });
    try {
      const result = await updateObjectDirectory(path, move);
      queryClient.setQueryData(DIRECTORY_KEY, result);
      // The lists of the stored templates and of "Open" belong to the directory: ask again, with and without moving.
      await queryClient.invalidateQueries({ queryKey: ['objects'] });
      setText(null);
      setSave({ phase: 'saved' });
    } catch (error) {
      setSave({ phase: 'failed', error, cause: causeOf(error) });
    }
  }

  const busy = save.phase === 'saving';
  const asking = save.phase === 'asking';

  return (
    <ModalDialog labelledBy={titleId} onClose={onClose} className="settings-dialog">
      <h2 id={titleId}>{t('settings.title')}</h2>

      <div className="settings-language">
        <LanguageSelect state={languageState} />
      </div>

      <div className="settings-directory">
        <h3>{t('settings.directorySection')}</h3>
        {directory.isPending ? <p>{t('settings.directoryLoading')}</p> : null}
        {directory.isError ? (
          <div role="alert">
            <p>{t('settings.directoryLoadFailed')}</p>
            <p>{describeCause(t, i18n, directory.error).summary}</p>
          </div>
        ) : null}
        {current !== undefined ? (
          <>
            <p className="directory-current">
              {current.path === null
                ? t('settings.directoryNotSet')
                : current.isDefault
                  ? t('settings.directoryIsDefault')
                  : t('settings.directoryIsSet')}
            </p>
            <div className="field">
              <label htmlFor={pathId}>{t('settings.directory')}</label>
              <input
                id={pathId}
                type="text"
                value={value}
                disabled={busy || asking}
                onChange={(event) => {
                  setText(event.target.value);
                  setSave({ phase: 'idle' });
                }}
              />
            </div>
            <button
              type="button"
              disabled={busy || asking || value.trim() === '' || value === (current.path ?? '')}
              onClick={() => {
                setSave({ phase: 'asking', path: value });
              }}
            >
              {t('settings.directoryChange')}
            </button>
          </>
        ) : null}

        {save.phase === 'asking' ? (
          <div role="group" aria-labelledby={`${titleId}-move`} className="settings-move">
            <p id={`${titleId}-move`}>{t('settings.moveQuestion')}</p>
            <button
              type="button"
              onClick={() => {
                void store(save.path, true);
              }}
            >
              {t('settings.moveYes')}
            </button>
            <button
              type="button"
              onClick={() => {
                void store(save.path, false);
              }}
            >
              {t('settings.moveNo')}
            </button>
            <button
              type="button"
              onClick={() => {
                // "Abbrechen" changes nothing: the field shows the stored directory again
                setText(null);
                setSave({ phase: 'idle' });
              }}
            >
              {t('settings.moveCancel')}
            </button>
          </div>
        ) : null}
        {save.phase === 'saved' ? (
          <p className="settings-saved" aria-live="polite">
            {t('settings.directorySaved')}
          </p>
        ) : null}
        {save.phase === 'failed' ? (
          <div role="alert" className="settings-error">
            <p>{t('settings.directoryFailed')}</p>
            <p>{describeCause(t, i18n, save.error).summary}</p>
            {save.cause.moveFailure !== null ? (
              <div className="move-failure">
                <p>{t('settings.moveFailureFrom', { directory: save.cause.moveFailure.sourceDirectory })}</p>
                <p>{t('settings.moveFailureTo', { directory: save.cause.moveFailure.targetDirectory })}</p>
                <ul>
                  {save.cause.moveFailure.files.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="dialog-actions">
        <button type="button" onClick={onClose}>
          {t('settings.close')}
        </button>
      </div>
    </ModalDialog>
  );
}
