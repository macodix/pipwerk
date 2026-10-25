import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { requestUsage, type UsageReport } from '../api/usage';
import type { StrategyDocument } from '../document/types';

/** The parts of the document that decide who uses what and where it is usable; moving a step or folding a frame does not. */
export function usageSignature(document: StrategyDocument | null): string {
  if (document === null) {
    return '';
  }
  return JSON.stringify([
    document.parameters,
    document.rules,
    document.connections,
    document.elements.map((element) => [
      element.id,
      element.type,
      element.key,
      element.parameters,
      element.properties,
      element.inputs,
      element.instance,
      element.rules,
      element.management_of,
    ]),
  ]);
}

function useDelayed<T>(value: T, delay: number): T {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDelayed(value);
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);
  return delayed;
}

/**
 * Asks the backend who uses which instance of the open strategy, a short time after the last change. While the answer
 * is on its way the previous report stays; without one (not loaded, failed) the result is `null` and the drawing area
 * works from the document alone.
 */
export function useUsage(document: StrategyDocument | null, enabled: boolean): UsageReport | null {
  const current = useMemo(() => (document === null ? null : { document, sign: usageSignature(document) }), [document]);
  const settled = useDelayed(current, 250);
  const sign = settled?.sign ?? '';
  const query = useQuery({
    queryKey: ['usage', sign],
    queryFn: async ({ signal }) => ({
      sign,
      report: settled === null ? null : await requestUsage(settled.document, signal),
    }),
    enabled: enabled && settled !== null,
    retry: false,
    networkMode: 'always',
    placeholderData: keepPreviousData,
    staleTime: Number.POSITIVE_INFINITY,
  });
  // A report of an earlier state of the document is not shown: the document alone answers until the new report is there.
  return current !== null && query.data?.sign === current.sign ? query.data.report : null;
}
