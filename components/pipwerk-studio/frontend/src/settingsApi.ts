import type { SupportedLanguage } from './i18n';
import { isSupportedLanguage } from './i18n';

export type StudioLanguageResponse = {
  language: SupportedLanguage;
};

function isStudioLanguageResponse(value: unknown): value is StudioLanguageResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    'language' in value &&
    typeof value.language === 'string' &&
    isSupportedLanguage(value.language)
  );
}

/**
 * Time limit of every request to the Studio language API. The backend is a
 * local process answering a read or write of a single database row, so an
 * answer that takes longer is treated as failed instead of leaving the user
 * interface waiting indefinitely. It is a fixed value, not configurable.
 */
export const LANGUAGE_REQUEST_TIMEOUT_MS = 10_000;

export class LanguageRequestTimeoutError extends Error {
  constructor() {
    super(`Studio language request did not answer within ${LANGUAGE_REQUEST_TIMEOUT_MS} ms`);
    this.name = 'LanguageRequestTimeoutError';
  }
}

async function parseLanguageResponse(response: Response): Promise<StudioLanguageResponse> {
  if (!response.ok) {
    throw new Error(`Studio language request failed with HTTP status ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isStudioLanguageResponse(body)) {
    throw new Error('Studio language request returned an unexpected response');
  }
  return body;
}

/**
 * Sends a request and reads its answer within `LANGUAGE_REQUEST_TIMEOUT_MS`.
 * Running out of time fails with `LanguageRequestTimeoutError`. An abort
 * from the caller (`signal`, for example a cancelled query) is passed on
 * unchanged and is not a failure of the request.
 */
async function requestLanguage(
  init: RequestInit,
  signal?: AbortSignal,
): Promise<StudioLanguageResponse> {
  const timeout = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    timeout.abort();
  }, LANGUAGE_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/api/studio/settings/language', {
      ...init,
      signal: signal === undefined ? timeout.signal : AbortSignal.any([signal, timeout.signal]),
    });
    return await parseLanguageResponse(response);
  } catch (error) {
    if (timedOut) {
      throw new LanguageRequestTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Load the single, backend-authoritative Studio user interface language. */
export function fetchLanguage(signal?: AbortSignal): Promise<StudioLanguageResponse> {
  return requestLanguage({ headers: { Accept: 'application/json' } }, signal);
}

/** Persist the Studio user interface language and return the stored value. */
export function updateLanguage(
  language: SupportedLanguage,
  signal?: AbortSignal,
): Promise<StudioLanguageResponse> {
  return requestLanguage(
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ language }),
    },
    signal,
  );
}
