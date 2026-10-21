import { isTimestamp } from './timestamp';

export type ReplayRevisionResponse = {
  revision: string | null;
  commit: string | null;
  committed_at: string | null;
};

const SHORT_REVISION = /^[0-9a-f]{7}$/;
const FULL_COMMIT = /^[0-9a-f]{40}$/;
function isCommittedAt(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && isTimestamp(value));
}

function isReplayRevisionResponse(value: unknown): value is ReplayRevisionResponse {
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
 * Load the revision pipwerk replay runs from: the 7-character short form, the
 * full commit and its committer date (ISO 8601 with offset), each `null` if not
 * determinable.
 */
export async function fetchRevision(signal?: AbortSignal): Promise<ReplayRevisionResponse> {
  const response = await fetch('/api/replay/revision', {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Revision request failed with HTTP status ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isReplayRevisionResponse(body)) {
    throw new Error('Revision request returned an unexpected response');
  }
  return body;
}
