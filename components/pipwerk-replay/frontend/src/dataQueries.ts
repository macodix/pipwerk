import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  fetchBrokers,
  fetchSeries,
  fetchSeriesDetails,
  fetchTestRunBroker,
  type SeriesFilter,
  type SeriesRow,
} from './marketDataApi';

export const SERIES_QUERY_KEY = ['market-data-series'];
export const DETAILS_QUERY_KEY = ['market-data-series-details'];
export const BROKERS_QUERY_KEY = ['market-data-brokers'];
export const TEST_RUN_BROKER_QUERY_KEY = ['test-run-broker'];

/** How many rows of the table one page shows. */
export const PAGE_SIZE = 10;

/**
 * The text of the filter "Daten" as the part of the identifier the backend filters by. The user
 * may write what the table shows: "Kerzen H1" and "Candles H1" filter by `h1`, "Kontraktdaten" and
 * "Contract data" by `contract`. Anything else counts as typed (`h1`, `tick`).
 */
export function dataFilterParam(text: string): string {
  const typed = text.trim().toLowerCase();
  if (typed.startsWith('kontrakt') || typed.startsWith('contract')) {
    return 'contract';
  }
  return typed.replace(/^(kerzen|candles)\s*/, '');
}

/** One page of the table, read from the backend with the filter. The previous page stays while the next loads. */
export function useSeries(filter: SeriesFilter, page: number) {
  return useQuery({
    queryKey: [...SERIES_QUERY_KEY, filter, page],
    queryFn: ({ signal }) => fetchSeries(filter, page * PAGE_SIZE, PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
  });
}

/** The gaps and the contract data of a row; `row` is `null` while no row is chosen. */
export function useSeriesDetails(row: Pick<SeriesRow, 'broker' | 'instrument' | 'data'> | null) {
  return useQuery({
    queryKey: [...DETAILS_QUERY_KEY, row],
    queryFn: ({ signal }) => {
      if (row === null) {
        throw new Error('No row chosen');
      }
      return fetchSeriesDetails(row, signal);
    },
    enabled: row !== null,
  });
}

/** The brokers of the data stock, for the choice of the broker for test runs and as suggestions. */
export function useBrokers() {
  return useQuery({ queryKey: BROKERS_QUERY_KEY, queryFn: ({ signal }) => fetchBrokers(signal) });
}

export function useTestRunBroker() {
  return useQuery({
    queryKey: TEST_RUN_BROKER_QUERY_KEY,
    queryFn: ({ signal }) => fetchTestRunBroker(signal),
  });
}
