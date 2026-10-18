import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { switchLanguage } from './testing/actions';
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

  it('shows the library on the left, the drawing area in the middle and the property view on the right', () => {
    renderWithProviders(<App />);

    const library = screen.getByRole('complementary', { name: 'Elementbibliothek' });
    const canvas = screen.getByRole('region', { name: 'Designer-Arbeitsfläche' });
    const properties = screen.getByRole('complementary', { name: 'Eigenschaften' });
    expect(library.compareDocumentPosition(canvas) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(canvas.compareDocumentPosition(properties) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('shows the menu in the header with the entries of the specification', () => {
    renderWithProviders(<App />);

    const menu = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Menü' });
    expect(within(menu).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Neue Strategie',
      'Öffnen',
      'Speichern',
      'Prüfen',
      'Schließen',
      'Löschen',
      'Einstellungen',
    ]);
  });

  it('has no language selection in the header any more; it is in the settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(await screen.findByText('Backend: verbunden')).toBeInTheDocument();

    expect(within(screen.getByRole('banner')).queryByLabelText('Sprache')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Einstellungen' }));

    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });
    expect(within(dialog).getByLabelText('Sprache')).toBeInTheDocument();
  });

  it('switches visible texts between German and English', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(await screen.findByText('Backend: verbunden')).toBeInTheDocument();
    await screen.findByRole('button', { name: 'Einstellungen' });

    await switchLanguage(user, 'English');

    expect(screen.getByRole('region', { name: 'Designer canvas' })).toBeInTheDocument();
    expect(screen.getByText('The canvas is empty.')).toBeInTheDocument();
    expect(screen.getByText('Backend: connected')).toBeInTheDocument();
    expect(screen.queryByText('Backend: verbunden')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New strategy' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');

    await switchLanguage(user, 'Deutsch');

    expect(await screen.findByRole('region', { name: 'Designer-Arbeitsfläche' })).toBeInTheDocument();
    expect(screen.getByText('Backend: verbunden')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de');
  });

  it('shows the About button in the header right of the menu, in German and English', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(await screen.findByText('Backend: verbunden')).toBeInTheDocument();

    const header = screen.getByRole('banner');
    const button = within(header).getByRole('button', { name: 'Über pipwerk Studio' });
    const menu = within(header).getByRole('navigation', { name: 'Menü' });
    expect(menu.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(button).toHaveAttribute('type', 'button');

    await switchLanguage(user, 'English');

    expect(await within(header).findByRole('button', { name: 'About pipwerk Studio' })).toBeInTheDocument();
  });

  it('opens the dialog with the mouse and focuses the button again after closing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Über pipwerk Studio' });

    await user.click(button);

    const dialog = screen.getByRole('dialog', { name: 'Über pipwerk Studio' });
    expect(within(dialog).getByRole('button', { name: 'Schließen' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('opens the dialog with the keyboard and focuses the button again after closing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    const button = screen.getByRole('button', { name: 'Über pipwerk Studio' });
    button.focus();

    await user.keyboard('{Enter}');

    const dialog = screen.getByRole('dialog', { name: 'Über pipwerk Studio' });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));

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
    await screen.findByRole('button', { name: 'Einstellungen' });

    await switchLanguage(user, 'English');

    expect(screen.getByRole('heading', { level: 1, name: 'pipwerk Studio' })).toBeInTheDocument();
  });
});
