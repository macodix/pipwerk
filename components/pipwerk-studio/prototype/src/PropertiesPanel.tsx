// Region "properties view": shows the wizard, a template, or what is selected.
import { PanelTabs } from './Library';
import { ElementProps, FrameProps, RuleProps, StrategyProps } from './Properties';
import type { Finding } from './findings';
import { TemplateView } from './TemplateView';
import { Wizard } from './Wizard';
import { closeStrategy, newStrategyAction, setState, useApp } from './store';
import { Btn, Icon, useL } from './ui';

export function PropertiesPanel({ findings }: { findings: Finding[] }) {
  const app = useApp();
  const L = useL();
  const s = app.strategy;
  let body: React.ReactNode;
  if (app.tplView) body = <TemplateView />;
  else if (!s) {
    body = (
      <div className="props" data-testid="props-none">
        <div className="empty-card flat">
          <Icon name="info" size={26} />
          <h2>{L('Keine Strategie geöffnet', 'No strategy open')}</h2>
          <p>{L('Nächster Schritt: „Neue Strategie“ legt eine leere Strategie an und startet den Assistenten. „Öffnen“ zeigt gespeicherte Strategien.', '"New strategy" creates an empty strategy and starts the assistant. "Open" shows saved strategies.')}</p>
          <div className="btn-row">
            <Btn kind="primary" icon="plus" onClick={newStrategyAction}>{L('Neue Strategie', 'New strategy')}</Btn>
            <Btn icon="folder" onClick={() => setState({ dialog: { k: 'open' } })}>{L('Öffnen', 'Open')}</Btn>
          </div>
        </div>
      </div>
    );
  } else if (app.wizard) body = <Wizard />;
  else if (app.sel.k === 'el') {
    const el = s.els.find((e) => e.id === (app.sel as { id: string }).id);
    body = el ? <ElementProps el={el} findings={findings} key={el.id} /> : <StrategyProps findings={findings} />;
  } else if (app.sel.k === 'frame') body = <FrameProps orderId={app.sel.id} />;
  else if (app.sel.k === 'rule') body = <RuleProps owner={app.sel.owner} id={app.sel.id} key={app.sel.id} />;
  else body = <StrategyProps findings={findings} />;
  return (
    <aside className="region region-props" data-region="props" data-testid="props" aria-label={L('Eigenschaftenansicht', 'Properties view')}>
      <PanelTabs />
      {s && !app.tplView && !app.wizard && app.sel.k !== 'strategy' && (
        <div className="crumbs">
          <button type="button" onClick={() => setState({ sel: { k: 'strategy' } })} data-testid="crumb-strategy">
            <Icon name="left" size={14} />{s.name}
          </button>
        </div>
      )}
      <div className="props-scroll">{body}</div>
      <span hidden onClick={closeStrategy} />
    </aside>
  );
}
