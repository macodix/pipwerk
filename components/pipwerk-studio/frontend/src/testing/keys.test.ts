import { describe, expect, it } from 'vitest';

import { identifierFromName } from './keys';

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
    expect(identifierFromName('???')).toMatch(/^[A-Za-z_][A-Za-z0-9_]*$/);
  });
});
