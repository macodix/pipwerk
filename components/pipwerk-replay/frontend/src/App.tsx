import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AboutDialog } from './AboutDialog';
import { AccountsView } from './AccountsView';
import { BackendStatus } from './BackendStatus';
import { DataView } from './DataView';
import { LanguageSelect } from './LanguageSelect';
import { RevisionDisplay } from './RevisionDisplay';
import { SettingsView } from './SettingsView';
import { Btn, Icon, TipLayer } from './ui';

/**
 * The views of this stage: data stock, test accounts and settings. The test run and the saved
 * backtests come with later work packages; their menu entries do not exist yet.
 */
export type View = 'data' | 'accounts' | 'settings';

const MENU: { id: View; icon: string }[] = [
  { id: 'data', icon: 'database' },
  { id: 'accounts', icon: 'wallet' },
  { id: 'settings', icon: 'gear' },
];

export function App() {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<View>('data');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const menuToggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (i18n.resolvedLanguage !== undefined) {
      document.documentElement.lang = i18n.resolvedLanguage;
    }
  }, [i18n.resolvedLanguage]);

  // The compact menu closes with a click outside of it and with Escape.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function outside(event: MouseEvent): void {
      if (event.target instanceof Node && menuToggleRef.current?.contains(event.target) !== true) {
        setMenuOpen(false);
      }
    }
    function escape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [menuOpen]);

  function choose(next: View): void {
    setView(next);
    setMenuOpen(false);
  }

  return (
    <div className="app" data-view={view} data-testid="app">
      <header className="region header" data-testid="header">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            <Icon name="chart" size={20} />
          </span>
          <span className="brand-name">pipwerk replay</span>
        </div>
        <nav className="menu menu-full" aria-label={t('menu.label')}>
          {MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`menu-btn${view === item.id ? ' on' : ''}`}
              aria-current={view === item.id ? 'page' : undefined}
              data-testid={`menu-${item.id}`}
              data-tip={t(`menu.tip.${item.id}`)}
              onClick={() => {
                choose(item.id);
              }}
            >
              <Icon name={item.icon} size={16} />
              <span>{t(`menu.${item.id}`)}</span>
            </button>
          ))}
        </nav>
        <div className="head-right">
          <div className="menu-compact" ref={menuToggleRef}>
            <Btn
              icon="menu"
              kind="ghost"
              testid="menu-toggle"
              title={t('menu.label')}
              onClick={() => {
                setMenuOpen(!menuOpen);
              }}
            >
              {t('menu.label')}
            </Btn>
            {menuOpen && (
              <div className="menu-pop" data-testid="menu-pop">
                {MENU.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={view === item.id ? 'on' : ''}
                    aria-current={view === item.id ? 'page' : undefined}
                    data-testid={`cmenu-${item.id}`}
                    onClick={() => {
                      choose(item.id);
                    }}
                  >
                    <Icon name={item.icon} size={16} />
                    <span>{t(`menu.${item.id}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            ref={aboutButtonRef}
            className="btn btn-ghost"
            data-testid="menu-about"
            aria-label={t('about.open')}
            data-tip={t('about.open')}
            onClick={() => {
              setAboutOpen(true);
            }}
          >
            <Icon name="info" size={17} />
            <span className="about-text">{t('about.open')}</span>
          </button>
          <LanguageSelect />
        </div>
      </header>
      <main className="main" data-testid="main">
        {view === 'data' && (
          <DataView
            onOpenSettings={() => {
              choose('settings');
            }}
          />
        )}
        {view === 'accounts' && <AccountsView />}
        {view === 'settings' && <SettingsView />}
      </main>
      <footer className="region footer" data-testid="footer">
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
      <TipLayer />
    </div>
  );
}
