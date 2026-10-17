import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { vi } from 'vitest';

import { createI18n, type SupportedLanguage } from './i18n';
import typesJson from './testing/element-types.json';

export function renderWithProviders(ui: ReactElement, language?: SupportedLanguage) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const i18n = createI18n(language);
  return {
    i18n,
    ...render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </I18nextProvider>,
    ),
  };
}

function toResponse(status: number, body: unknown): Response {
  if (status === 204) {
    return new Response(null, { status });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Mocks every `fetch` call with the same response, regardless of URL. */
export function mockFetchResponse(status: number, body: unknown): void {
  vi.stubGlobal('fetch', () => Promise.resolve(toResponse(status, body)));
}

/** `'pending'` never answers, which keeps the request open for the whole test. */
export type RouteResponse = { status: number; body: unknown } | 'network-error' | 'pending';

/** A route answer that may change between calls or be released later (see `createGate`). */
export type RouteSource<Args extends unknown[] = []> =
  | RouteResponse
  | ((...args: Args) => RouteResponse | Promise<RouteResponse>);

/** A request whose answer the test releases explicitly. */
export function createGate(): { promise: Promise<RouteResponse>; release: (r: RouteResponse) => void } {
  let release!: (r: RouteResponse) => void;
  const promise = new Promise<RouteResponse>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

/** A request the mock has seen. */
export type RecordedCall = { method: string; url: string; body: unknown };

/** A route a test adds: it answers a request or returns `undefined` to leave it to the standard routes. */
export type ExtraRoute = (call: RecordedCall) => RouteResponse | Promise<RouteResponse> | undefined;

export const EMPTY_LIST = { status: 200, body: { items: [] } } as const;

/**
 * Mocks `fetch` with per-endpoint responses so tests can exercise the
 * backend health check, the Studio revision and the Studio language endpoints independently.
 * Defaults to a healthy backend, an undeterminable revision and a stored German language when a route
 * is not explicitly overridden. The Web API answers with the standard type descriptions, empty lists
 * and an object directory; `extra` adds or replaces routes. Returns the requests the mock has seen.
 */
export function mockFetchRoutes(overrides: {
  health?: RouteResponse;
  revision?: RouteResponse;
  getLanguage?: RouteSource;
  putLanguage?: RouteSource<[unknown]>;
  elementTypes?: RouteResponse;
  extra?: ExtraRoute;
} = {}): { calls: RecordedCall[] } {
  const health = overrides.health ?? { status: 200, body: { status: 'ok' } };
  const revision = overrides.revision ?? { status: 200, body: { revision: null, commit: null, committed_at: null } };
  const getLanguage = overrides.getLanguage ?? { status: 200, body: { language: 'de' } };
  const putLanguage: RouteSource<[unknown]> =
    overrides.putLanguage ?? ((requestBody: unknown) => ({ status: 200, body: requestBody }));
  const elementTypes = overrides.elementTypes ?? { status: 200, body: typesJson };
  const calls: RecordedCall[] = [];

  vi.stubGlobal(
    'fetch',
    (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();
      const body: unknown = init?.body !== undefined ? JSON.parse(String(init.body)) : undefined;
      const call: RecordedCall = { method, url, body };
      calls.push(call);

      let route: RouteResponse | Promise<RouteResponse> | undefined = overrides.extra?.(call);
      if (route === undefined) {
        if (url.includes('/api/health')) {
          route = health;
        } else if (url.includes('/api/studio/revision')) {
          route = revision;
        } else if (url.includes('/api/studio/settings/language') && method === 'GET') {
          route = typeof getLanguage === 'function' ? getLanguage() : getLanguage;
        } else if (url.includes('/api/studio/settings/language') && method === 'PUT') {
          const requestBody: unknown = body ?? {};
          route = typeof putLanguage === 'function' ? putLanguage(requestBody) : putLanguage;
        } else if (url.includes('/api/v1/element-types')) {
          route = elementTypes;
        } else if (/\/api\/v1\/(strategies|indicators|trends|rules|rulesets)$/.test(url) && method === 'GET') {
          route = EMPTY_LIST;
        } else if (url.includes('/api/studio/settings/object-directory') && method === 'GET') {
          route = { status: 200, body: { path: '/var/objects', is_default: true } };
        } else if (url.includes('/api/v1/check') && method === 'POST') {
          route = { status: 200, body: { findings: [], expressions: [], names_truncated: false } };
        } else {
          return Promise.reject(new Error(`Unmocked fetch call: ${method} ${url}`));
        }
      }

      const signal = init?.signal ?? undefined;
      // Like the real `fetch`, an aborted request rejects with an AbortError.
      const aborted = new Promise<never>((_resolve, reject) => {
        const fail = (): void => reject(new DOMException('The operation was aborted.', 'AbortError'));
        if (signal?.aborted === true) {
          fail();
        } else {
          signal?.addEventListener('abort', fail, { once: true });
        }
      });
      const answered = Promise.resolve(route).then((resolved) => {
        if (resolved === 'pending') {
          return new Promise<Response>(() => undefined);
        }
        if (resolved === 'network-error') {
          return Promise.reject(new TypeError('network error'));
        }
        return toResponse(resolved.status, resolved.body);
      });
      return Promise.race([answered, aborted]);
    },
  );
  return { calls };
}
