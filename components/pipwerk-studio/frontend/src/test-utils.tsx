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

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function mockFetchResponse(status: number, body: unknown): void {
  vi.stubGlobal('fetch', () => Promise.resolve(jsonResponse(status, body)));
}

export type MockRoute = { status: number; body: unknown };

/**
 * Answers each request path with its own response. Paths without an entry are
 * answered with HTTP 404, which lets tests simulate a partly reachable backend.
 */
export function mockFetchRoutes(routes: Record<string, MockRoute>): void {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    const route = Object.entries(routes).find(([path]) => url.endsWith(path))?.[1];
    if (route === undefined) {
      return Promise.resolve(jsonResponse(404, { detail: 'not found' }));
    }
    return Promise.resolve(jsonResponse(route.status, route.body));
  });
}

export const okRoutes: Record<string, MockRoute> = {
  '/api/health': { status: 200, body: { status: 'ok' } },
  '/api/info': { status: 200, body: { name: 'Pipwerk Studio', version: '0.1.0.dev0' } },
};
