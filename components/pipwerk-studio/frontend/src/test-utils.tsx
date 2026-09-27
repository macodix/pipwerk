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

export function mockFetchResponse(status: number, body: unknown): void {
  vi.stubGlobal('fetch', () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
}
