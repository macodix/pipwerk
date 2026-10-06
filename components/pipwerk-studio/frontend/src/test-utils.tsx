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
    ...render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </I18nextProvider>,
    ),
  };
}

function toResponse(status: number, body: unknown): Response {
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

/**
 * Mocks `fetch` with per-endpoint responses so tests can exercise the
 * backend health check and the Studio language endpoints independently.
 * Defaults to a healthy backend and a stored German language when a route
 * is not explicitly overridden.
 */
export function mockFetchRoutes(overrides: {
  health?: RouteResponse;
  getLanguage?: RouteSource;
  putLanguage?: RouteSource<[unknown]>;
} = {}): void {
  const health = overrides.health ?? { status: 200, body: { status: 'ok' } };
  const getLanguage = overrides.getLanguage ?? { status: 200, body: { language: 'de' } };
  const putLanguage: RouteSource<[unknown]> =
    overrides.putLanguage ?? ((requestBody: unknown) => ({ status: 200, body: requestBody }));

  vi.stubGlobal(
    'fetch',
    (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();

      let route: RouteResponse | Promise<RouteResponse>;
      if (url.includes('/api/health')) {
        route = health;
      } else if (url.includes('/api/studio/settings/language') && method === 'GET') {
        route = typeof getLanguage === 'function' ? getLanguage() : getLanguage;
      } else if (url.includes('/api/studio/settings/language') && method === 'PUT') {
        const requestBody: unknown = init?.body !== undefined ? JSON.parse(String(init.body)) : {};
        route = typeof putLanguage === 'function' ? putLanguage(requestBody) : putLanguage;
      } else {
        return Promise.reject(new Error(`Unmocked fetch call: ${method} ${url}`));
      }

      return Promise.resolve(route).then((resolved) => {
        if (resolved === 'pending') {
          return new Promise<Response>(() => undefined);
        }
        if (resolved === 'network-error') {
          return Promise.reject(new TypeError('network error'));
        }
        return toResponse(resolved.status, resolved.body);
      });
    },
  );
}
