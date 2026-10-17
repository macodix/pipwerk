import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { isSupportedLanguage, languageNames, supportedLanguages } from './i18n';
import { useStudioLanguage, type StudioLanguageState } from './useStudioLanguage';

const messageSuffix = {
  load: 'LoadError',
  save: 'SaveError',
  saveUnconfirmed: 'SaveUnconfirmedError',
} as const;

function LanguageSelectView({ state }: { state: StudioLanguageState }) {
  const { t } = useTranslation();
  const id = useId();
  const { displayedLanguage, isBusy, error, changeLanguage } = state;

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

function LanguageSelectWithOwnState() {
  return <LanguageSelectView state={useStudioLanguage()} />;
}

/**
 * The selection of the language of the interface. It stands in the settings
 * (specification 5.1). Without `state` it reads and writes the language itself;
 * the application passes its own state, so that a language that is being saved
 * is not lost when the settings are closed.
 */
export function LanguageSelect({ state }: { state?: StudioLanguageState }) {
  return state === undefined ? <LanguageSelectWithOwnState /> : <LanguageSelectView state={state} />;
}
