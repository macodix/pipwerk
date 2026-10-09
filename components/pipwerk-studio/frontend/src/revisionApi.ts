export type StudioRevisionResponse = {
  revision: string | null;
  commit: string | null;
  committed_at: string | null;
};

const SHORT_REVISION = /^[0-9a-f]{7}$/;
const FULL_COMMIT = /^[0-9a-f]{40}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;

function isCommittedAt(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === 'string' && TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value)))
  );
}

function isStudioRevisionResponse(value: unknown): value is StudioRevisionResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (
    keys.length !== 3 ||
    !('revision' in value) ||
    !('commit' in value) ||
    !('committed_at' in value)
  ) {
    return false;
  }
  const { revision, commit, committed_at: committedAt } = value;
  if (revision === null || commit === null) {
    // Revision and commit are both unknown; a date cannot exist without a commit.
    return revision === null && commit === null && committedAt === null;
  }
  return (
    typeof revision === 'string' &&
    SHORT_REVISION.test(revision) &&
    typeof commit === 'string' &&
    FULL_COMMIT.test(commit) &&
    commit.startsWith(revision) &&
    isCommittedAt(committedAt)
  );
}

/**
 * Load the revision Studio runs from: the 7-character short form, the full
 * commit and its committer date (ISO 8601 with offset), each `null` if not
 * determinable.
 */
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
