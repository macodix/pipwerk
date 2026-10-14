import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import licenseText from '../../../../LICENSE?raw';
import { buildRevision } from './buildRevision';
import { localParts } from './commitDate';
import { repositoryUrl } from './repository';

// Name and text of the license are not translated.
const LICENSE_NAME = 'GNU General Public License, Version 3';

type AboutDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      // The dialog is not displayed before `showModal()`, so the focus is set
      // here and not with the attribute `autoFocus` at mount time.
      closeButtonRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const revision =
    buildRevision === null
      ? t('about.unknown')
      : t('about.revisionValue', {
          commit: buildRevision.commit,
          ...localParts(buildRevision.committedAt),
        });

  return (
    <dialog ref={dialogRef} className="about-dialog" aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId}>{t('about.title')}</h2>
      <p className="about-name">pipwerk Studio</p>
      <dl className="about-details">
        <dt>{t('about.revision')}</dt>
        <dd>{revision}</dd>
        <dt>{t('about.license')}</dt>
        <dd className="about-license">
          <p lang="en" className="about-license-name">
            {LICENSE_NAME}
          </p>
          <pre lang="en" className="about-license-text" tabIndex={0}>
            {licenseText}
          </pre>
        </dd>
        <dt>{t('about.repository')}</dt>
        <dd>
          {repositoryUrl === null ? (
            t('about.unknown')
          ) : (
            <a href={repositoryUrl} target="_blank" rel="noopener noreferrer">
              {repositoryUrl}
            </a>
          )}
        </dd>
      </dl>
      <button
        type="button"
        ref={closeButtonRef}
        onClick={() => {
          dialogRef.current?.close();
        }}
      >
        {t('about.close')}
      </button>
    </dialog>
  );
}
