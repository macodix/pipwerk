// Application shell: header with menu, mode switch, about and language; the views; footer.
import { useEffect } from 'react';
import { AccountsView } from './AccountsView';
import { DataView } from './DataView';
import { Dialogs } from './Dialogs';
import { Prepare } from './Prepare';
import { BtProgress, ResultView } from './ResultView';
import { RunView } from './RunView';
import { SavedView } from './SavedView';
import { accountName } from './data';
import { backToPrepare, entryOf, setLang, setMode, setState, setView, useApp } from './store';
import type { View } from './store';
import { Btn, Icon, TipLayer, useL } from './ui';

function Header() {
  const app = useApp();
  const L = useL();
  const lang = app.settings.lang;
  const items: { id: View; label: string; icon: string; tip: string }[] = [
    { id: 'test', label: L('Testlauf', 'Test run'), icon: 'play', tip: L('Einen Testlauf vorbereiten und ausführen.', 'Prepare and run a test run.') },
    { id: 'data', label: L('Datenbestand', 'Data stock'), icon: 'database', tip: L('Welche historischen Kursdaten vorliegen; Import und Beschaffung von Hand.', 'Which historical price data is available; import and procurement by hand.') },
    { id: 'accounts', label: L('Testkonten', 'Test accounts'), icon: 'wallet', tip: L('Testkonten anlegen, bearbeiten, speichern und löschen.', 'Create, edit, save and delete test accounts.') },
    { id: 'saved', label: `${L('Gespeicherte Backtests', 'Saved backtests')} (${app.saved.length})`, icon: 'save', tip: L('Gespeicherte Backtests ansehen und vergleichen.', 'View and compare saved backtests.') },
  ];
  return (
    <header className="region header" data-region="header" data-testid="header">
      <div className="brand">
        <span className="logo" aria-hidden="true"><Icon name="chart" size={20} /></span>
        <span className="brand-name">pipwerk replay</span>
        <span className="proto-tag" data-tip={L('Prototyp: klickbar mit simulierten Daten. Er rechnet nicht wie das fertige Produkt.', 'Prototype: clickable with simulated data. It does not calculate like the finished product.')}>{L('Prototyp', 'Prototype')}</span>
      </div>
      <div className="seg mode-switch" role="radiogroup" aria-label={L('Betriebsart', 'Mode')} data-testid="mode-switch">
        <button type="button" role="radio" aria-checked={app.mode === 'single'} className={app.mode === 'single' ? 'on' : ''} onClick={() => setMode('single')} data-testid="mode-single"
          data-tip={L('Einzelschritt-Test: Die Strategie läuft Schritt für Schritt. Sie sehen Ablauf, Werte und Chart.', 'Single-step test: the strategy runs step by step. You see flow, values and chart.')}>
          <Icon name="step" size={15} /><span>{L('Einzelschritt-Test', 'Single-step test')}</span>
        </button>
        <button type="button" role="radio" aria-checked={app.mode === 'backtest'} className={app.mode === 'backtest' ? 'on' : ''} onClick={() => setMode('backtest')} data-testid="mode-backtest"
          data-tip={L('Backtest: Die Strategie läuft ohne Unterbrechung über den Testzeitraum. Ergebnis sind Kontoentwicklung, Trades und Kennzahlen.', 'Backtest: the strategy runs without interruption over the test period. The result is account development, trades and key figures.')}>
          <Icon name="chart" size={15} /><span>{L('Backtest', 'Backtest')}</span>
        </button>
      </div>
      <nav className="menu menu-full" aria-label={L('Menü', 'Menu')}>
        {items.map((it) => (
          <button key={it.id} type="button" className={`menu-btn${app.view === it.id ? ' on' : ''}`} onClick={() => setView(it.id)} data-testid={`menu-${it.id}`} data-tip={it.tip} aria-current={app.view === it.id ? 'page' : undefined}>
            <Icon name={it.icon} size={16} /><span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="head-right">
        <div className="menu-compact">
          <Btn icon="menu" kind="ghost" testid="menu-toggle" title={L('Menü', 'Menu')} onClick={() => setState({ menuOpen: !app.menuOpen })}>{L('Menü', 'Menu')}</Btn>
          {app.menuOpen && (
            <div className="menu-pop" role="menu" data-testid="menu-pop">
              {items.map((it) => (
                <button key={it.id} type="button" role="menuitem" onClick={() => setView(it.id)} data-testid={`cmenu-${it.id}`} className={app.view === it.id ? 'on' : ''}>
                  <Icon name={it.icon} size={16} /><span>{it.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Btn icon="info" kind="ghost" testid="menu-about" title={L('Über pipwerk replay', 'About pipwerk replay')} onClick={() => setState({ dialog: { k: 'about' } })}><span className="about-text">{L('Über pipwerk replay', 'About pipwerk replay')}</span></Btn>
        <div className="seg lang-switch" role="radiogroup" aria-label={L('Sprache', 'Language')} data-testid="lang-switch">
          {(['de', 'en'] as const).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)} data-testid={`lang-${l}`} data-tip={l === 'de' ? 'Deutsch' : 'English'}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const app = useApp();
  const L = useL();
  const e = entryOf(app.prep.strategyId);
  const per = app.prep.periods[app.mode];
  const acc = app.accounts.find((a) => a.id === app.prep.accountId);
  return (
    <footer className="region footer" data-region="footer" data-testid="footer">
      <span className="foot-item">{e.strategy.name} · {app.prep.instrument} · {per.from} – {per.to}{acc ? ` · ${accountName(acc, app.settings.lang)}` : ''}</span>
      <span className="foot-item foot-mid" data-tip={L('Der Prototyp läuft ohne Backend. Gespeichertes bleibt in diesem Browser.', 'The prototype runs without a backend. Saved data stays in this browser.')}>
        <span className="dot ok" />{L('Prototyp, simulierte Daten', 'Prototype, simulated data')}
      </span>
      <span className="foot-item foot-end" data-tip={L('Stand des Prototyps', 'Version of the prototype')}>pipwerk replay · {L('Stand', 'version')} 2026-10-21</span>
    </footer>
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

function Main() {
  const app = useApp();
  const L = useL();
  if (app.view === 'data') return <DataView />;
  if (app.view === 'accounts') return <AccountsView />;
  if (app.view === 'saved') return <SavedView />;
  switch (app.phase) {
    case 'run': return app.single ? <RunView /> : <Prepare />;
    case 'btrun': return <BtProgress />;
    case 'btresult': return app.result ? <ResultView result={app.result} onBack={backToPrepare} backLabel={L('Neuer Testlauf', 'New test run')} /> : <Prepare />;
    default: return <Prepare />;
  }
}

export function App() {
  const app = useApp();
  useEffect(() => {
    document.documentElement.lang = app.settings.lang;
  }, [app.settings.lang]);
  return (
    <div className="app" data-view={app.view} data-phase={app.phase} data-mode={app.mode} data-testid="app">
      <Header />
      <main className="main" data-testid="main"><Main /></main>
      <Footer />
      <Dialogs />
      <Toast />
      <TipLayer />
    </div>
  );
}
