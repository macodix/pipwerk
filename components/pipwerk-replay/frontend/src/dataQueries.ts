import { useQuery } from '@tanstack/react-query';

import { fetchOverview, type Overview } from './marketDataApi';

export const OVERVIEW_QUERY_KEY = ['market-data-overview'];
export const DEFAULT_SOURCE_QUERY_KEY = ['default-source'];
export const INSTRUMENT_QUERY_KEY = ['market-data-instrument'];

/** The brokers and instruments the data stock knows, for suggestions in input fields. */
export function knownNames(overview: Overview | undefined): { brokers: string[]; instruments: string[] } {
  const brokers = new Set<string>();
  const instruments = new Set<string>();
  for (const series of overview?.series ?? []) {
    brokers.add(series.broker);
    instruments.add(series.instrument);
  }
  for (const entry of overview?.instruments ?? []) {
    brokers.add(entry.broker);
    instruments.add(entry.instrument);
  }
  return { brokers: [...brokers].sort(), instruments: [...instruments].sort() };
}

export function useOverview() {
  return useQuery({ queryKey: OVERVIEW_QUERY_KEY, queryFn: ({ signal }) => fetchOverview(signal) });
}
