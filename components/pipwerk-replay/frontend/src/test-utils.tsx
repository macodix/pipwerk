import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { vi } from 'vitest';

import { createI18n, type SupportedLanguage } from './i18n';

export function renderWithProviders(ui: ReactElement, language?: SupportedLanguage) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const i18n = createI18n(language);
  return {
    i18n,
    queryClient,
    ...render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </I18nextProvider>,
    ),
  };
}

type Json = Record<string, unknown>;

export type Call = { method: string; path: string; query: URLSearchParams; contentType: string | null; body: unknown };

export function json(status: number, body: unknown): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const DEFAULT_ACCOUNT_JSON: Json = {
  id: '5b0e7c3a-1d84-4f6a-9a52-3c6d0e8f7a21',
  name: 'Standard-Testkonto',
  initial_capital: 10000,
  currency: 'EUR',
  leverage: 30,
  spread_mode: 'candle',
  spread_points: null,
  commission_per_lot_side: 0,
  is_default: true,
};

export function seriesJson(overrides: Json = {}): Json {
  return {
    broker: 'Demo-Server',
    instrument: 'EURUSD',
    unit: 'h1',
    count: 120,
    first: '2026-01-05T00:00:00Z',
    last: '2026-01-09T23:00:00Z',
    covered: [{ start: '2026-01-05T00:00:00Z', end: '2026-01-10T00:00:00Z' }],
    covered_count: 1,
    missing: [],
    missing_count: 0,
    has_trading_hours: false,
    ...overrides,
  };
}

export function overviewJson(series: Json[] = [], instruments: Json[] = []): Json {
  return {
    series,
    series_total: series.length,
    instruments,
    instruments_total: instruments.length,
    offset: 0,
    limit: 1000,
  };
}

export const INSTRUMENT_JSON: Json = {
  broker: 'Demo-Server',
  instrument: 'EURUSD',
  acquired_at: '2026-01-05T08:00:00Z',
  tick_size: 0.00001,
  tick_value: 1,
  tick_value_currency: 'USD',
  point: 0.00001,
  pip: 0.0001,
  spread: 0.00012,
  min_volume: 0.01,
  volume_step: 0.01,
  contract_size: 100000,
  swap_long: -6.5,
  swap_short: 2.1,
  swap_triple_weekday: 'wednesday',
  margin_per_lot: null,
};

export function importResultJson(overrides: Json = {}): Json {
  return {
    kind: 'candles',
    broker: 'Demo-Server',
    instrument: 'EURUSD',
    unit: 'h1',
    accepted: 3,
    replaced: 0,
    period_start: '2026-01-05T08:00:00Z',
    period_end: '2026-01-05T10:00:00Z',
    rejected: [],
    rejected_count: 0,
    ...overrides,
  };
}

export function acquisitionJson(
  state: 'running' | 'finished',
  part: Json,
  id = '0a1b2c3d-0000-4000-8000-000000000001',
): Json {
  return {
    id,
    state,
    created_at: '2026-01-05T08:00:00Z',
    finished_at: state === 'finished' ? '2026-01-05T08:00:05Z' : null,
    parts: [
      {
        request: { kind: 'candles', instrument: 'EURUSD', time_unit: 'h1', start: '2026-01-05T00:00:00Z', end: '2026-01-06T00:00:00Z' },
        state: 'queued',
        result: null,
        omitted_count: null,
        error: null,
        ...part,
      },
    ],
  };
}

/**
 * A replacement of the backend for component tests: it answers `fetch` like the web API does
 * (with the answers of the interface to test) and records every call.
 */
export class FakeBackend {
  language: SupportedLanguage = 'de';
  healthy = true;
  accounts: Json[] = [{ ...DEFAULT_ACCOUNT_JSON }];
  overview: Json = overviewJson();
  /** A special answer to the overview (an error), instead of `overview`. */
  overviewAnswer: (() => Response) | null = null;
  instruments: Json[] = [];
  defaultSource: string | null = null;
  revision: Json = { revision: null, commit: null, committed_at: null };
  /** The answer to an import; replaced per test. */
  importAnswer: () => Response = () => json(200, importResultJson());
  /** The answer to the start of an acquisition. */
  acquisitionStart: () => Response = () => json(202, acquisitionJson('finished', { state: 'succeeded' }));
  /** The answers to the questions for the state of an acquisition; the last one stays. */
  acquisitionStates: Json[] = [];
  calls: Call[] = [];
  private counter = 0;

  install(): void {
    vi.stubGlobal('fetch', (input: string | URL | Request, init?: RequestInit) => this.handle(input, init));
  }

  callsTo(method: string, path: string): Call[] {
    return this.calls.filter((call) => call.method === method && call.path === path);
  }

  private handle(input: string | URL | Request, init?: RequestInit): Promise<Response> {
    const url = new URL(typeof input === 'string' ? input : input.toString(), 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = new Headers(init?.headers);
    const contentType = headers.get('Content-Type');
    const rawBody = init?.body;
    let body: unknown = null;
    if (typeof rawBody === 'string') {
      body = contentType === 'application/json' ? JSON.parse(rawBody) : rawBody;
    } else if (rawBody instanceof Blob) {
      body = rawBody;
    }
    this.calls.push({ method, path: url.pathname, query: url.searchParams, contentType, body });
    return Promise.resolve(this.route(method, url, body));
  }

  private route(method: string, url: URL, body: unknown): Response {
    const path = url.pathname;
    if (path === '/api/health') {
      return this.healthy ? json(200, { status: 'ok' }) : json(503, { detail: 'down' });
    }
    if (path === '/api/replay/revision') {
      return json(200, this.revision);
    }
    if (path === '/api/replay/settings/language') {
      if (method === 'PUT') {
        this.language = (body as { language: SupportedLanguage }).language;
      }
      return json(200, { language: this.language });
    }
    if (path === '/api/replay/settings/default-source') {
      if (method === 'PUT') {
        this.defaultSource = (body as { broker: string | null }).broker;
      }
      return json(200, { broker: this.defaultSource });
    }
    if (path === '/api/v1/accounts') {
      if (method === 'POST') {
        this.counter += 1;
        const created = { ...(body as Json), id: `00000000-0000-4000-8000-00000000000${this.counter}`, is_default: false };
        this.accounts.push(created);
        return json(201, created);
      }
      return json(200, { items: this.accounts });
    }
    const account = /^\/api\/v1\/accounts\/([^/]+)$/.exec(path);
    if (account !== null) {
      const index = this.accounts.findIndex((item) => item.id === account[1]);
      if (index < 0) {
        return json(404, { detail: 'The test account does not exist.' });
      }
      if (method === 'PUT') {
        const current = this.accounts[index] as Json;
        const changed = { ...(body as Json), id: current.id, is_default: current.is_default };
        this.accounts[index] = changed;
        return json(200, changed);
      }
      if (method === 'DELETE') {
        this.accounts.splice(index, 1);
        return new Response(null, { status: 204 });
      }
      return json(200, this.accounts[index]);
    }
    if (path === '/api/v1/market-data/overview') {
      return this.overviewAnswer === null ? json(200, this.overview) : this.overviewAnswer();
    }
    if (path === '/api/v1/market-data/instrument') {
      const found = this.instruments.find(
        (item) => item.broker === url.searchParams.get('broker') && item.instrument === url.searchParams.get('instrument'),
      );
      return found === undefined ? json(404, { detail: 'There are no data of this instrument.' }) : json(200, found);
    }
    if (path === '/api/v1/market-data/imports/json' || path === '/api/v1/market-data/imports/csv') {
      return this.importAnswer();
    }
    if (path === '/api/v1/market-data/acquisitions' && method === 'POST') {
      return this.acquisitionStart();
    }
    if (/^\/api\/v1\/market-data\/acquisitions\/[^/]+$/.test(path)) {
      const next = this.acquisitionStates.length > 1 ? this.acquisitionStates.shift() : this.acquisitionStates[0];
      return next === undefined ? json(404, { detail: 'The acquisition does not exist.' }) : json(200, next);
    }
    return json(404, { detail: 'Not Found' });
  }
}
