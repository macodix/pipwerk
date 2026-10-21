import { describe, expect, it } from 'vitest';

import {
  NEW_ACCOUNT_VALUES,
  checkAccountForm,
  formFromAccount,
  sameForm,
  valuesFromForm,
  type AccountForm,
} from './accountForm';
import type { Account } from './accountsApi';

const VALID: AccountForm = { name: 'Konto', ...NEW_ACCOUNT_VALUES };

const ACCOUNT: Account = {
  id: 'x',
  name: 'Konto',
  initialCapital: 5000,
  currency: 'USD',
  leverage: 100,
  spreadMode: 'fixed',
  spreadPoints: 12,
  commissionPerLotSide: 3.5,
  isDefault: false,
};

describe('checkAccountForm', () => {
  it('accepts the values of a new test account', () => {
    expect(checkAccountForm(VALID)).toEqual([]);
  });

  it.each([
    ['an empty name', { name: '' }, 'name'],
    ['a name of blanks', { name: '   ' }, 'name'],
    ['a name with a control character', { name: 'a\tb' }, 'name'],
    ['a name with a line separator', { name: 'a b' }, 'name'],
    ['a name with 101 characters', { name: 'x'.repeat(101) }, 'name'],
    ['no capital', { initialCapital: '' as const }, 'capital'],
    ['capital 0', { initialCapital: 0 }, 'capital'],
    ['capital above 10^12', { initialCapital: 1e12 + 1 }, 'capital'],
    ['a currency in small letters', { currency: 'eur' }, 'currency'],
    ['a currency with 2 letters', { currency: 'EU' }, 'currency'],
    ['leverage 0', { leverage: 0 }, 'leverage'],
    ['leverage 1001', { leverage: 1001 }, 'leverage'],
    ['a fraction as leverage', { leverage: 2.5 }, 'leverage'],
    ['no leverage', { leverage: '' as const }, 'leverage'],
    ['a negative fixed spread', { spreadMode: 'fixed' as const, spreadPoints: -1 }, 'spread'],
    ['a fixed spread above 100000', { spreadMode: 'fixed' as const, spreadPoints: 100001 }, 'spread'],
    ['no fixed spread', { spreadMode: 'fixed' as const, spreadPoints: '' as const }, 'spread'],
    ['a negative commission', { commissionPerLotSide: -0.1 }, 'commission'],
    ['no commission', { commissionPerLotSide: '' as const }, 'commission'],
  ])('rejects %s', (_name, patch, problem) => {
    expect(checkAccountForm({ ...VALID, ...patch })).toEqual([problem]);
  });

  it('accepts the limits', () => {
    expect(
      checkAccountForm({
        ...VALID,
        name: 'x'.repeat(100),
        initialCapital: 1e12,
        leverage: 1000,
        spreadMode: 'fixed',
        spreadPoints: 0,
        commissionPerLotSide: 100000,
      }),
    ).toEqual([]);
  });

  it('ignores the spread value in the mode candle', () => {
    expect(checkAccountForm({ ...VALID, spreadMode: 'candle', spreadPoints: '' })).toEqual([]);
  });

  it('counts a character outside of the basic plane as one', () => {
    expect(checkAccountForm({ ...VALID, name: '😀'.repeat(100) })).toEqual([]);
  });
});

describe('valuesFromForm and formFromAccount', () => {
  it('takes the spread value only for the mode fixed', () => {
    expect(valuesFromForm({ ...VALID, spreadMode: 'candle', spreadPoints: 7 }).spreadPoints).toBeNull();
    expect(valuesFromForm({ ...VALID, spreadMode: 'fixed', spreadPoints: 7 }).spreadPoints).toBe(7);
  });

  it('round-trips an account', () => {
    expect(valuesFromForm(formFromAccount(ACCOUNT))).toEqual({
      name: 'Konto',
      initialCapital: 5000,
      currency: 'USD',
      leverage: 100,
      spreadMode: 'fixed',
      spreadPoints: 12,
      commissionPerLotSide: 3.5,
    });
  });

  it('shows 0 as the spread value of an account with the mode candle', () => {
    expect(formFromAccount({ ...ACCOUNT, spreadMode: 'candle', spreadPoints: null }).spreadPoints).toBe(0);
  });
});

describe('sameForm', () => {
  it('compares the values', () => {
    expect(sameForm(VALID, { ...VALID })).toBe(true);
    expect(sameForm(VALID, { ...VALID, leverage: 31 })).toBe(false);
  });

  it('does not count the spread value in the mode candle', () => {
    expect(sameForm({ ...VALID, spreadPoints: 1 }, { ...VALID, spreadPoints: 2 })).toBe(true);
    expect(sameForm({ ...VALID, spreadMode: 'fixed', spreadPoints: 1 }, { ...VALID, spreadMode: 'fixed', spreadPoints: 2 })).toBe(false);
  });
});
