// Application shell: header with menu, strategy parameters, library, canvas, properties, footer.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from './Canvas';
import { Dialogs } from './Dialogs';
import { computeFindings } from './findings';
import { Library } from './Library';
import { ParamEditor } from './Properties';
import { PropertiesPanel } from './PropertiesPanel';
import {
  closeStrategy, newStrategyAction, runCheck, saveStrategy, select, setState, addParam, useApp,
} from './store';
import { Btn, Icon, TipLayer, fmtDate, useL } from './ui';

function Header() {
  const app = useApp();
  const L = useL();
  const s = app.strategy;
  const open = app.menuOpen;
  const items: { id: string; label: string; icon: string; run: () => void; disabled?: boolean; kind?: 'primary' }[] = [
    { id: 'new', label: L('Neue Strategie', 'New strategy'), icon: 'plus', run: newStrategyAction },
    { id: 'open', label: L('Öffnen', 'Open'), icon: 'folder', run: () => setState({ dialog: { k: 'open' }, menuOpen: false }) },
    { id: 'save', label: L('Speichern', 'Save'), icon: 'save', run: () => { saveStrategy(); setState({ menuOpen: false }); }, disabled: !s },
    { id: 'check', label: L('Prüfen', 'Check'), icon: 'check', run: runCheck, disabled: !s },
    { id: 'close', label: L('Schließen', 'Close'), icon: 'x', run: closeStrategy, disabled: !s },
    { id: 'delete', label: L('Löschen', 'Delete'), icon: 'trash', run: () => setState({ dialog: { k: 'deleteStrategy' }, menuOpen: false }), disabled: !s },
    { id: 'settings', label: L('Einstellungen', 'Settings'), icon: 'gear', run: () => setState({ dialog: { k: 'settings' }, menuOpen: false }) },
  ];
  const tips: Record<string, string> = {
    new: L('Legt eine neue, leere Strategie an. Ein Assistent führt Sie durch den Aufbau.', 'Creates a new empty strategy. An assistant guides you through the setup.'),
    open: L('Zeigt die gespeicherten Strategien zum Öffnen.', 'Shows the saved strategies to open.'),
    save: L('Speichert die Strategie und prüft sie. Speichern geht immer, auch bei Befunden.', 'Saves the strategy and checks it. Saving always works, even with findings.'),
    check: L('Sucht Probleme wie fehlende Verbindungen oder leere Pflichtangaben.', 'Looks for problems such as missing connections or empty required entries.'),
    close: L('Schließt die Strategie. Bei ungespeicherten Änderungen fragt Studio nach.', 'Closes the strategy. With unsaved changes Studio asks first.'),
    delete: L('Löscht die Strategie nach Rückfrage.', 'Deletes the strategy after confirmation.'),
    settings: L('Sprache und Speicherort der Objekte.', 'Language and storage location of the objects.'),
  };
  const errCount = app.checked && s ? computeFindings(s, app.settings.lang).length : 0;
  return (
    <header className="region header" data-region="header" data-testid="header">
      <div className="brand">
        <span className="logo" aria-hidden="true"><Icon name="chart" size={20} /></span>
        <span className="brand-name">pipwerk Studio</span>
        <span className="proto-tag" data-tip={L('Prototyp: klickbar mit simulierten Daten. Er rechnet nichts.', 'Prototype: clickable with simulated data. It calculates nothing.')}>{L('Prototyp', 'Prototype')}</span>
      </div>
      <nav className="menu menu-full" aria-label={L('Menü', 'Menu')}>
        {items.map((it) => (
          <button key={it.id} type="button" className="menu-btn" disabled={it.disabled} onClick={it.run} data-testid={`menu-${it.id}`} data-tip={tips[it.id]}>
            <Icon name={it.icon} size={16} /><span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="head-right">
        {app.checked && s && (
          <button type="button" className={`count-pill${errCount ? ' bad' : ' good'}`} onClick={() => select({ k: 'strategy' }, 'props')} data-testid="findings-count" data-tip={L('Befunde der Prüfung', 'Check findings')}>
            <Icon name={errCount ? 'warn' : 'check'} size={14} />
            {errCount ? L(`${errCount} Befund(e)`, `${errCount} finding(s)`) : L('keine Befunde', 'no findings')}
          </button>
        )}
        <div className="menu-compact">
          <Btn icon="menu" kind="ghost" testid="menu-toggle" onClick={() => setState({ menuOpen: !open })}>{L('Menü', 'Menu')}</Btn>
          {open && (
            <div className="menu-pop" role="menu" data-testid="menu-pop">
              {items.map((it) => (
                <button key={it.id} type="button" role="menuitem" disabled={it.disabled} onClick={it.run} data-testid={`cmenu-${it.id}`}>
                  <Icon name={it.icon} size={16} /><span>{it.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Btn icon="info" kind="ghost" testid="menu-about" onClick={() => setState({ dialog: { k: 'about' } })}>
          <span className="about-text">{L('Über pipwerk Studio', 'About pipwerk Studio')}</span>
        </Btn>
      </div>
    </header>
  );
}

function ParamStrip() {
  const app = useApp();
  const L = useL();
  const s = app.strategy;
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);
  const cur = s?.params.find((p) => p.id === open);
  return (
    <section className="region params" data-region="params" data-testid="param-strip" ref={ref} aria-label={L('Strategieparameter', 'Strategy parameters')}>
      {s && (
        <button type="button" className={`status-pill${app.dirty ? ' dirty' : ''}`} onClick={() => select({ k: 'strategy' }, 'props')} data-testid="status-pill" data-tip={L('Zur Eigenschaftenansicht der Strategie: Name, Beschreibung, Regeln', 'To the properties view of the strategy: name, description, rules')}>
          <span className="dot" />
          <span className="status-name">{s.name}</span>
          <span className="status-state">{app.dirty ? L('ungespeichert', 'unsaved') : L('gespeichert', 'saved')}</span>
        </button>
      )}
      <div className="strip-label">
        <Icon name="params" size={16} />
        <span>{L('Strategieparameter', 'Strategy parameters')}</span>
      </div>
      {!s && <span className="strip-note">{L('Öffnen Sie eine Strategie, um ihre Parameter zu sehen.', 'Open a strategy to see its parameters.')}</span>}
      {s && (
        <div className="chips strip-chips">
          {s.params.length === 0 && <span className="strip-note">{L('Noch keine. Mit „+ Neu“ legen Sie den ersten an, zum Beispiel die Zeiteinheit.', 'None yet. Create the first one with "+ New", for example the time unit.')}</span>}
          {s.params.map((p) => (
            <button key={p.id} type="button" className={`chip chip-param${open === p.id ? ' on' : ''}`} onClick={() => setOpen(open === p.id ? null : p.id)} data-testid="param-chip" data-tip={L('Klicken zum Ändern', 'Click to change')}>
              <b>{p.name}</b>
              <span>{p.atApplication ? L('bei Anwendung', 'at application') : p.dtype === 'time_unit' ? String(p.value).toUpperCase() : p.dtype === 'boolean' ? (p.value ? L('ja', 'yes') : L('nein', 'no')) : p.dtype === 'percent' && typeof p.value === 'number' ? `${Math.round(p.value * 10000) / 100} %` : String(p.value)}</span>
            </button>
          ))}
          <button type="button" className="chip chip-add" data-testid="param-new" onClick={() => { const id = addParam(L('Neuer Strategieparameter', 'New strategy parameter'), 'number'); setOpen(id); }} data-tip={L('Neuen Strategieparameter anlegen', 'Create a new strategy parameter')}>
            <Icon name="plus" size={14} />{L('Neu', 'New')}
          </button>
        </div>
      )}
      {cur && (
        <div className="popover" data-testid="param-popover">
          <ParamEditor p={cur} />
          <Btn small kind="quiet" onClick={() => setOpen(null)}>{L('Fertig', 'Done')}</Btn>
        </div>
      )}
    </section>
  );
}

function Footer() {
  const app = useApp();
  const L = useL();
  const s = app.strategy;
  return (
    <footer className="region footer" data-region="footer" data-testid="footer">
      <span className="foot-item">{s ? (app.dirty ? L('Ungespeicherte Änderungen', 'Unsaved changes') : L(`Gespeichert: ${fmtDate(s.savedAt, app.settings.lang)}`, `Saved: ${fmtDate(s.savedAt, app.settings.lang)}`)) : L('Keine Strategie geöffnet', 'No strategy open')}</span>
      <span className="foot-item foot-mid" data-tip={L('Der Prototyp läuft ohne Backend. Gespeichertes bleibt in diesem Browser.', 'The prototype runs without a backend. Saved data stays in this browser.')}>
        <span className="dot ok" />{L('Prototyp, simulierte Daten', 'Prototype, simulated data')}
      </span>
      <span className="foot-item foot-end" data-tip={L('Stand des Prototyps', 'Version of the prototype')}>pipwerk Studio · {L('Stand', 'version')} 2026-10-19</span>
    </footer>
  );
}

function TabBar() {
  const app = useApp();
  const L = useL();
  const tabs: [string, string, string][] = [
    ['canvas', L('Fläche', 'Canvas'), 'grid'], ['library', L('Bibliothek', 'Library'), 'list'], ['props', L('Eigenschaften', 'Properties'), 'sliders'],
  ];
  return (
    <nav className="region tabbar" data-region="tabbar" role="tablist" aria-label={L('Bereiche', 'Areas')} data-testid="tabbar">
      {tabs.map(([id, label, icon]) => (
        <button key={id} type="button" role="tab" aria-selected={app.panel === id} className={app.panel === id ? 'on' : ''} onClick={() => setState({ panel: id as 'canvas' | 'library' | 'props' })} data-testid={`bar-${id}`}>
          <Icon name={icon} size={18} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

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

export function App() {
  const app = useApp();
  const findings = useMemo(() => (app.strategy && app.checked ? computeFindings(app.strategy, app.settings.lang) : []), [app.strategy, app.checked, app.settings.lang]);
  useEffect(() => {
    document.documentElement.lang = app.settings.lang;
  }, [app.settings.lang]);
  return (
    <div className="app" data-panel={app.panel} data-testid="app">
      <Header />
      <ParamStrip />
      <Library />
      <Canvas findings={findings} />
      <PropertiesPanel findings={findings} />
      <TabBar />
      <Footer />
      <Dialogs />
      <Toast />
      <TipLayer />
    </div>
  );
}
