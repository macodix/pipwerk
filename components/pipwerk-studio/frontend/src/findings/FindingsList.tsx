import { useTranslation } from 'react-i18next';

import type { Finding } from '../api/objects';
import { useStudio } from '../state/StudioContext';
import { findingText } from './findingText';

type FindingsListProps = {
  findings: readonly Finding[];
  /** Heading shown above the list; without it the list stands alone. */
  heading?: string;
};

/**
 * The findings as text, in the language of the interface. A finding of the level
 * error and one of the level hint differ by the word and by the color (specification 5.4).
 */
export function FindingsList({ findings, heading }: FindingsListProps) {
  const { t, i18n } = useTranslation();
  const { document, types, language } = useStudio();
  if (findings.length === 0) {
    return null;
  }
  return (
    <section className="findings" aria-label={heading ?? t('findings.title')}>
      {heading !== undefined ? <h3>{heading}</h3> : null}
      <ul className="findings-list">
        {findings.map((finding, index) => (
          <li key={`${finding.code}:${index}`} className={`finding finding-${finding.level}`}>
            <span className="finding-level">{t(`findings.level.${finding.level}`)}</span>{' '}
            <span className="finding-text">{findingText(t, i18n, finding, { document, types, language })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
