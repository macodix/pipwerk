import { useTranslation } from 'react-i18next';

import { languageNames, supportedLanguages } from './i18n';
import { useReplayLanguage } from './useReplayLanguage';

const messageSuffix = {
  load: 'LoadError',
  save: 'SaveError',
  saveUnconfirmed: 'SaveUnconfirmedError',
} as const;

/** The choice of the language: two buttons in the header; the backend stores the choice. */
export function LanguageSelect() {
  const { t } = useTranslation();
  const { displayedLanguage, isBusy, error, changeLanguage } = useReplayLanguage();

  return (
    <div className="language-select">
      <div
        className="seg lang-switch"
        role="radiogroup"
        aria-label={t('app.language')}
        data-testid="lang-switch"
      >
        {supportedLanguages.map((language) => (
          <button
            key={language}
            type="button"
            role="radio"
            aria-checked={displayedLanguage === language}
            className={displayedLanguage === language ? 'on' : ''}
            disabled={isBusy}
            lang={language}
            title={languageNames[language]}
            data-testid={`lang-${language}`}
            onClick={() => {
              changeLanguage(language);
            }}
          >
            {language.toUpperCase()}
          </button>
        ))}
      </div>
      {error !== null ? (
        <p className="language-select-error" role="alert">
          {t(`app.language${messageSuffix[error]}`)}
        </p>
      ) : null}
    </div>
  );
}
