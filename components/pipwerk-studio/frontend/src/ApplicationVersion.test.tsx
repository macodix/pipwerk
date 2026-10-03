import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApplicationVersion } from './ApplicationVersion';
import { mockFetchResponse, renderWithProviders } from './test-utils';

const info = { name: 'Pipwerk Studio', version: '0.1.0.dev0' };

describe('ApplicationVersion', () => {
  it('shows name and version in English', async () => {
    mockFetchResponse(200, info);
    renderWithProviders(<ApplicationVersion />, 'en');

    expect(await screen.findByText('Pipwerk Studio version 0.1.0.dev0')).toBeInTheDocument();
  });

  it('shows name and version in German', async () => {
    mockFetchResponse(200, info);
    renderWithProviders(<ApplicationVersion />, 'de');

    expect(await screen.findByText('Pipwerk Studio Version 0.1.0.dev0')).toBeInTheDocument();
  });

  it('stays empty while the request is pending', () => {
    vi.stubGlobal('fetch', () => new Promise<Response>(() => {}));
    const { container } = renderWithProviders(<ApplicationVersion />, 'en');

    expect(container).toBeEmptyDOMElement();
  });

  it('stays empty on an HTTP error', async () => {
    mockFetchResponse(503, { detail: 'unavailable' });
    const { container } = renderWithProviders(<ApplicationVersion />, 'en');

    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText(/0\.1\.0/)).not.toBeInTheDocument();
  });

  it('stays empty on a network error', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('network error')));
    const { container } = renderWithProviders(<ApplicationVersion />, 'en');

    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('stays empty on an unexpected response', async () => {
    mockFetchResponse(200, { name: 'Pipwerk Studio' });
    const { container } = renderWithProviders(<ApplicationVersion />, 'en');

    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('stays empty when the reported version is blank', async () => {
    mockFetchResponse(200, { name: 'Pipwerk Studio', version: '   ' });
    const { container } = renderWithProviders(<ApplicationVersion />, 'en');

    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
