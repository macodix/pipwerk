import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { fetchHealth } from './api';

/** How often the display asks whether the backend is reachable. */
export const HEALTH_INTERVAL_MS = 10_000;

export function BackendStatus() {
  const { t } = useTranslation();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => fetchHealth(signal),
    // An unreachable backend is shown at once (no repeated attempts first), and the display
    // follows the backend: it is asked again from time to time.
    retry: false,
    refetchInterval: HEALTH_INTERVAL_MS,
    networkMode: 'always',
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
    <p className="foot-item backend-status" role="status" data-state={key.split('.')[1]}>
      <span className="dot" aria-hidden="true" />
      {t(key)}
    </p>
  );
}
