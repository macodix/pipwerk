import { isTimestamp } from './timestamp';

export type BuildRevision = {
  commit: string;
  committedAt: string;
};

const FULL_COMMIT = /^[0-9a-f]{40}$/;

/**
 * Checks the value that the build put into the delivered files: an object with
 * exactly the fields `commit` and `committedAt`, or `null`.
 */
export function parseBuildRevision(value: unknown): BuildRevision | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const keys = Object.keys(value);
  if (keys.length !== 2 || !('commit' in value) || !('committedAt' in value)) {
    return null;
  }
  const { commit, committedAt } = value;
  if (
    typeof commit === 'string' &&
    FULL_COMMIT.test(commit) &&
    typeof committedAt === 'string' &&
    isTimestamp(committedAt)
  ) {
    return { commit, committedAt };
  }
  return null;
}

// Without a value from the build (for example in a tool that does not apply the
// Vite option `define`) the revision is unknown.
export const buildRevision: BuildRevision | null = parseBuildRevision(
  typeof __PIPWERK_STUDIO_BUILD_REVISION__ === 'undefined' ? null : __PIPWERK_STUDIO_BUILD_REVISION__,
);
