/**
 * The values of the datatype time unit: all time units of MetaTrader 5 from M1
 * to MN1 (specification 3.1), with the identifiers the library forms from their
 * names. The type descriptions do not list them for a parameter of this
 * datatype, so the datatype itself defines them here.
 */
export const TIME_UNITS: readonly string[] = [
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'm10',
  'm12',
  'm15',
  'm20',
  'm30',
  'h1',
  'h2',
  'h3',
  'h4',
  'h6',
  'h8',
  'h12',
  'd1',
  'w1',
  'mn1',
];

/** The name of a time unit as the user knows it: `h1` is H1. */
export function timeUnitLabel(id: string): string {
  return id.toUpperCase();
}
