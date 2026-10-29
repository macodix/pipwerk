import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BackendStatus } from './BackendStatus';
import { mockFetchResponse, renderWithProviders } from './test-utils';

describe('BackendStatus', () => {
  it('reports a connected backend', async () => {
    mockFetchResponse(200, { status: 'ok' });
    renderWithProviders(<BackendStatus />, 'en');

    expect(await screen.findByText('Connection to the server: established')).toBeInTheDocument();
  });

  it('reports an unreachable backend on an HTTP error', async () => {
    mockFetchResponse(503, { detail: 'unavailable' });
    renderWithProviders(<BackendStatus />, 'en');

    expect(await screen.findByText('Connection to the server: not possible')).toBeInTheDocument();
  });

  it('reports an unreachable backend on an unexpected response', async () => {
    mockFetchResponse(200, { status: 'unexpected' });
    renderWithProviders(<BackendStatus />, 'en');

    expect(await screen.findByText('Connection to the server: not possible')).toBeInTheDocument();
  });

  it('reports an unreachable backend on a network error', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('network error')));
    renderWithProviders(<BackendStatus />, 'en');

    expect(await screen.findByText('Connection to the server: not possible')).toBeInTheDocument();
  });
});
