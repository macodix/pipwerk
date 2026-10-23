// Region "properties view": the only place for hints, the assistant and short messages (req-ui-016). Shows the
// assistant, a template, or what is selected; while the assistant runs and something is selected, a line above the
// fields leads back to the assistant.
import { PanelTabs } from './Library';
import { ElementProps, FrameProps, RuleProps, StrategyProps } from './Properties';
import type { Finding } from './findings';
import { TemplateView } from './TemplateView';
import { Wizard } from './Wizard';
import { closeStrategy, newStrategyAction, setState, useApp } from './store';
import { Btn, Icon, useL } from './ui';

const STEPS = 5;

/** Short message that disappears by itself. */
function Toast() {
  const app = useApp();
  const L = useL();
  if (!app.toast) return null;
  return (
    <div className="toast" role="status" data-testid="toast">
      <Icon name="info" size={16} /><span>{L(app.toast.de, app.toast.en)}</span>
    </div>
  );
}

export function PropertiesPanel({ findings }: { findings: Finding[] }) {
  const app = useApp();
  const L = useL();
  const s = app.strategy;
  const wzRuns = !!(s && app.wizard);
  const showWizard = wzRuns && app.wzShown && !app.tplView;
  let body: React.ReactNode = null;
  if (app.tplView) body = <TemplateView />;
  else if (!s) {
    body = (
      <div className="props" data-testid="props-none">
        <div className="empty-card flat">
          <Icon name="info" size={26} />
          <h2>{L('Keine Strategie geöffnet', 'No strategy open')}</h2>
          <p>{L('Nächster Schritt: „Neue Strategie“ legt eine leere Strategie an und startet den Assistenten. „Öffnen“ zeigt gespeicherte Strategien.', '"New strategy" creates an empty strategy and starts the assistant. "Open" shows saved strategies.')}</p>
          <div className="btn-row">
            <Btn kind="primary" icon="plus" testid="empty-new" onClick={newStrategyAction}>{L('Neue Strategie', 'New strategy')}</Btn>
            <Btn icon="folder" testid="empty-open" onClick={() => setState({ dialog: { k: 'open' } })}>{L('Öffnen', 'Open')}</Btn>
          </div>
        </div>
      </div>
    );
  } else if (showWizard) body = null;
  else if (app.sel.k === 'el') {
    const el = s.els.find((e) => e.id === (app.sel as { id: string }).id);
    body = el ? <ElementProps el={el} findings={findings} key={el.id} /> : <StrategyProps findings={findings} />;
  } else if (app.sel.k === 'frame') body = <FrameProps orderId={app.sel.id} />;
  else if (app.sel.k === 'rule') body = <RuleProps owner={app.sel.owner} id={app.sel.id} key={app.sel.id} />;
  else body = <StrategyProps findings={findings} />;
  const resume = wzRuns && !app.wzShown && !app.tplView && app.wizard;
  return (
    <aside className="region region-props" data-region="props" data-testid="props" aria-label={L('Eigenschaftenansicht', 'Properties view')}>
      <PanelTabs />
      {s && !app.tplView && !showWizard && app.sel.k !== 'strategy' && (
        <div className="crumbs">
          <button type="button" onClick={() => setState({ sel: { k: 'strategy' } })} data-testid="crumb-strategy">
            <Icon name="left" size={14} />{s.name}
          </button>
        </div>
      )}
      <div className="props-main">
        <Toast />
        <div className="props-scroll">
          {resume && (
            <div className="wz-resume" data-testid="wz-resume">
              <Icon name="wand" size={16} />
              <span>{L(`Assistent, Schritt ${resume.step} von ${STEPS}`, `Assistant, step ${resume.step} of ${STEPS}`)}</span>
              <Btn small kind="primary" testid="wz-resume-btn" onClick={() => setState({ wzShown: true })}>{L('Assistent fortsetzen', 'Continue assistant')}</Btn>
            </div>
          )}
          {/* stays mounted while hidden, so that the entries of the assistant survive a look at an element */}
          {wzRuns && <div hidden={!showWizard}><Wizard /></div>}
          {body}
        </div>
      </div>
      <span hidden onClick={closeStrategy} />
    </aside>
  );
}
