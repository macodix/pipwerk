import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AboutDialog } from './AboutDialog';
import { BackendStatus } from './BackendStatus';
import { DesignerCanvas } from './DesignerCanvas';
import { describeCause } from './errors';
import { MessageDialog } from './dialogs/MessageDialog';
import { OpenDialog } from './dialogs/OpenDialog';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { ElementLibrary } from './library/ElementLibrary';
import { MenuBar } from './MenuBar';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { RevisionDisplay } from './RevisionDisplay';
import { StudioContext } from './state/StudioContext';
import { useStudioController } from './state/useStudioController';
import { useStudioLanguage } from './useStudioLanguage';

export function App() {
  const { t, i18n } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  // The language is read at the start and kept here, so that a language that is being saved is not lost
  // when the settings are closed.
  const languageState = useStudioLanguage();
  const studio = useStudioController();
  const { state, dialog, setDialog, api, types, busy } = studio;

  useEffect(() => {
    if (i18n.resolvedLanguage !== undefined) {
      document.documentElement.lang = i18n.resolvedLanguage;
    }
  }, [i18n.resolvedLanguage]);

  const findingCount = state.findings === null ? null : studio.findings.all.length;
  const strategyTitle = state.document?.title ?? '';

  return (
    <div className="studio">
      <header className="studio-header">
        <h1>pipwerk Studio</h1>
        <MenuBar
          hasStrategy={state.document !== null}
          ready={types !== null}
          busy={busy}
          onNew={() => {
            studio.request({ kind: 'new' });
          }}
          onOpen={() => {
            setDialog({ kind: 'open' });
          }}
          onSave={() => {
            void studio.save();
          }}
          onCheck={() => {
            void studio.check();
          }}
          onClose={() => {
            studio.request({ kind: 'close' });
          }}
          onDelete={() => {
            setDialog({ kind: 'delete' });
          }}
          onSettings={() => {
            setDialog({ kind: 'settings' });
          }}
        />
        <div className="studio-header-actions">
          {findingCount !== null ? (
            <span
              className="findings-count"
              title={t('findings.countDetail', { errors: studio.findings.errors, hints: studio.findings.hints })}
            >
              {t('findings.count', { count: findingCount })}
            </span>
          ) : null}
          <button
            type="button"
            ref={aboutButtonRef}
            onClick={() => {
              setAboutOpen(true);
            }}
          >
            {t('about.open')}
          </button>
        </div>
      </header>
      <main className="studio-main">
        <ElementLibrary
          groups={studio.library}
          loadFailed={studio.typesFailed}
          storedFailed={studio.storedFailed}
          canInsert={state.document !== null}
          onRetry={studio.retryTypes}
          onInsert={studio.insertEntry}
        />
        <DesignerCanvas
          state={state}
          dispatch={studio.dispatch}
          types={types}
          language={studio.language}
          severities={studio.severities}
          onDropEntry={studio.dropEntry}
          apiRef={studio.canvasApi}
        />
        {api !== null ? (
          <StudioContext.Provider value={api}>
            <PropertiesPanel />
          </StudioContext.Provider>
        ) : (
          <aside className="studio-properties" aria-label={t('properties.panel')}>
            <p className="properties-none">{t('properties.none')}</p>
          </aside>
        )}
      </main>
      <footer className="studio-footer">
        <BackendStatus />
        <RevisionDisplay />
      </footer>
      <AboutDialog
        open={aboutOpen}
        onClose={() => {
          setAboutOpen(false);
          // The focus is set explicitly and does not depend on the browser.
          aboutButtonRef.current?.focus();
        }}
      />

      {dialog?.kind === 'unsaved' ? (
        <MessageDialog
          title={t('dialogs.unsaved.title')}
          onCancel={() => {
            void studio.answerUnsaved('cancel');
          }}
          actions={[
            {
              label: t('dialogs.unsaved.save'),
              primary: true,
              onClick: () => {
                void studio.answerUnsaved('save');
              },
            },
            {
              label: t('dialogs.unsaved.discard'),
              onClick: () => {
                void studio.answerUnsaved('discard');
              },
            },
            {
              label: t('dialogs.unsaved.cancel'),
              onClick: () => {
                void studio.answerUnsaved('cancel');
              },
            },
          ]}
        >
          <p>{t('dialogs.unsaved.text')}</p>
        </MessageDialog>
      ) : null}
      {dialog?.kind === 'open' ? (
        <OpenDialog
          onOpen={(id) => {
            setDialog(null);
            studio.request({ kind: 'open', id });
          }}
          onCancel={() => {
            setDialog(null);
          }}
        />
      ) : null}
      {dialog?.kind === 'delete' ? (
        <MessageDialog
          title={t('dialogs.delete.title')}
          onCancel={() => {
            setDialog(null);
          }}
          actions={[
            {
              label: t('dialogs.delete.confirm'),
              onClick: () => {
                void studio.confirmDelete();
              },
            },
            {
              label: t('dialogs.delete.cancel'),
              primary: true,
              onClick: () => {
                setDialog(null);
              },
            },
          ]}
        >
          <p>
            {strategyTitle === ''
              ? t('dialogs.delete.textUntitled')
              : t('dialogs.delete.text', { title: strategyTitle })}
          </p>
          {state.persisted ? null : <p>{t('dialogs.delete.notSaved')}</p>}
        </MessageDialog>
      ) : null}
      {dialog?.kind === 'settings' ? (
        <SettingsDialog
          languageState={languageState}
          onClose={() => {
            setDialog(null);
          }}
        />
      ) : null}
      {dialog?.kind === 'error' ? (
        <ErrorDialog
          titleKey={dialog.titleKey}
          error={dialog.error}
          onClose={() => {
            setDialog(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** A message that has to be confirmed: a request failed (item 9 of the order). */
function ErrorDialog({ titleKey, error, onClose }: { titleKey: string; error: unknown; onClose: () => void }) {
  const { t } = useTranslation();
  const cause = describeCause(t, error);
  return (
    <MessageDialog
      role="alertdialog"
      title={t(titleKey)}
      onCancel={onClose}
      actions={[{ label: t('dialogs.error.ok'), primary: true, onClick: onClose }]}
    >
      <p>{cause.summary}</p>
      {cause.backendText !== null ? <p lang="en">{cause.backendText}</p> : null}
    </MessageDialog>
  );
}
