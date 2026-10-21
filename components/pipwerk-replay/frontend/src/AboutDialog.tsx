import { useTranslation } from 'react-i18next';

import licenseText from '../../../../LICENSE?raw';
import { buildRevision } from './buildRevision';
import { localParts } from './commitDate';
import { Modal } from './Modal';
import { repositoryUrl } from './repository';
import { Btn } from './ui';

// Name and text of the license are not translated.
const LICENSE_NAME = 'GNU General Public License, Version 3';

type AboutDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { t } = useTranslation();

  const revision =
    buildRevision === null
      ? t('about.unknown')
      : t('about.revisionValue', {
          commit: buildRevision.commit,
          ...localParts(buildRevision.committedAt),
        });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('about.title')}
      icon="info"
      testid="dialog-about"
      footer={
        <Btn
          kind="primary"
          testid="about-close"
          onClick={() => {
            onClose();
          }}
        >
          {t('about.close')}
        </Btn>
      }
    >
      <p className="about-name">pipwerk replay</p>
      <dl className="about-list">
        <dt>{t('about.revision')}</dt>
        <dd data-testid="about-revision">{revision}</dd>
        <dt>{t('about.license')}</dt>
        <dd className="about-license">
          <p lang="en" className="about-license-name">
            {LICENSE_NAME}
          </p>
          <pre lang="en" className="license" tabIndex={0} data-testid="license-text">
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
    </Modal>
  );
}
