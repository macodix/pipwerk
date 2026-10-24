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

/** A row of the list of series (`SeriesRow` of the web API). */
export function rowJson(overrides: Json = {}): Json {
  return {
    broker: 'Demo-Server',
    instrument: 'EURUSD',
    data: 'h1',
    first: '2026-01-05T00:00:00Z',
    last: '2026-01-09T23:00:00Z',
    gap_count: 0,
    ...overrides,
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

/** The result for a file that is taken over (`FileOutcome` of the web API). */
export function takenJson(name: string, result: Json = {}): Json {
  return { name, refused: false, result: importResultJson(result), error: null, message: null };
}

/** The result for a file that is refused as a whole. */
export function refusedJson(name: string, error: string, message = 'x'): Json {
  return { name, refused: true, result: null, error, message };
}

/** What the preview says about a file (`FileHint` of the web API). */
export function hintJson(name: string, overrides: Json = {}): Json {
  return {
    name,
    format: name.toLowerCase().endsWith('.json') ? 'json' : 'csv',
    broker: null,
    instrument: null,
    data: null,
    error: null,
    ...overrides,
  };
}

/** What the form of the request of a file contained, read from the recorded body. */
export type SentForm = {
  broker: string | null;
  timezone: string | null;
  files: string[];
  instrument: string[];
  data: string[];
};

export function readForm(body: unknown): SentForm {
  const form = body as FormData;
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === 'string' ? value : null;
  };
  return {
    broker: text('broker'),
    timezone: text('timezone'),
    files: form.getAll('file').map((file) => (file as File).name),
    instrument: form.getAll('instrument').map(String),
    data: form.getAll('data').map(String),
  };
}

/** What deleting would remove or removed (`DeletionResult` of the web API). */
export function deletionJson(overrides: Json = {}): Json {
  return {
    kind: 'series',
    deleted: false,
    broker: 'Demo-Server',
    instrument: 'EURUSD',
    data: 'h1',
    start: null,
    end: null,
    candle_count: 120,
    tick_count: 0,
    series_count: 1,
    instrument_count: 0,
    broker_removed: false,
    test_run_broker_reset: false,
    test_run_broker: { broker: 'Demo-Server', chosen: false },
    ...overrides,
  };
}

export const IMPORT_PROCESS_PATH = '/api/v1/market-data/import-processes';
export const DELETIONS_PATH = '/api/v1/market-data/deletions';

/**
 * A replacement of the backend for component tests: it answers `fetch` like the web API does
 * (with the answers of the interface to test) and records every call.
 */
export class FakeBackend {
  language: SupportedLanguage = 'de';
  healthy = true;
  accounts: Json[] = [{ ...DEFAULT_ACCOUNT_JSON }];
  /** The rows of the data stock, in the order of the list. */
  rows: Json[] = [];
  /** A special answer to the list of series (an error), instead of the rows. */
  seriesAnswer: (() => Response) | null = null;
  /** The gaps of a row by `broker|instrument|data`. */
  gaps: Record<string, Json[]> = {};
  /** The contract data by `broker|instrument`. */
  contracts: Record<string, Json> = {};
  /** The brokers of the data stock. */
  brokers: string[] = [];
  /** The choice for the broker for test runs; the answer applies the rule of the backend. */
  testRunBroker: string | null = null;
  revision: Json = { revision: null, commit: null, committed_at: null };
  /** What the preview says about a file by its name; a file without an entry is unknown. */
  hints: Record<string, Json> = {};
  /** A special answer to the preview of a file (by its name), instead of the hints. */
  previewAnswer: ((name: string) => Response | Promise<Response>) | null = null;
  /** The answer to the beginning of an import process. */
  beginAnswer: () => Response = () => json(201, { id: 'process-1', idle_timeout_seconds: 300 });
  /** The answer to the request of one file of a process, from its name; replaced per test. */
  fileAnswer: (name: string, call: number) => Response | Promise<Response> = (name) => json(200, takenJson(name));
  /** The answer to the end or the abort of a process. */
  endAnswer: (how: 'finish' | 'abort') => Response = (how) =>
    json(200, { id: 'process-1', state: how === 'finish' ? 'finished' : 'aborted', imported_count: 0, refused_count: 0 });
  /** The answer to a deletion (`confirm` false or true) by kind and body; replaced per test. */
  deletionAnswer: (kind: string, body: Json) => Response = (kind, body) =>
    json(200, deletionJson({ kind, deleted: body.confirm === true }));
  calls: Call[] = [];
  private fileCalls = 0;
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
    } else if (rawBody instanceof Blob || rawBody instanceof FormData) {
      body = rawBody;
    }
    this.calls.push({ method, path: url.pathname, query: url.searchParams, contentType, body });
    try {
      return Promise.resolve(this.route(method, url, body));
    } catch (error) {
      // An answer that throws is a request that fails, as `fetch` does without a network.
      return Promise.reject(error instanceof Error ? error : new TypeError('Failed to fetch'));
    }
  }

  private route(method: string, url: URL, body: unknown): Response | Promise<Response> {
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
    if (path === '/api/replay/settings/test-run-broker') {
      if (method === 'PUT') {
        const wanted = (body as { broker: string | null }).broker;
        if (wanted !== null && !this.brokers.includes(wanted)) {
          return json(422, { detail: 'The broker has no data in the data stock.' });
        }
        this.testRunBroker = wanted;
      }
      return json(200, this.appliedTestRunBroker());
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
    if (path === '/api/v1/market-data/series') {
      return this.seriesAnswer === null ? this.series(url.searchParams) : this.seriesAnswer();
    }
    if (path === '/api/v1/market-data/series/details') {
      return this.seriesDetails(url.searchParams);
    }
    if (path === '/api/v1/market-data/brokers') {
      return json(200, { items: this.brokers });
    }
    if (path === '/api/v1/market-data/import-preview' && method === 'POST') {
      const name = readForm(body).files[0] ?? '';
      return this.previewAnswer === null ? json(200, this.hints[name] ?? hintJson(name)) : this.previewAnswer(name);
    }
    if (path === IMPORT_PROCESS_PATH && method === 'POST') {
      return this.beginAnswer();
    }
    const processFiles = new RegExp(`^${IMPORT_PROCESS_PATH}/([^/]+)/files$`).exec(path);
    if (processFiles !== null && method === 'POST') {
      this.fileCalls += 1;
      return this.fileAnswer(readForm(body).files[0] ?? '', this.fileCalls);
    }
    const processEnd = new RegExp(`^${IMPORT_PROCESS_PATH}/([^/]+)/(finish|abort)$`).exec(path);
    if (processEnd !== null && method === 'POST') {
      return this.endAnswer(processEnd[2] as 'finish' | 'abort');
    }
    const deletion = new RegExp(`^${DELETIONS_PATH}/(series|period|contract|broker)$`).exec(path);
    if (deletion !== null && method === 'POST') {
      return this.deletionAnswer(deletion[1] as string, body as Json);
    }
    return json(404, { detail: 'Not Found' });
  }

  /** The broker that applies: the choice if it occurs in the data stock, else the first one. */
  appliedTestRunBroker(): Json {
    const first = [...this.brokers].sort((a, b) => a.localeCompare(b))[0] ?? null;
    if (this.testRunBroker !== null && this.brokers.includes(this.testRunBroker)) {
      return { broker: this.testRunBroker, chosen: true };
    }
    return { broker: first, chosen: false };
  }

  private series(query: URLSearchParams): Response {
    const part = (key: string) => (query.get(key) ?? '').toLowerCase();
    const matching = this.rows.filter(
      (row) =>
        String(row.broker).toLowerCase().includes(part('broker')) &&
        String(row.instrument).toLowerCase().includes(part('instrument')) &&
        String(row.data).toLowerCase().includes(part('data')),
    );
    const offset = Number(query.get('offset') ?? 0);
    const limit = Number(query.get('limit') ?? 1000);
    return json(200, { items: matching.slice(offset, offset + limit), total: matching.length, offset, limit });
  }

  private seriesDetails(query: URLSearchParams): Response {
    const broker = query.get('broker');
    const instrument = query.get('instrument');
    const data = query.get('data');
    const row = this.rows.find((item) => item.broker === broker && item.instrument === instrument && item.data === data);
    if (row === undefined) {
      return json(404, { detail: 'There is no such row in the list of series.' });
    }
    return json(200, {
      row,
      gaps: this.gaps[`${String(broker)}|${String(instrument)}|${String(data)}`] ?? [],
      contract: this.contracts[`${String(broker)}|${String(instrument)}`] ?? null,
    });
  }
}
