import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchRevision } from './revisionApi';

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/** Date and time in the local time zone of the browser, 24-hour clock. */
function localParts(isoTimestamp: string): {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
} {
  const date = new Date(isoTimestamp);
  return {
    year: pad(date.getFullYear(), 4),
    month: pad(date.getMonth() + 1),
    day: pad(date.getDate()),
    hours: pad(date.getHours()),
    minutes: pad(date.getMinutes()),
  };
}

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
