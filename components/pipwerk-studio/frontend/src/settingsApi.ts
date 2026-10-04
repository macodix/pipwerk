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

/** Load the single, backend-authoritative Studio user interface language. */
export async function fetchLanguage(signal?: AbortSignal): Promise<StudioLanguageResponse> {
  const response = await fetch('/api/studio/settings/language', {
    headers: { Accept: 'application/json' },
    signal,
  });
  return parseLanguageResponse(response);
}

/** Persist the Studio user interface language and return the stored value. */
export async function updateLanguage(
  language: SupportedLanguage,
  signal?: AbortSignal,
): Promise<StudioLanguageResponse> {
  const response = await fetch('/api/studio/settings/language', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ language }),
    signal,
  });
  return parseLanguageResponse(response);
}
