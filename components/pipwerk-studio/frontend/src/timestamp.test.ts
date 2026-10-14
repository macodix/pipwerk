import { describe, expect, it } from 'vitest';

import { isTimestamp } from './timestamp';

describe('isTimestamp', () => {
  it.each([
    '2026-10-09T14:52:03+02:00',
    '2026-10-09T14:52:03-05:30',
    '2026-10-09T14:52:03Z',
    '2024-02-29T00:00:00+00:00',
    '2026-12-31T23:59:59+23:59',
  ])('accepts %s', (value) => {
    expect(isTimestamp(value)).toBe(true);
  });

  it.each([
    ['without time zone', '2026-10-09T14:52:03'],
    ['without time', '2026-10-09'],
    ['space instead of T', '2026-10-09 14:52:03+02:00'],
    ['empty', ''],
    ['text', 'yesterday'],
    ['trailing text', '2026-10-09T14:52:03+02:00 x'],
    ['month 13', '2026-13-01T10:00:00+00:00'],
    ['month 0', '2026-00-01T10:00:00+00:00'],
    ['31 February', '2026-02-31T10:00:00+00:00'],
    ['31 April', '2026-04-31T10:00:00+00:00'],
    ['29 February in a common year', '2026-02-29T10:00:00+00:00'],
    ['29 February in 1900', '1900-02-29T10:00:00+00:00'],
    ['day 0', '2026-10-00T10:00:00+00:00'],
    ['hour 24', '2026-10-09T24:00:00+00:00'],
    ['minute 60', '2026-10-09T10:60:00+00:00'],
    ['second 60', '2026-10-09T10:00:60+00:00'],
    ['offset hour 24', '2026-10-09T10:00:00+24:00'],
    ['offset minute 60', '2026-10-09T10:00:00+01:60'],
  ])('rejects %s', (_name, value) => {
    expect(isTimestamp(value)).toBe(false);
  });

  it('accepts a leap day in a leap year and in the year 2000', () => {
    expect(isTimestamp('2028-02-29T10:00:00+00:00')).toBe(true);
    expect(isTimestamp('2000-02-29T10:00:00+00:00')).toBe(true);
  });
});
