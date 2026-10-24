import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { elementName } from '../model/elements';
import { PanelTabs } from '../library/Library';
import { useStudio } from '../state/StudioContext';
import { Btn, Section } from '../ui/controls';
import { Icon } from '../ui/Icon';
import { ElementView } from './ElementView';
import { FindingsList } from './FindingsList';
import { InstanceList } from './Instances';
import { Wizard } from '../wizard/Wizard';
import { WIZARD_STEPS } from '../wizard/model';

/** After a click on a finding the field is scrolled into view and highlighted. */
function useFocusField(root: React.RefObject<HTMLElement | null>): void {
  const { studio } = useStudio();
  const focus = studio.state.focusField;
  useEffect(() => {
    if (focus === null || root.current === null) {
      return;
    }
    const target = root.current.querySelector<HTMLElement>(`[data-field="${CSS.escape(focus.field)}"]`);
    if (target === null) {
      return;
    }
    target.scrollIntoView({ block: 'center' });
    target.classList.add('flash');
    // a finding in an expression leads to the spot in the formula, which takes the focus itself
    if (focus.place === null) {
      target.querySelector<HTMLElement>('select, input, textarea, button')?.focus({ preventScroll: true });
    }
    const timer = window.setTimeout(() => {
      target.classList.remove('flash');
    }, 1800);
    return () => {
      window.clearTimeout(timer);
    };
  }, [focus, root]);
}

/**
 * The short message of the properties view (specification 5.1): the prompt of a step that waits for its successor, or a
 * note that disappears on its own. Messages stand only here, never on the drawing area (req-ui-016).
 */
function MessageBar() {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const { state, actions } = studio;
  if (state.armed !== null) {
    const value = state.armed.output.startsWith('prop:');
    return (
      <div className="message-bar waiting" role="status" data-testid="armed-banner">
        <Icon name="link" size={16} />
        <span>
          {t(value ? 'notices.armedValue' : 'notices.armed')}
          {value && state.notice !== null && studio.noticeVisible && state.notice.key.startsWith('notices.connection.') ? (
            <>
              {' '}
              <span data-testid="message">{t(state.notice.key, state.notice.params)}</span>
            </>
          ) : null}
        </span>
        <Btn
          small
          kind="quiet"
          onClick={() => {
            actions.arm(null);
          }}
        >
          {t('common.cancel')}
        </Btn>
      </div>
    );
  }
  if (state.notice === null || !studio.noticeVisible) {
    return null;
  }
  return (
    <div className="message-bar" role="status" data-testid="message">
      <Icon name="info" size={16} />
      <span>{t(state.notice.key, state.notice.params)}</span>
    </div>
  );
}

/** "Assistent, Schritt n von 5" with "Assistent fortsetzen" above the properties of what the user chose (specification 5.5). */
function WizardBar() {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const wizard = studio.state.wizard;
  if (wizard === null || !wizard.paused) {
    return null;
  }
  return (
    <div className="wizard-bar" data-testid="wizard-bar">
      <Icon name="wand" size={16} />
      <span className="grow">{t('wizard.barStep', { step: wizard.step, count: WIZARD_STEPS })}</span>
      <Btn small kind="primary" onClick={studio.actions.resumeWizard} testid="wz-resume">
        {t('wizard.resume')}
      </Btn>
    </div>
  );
}

/** The hint of a strategy without elements: the next step, with the way to the assistant (specification 5.5). */
function EmptyStrategyHint() {
  const { studio } = useStudio();
  const { t } = useTranslation();
  return (
    <div className="hint-box hint-card" data-testid="empty-strategy-hint">
      <Icon name="info" size={16} />
      <div className="hint-body">
        <strong>{t('properties.emptyTitle')}</strong>
        <p>{t('properties.emptyText')}</p>
        <div className="btn-row">
          <Btn small kind="primary" icon="wand" testid="empty-wizard" onClick={studio.actions.startWizard}>
            {t('wizard.start')}
          </Btn>
          <span className="only-narrow">
            <Btn
              small
              icon="list"
              testid="empty-library"
              onClick={() => {
                studio.actions.setPanel('library');
              }}
            >
              {t('canvas.openLibrary')}
            </Btn>
          </span>
        </div>
      </div>
    </div>
  );
}

function StrategyView() {
  const { studio, findings } = useStudio();
  const { t } = useTranslation();
  const root = useRef<HTMLDivElement>(null);
  useFocusField(root);
  const document = studio.state.document;
  if (document === null) {
    return null;
  }
  const { actions } = studio;
  const checked = studio.state.findings !== null;
  return (
    <div className="props" ref={root} data-testid="props-strategy">
      {document.elements.length === 0 && studio.state.wizard === null ? <EmptyStrategyHint /> : null}
      <header className="props-head">
        <div className="badge b-strategy">
          <Icon name="chart" size={20} />
        </div>
        <div className="props-title">
          <span className="props-kind">{t('properties.strategy')}</span>
          <input
            className="input title-input"
            value={document.name}
            onChange={(event) => {
              actions.setName(event.target.value);
            }}
            aria-label={t('properties.strategyName')}
            data-testid="strategy-name"
          />
        </div>
      </header>
      <Section title={t('properties.description')}>
        <textarea
          className="input area"
          rows={3}
          value={document.description}
          onChange={(event) => {
            actions.setDescription(event.target.value);
          }}
          aria-label={t('properties.description')}
          data-testid="strategy-description"
          placeholder={t('properties.descriptionPlaceholder')}
        />
      </Section>
      <Section title={t('properties.rulesOfStrategy')} testid="sec-rules">
        <p className="muted">{t('properties.rulesOfStrategyHint')}</p>
        <InstanceList list={{ root: { kind: 'strategy' }, steps: [], list: 'rules' }} kind="rules" />
      </Section>
      <Section
        title={t('properties.findings')}
        testid="sec-findings"
        aside={
          <Btn
            small
            kind="ghost"
            icon="check"
            testid="props-check"
            onClick={() => {
              void actions.check();
            }}
          >
            {t('menu.check')}
          </Btn>
        }
      >
        {!checked ? <p className="empty-note">{t('properties.notChecked')}</p> : null}
        {checked && findings.all.length === 0 ? (
          <p className="ok-note" data-testid="no-findings">
            <Icon name="check" size={16} />
            {t('properties.noFindings')}
          </p>
        ) : null}
        {checked && findings.all.length > 0 ? (
          <p className="muted">
            {t(findings.general.length === findings.all.length ? 'properties.findingsGeneral' : 'properties.findingsMarked')}
          </p>
        ) : null}
        <FindingsList items={[...findings.general, ...findings.all.filter((finding) => finding.element !== null)]} />
      </Section>
    </div>
  );
}

function FrameView({ owner }: { owner: string }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  const element = document?.elements.find((candidate) => candidate.id === owner);
  if (document === null || element === undefined || types === null) {
    return null;
  }
  const count = document.elements.filter((candidate) => candidate.management_of === owner).length;
  return (
    <div className="props" data-testid="props-frame">
      <header className="props-head">
        <div className="badge b-order">
          <Icon name="layers" size={20} />
        </div>
        <div className="props-title">
          <span className="props-kind">{t('properties.management')}</span>
          <h2>{t('properties.managementOfName', { name: elementName(element, types, studio.language) })}</h2>
        </div>
      </header>
      <p>{t('properties.managementText')}</p>
      <p className="hint-box">
        <Icon name="info" size={16} />
        <span>{t(count === 0 ? 'properties.managementEmpty' : 'properties.managementInsert')}</span>
      </p>
    </div>
  );
}

function SectionView({ id }: { id: string }) {
  const { studio, types } = useStudio();
  const { t } = useTranslation();
  const document = studio.state.document;
  const section = document?.sections.find((candidate) => candidate.id === id);
  if (document === null || section === undefined || types === null) {
    return null;
  }
  const { actions } = studio;
  return (
    <div className="props" data-testid="props-section">
      <header className="props-head">
        <div className="badge b-calc">
          <Icon name="list" size={20} />
        </div>
        <div className="props-title">
          <span className="props-kind">{t('properties.section')}</span>
          <input
            className="input title-input"
            value={section.name}
            onChange={(event) => {
              actions.renameSection(id, event.target.value);
            }}
            aria-label={t('properties.sectionName')}
            data-testid="section-title"
          />
        </div>
      </header>
      <p className="muted">{t('properties.sectionHint')}</p>
      <Section title={t('properties.stepsOfSection', { count: section.elements.length })}>
        <ul className="prop-list">
          {section.elements.map((elementId) => {
            const element = document.elements.find((candidate) => candidate.id === elementId);
            return element === undefined ? null : (
              <li key={elementId} className="prop-row">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    actions.select({ kind: 'element', id: elementId });
                  }}
                >
                  {elementName(element, types, studio.language)}
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
      <div className="btn-row">
        <Btn
          small
          testid="section-toggle"
          onClick={() => {
            actions.setSectionCollapsed(id, !section.collapsed);
          }}
        >
          {t(section.collapsed ? 'canvas.expandSection' : 'canvas.collapseSection')}
        </Btn>
        <Btn
          small
          kind="quiet"
          icon="trash"
          testid="section-remove"
          onClick={() => {
            actions.removeSection(id);
          }}
        >
          {t('properties.dissolveSection')}
        </Btn>
      </div>
    </div>
  );
}

/** The properties view (specification 5.4): the strategy, the selected element, frame or section. */
export function PropertiesPanel() {
  const { studio } = useStudio();
  const { t } = useTranslation();
  const { state, actions } = studio;
  const document = state.document;
  const selection = state.selection;
  let body: React.ReactNode;
  if (document === null) {
    body = (
      <div className="props" data-testid="props-none">
        <div className="empty-card flat">
          <Icon name="info" size={26} />
          <h2>{t('canvas.noStrategyTitle')}</h2>
          <p>{t('properties.none')}</p>
          <div className="btn-row">
            <Btn
              kind="primary"
              icon="plus"
              onClick={() => {
                actions.request({ kind: 'new' });
              }}
            >
              {t('menu.new')}
            </Btn>
            <Btn
              icon="folder"
              onClick={() => {
                actions.setDialog({ kind: 'open' });
              }}
            >
              {t('menu.open')}
            </Btn>
          </div>
        </div>
      </div>
    );
  } else if (state.wizard !== null && !state.wizard.paused) {
    body = <Wizard />;
  } else if (selection.kind === 'element') {
    const element = document.elements.find((candidate) => candidate.id === selection.id);
    body = element === undefined ? <StrategyView /> : <ElementView element={element} key={element.id} />;
  } else if (selection.kind === 'frame') {
    body = <FrameView owner={selection.id} />;
  } else if (selection.kind === 'section') {
    body = <SectionView id={selection.id} key={selection.id} />;
  } else {
    body = <StrategyView />;
  }
  return (
    <aside className="region region-props" data-region="props" data-testid="props" aria-label={t('properties.panel')}>
      <PanelTabs />
      <MessageBar />
      <WizardBar />
      {document !== null && selection.kind !== 'strategy' ? (
        <div className="crumbs">
          <button
            type="button"
            onClick={() => {
              actions.select({ kind: 'strategy' });
            }}
            data-testid="crumb-strategy"
          >
            <Icon name="left" size={14} />
            {document.name}
          </button>
        </div>
      ) : null}
      <div className="props-scroll">{body}</div>
    </aside>
  );
}
