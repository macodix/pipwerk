// Texts for errors of requests. The backend answers with fixed English texts and codes; the
// interface shows its own texts in the chosen language, each with the next step.
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
  'store_failed',
] as const;

/** The codes of an import that is refused as a whole (`BatchErrorCode`). */
export const BATCH_ERROR_CODES = ['no_files', 'too_many_files', 'batch_too_large'] as const;

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

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

export function rejectReasonText(t: TFunction, reason: string): string {
  return isOneOf(REJECT_REASONS, reason) ? t(`import.reject.${reason}`) : t('import.reject.unknown');
}

export function fileErrorText(t: TFunction, code: unknown): string {
  return isOneOf(FILE_ERROR_CODES, code) ? t(`import.fileError.${code}`) : t('import.fileError.unknown');
}

/** The text for any error of a request, by what the backend and the network tell. */
export function describeError(t: TFunction, error: unknown): string {
  if (error instanceof ApiError) {
    const body: unknown = error.body;
    const record =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    // An import that is refused as a whole names the reason in `code`.
    if ((error.status === 413 || error.status === 422) && isOneOf(BATCH_ERROR_CODES, record.code)) {
      return t(`import.batchError.${record.code}`);
    }
    switch (error.status) {
      case 400:
        return t('errors.host');
      case 403:
        return t('errors.origin');
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
