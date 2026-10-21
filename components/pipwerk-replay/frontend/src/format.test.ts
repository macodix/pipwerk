import { describe, expect, it } from 'vitest';

import { formatBytes, formatMoment, formatNumber, formatPeriod, isMinute, minuteToMoment } from './format';

describe('formatMoment', () => {
  it('shows UTC to the minute in the form of the language', () => {
    expect(formatMoment('2026-01-05T08:07:59Z', 'de')).toBe('05.01.2026 08:07');
    expect(formatMoment('2026-01-05T08:07:59Z', 'en')).toBe('2026-01-05 08:07');
  });

  it('converts a moment with an offset to UTC', () => {
    expect(formatMoment('2026-01-05T08:00:00+02:00', 'en')).toBe('2026-01-05 06:00');
  });

  it('returns a text that is no moment unchanged', () => {
    expect(formatMoment('yesterday', 'de')).toBe('yesterday');
  });

  it('shows a period with an en dash', () => {
    expect(formatPeriod('2026-01-05T00:00:00Z', '2026-01-06T00:00:00Z', 'de')).toBe('05.01.2026 00:00 – 06.01.2026 00:00');
  });
});

describe('formatNumber', () => {
  it('uses the separators of the language', () => {
    expect(formatNumber(1234567.891, 'de', 2)).toBe('1.234.567,89');
    expect(formatNumber(1234567.891, 'en', 2)).toBe('1,234,567.89');
    expect(formatNumber(0.00001, 'de', 8)).toBe('0,00001');
  });

  it('uses at least the minimum number of decimals', () => {
    expect(formatNumber(2, 'en', 0, 2)).toBe('2.00');
  });
});

describe('minutes', () => {
  it('turns the value of a field for date and time into a moment in UTC', () => {
    expect(minuteToMoment('2026-01-05T08:30')).toBe('2026-01-05T08:30:00Z');
  });

  it.each(['2026-01-05T00:00', '2028-02-29T23:59'])('accepts %s', (value) => {
    expect(isMinute(value)).toBe(true);
  });

  it.each([
    '',
    '2026-01-05',
    '2026-01-05 08:30',
    '2026-01-05T08:30:15',
    '2026-02-30T08:30',
    '2027-02-29T08:30',
    '2026-13-01T08:30',
    '2026-01-05T24:00',
    '2026-01-05T08:60',
    '05.01.2026',
    'abc',
  ])('rejects "%s"', (value) => {
    expect(isMinute(value)).toBe(false);
  });
});

describe('formatBytes', () => {
  it('names bytes, kilobytes and megabytes', () => {
    expect(formatBytes(12, 'de')).toBe('12 B');
    expect(formatBytes(2048, 'de')).toBe('2 KB');
    expect(formatBytes(1536, 'en')).toBe('1.5 KB');
    expect(formatBytes(3 * 1024 * 1024, 'de')).toBe('3 MB');
  });
});
