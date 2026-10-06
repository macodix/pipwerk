import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { isSupportedLanguage, languageNames, supportedLanguages } from './i18n';
import { useStudioLanguage } from './useStudioLanguage';

export function LanguageSelect() {
  const { t } = useTranslation();
  const id = useId();
  const { displayedLanguage, isInitializing, error, changeLanguage } = useStudioLanguage();

  return (
    <div className="language-select">
      <label htmlFor={id}>{t('app.language')}</label>
      <select
        id={id}
        value={displayedLanguage}
        disabled={isInitializing}
        onChange={(event) => {
          const language = event.target.value;
          if (isSupportedLanguage(language)) {
            changeLanguage(language);
          }
        }}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language} lang={language}>
            {languageNames[language]}
          </option>
        ))}
      </select>
      {error !== null ? (
        <p className="language-select-error" role="alert">
          {t(error === 'save' ? 'app.languageSaveError' : 'app.languageLoadError')}
        </p>
      ) : null}
    </div>
  );
}
