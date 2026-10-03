export type HealthStatus = {
  status: 'ok';
};

export type ApplicationInfo = {
  name: string;
  version: string;
};

function isHealthStatus(value: unknown): value is HealthStatus {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    value.status === 'ok'
  );
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const response = await fetch('/api/health', {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP status ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isHealthStatus(body)) {
    throw new Error('Health check returned an unexpected response');
  }
  return body;
}

function isApplicationInfo(value: unknown): value is ApplicationInfo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim() !== '' &&
    typeof candidate.version === 'string' &&
    candidate.version.trim() !== ''
  );
}

export async function fetchInfo(signal?: AbortSignal): Promise<ApplicationInfo> {
  const response = await fetch('/api/info', {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Application info failed with HTTP status ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isApplicationInfo(body)) {
    throw new Error('Application info returned an unexpected response');
  }
  return { name: body.name, version: body.version };
}
