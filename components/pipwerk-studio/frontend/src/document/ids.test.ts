import { describe, expect, it } from 'vitest';

import { identifierFromName, isValidName, newUuid, uniqueName } from './ids';

describe('newUuid', () => {
  it('is a UUID of version 4 in lower case, and different each time', () => {
    const first = newUuid();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newUuid()).not.toBe(first);
  });
});

describe('identifierFromName (specification 3.1)', () => {
  it.each([
    ['Punkt 1/3', 'punkt_13'],
    ['Stop-Loss', 'stop_loss'],
    ['Tickgröße', 'tickgroesse'],
    ['aufwärts', 'aufwaerts'],
    ['Straße', 'strasse'],
    ['nicht gestellt', 'nicht_gestellt'],
    ['ema_20', 'ema_20'],
    ['Risiko je Trade', 'risiko_je_trade'],
  ])('forms %s as %s', (name, expected) => {
    expect(identifierFromName(name)).toBe(expected);
  });

  it('gives a name that expressions can use even if the text has nothing to build from', () => {
    expect(identifierFromName('')).toBe('n_');
    expect(identifierFromName('20 Tage')).toBe('n_20_tage');
    expect(isValidName(identifierFromName('???'))).toBe(true);
  });
});

describe('uniqueName', () => {
  it('keeps a free name and counts up for a taken one, without regard to case', () => {
    expect(uniqueName('ema', [])).toBe('ema');
    expect(uniqueName('ema', ['EMA'])).toBe('ema1');
    expect(uniqueName('ema', ['ema', 'ema1', 'EMA2'])).toBe('ema3');
  });
});

describe('isValidName', () => {
  it.each(['a', '_a', 'ema20', 'Regel_1'])('accepts %s', (name) => {
    expect(isValidName(name)).toBe(true);
  });

  it.each(['', '1a', 'a b', 'ä', 'a.b', 'a\n'])('rejects %j', (name) => {
    expect(isValidName(name)).toBe(false);
  });
});
