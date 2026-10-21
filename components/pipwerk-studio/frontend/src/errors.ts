import type { i18n as I18n, TFunction } from 'i18next';

import { HttpError, RequestTimeoutError, ResponseFormatError } from './api/http';

/**
 * What the user is told about a failed request: what went wrong in the language of the interface. The text comes from
 * the identifier of the cause (`code` of the answer, specification 4.2) with its data (`params`); the English text
 * of the answer (`detail`) is for users of the interface and is never shown (specification 5.1, M4).
 */
export type CauseText = { summary: string };

/** The data of a cause as strings, for the text. */
function plainParams(params: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = String(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
    }
  }
  return result;
}

export function describeCause(t: TFunction, i18n: I18n, error: unknown): CauseText {
  if (error instanceof HttpError) {
    if (error.code !== null && i18n.exists(`errors.codes.${error.code}`)) {
      return { summary: t(`errors.codes.${error.code}`, plainParams(error.params)) };
    }
    return {
      summary: t(error.code === null ? 'errors.http' : 'errors.httpCode', { status: error.status, code: error.code ?? '' }),
    };
  }
  if (error instanceof RequestTimeoutError) {
    return { summary: t('errors.timeout') };
  }
  if (error instanceof ResponseFormatError) {
    return { summary: t('errors.unexpectedResponse') };
  }
  return { summary: t('errors.network') };
}
