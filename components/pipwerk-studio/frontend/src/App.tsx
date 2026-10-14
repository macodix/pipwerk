import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AboutDialog } from './AboutDialog';
import { BackendStatus } from './BackendStatus';
import { DesignerCanvas } from './DesignerCanvas';
import { LanguageSelect } from './LanguageSelect';
import { RevisionDisplay } from './RevisionDisplay';

export function App() {
  const { t, i18n } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (i18n.resolvedLanguage !== undefined) {
      document.documentElement.lang = i18n.resolvedLanguage;
    }
  }, [i18n.resolvedLanguage]);

  return (
    <div className="studio">
      <header className="studio-header">
        <h1>pipwerk Studio</h1>
        <div className="studio-header-actions">
          <LanguageSelect />
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
        <DesignerCanvas />
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
    </div>
  );
}
