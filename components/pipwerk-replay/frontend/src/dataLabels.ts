// The display of the identifiers of data (`h1`, `ticks`, `contract`) that the web API uses.
import type { TFunction } from 'i18next';

import { TIME_UNITS, isTimeUnit } from './marketDataApi';

/** "Kerzen H1", "Ticks" or "Kontraktdaten" (English: "Candles H1", "Ticks", "Contract data"). */
export function dataLabel(t: TFunction, id: string): string {
  if (id === 'ticks') {
    return t('data.ticks');
  }
  if (id === 'contract') {
    return t('data.contract');
  }
  if (isTimeUnit(id)) {
    return `${t('data.candles')} ${id.toUpperCase()}`;
  }
  return id;
}

/** The identifiers of the data that a CSV file can contain: a time unit or ticks. */
export const CSV_DATA_IDS: readonly string[] = [...TIME_UNITS, 'ticks'];

/** The identifiers of all data, for the suggestions of the filter. */
export const ALL_DATA_IDS: readonly string[] = [...CSV_DATA_IDS, 'contract'];
