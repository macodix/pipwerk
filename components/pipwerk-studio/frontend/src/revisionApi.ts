export type StudioRevisionResponse = {
  revision: string | null;
};

const SHORT_REVISION = /^[0-9a-f]{7}$/;

function isStudioRevisionResponse(value: unknown): value is StudioRevisionResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    'revision' in value &&
    (value.revision === null ||
      (typeof value.revision === 'string' && SHORT_REVISION.test(value.revision)))
  );
}

/** Load the revision Studio runs from: 7 hexadecimal characters or `null` (not determinable). */
export async function fetchRevision(signal?: AbortSignal): Promise<StudioRevisionResponse> {
  const response = await fetch('/api/studio/revision', {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Studio revision request failed with HTTP status ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isStudioRevisionResponse(body)) {
    throw new Error('Studio revision request returned an unexpected response');
  }
  return body;
}
