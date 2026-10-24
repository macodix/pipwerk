import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AboutDialog } from './AboutDialog';
import { BackendStatus } from './BackendStatus';
import { Canvas } from './canvas/Canvas';
import { MessageDialog } from './dialogs/MessageDialog';
import { OpenDialog } from './dialogs/OpenDialog';
import { SettingsDialog } from './dialogs/SettingsDialog';
import { describeCause } from './errors';
import { indexFindings } from './findings/findingsModel';
import { Header } from './Header';
import { Library } from './library/Library';
import type { DescribeContext } from './model/describe';
import { ParamStrip } from './ParamStrip';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { RevisionDisplay } from './RevisionDisplay';
import type { RemovalPlan } from './state/removal';
import { StudioContext, useStudio, type StudioValue } from './state/StudioContext';
import { languageOf, useStudioController } from './state/useStudioController';
import { useExpressions } from './state/useExpressions';
import { useUsage } from './state/useUsage';
import { buildUsageModel } from './model/uses';
import { Icon } from './ui/Icon';
import { TipLayer } from './ui/TipLayer';
import { useStudioLanguage } from './useStudioLanguage';

function TabBar() {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const tabs = [
    ['canvas', 'layout.canvas', 'grid'],
    ['library', 'layout.library', 'list'],
    ['props', 'layout.properties', 'sliders'],
  ] as const;
  return (
    <nav className="region tabbar" data-region="tabbar" role="tablist" aria-label={t('layout.areas')} data-testid="tabbar">
      {tabs.map(([id, key, icon]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={studio.state.panel === id}
          // a short message waits in the properties view, which this button leads to (specification 5.1)
          data-marked={id === 'props' && studio.state.panel !== 'props' && studio.messageShown ? 'true' : undefined}
          className={`${studio.state.panel === id ? 'on' : ''}${id === 'props' && studio.state.panel !== 'props' && studio.messageShown ? ' marked' : ''}`}
          onClick={() => {
            studio.actions.setPanel(id);
          }}
          data-testid={`bar-${id}`}
        >
          <Icon name={icon} size={18} />
          <span>{t(key)}</span>
        </button>
      ))}
    </nav>
  );
}

/** The steps that use what is about to be removed (the rules of the strategy are one entry of their own). */
function UsersList({ plan }: { plan: RemovalPlan }) {
  const { t } = useTranslation();
  const { studio } = useStudio();
  if (plan.users.length === 0) {
    return null;
  }
  return (
    <>
      <p>{t('dialogs.usedBy')}</p>
      <ul className="usage-list" data-testid="remove-users">
        {plan.users.map((id) => (
          <li key={id ?? 'strategy'}>
            <Icon name={id === null ? 'chart' : 'list'} size={14} />
            {id === null ? t('dialogs.usedByStrategyRules') : studio.actions.elementDisplayName(id)}
          </li>
        ))}
      </ul>
      <p>{t('dialogs.afterRemoval')}</p>
    </>
  );
}

function Dialogs({
  languageState,
}: {
  languageState: ReturnType<typeof useStudioLanguage>;
}) {
  const { studio } = useStudio();
  const { t, i18n } = useTranslation();
  const { dialog, state, actions } = studio;
  if (dialog === null) {
    return null;
  }
  const document = state.document;
  const close = (): void => {
    actions.setDialog(null);
  };
  switch (dialog.kind) {
    case 'unsaved':
      return (
        <MessageDialog
          title={t('dialogs.unsaved.title')}
          onCancel={() => {
            void actions.answerUnsaved('cancel');
          }}
          actions={[
            {
              label: t('dialogs.unsaved.save'),
              primary: true,
              onClick: () => {
                void actions.answerUnsaved('save');
              },
            },
            {
              label: t('dialogs.unsaved.discard'),
              onClick: () => {
                void actions.answerUnsaved('discard');
              },
            },
            {
              label: t('dialogs.unsaved.cancel'),
              onClick: () => {
                void actions.answerUnsaved('cancel');
              },
            },
          ]}
        >
          <p>{t('dialogs.unsaved.text', { name: document?.name ?? '' })}</p>
        </MessageDialog>
      );
    case 'open':
      return (
        <OpenDialog
          onOpen={(id) => {
            close();
            actions.request({ kind: 'open', id });
          }}
          onCancel={close}
        />
      );
    case 'delete':
      return (
        <MessageDialog
          title={t('dialogs.delete.title')}
          onCancel={close}
          actions={[
            {
              label: t('dialogs.delete.confirm'),
              onClick: () => {
                void actions.confirmDelete();
              },
            },
            { label: t('dialogs.delete.cancel'), primary: true, onClick: close },
          ]}
        >
          <p>{t('dialogs.delete.text', { name: document?.name ?? '' })}</p>
          {state.persisted ? null : <p>{t('dialogs.delete.notSaved')}</p>}
        </MessageDialog>
      );
    case 'settings':
      return <SettingsDialog languageState={languageState} onClose={close} />;
    case 'removeElement': {
      const info = actions.removalInfo(dialog.id);
      if (info === null) {
        return null;
      }
      return (
        <MessageDialog
          title={t('dialogs.removeElement.title')}
          onCancel={close}
          actions={[
            {
              label: t('dialogs.removeElement.confirm'),
              onClick: () => {
                actions.confirmRemoveElement(dialog.id, dialog.plan);
              },
            },
            { label: t('dialogs.removeElement.cancel'), primary: true, onClick: close },
          ]}
        >
          <p>{t('dialogs.removeElement.text', { name: actions.elementDisplayName(dialog.id) })}</p>
          <UsersList plan={dialog.plan} />
          {info.managed.length > 0 ? (
            <>
              <p>{t('dialogs.removeElement.managed')}</p>
              <ul className="usage-list" data-testid="remove-managed">
                {info.managed.map((step) => (
                  <li key={step.id}>
                    <Icon name="layers" size={14} />
                    {actions.elementDisplayName(step.id)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </MessageDialog>
      );
    }
    case 'removeParameter': {
      const parameter = document?.parameters.find((candidate) => candidate.key === dialog.key);
      if (parameter === undefined) {
        return null;
      }
      return (
        <MessageDialog
          title={t('dialogs.removeParameter.title')}
          onCancel={close}
          actions={[
            {
              label: t('dialogs.removeParameter.confirm'),
              onClick: () => {
                actions.confirmRemoveParameter(dialog.key, dialog.plan);
              },
            },
            { label: t('dialogs.removeParameter.cancel'), primary: true, onClick: close },
          ]}
        >
          <p>{t('dialogs.removeParameter.text', { name: parameter.name })}</p>
          <UsersList plan={dialog.plan} />
        </MessageDialog>
      );
    }
    case 'error':
      return (
        <MessageDialog
          role="alertdialog"
          title={t(dialog.titleKey)}
          onCancel={close}
          actions={[{ label: t('dialogs.error.ok'), primary: true, onClick: close }]}
        >
          <p>{describeCause(t, i18n, dialog.error).summary}</p>
        </MessageDialog>
      );
  }
}

export function App() {
  const { t, i18n } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  // The language is read at the start and kept here, so that a language that is being saved is not lost
  // when the settings are closed.
  const languageState = useStudioLanguage();
  const language = languageOf(i18n.resolvedLanguage);
  const studio = useStudioController(language);
  const { state, types } = studio;
  const expressions = useExpressions(state.document, language, types !== null);
  const findings = useMemo(() => indexFindings(state.findings), [state.findings]);
  const describe = useMemo<DescribeContext | null>(
    () =>
      state.document === null || types === null
        ? null
        : { document: state.document, types, language, t, answers: expressions.answer },
    [expressions.answer, language, state.document, t, types],
  );
  const report = useUsage(state.document, types !== null);
  const uses = useMemo(
    () => (state.document === null || types === null ? null : buildUsageModel(state.document, types, report, expressions.references)),
    [expressions.references, report, state.document, types],
  );
  const value = useMemo<StudioValue>(
    () => ({ studio, types, expressions, findings, describe, uses }),
    [describe, expressions, findings, studio, types, uses],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <StudioContext.Provider value={value}>
      <div className="app" data-panel={state.panel} data-testid="app">
        <Header onAbout={() => { setAboutOpen(true); }} aboutRef={aboutButtonRef} />
        <ParamStrip />
        <Library />
        <Canvas />
        <PropertiesPanel />
        <TabBar />
        <footer className="region footer" data-region="footer" data-testid="footer">
          <BackendStatus />
          <RevisionDisplay />
        </footer>
        <Dialogs languageState={languageState} />
        <AboutDialog
          open={aboutOpen}
          onClose={() => {
            setAboutOpen(false);
            // The focus is set explicitly and does not depend on the browser.
            aboutButtonRef.current?.focus();
          }}
        />
        <TipLayer />
      </div>
    </StudioContext.Provider>
  );
}
