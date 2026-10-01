import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { mockFetchRoutes, okRoutes, renderWithProviders } from './test-utils';

describe('App', () => {
  beforeEach(() => {
    mockFetchRoutes(okRoutes);
  });

  it('shows the product name', () => {
    renderWithProviders(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Pipwerk Studio' })).toBeInTheDocument();
  });

  it('shows an empty designer canvas', () => {
    renderWithProviders(<App />);

    const canvas = screen.getByRole('region', { name: 'Designer-Arbeitsfläche' });
    expect(canvas.querySelector('.react-flow')).not.toBeNull();
    expect(canvas.querySelectorAll('.react-flow__node')).toHaveLength(0);
    expect(canvas.querySelectorAll('.react-flow__edge')).toHaveLength(0);
    expect(screen.getByText('Die Arbeitsfläche ist leer.')).toBeInTheDocument();
  });

  it('switches visible texts between German and English', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(await screen.findByText('Backend: verbunden')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Sprache'), 'English');

    expect(screen.getByLabelText('Language')).toHaveValue('en');
    expect(screen.getByRole('region', { name: 'Designer canvas' })).toBeInTheDocument();
    expect(screen.getByText('The canvas is empty.')).toBeInTheDocument();
    expect(screen.getByText('Backend: connected')).toBeInTheDocument();
    expect(screen.queryByText('Backend: verbunden')).not.toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');

    await user.selectOptions(screen.getByLabelText('Language'), 'Deutsch');

    expect(screen.getByRole('region', { name: 'Designer-Arbeitsfläche' })).toBeInTheDocument();
    expect(screen.getByText('Backend: verbunden')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de');
  });

  it('shows name and version in the footer in German and English', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    expect(await screen.findByText('Pipwerk Studio Version 0.1.0.dev0')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Sprache'), 'English');

    expect(await screen.findByText('Pipwerk Studio version 0.1.0.dev0')).toBeInTheDocument();
    expect(screen.queryByText('Pipwerk Studio Version 0.1.0.dev0')).not.toBeInTheDocument();
  });

  it('stays usable without a reachable backend and shows no version', async () => {
    mockFetchRoutes({});
    renderWithProviders(<App />);

    expect(await screen.findByText('Backend: nicht erreichbar')).toBeInTheDocument();
    expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Pipwerk Studio' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Designer-Arbeitsfläche' })).toBeInTheDocument();
    expect(screen.getByLabelText('Sprache')).toBeEnabled();
  });

  it('keeps the product name unchanged when switching the language', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.selectOptions(screen.getByLabelText('Sprache'), 'English');

    expect(screen.getByRole('heading', { level: 1, name: 'Pipwerk Studio' })).toBeInTheDocument();
  });
});
