// The form of a test account: the values as typed, the check against the limits of the backend,
// and the conversion to the values of the web API.
import { ACCOUNT_LIMITS, type Account, type AccountValues, type SpreadMode } from './accountsApi';

/** The name the backend stores for the default test account (German); see `accounts.py`. */
export const DEFAULT_ACCOUNT_NAME = 'Standard-Testkonto';

/** A number field holds a number or, while empty or incomplete, `''`. */
export type AccountForm = {
  name: string;
  initialCapital: number | '';
  currency: string;
  leverage: number | '';
  spreadMode: SpreadMode;
  spreadPoints: number | '';
  commissionPerLotSide: number | '';
};

/** The values of a new test account: the default test account of the specification (6.2). */
export const NEW_ACCOUNT_VALUES: Omit<AccountForm, 'name'> = {
  initialCapital: 10_000,
  currency: 'EUR',
  leverage: 30,
  spreadMode: 'candle',
  spreadPoints: 0,
  commissionPerLotSide: 0,
};

export function formFromAccount(account: Account): AccountForm {
  return {
    name: account.name,
    initialCapital: account.initialCapital,
    currency: account.currency,
    leverage: account.leverage,
    spreadMode: account.spreadMode,
    spreadPoints: account.spreadPoints ?? 0,
    commissionPerLotSide: account.commissionPerLotSide,
  };
}

/** The problems of the form; the texts are in `accounts.problem.<key>`. */
export type AccountProblem =
  | 'name'
  | 'capital'
  | 'currency'
  | 'leverage'
  | 'spread'
  | 'commission';

// Control characters and the separators of lines and paragraphs (Unicode `Cc`, `Zl`, `Zp`).
const CONTROL_CHARACTER = new RegExp('[\\x00-\\x1f\\x7f\\u2028\\u2029]');

function inRange(value: number | '', min: number, max: number, minIncluded: boolean): boolean {
  if (value === '' || !Number.isFinite(value)) {
    return false;
  }
  return (minIncluded ? value >= min : value > min) && value <= max;
}

export function checkAccountForm(form: AccountForm): AccountProblem[] {
  const problems: AccountProblem[] = [];
  if (
    form.name.trim() === '' ||
    Array.from(form.name).length > ACCOUNT_LIMITS.nameLength ||
    CONTROL_CHARACTER.test(form.name)
  ) {
    problems.push('name');
  }
  if (!inRange(form.initialCapital, 0, ACCOUNT_LIMITS.maxCapital, false)) {
    problems.push('capital');
  }
  if (!/^[A-Z]{3}$/.test(form.currency)) {
    problems.push('currency');
  }
  if (!Number.isInteger(form.leverage) || !inRange(form.leverage, 1, ACCOUNT_LIMITS.maxLeverage, true)) {
    problems.push('leverage');
  }
  if (form.spreadMode === 'fixed' && !inRange(form.spreadPoints, 0, ACCOUNT_LIMITS.maxSpreadPoints, true)) {
    problems.push('spread');
  }
  if (!inRange(form.commissionPerLotSide, 0, ACCOUNT_LIMITS.maxCommission, true)) {
    problems.push('commission');
  }
  return problems;
}

/** The values of the form for the web API; only for a form without problems. */
export function valuesFromForm(form: AccountForm): AccountValues {
  return {
    name: form.name,
    initialCapital: Number(form.initialCapital),
    currency: form.currency,
    leverage: Number(form.leverage),
    spreadMode: form.spreadMode,
    spreadPoints: form.spreadMode === 'fixed' ? Number(form.spreadPoints) : null,
    commissionPerLotSide: Number(form.commissionPerLotSide),
  };
}

/** Whether two forms hold the same values (the spread value counts only for the mode `fixed`). */
export function sameForm(a: AccountForm, b: AccountForm): boolean {
  const normal = (form: AccountForm) => ({
    ...form,
    spreadPoints: form.spreadMode === 'fixed' ? form.spreadPoints : null,
  });
  return JSON.stringify(normal(a)) === JSON.stringify(normal(b));
}
