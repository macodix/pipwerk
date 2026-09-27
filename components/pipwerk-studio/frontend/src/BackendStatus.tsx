import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { fetchHealth } from './api';

export function BackendStatus() {
  const { t } = useTranslation();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
  });

  let key: 'backend.checking' | 'backend.connected' | 'backend.unreachable';
  if (health.isPending) {
    key = 'backend.checking';
  } else if (health.isSuccess) {
    key = 'backend.connected';
  } else {
    key = 'backend.unreachable';
  }

  return (
    <p className="backend-status" role="status" data-state={key.split('.')[1]}>
      {t(key)}
    </p>
  );
}
