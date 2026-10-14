import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { mockFetchRoutes, renderWithProviders } from './test-utils';

describe('App', () => {
  beforeEach(() => {
    mockFetchRoutes();
  });

  it('shows the product name', () => {
    renderWithProviders(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'pipwerk Studio' })).toBeInTheDocument();
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
    await screen.findByDisplayValue('Deutsch');

    await user.selectOptions(screen.getByLabelText('Sprache'), 'English');

    expect(await screen.findByLabelText('Language')).toHaveValue('en');
    expect(screen.getByRole('region', { name: 'Designer canvas' })).toBeInTheDocument();
    expect(screen.getByText('The canvas is empty.')).toBeInTheDocument();
    expect(screen.getByText('Backend: connected')).toBeInTheDocument();
    expect(screen.queryByText('Backend: verbunden')).not.toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');

    await user.selectOptions(screen.getByLabelText('Language'), 'Deutsch');

    expect(await screen.findByRole('region', { name: 'Designer-Arbeitsfläche' })).toBeInTheDocument();
    expect(screen.getByText('Backend: verbunden')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de');
  });

  it('shows the About button in the header right of the language select, in German and English', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(await screen.findByText('Backend: verbunden')).toBeInTheDocument();
    await screen.findByDisplayValue('Deutsch');

    const header = screen.getByRole('banner');
    const button = within(header).getByRole('button', { name: 'Über pipwerk Studio' });
    const select = within(header).getByLabelText('Sprache');
    expect(select.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(button).toHaveAttribute('type', 'button');

    await user.selectOptions(select, 'English');

    expect(await within(header).findByRole('button', { name: 'About pipwerk Studio' })).toBeInTheDocument();
  });

  it('opens the dialog with the mouse and focuses the button again after closing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Über pipwerk Studio' });

    await user.click(button);

    expect(screen.getByRole('dialog', { name: 'Über pipwerk Studio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Schließen' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('opens the dialog with the keyboard and focuses the button again after closing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    const button = screen.getByRole('button', { name: 'Über pipwerk Studio' });
    button.focus();

    await user.keyboard('{Enter}');

    expect(screen.getByRole('dialog', { name: 'Über pipwerk Studio' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(button).toHaveFocus();
  });

  it('keeps the footer with the revision unchanged while the dialog is open', async () => {
    const user = userEvent.setup();
    mockFetchRoutes({
      revision: {
        status: 200,
        body: {
          revision: '0123456',
          commit: '0123456789abcdef0123456789abcdef01234567',
          committed_at: '2026-10-09T14:52:03+02:00',
        },
      },
    });
    renderWithProviders(<App />);
    expect(await screen.findByText('Stand: 0123456')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Über pipwerk Studio' }));

    expect(screen.getByText('Stand: 0123456')).toBeInTheDocument();
  });

  it('keeps the product name unchanged when switching the language', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByDisplayValue('Deutsch');

    await user.selectOptions(screen.getByLabelText('Sprache'), 'English');

    expect(screen.getByRole('heading', { level: 1, name: 'pipwerk Studio' })).toBeInTheDocument();
  });
});
