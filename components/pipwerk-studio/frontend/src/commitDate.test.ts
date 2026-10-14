import { afterEach, describe, expect, it } from 'vitest';

import { localParts } from './commitDate';

// The parts are given in the local time zone of the browser; the tests fix it.
const originalTimeZone = process.env.TZ;

afterEach(() => {
  if (originalTimeZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimeZone;
  }
});

describe('localParts', () => {
  it('splits a time stamp in the local time zone', () => {
    process.env.TZ = 'Europe/Berlin';

    expect(localParts('2026-10-09T14:52:03+02:00')).toEqual({
      year: '2026',
      month: '10',
      day: '09',
      hours: '14',
      minutes: '52',
    });
  });

  it('pads month, day, hours and minutes with zeros', () => {
    process.env.TZ = 'UTC';

    expect(localParts('2026-01-02T03:04:05+00:00')).toEqual({
      year: '2026',
      month: '01',
      day: '02',
      hours: '03',
      minutes: '04',
    });
  });

  it('converts to the local time zone and can change the day', () => {
    process.env.TZ = 'Asia/Kolkata';

    expect(localParts('2026-10-09T22:00:00+00:00')).toEqual({
      year: '2026',
      month: '10',
      day: '10',
      hours: '03',
      minutes: '30',
    });
  });

  it('uses the 24-hour clock', () => {
    process.env.TZ = 'UTC';

    expect(localParts('2026-10-09T00:05:00+00:00').hours).toBe('00');
    expect(localParts('2026-10-09T23:59:00+00:00').hours).toBe('23');
  });
});
