import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { useStudio } from './state/StudioContext';
import { Btn } from './ui/controls';
import { Icon } from './ui/Icon';

type Item = { id: string; icon: string; run: () => void; disabled: boolean };

/** The header (specification 5.1): menu, the number of findings, "Über pipwerk Studio". Below 1280 pixels the menu is one button. */
export function Header({ onAbout, aboutRef }: { onAbout: () => void; aboutRef: RefObject<HTMLButtonElement | null> }) {
  const { studio, findings } = useStudio();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { state, actions, busy, types } = studio;
  const hasStrategy = state.document !== null;
  const items: Item[] = [
    {
      id: 'new',
      icon: 'plus',
      run: () => {
        actions.request({ kind: 'new' });
      },
      disabled: busy || types === null,
    },
    {
      id: 'open',
      icon: 'folder',
      run: () => {
        actions.setDialog({ kind: 'open' });
      },
      disabled: busy,
    },
    {
      id: 'save',
      icon: 'save',
      run: () => {
        void actions.save();
      },
      disabled: busy || !hasStrategy,
    },
    {
      id: 'check',
      icon: 'check',
      run: () => {
        void actions.check();
      },
      disabled: busy || !hasStrategy,
    },
    {
      id: 'close',
      icon: 'x',
      run: () => {
        actions.request({ kind: 'close' });
      },
      disabled: busy || !hasStrategy,
    },
    {
      id: 'delete',
      icon: 'trash',
      run: () => {
        actions.setDialog({ kind: 'delete' });
      },
      disabled: busy || !hasStrategy,
    },
    {
      id: 'settings',
      icon: 'gear',
      run: () => {
        actions.setDialog({ kind: 'settings' });
      },
      disabled: false,
    },
  ];
  const run = (item: Item): void => {
    setOpen(false);
    item.run();
  };
  const count = state.findings === null ? null : findings.all.length;
  return (
    <header className="region header" data-region="header" data-testid="header">
      <div className="brand">
        <span className="logo" aria-hidden="true">
          <Icon name="chart" size={20} />
        </span>
        <h1 className="brand-name">pipwerk Studio</h1>
      </div>
      <nav className="menu menu-full" aria-label={t('menu.label')}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="menu-btn"
            disabled={item.disabled}
            onClick={() => {
              run(item);
            }}
            data-testid={`menu-${item.id}`}
            data-tip={t(`menu.tips.${item.id}`)}
          >
            <Icon name={item.icon} size={16} />
            <span>{t(`menu.${item.id}`)}</span>
          </button>
        ))}
      </nav>
      <div className="head-right">
        {count !== null ? (
          <button
            type="button"
            className={`count-pill${findings.errors > 0 ? ' bad' : count > 0 ? ' hints-only' : ' good'}`}
            onClick={() => {
              actions.select({ kind: 'strategy' }, 'props');
            }}
            data-testid="findings-count"
            data-tip={t('findings.countTip', {
              errors: t('findings.errorsCount', { count: findings.errors }),
              hints: t('findings.hintsCount', { count: findings.hints }),
            })}
          >
            <Icon name={count > 0 ? 'warn' : 'check'} size={14} />
            {count > 0 ? t('findings.count', { count }) : t('findings.none')}
          </button>
        ) : null}
        <div className="menu-compact">
          <Btn
            icon="menu"
            kind="ghost"
            testid="menu-toggle"
            title={t('menu.label')}
            onClick={() => {
              setOpen(!open);
            }}
          >
            {t('menu.label')}
          </Btn>
          {open ? (
            <div className="menu-pop" role="menu" data-testid="menu-pop">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    run(item);
                  }}
                  data-testid={`cmenu-${item.id}`}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{t(`menu.${item.id}`)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          ref={aboutRef}
          className="btn btn-ghost"
          onClick={onAbout}
          aria-label={t('about.open')}
          data-testid="menu-about"
        >
          <Icon name="info" size={16} />
          <span className="about-text">{t('about.open')}</span>
        </button>
      </div>
    </header>
  );
}
