// Texts for errors of requests. The backend answers with fixed English texts and codes; the
// interface shows its own texts in the chosen language, each with the next step.
import type { TFunction } from 'i18next';

import { formatNumber } from './format';
import { ApiError } from './http';
import type { SupportedLanguage } from './i18n';
import type { FileLimit } from './marketDataApi';

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

/** The reasons for refusing a deletion (`DeletionErrorCode` of the web API, HTTP 404). */
export const DELETION_ERROR_CODES = [
  'broker_unknown',
  'instrument_unknown',
  'series_unknown',
  'contract_unknown',
  'period_invalid',
  'period_empty',
] as const;

/** The reasons for rejecting a row (`RejectReason` of the data stock). */
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

/** The limit per file as the user reads it: `32 MiB` (German: `1,5 GiB`) or `500.000`. */
export function limitText(limit: FileLimit, language: SupportedLanguage): string {
  if (limit.kind === 'rows') {
    return formatNumber(Number(limit.text), language, 0);
  }
  return language === 'de' ? limit.text.replace('.', ',') : limit.text;
}

/**
 * The text for the reason a whole file is refused. A file above the limit per file names the
 * limit, if the backend said it.
 */
export function fileErrorText(
  t: TFunction,
  code: unknown,
  limit: FileLimit | null = null,
  language: SupportedLanguage = 'de',
): string {
  if (!isOneOf(FILE_ERROR_CODES, code)) {
    return t('import.fileError.unknown');
  }
  if ((code === 'too_large' || code === 'too_many_rows') && limit !== null) {
    return t(`import.fileError.${code}`, { limit: limitText(limit, language) });
  }
  return t(`import.fileError.${code}`, { context: 'unnamed' });
}

/** The text for any error of a request, by what the backend and the network tell. */
export function describeError(t: TFunction, error: unknown): string {
  if (error instanceof ApiError) {
    const body: unknown = error.body;
    const record =
      typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    // A deletion that is refused names the reason in `code` (404) or `reason` (409).
    if (error.status === 409 && record.reason === 'import_running') {
      return t('errors.importRunning');
    }
    if (error.status === 404 && isOneOf(DELETION_ERROR_CODES, record.code)) {
      return t(`delete.error.${record.code}`);
    }
    switch (error.status) {
      case 400:
        return t('errors.host');
      case 403:
        return t('errors.origin');
      case 404:
        return t('errors.notFound');
      case 409:
        return t('errors.conflict');
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
