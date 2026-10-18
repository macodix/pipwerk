import type { TFunction } from 'i18next';

import { HttpError, RequestTimeoutError, ResponseFormatError } from './api/http';

/**
 * What the user is told about a failed request: what went wrong in the
 * language of the interface and, if the backend sent one, its fixed text
 * (which is English and is shown as it is).
 */
export type CauseText = {
  summary: string;
  backendText: string | null;
};

export function describeCause(t: TFunction, error: unknown): CauseText {
  if (error instanceof HttpError) {
    return { summary: t('errors.http', { status: error.status }), backendText: error.detail };
  }
  if (error instanceof RequestTimeoutError) {
    return { summary: t('errors.timeout'), backendText: null };
  }
  if (error instanceof ResponseFormatError) {
    return { summary: t('errors.unexpectedResponse'), backendText: null };
  }
  return { summary: t('errors.network'), backendText: null };
}
