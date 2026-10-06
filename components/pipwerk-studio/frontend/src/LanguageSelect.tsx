import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { isSupportedLanguage, languageNames, supportedLanguages } from './i18n';
import { useStudioLanguage } from './useStudioLanguage';

const messageSuffix = {
  load: 'LoadError',
  save: 'SaveError',
  saveUnconfirmed: 'SaveUnconfirmedError',
} as const;

export function LanguageSelect() {
  const { t } = useTranslation();
  const id = useId();
  const { displayedLanguage, isBusy, error, changeLanguage } = useStudioLanguage();

  return (
    <div className="language-select">
      <label htmlFor={id}>{t('app.language')}</label>
      <select
        id={id}
        value={displayedLanguage}
        disabled={isBusy}
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
          {t(`app.language${messageSuffix[error]}`)}
        </p>
      ) : null}
    </div>
  );
}
