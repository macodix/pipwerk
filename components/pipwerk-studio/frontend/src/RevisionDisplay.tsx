import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { fetchRevision } from './revisionApi';

export function RevisionDisplay() {
  const { t } = useTranslation();
  const revision = useQuery({
    queryKey: ['revision'],
    queryFn: ({ signal }) => fetchRevision(signal),
  });

  const shortRevision = revision.isSuccess ? revision.data.revision : null;

  return (
    <p className="studio-revision">
      {shortRevision === null
        ? t('revision.unknown')
        : t('revision.known', { revision: shortRevision })}
    </p>
  );
}
