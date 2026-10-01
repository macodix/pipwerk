import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { fetchInfo } from './api';

export function ApplicationVersion() {
  const { t } = useTranslation();
  const info = useQuery({
    queryKey: ['info'],
    queryFn: ({ signal }) => fetchInfo(signal),
  });

  // Without a reachable backend the footer stays without a version. The rest
  // of the user interface remains usable.
  if (!info.isSuccess) {
    return null;
  }

  return (
    <p className="application-version">
      {t('app.version', { name: info.data.name, version: info.data.version })}
    </p>
  );
}
