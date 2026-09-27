import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { isSupportedLanguage, languageNames, supportedLanguages } from './i18n';

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const id = useId();

  return (
    <div className="language-select">
      <label htmlFor={id}>{t('app.language')}</label>
      <select
        id={id}
        value={i18n.resolvedLanguage}
        onChange={(event) => {
          const language = event.target.value;
          if (isSupportedLanguage(language)) {
            void i18n.changeLanguage(language);
          }
        }}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language} lang={language}>
            {languageNames[language]}
          </option>
        ))}
      </select>
    </div>
  );
}
