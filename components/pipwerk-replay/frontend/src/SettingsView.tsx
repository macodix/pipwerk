// View "Einstellungen" (specification 5.7, 8.3): "Importierte Dateien behalten", "Ablageverzeichnis",
// "Importverzeichnis" and "Exportverzeichnis", each with its name, its value and an explanation
// that appears on pointing at it. All four are saved together (the backend checks the
// directories together and saves nothing if one is refused). The language and the "Broker für
// Testläufe" stay where they are (specification 5.7). The browser stores nothing; the values
// come from and go to the backend.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FILE_SETTINGS_QUERY_KEY, useFileSettings } from './dataQueries';
import { describeError } from './errors';
import {
  directoryRefusals,
  updateFileSettings,
  type DirectoryField,
  type DirectoryReason,
  type DirectorySetting,
  type FileSettings,
} from './fileSettingsApi';
import { Btn, CheckField, Field, Icon, TextInput } from './ui';

/** What the user has typed: the tick and the three paths (empty: the default). */
type Draft = { keep: boolean; storage: string; import: string; export: string };

type Key = 'storage' | 'import' | 'export';

const KEYS: { key: Key; field: DirectoryField }[] = [
  { key: 'storage', field: 'storage_directory' },
  { key: 'import', field: 'import_directory' },
  { key: 'export', field: 'export_directory' },
];

function settingOf(settings: FileSettings, key: Key): DirectorySetting {
  return key === 'storage'
    ? settings.storageDirectory
    : key === 'import'
      ? settings.importDirectory
      : settings.exportDirectory;
}

/** The values the backend holds, as the form shows them: the path that applies, empty if none. */
function draftOf(settings: FileSettings): Draft {
  return {
    keep: settings.keepImportedFiles,
    storage: settings.storageDirectory.path ?? '',
    import: settings.importDirectory.path ?? '',
    export: settings.exportDirectory.path ?? '',
  };
}

/**
 * The value to send for a directory: `null` (the default applies) if the field is empty, or if it
 * still shows the default that was shown when it was read; else the typed path.
 */
function valueToSend(typed: string, setting: DirectorySetting): string | null {
  if (typed.trim() === '') {
    return null;
  }
  if (setting.isDefault && typed === (setting.path ?? '')) {
    return null;
  }
  return typed;
}

export function SettingsView() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const settings = useFileSettings();
  // `null`: nothing is changed, the form shows what the backend holds.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [refusals, setRefusals] = useState<Partial<Record<DirectoryField, DirectoryReason>>>({});
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: (variables: { draft: Draft; settings: FileSettings }) =>
      updateFileSettings({
        keepImportedFiles: variables.draft.keep,
        storageDirectory: valueToSend(variables.draft.storage, variables.settings.storageDirectory),
        importDirectory: valueToSend(variables.draft.import, variables.settings.importDirectory),
        exportDirectory: valueToSend(variables.draft.export, variables.settings.exportDirectory),
      }),
    onSuccess: (stored) => {
      queryClient.setQueryData(FILE_SETTINGS_QUERY_KEY, stored);
      setDraft(null);
      setRefusals({});
      setSaved(true);
    },
    onError: (error) => {
      setSaved(false);
      setRefusals(directoryRefusals(error) ?? {});
    },
  });

  const current = settings.data;
  if (current === undefined) {
    return (
      <section className="region page" data-testid="settings" aria-labelledby="settings-title">
        <div className="page-scroll">
          <header className="page-head">
            <h1 id="settings-title">{t('settings.title')}</h1>
            <p className="muted">{t('settings.intro')}</p>
          </header>
          {settings.isError ? (
            <div className="error-note" role="alert" data-testid="settings-load-error">
              <Icon name="warn" size={14} />
              <span>{t('settings.loadError', { reason: describeError(t, settings.error) })}</span>
              <Btn
                small
                testid="settings-retry"
                onClick={() => {
                  void settings.refetch();
                }}
              >
                {t('common.retry')}
              </Btn>
            </div>
          ) : (
            <p className="muted" role="status">
              {t('common.loading')}
            </p>
          )}
        </div>
      </section>
    );
  }

  const server = draftOf(current);
  const form = draft ?? server;
  const changed = KEYS.some(({ key }) => form[key] !== server[key]) || form.keep !== server.keep;
  const refused = Object.keys(refusals).length > 0;
  // A refusal that is not one of directories (the backend is not reachable, an error) is shown as such.
  const otherError = mutation.isError && !refused ? mutation.error : null;

  function edit(changes: Partial<Draft>): void {
    setDraft({ ...form, ...changes });
    setSaved(false);
  }

  function editPath(key: Key, field: DirectoryField, value: string): void {
    edit({ [key]: value });
    setRefusals((now) => {
      const rest = { ...now };
      delete rest[field];
      return rest;
    });
  }

  return (
    <section className="region page" data-testid="settings" aria-labelledby="settings-title">
      <div className="page-scroll">
        <header className="page-head">
          <h1 id="settings-title">{t('settings.title')}</h1>
          <p className="muted">{t('settings.intro')}</p>
        </header>
        <form
          className="card-box wide settings-form"
          data-testid="settings-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (changed && !mutation.isPending) {
              mutation.mutate({ draft: form, settings: current });
            }
          }}
        >
          <CheckField
            label={t('settings.keep')}
            tip={t('settings.tip.keep')}
            checked={form.keep}
            testid="settings-keep"
            disabled={mutation.isPending}
            onChange={(keep) => {
              edit({ keep });
            }}
            note={t('settings.keepNote')}
          />
          {KEYS.map(({ key, field }) => {
            const setting = settingOf(current, key);
            const reason = refusals[field];
            return (
              <Field
                key={key}
                label={t(`settings.${key}`)}
                tip={t(`settings.tip.${key}`)}
                testid={`field-settings-${key}`}
                note={
                  <>
                    {t(`settings.note.${key}`)}{' '}
                    <span data-testid={`settings-${key}-origin`}>
                      {setting.isDefault
                        ? setting.path === null
                          ? t('settings.defaultUnknown')
                          : t('settings.isDefault')
                        : t('settings.isStored')}
                    </span>
                  </>
                }
              >
                {(id) => (
                  <>
                    <TextInput
                      id={id}
                      value={form[key]}
                      testid={`settings-${key}`}
                      disabled={mutation.isPending}
                      onChange={(value) => {
                        editPath(key, field, value);
                      }}
                    />
                    {reason !== undefined && (
                      <p className="error-note" role="alert" data-testid={`settings-${key}-error`} data-reason={reason}>
                        <Icon name="warn" size={14} />
                        {t(`settings.reason.${reason}`)}
                      </p>
                    )}
                  </>
                )}
              </Field>
            );
          })}

          {refused && (
            <p className="error-note" role="alert" data-testid="settings-refused">
              <Icon name="warn" size={14} />
              {t('settings.refused')}
            </p>
          )}
          {otherError !== null && (
            <p className="error-note" role="alert" data-testid="settings-error">
              <Icon name="warn" size={14} />
              {t('settings.saveError', { reason: describeError(t, otherError) })}
            </p>
          )}
          {saved && !changed && (
            <p className="ok-note" role="status" data-testid="settings-saved">
              <Icon name="check" size={16} />
              {t('settings.saved')}
            </p>
          )}
          {changed && (
            <p className="muted" data-testid="settings-unsaved">
              {t('settings.unsaved')}
            </p>
          )}
          <div className="btn-row">
            <Btn
              kind="primary"
              icon="save"
              type="submit"
              testid="settings-save"
              disabled={!changed || mutation.isPending}
            >
              {t('settings.save')}
            </Btn>
            <Btn
              testid="settings-discard"
              disabled={!changed || mutation.isPending}
              onClick={() => {
                setDraft(null);
                setRefusals({});
                mutation.reset();
              }}
            >
              {t('settings.discard')}
            </Btn>
          </div>
        </form>
      </div>
    </section>
  );
}
