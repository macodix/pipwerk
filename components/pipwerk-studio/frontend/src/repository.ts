import { repository } from '../package.json';

const REPOSITORY_URL = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

/** The address if it has the expected form, otherwise `null`. Never throws. */
export function parseRepositoryUrl(value: unknown): string | null {
  return typeof value === 'string' && REPOSITORY_URL.test(value) ? value : null;
}

function readUrl(field: unknown): unknown {
  if (typeof field !== 'object' || field === null || !('url' in field)) {
    return null;
  }
  return field.url;
}

// The only place of the address is the field `repository` of `package.json`.
export const repositoryUrl: string | null = parseRepositoryUrl(readUrl(repository));
