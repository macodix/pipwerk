// Texts for errors of requests. The backend answers with fixed English texts and codes; the
// interface shows its own texts in the chosen language (the backend text only for a code it does
// not know).
import type { TFunction } from 'i18next';

import { ApiError } from './http';

/** The codes of a whole file that is refused (`FileErrorCode` of the data stock). */
export const FILE_ERROR_CODES = [
  'too_large',
  'too_many_rows',
  'not_decodable',
  'json_invalid',
  'document_invalid',
  'header_invalid',
  'series_invalid',
  'timezone_unknown',
  'period_invalid',
  'no_rows',
] as const;

/** The reasons for a rejected row (`RejectReason` of the data stock). */
export const REJECT_REASONS = [
  'columns_mismatch',
  'entry_invalid',
  'field_unknown',
  'field_missing',
  'value_invalid',
  'time_invalid',
  'time_out_of_range',
  'local_time_not_existing',
  'time_not_ascending',
  'time_duplicate',
  'price_not_positive',
  'high_below_open',
  'high_below_low',
  'high_below_close',
  'low_above_open',
  'low_above_close',
] as const;

/** The codes of a failed part of an acquisition (source and pipwerk replay). */
export const ACQUISITION_ERROR_CODES = [
  'no_source',
  'unauthorized',
  'host_not_allowed',
  'body_too_large',
  'invalid_request',
  'not_found',
  'symbol_unknown',
  'no_data',
  'range_too_large',
  'terminal_unavailable',
  'broker_error',
  'broker_unknown',
  'invalid_broker_data',
  'internal_error',
  'source_unreachable',
  'source_response_invalid',
  'source_response_too_large',
  'import_refused',
  'data_store_error',
  'acquisition_failed',
] as const;

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

export function rejectReasonText(t: TFunction, reason: string): string {
  return isOneOf(REJECT_REASONS, reason) ? t(`import.reject.${reason}`) : t('import.reject.unknown');
}

export function fileErrorText(t: TFunction, code: unknown): string {
  return isOneOf(FILE_ERROR_CODES, code) ? t(`import.fileError.${code}`) : t('import.fileError.unknown');
}

/**
 * The text for a failed part of an acquisition or a refused start. A code the interface
 * knows gets its own text; for another one the reason of the backend is shown (a German text).
 */
export function acquisitionErrorText(
  t: TFunction,
  code: string,
  reason: string,
  fileError: string | null,
): string {
  if (code === 'import_refused' && fileError !== null) {
    return t('acquire.errors.import_refused_with', { reason: fileErrorText(t, fileError) });
  }
  if (isOneOf(ACQUISITION_ERROR_CODES, code)) {
    return t(`acquire.errors.${code}`);
  }
  return reason;
}

/** The text for any error of a request, by what the backend and the network tell. */
export function describeError(t: TFunction, error: unknown): string {
  if (error instanceof ApiError) {
    const body: unknown = error.body;
    const record =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    if (error.status === 422 && record.detail === 'The file is refused.') {
      return fileErrorText(t, record.code);
    }
    if (error.status === 409 && record.code === 'no_source') {
      return t('acquire.errors.no_source');
    }
    switch (error.status) {
      case 400:
        return t('errors.host');
      case 404:
        return t('errors.notFound');
      case 413:
        return t('errors.tooLarge');
      case 415:
        return t('errors.mediaType');
      case 422:
        return t('errors.invalid');
      case 429:
        return t('errors.busy');
      case 503:
        return t('errors.dataStock');
      default:
        return t('errors.server');
    }
  }
  if (error instanceof TypeError) {
    return t('errors.network');
  }
  return t('errors.unexpected');
}
