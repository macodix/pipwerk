import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ApplicationVersion } from './ApplicationVersion';
import { BackendStatus } from './BackendStatus';
import { DesignerCanvas } from './DesignerCanvas';
import { LanguageSelect } from './LanguageSelect';

export function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.resolvedLanguage !== undefined) {
      document.documentElement.lang = i18n.resolvedLanguage;
    }
  }, [i18n.resolvedLanguage]);

  return (
    <div className="studio">
      <header className="studio-header">
        <h1>Pipwerk Studio</h1>
        <LanguageSelect />
      </header>
      <main className="studio-main">
        <DesignerCanvas />
      </main>
      <footer className="studio-footer">
        <BackendStatus />
        <ApplicationVersion />
      </footer>
    </div>
  );
}
