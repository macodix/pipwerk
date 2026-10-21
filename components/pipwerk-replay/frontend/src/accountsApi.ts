// Test accounts: `/api/v1/accounts` (specification 6.2).
import {
  asArray,
  asRecord,
  bool,
  list,
  num,
  numOrNull,
  request,
  str,
  type JsonRecord,
} from './http';

export type SpreadMode = 'candle' | 'fixed';

/** The values of a test account that the user sets. */
export type AccountValues = {
  name: string;
  initialCapital: number;
  currency: string;
  leverage: number;
  spreadMode: SpreadMode;
  /** Fixed spread in points; `null` for the mode `candle`. */
  spreadPoints: number | null;
  commissionPerLotSide: number;
};

export type Account = AccountValues & {
  id: string;
  /** The default test account (read-only; the backend decides). */
  isDefault: boolean;
};

/** The limits of the backend for the values of a test account. */
export const ACCOUNT_LIMITS = {
  nameLength: 100,
  maxCapital: 1e12,
  maxLeverage: 1000,
  maxSpreadPoints: 100_000,
  maxCommission: 100_000,
} as const;

function parseAccount(value: unknown): Account {
  const record: JsonRecord = asRecord(value, 'test account');
  const spreadMode = str(record, 'spread_mode');
  if (spreadMode !== 'candle' && spreadMode !== 'fixed') {
    throw new Error('The test account has an unknown spread mode');
  }
  return {
    id: str(record, 'id'),
    name: str(record, 'name'),
    initialCapital: num(record, 'initial_capital'),
    currency: str(record, 'currency'),
    leverage: num(record, 'leverage'),
    spreadMode,
    spreadPoints: numOrNull(record, 'spread_points'),
    commissionPerLotSide: num(record, 'commission_per_lot_side'),
    isDefault: bool(record, 'is_default'),
  };
}

function toBody(values: AccountValues): Record<string, unknown> {
  return {
    name: values.name,
    initial_capital: values.initialCapital,
    currency: values.currency,
    leverage: values.leverage,
    spread_mode: values.spreadMode,
    spread_points: values.spreadMode === 'fixed' ? values.spreadPoints : null,
    commission_per_lot_side: values.commissionPerLotSide,
  };
}

export async function fetchAccounts(signal?: AbortSignal): Promise<Account[]> {
  const body = asRecord(await request('/api/v1/accounts', { signal }), 'list of test accounts');
  asArray(body.items, 'list of test accounts');
  return list(body, 'items', parseAccount);
}

export async function createAccount(values: AccountValues): Promise<Account> {
  return parseAccount(await request('/api/v1/accounts', { method: 'POST', json: toBody(values) }));
}

export async function updateAccount(id: string, values: AccountValues): Promise<Account> {
  return parseAccount(
    await request(`/api/v1/accounts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      json: toBody(values),
    }),
  );
}

export async function deleteAccount(id: string): Promise<void> {
  await request(`/api/v1/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
