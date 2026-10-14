import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { localParts } from './commitDate';
import { fetchRevision } from './revisionApi';

export function RevisionDisplay() {
  const { t } = useTranslation();
  const descriptionId = useId();
  const revision = useQuery({
    queryKey: ['revision'],
    queryFn: ({ signal }) => fetchRevision(signal),
  });

  const data = revision.isSuccess ? revision.data : null;
  const shortRevision = data?.revision ?? null;
  const commit = data?.commit ?? null;
  const committedAt = data?.committed_at ?? null;

  let description: string | null = null;
  if (commit !== null) {
    description =
      committedAt === null
        ? t('revision.commit', { commit })
        : t('revision.commitAt', { commit, ...localParts(committedAt) });
  }

  return (
    <>
      <p
        className="studio-revision"
        title={description ?? undefined}
        aria-describedby={description === null ? undefined : descriptionId}
      >
        {shortRevision === null
          ? t('revision.unknown')
          : t('revision.known', { revision: shortRevision })}
      </p>
      {description === null ? null : (
        <span id={descriptionId} hidden>
          {description}
        </span>
      )}
    </>
  );
}
