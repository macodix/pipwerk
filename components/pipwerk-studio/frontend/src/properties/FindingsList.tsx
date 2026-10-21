import { useTranslation } from 'react-i18next';

import type { Finding } from '../api/objects';
import { findingTexts } from '../findings/findingText';
import { useStudio } from '../state/StudioContext';
import { Btn } from '../ui/controls';
import { Icon } from '../ui/Icon';

/** Sends the user to the place of a finding: the element, and the field if the finding names one (specification 5.5). */
export function useGotoFinding(): (finding: Finding) => void {
  const { studio } = useStudio();
  return (finding) => {
    const { actions } = studio;
    const document = studio.state.document;
    const exists = finding.element !== null && document?.elements.some((candidate) => candidate.id === finding.element) === true;
    if (finding.element !== null && exists) {
      actions.showElement(finding.element);
    } else {
      actions.select({ kind: 'strategy' }, 'props');
    }
    const field = finding.details.field;
    if (typeof field === 'string') {
      const separator = field.indexOf(':');
      // a finding in an expression also leads to the spot in the expression
      const place = typeof finding.details.start === 'number' ? { field, subject: finding.subject, code: finding.code } : undefined;
      actions.focusField(separator < 0 ? field : field.slice(separator + 1), place);
    }
  };
}

/** The findings with their text, the way to fix them and a link to their place. */
export function FindingsList({ items }: { items: readonly Finding[] }) {
  const { t, i18n } = useTranslation();
  const { studio, types } = useStudio();
  const goto = useGotoFinding();
  if (items.length === 0) {
    return null;
  }
  const context = { document: studio.state.document, types, language: studio.language };
  return (
    <div className="findings" data-testid="findings-box">
      {items.map((finding, index) => {
        const texts = findingTexts(t, i18n, finding, context);
        return (
          <div key={`${finding.code}-${finding.element ?? ''}-${finding.subject ?? ''}-${index}`} className={`finding ${finding.level}`} data-testid="finding" data-code={finding.code}>
            <Icon name={finding.level === 'error' ? 'warn' : 'info'} size={18} />
            <div className="finding-body">
              <strong>{t(`findings.level.${finding.level}`)}</strong>
              <p>{texts.message}</p>
              <p className="fix">
                <b>{t('findings.howToFix')}</b>
                {texts.fix}
              </p>
              <Btn
                small
                kind="ghost"
                icon="right"
                testid="finding-goto"
                onClick={() => {
                  goto(finding);
                }}
              >
                {t('findings.goto')}
              </Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}
