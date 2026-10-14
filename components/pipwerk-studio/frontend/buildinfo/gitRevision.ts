// Determines the commit that pipwerk Studio is built from. Runs only in
// Node.js while Vite loads its configuration, never in the browser.
import { execFileSync } from 'node:child_process';

import { isTimestamp } from '../src/timestamp.ts';

export type GitRevision = {
  commit: string;
  committedAt: string;
};

const FULL_COMMIT = /^[0-9a-f]{40}$/;
const GIT_TIMEOUT_MS = 5000;

// Fixed text: it contains no Git output, no exception text, no path and no commit.
const WARNING = 'pipwerk Studio: revision for the About dialog could not be determined';

function git(directory: string, args: string[]): string {
  const output = execFileSync('git', ['-C', directory, ...args], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: GIT_TIMEOUT_MS,
  });
  return output.replace(/\n$/, '');
}

/**
 * Commit identifier and committer date of the Git working tree in `directory`,
 * or `null` if either cannot be determined. A failure never stops the build; it
 * leaves exactly one warning.
 */
export function lookupGitRevision(directory: string): GitRevision | null {
  try {
    const commit = git(directory, ['rev-parse', 'HEAD']);
    if (!FULL_COMMIT.test(commit)) {
      throw new Error('invalid commit');
    }
    const committedAt = git(directory, ['log', '-1', '--no-show-signature', '--format=%cI', commit]);
    if (!isTimestamp(committedAt)) {
      throw new Error('invalid date');
    }
    return { commit, committedAt };
  } catch {
    console.warn(WARNING);
    return null;
  }
}
