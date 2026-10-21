import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { AccountsView } from './AccountsView';
import { DEFAULT_ACCOUNT_JSON, FakeBackend, renderWithProviders } from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

async function shown(name: string): Promise<HTMLElement> {
  return screen.findByRole('textbox', { name });
}

describe('AccountsView', () => {
  it('shows the stored test accounts and the first one in the form', async () => {
    renderWithProviders(<AccountsView />);

    const items = await screen.findAllByTestId('account-item');
    expect(items).toHaveLength(1);
    expect(within(items[0] as HTMLElement).getByText('Standard-Testkonto')).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText('mitgeliefert')).toBeInTheDocument();
    expect(await shown('Name')).toHaveValue('Standard-Testkonto');
    expect(screen.getByLabelText('Anfangskapital')).toHaveValue('10000');
    expect(screen.getByLabelText('Hebel')).toHaveValue('30');
  });

  it('shows the default test account with an English text in the English interface', async () => {
    renderWithProviders(<AccountsView />, 'en');

    expect(await screen.findByText('Default test account')).toBeInTheDocument();
    expect(screen.getByText('built in')).toBeInTheDocument();
    expect(screen.queryByText('Standard-Testkonto')).not.toBeInTheDocument();
  });

  it('names the next step when there is no test account', async () => {
    backend.accounts = [];
    renderWithProviders(<AccountsView />);

    expect(await screen.findByTestId('accounts-empty')).toHaveTextContent('Nächster Schritt: Legen Sie ein neues an.');
    expect(screen.getByTestId('account-form-empty')).toHaveTextContent('Nächster Schritt');
    expect(screen.queryByTestId('account-delete')).not.toBeInTheDocument();
  });

  it('creates a test account with the values of the default test account and saves it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    await user.click(screen.getByTestId('account-new'));
    expect(screen.getByLabelText('Name')).toHaveValue('Neues Testkonto');
    expect(screen.getByLabelText('Anfangskapital')).toHaveValue('10000');
    expect(screen.getByLabelText('Kontowährung')).toHaveValue('EUR');
    expect(screen.getByTestId('account-delete')).toBeDisabled();

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Mein Konto');
    await user.click(screen.getByTestId('account-save'));

    await waitFor(() => {
      expect(screen.getAllByTestId('account-item')).toHaveLength(2);
    });
    const post = backend.callsTo('POST', '/api/v1/accounts');
    expect(post).toHaveLength(1);
    expect(post[0]?.body).toEqual({
      name: 'Mein Konto',
      initial_capital: 10000,
      currency: 'EUR',
      leverage: 30,
      spread_mode: 'candle',
      spread_points: null,
      commission_per_lot_side: 0,
    });
    expect(await screen.findByTestId('account-saved')).toHaveTextContent('Testkonto „Mein Konto“ ist gespeichert.');
    // The saved account is the shown one and can be deleted now.
    expect(screen.getByTestId('account-delete')).toBeEnabled();
  });

  it('changes and saves a test account with a fixed spread', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');
    expect(screen.getByTestId('account-save')).toBeDisabled();

    await user.click(screen.getByTestId('account-spread-fixed'));
    await user.clear(screen.getByTestId('account-spread'));
    await user.type(screen.getByTestId('account-spread'), '1,5');
    await user.clear(screen.getByLabelText('Hebel'));
    await user.type(screen.getByLabelText('Hebel'), '100');
    expect(screen.getByTestId('account-dirty')).toBeInTheDocument();
    await user.click(screen.getByTestId('account-save'));

    await waitFor(() => {
      expect(backend.callsTo('PUT', `/api/v1/accounts/${String(DEFAULT_ACCOUNT_JSON.id)}`)).toHaveLength(1);
    });
    expect(backend.callsTo('PUT', `/api/v1/accounts/${String(DEFAULT_ACCOUNT_JSON.id)}`)[0]?.body).toMatchObject({
      leverage: 100,
      spread_mode: 'fixed',
      spread_points: 1.5,
    });
    await waitFor(() => {
      expect(screen.queryByTestId('account-dirty')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('account-save')).toBeDisabled();
  });

  it('discards changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    await user.type(screen.getByLabelText('Name'), ' neu');
    expect(screen.getByLabelText('Name')).toHaveValue('Standard-Testkonto neu');
    await user.click(screen.getByTestId('account-revert'));

    expect(screen.getByLabelText('Name')).toHaveValue('Standard-Testkonto');
    expect(backend.callsTo('PUT', `/api/v1/accounts/${String(DEFAULT_ACCOUNT_JSON.id)}`)).toHaveLength(0);
  });

  it.each([
    ['Name', '', 'Der Name muss angegeben sein'],
    ['Anfangskapital', '0', 'Das Anfangskapital muss größer als 0 sein.'],
    ['Anfangskapital', 'abc', 'Das Anfangskapital muss größer als 0 sein.'],
    ['Hebel', '0', 'Der Hebel muss eine ganze Zahl von 1 bis 1000 sein.'],
    ['Hebel', '1,5', 'Der Hebel muss eine ganze Zahl von 1 bis 1000 sein.'],
    ['Hebel', '1001', 'Der Hebel muss eine ganze Zahl von 1 bis 1000 sein.'],
    ['Kontowährung', 'EU', 'Die Kontowährung besteht aus genau drei Großbuchstaben'],
    ['Kommission je Lot und Seite', '-1', 'Die Kommission muss eine Zahl von 0 bis 100000 sein.'],
  ])('does not save with %s "%s"', async (label, typed, message) => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    const field = screen.getByLabelText(label);
    await user.clear(field);
    if (typed !== '') {
      await user.type(field, typed);
    }

    expect(screen.getByTestId('account-invalid')).toHaveTextContent(message);
    expect(screen.getByTestId('account-save')).toBeDisabled();
  });

  it('requires a spread value in points for the fixed spread', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    await user.click(screen.getByTestId('account-spread-fixed'));
    await user.clear(screen.getByTestId('account-spread'));

    expect(screen.getByTestId('account-invalid')).toHaveTextContent('Der feste Spread muss eine Zahl von 0 bis 100000 Punkten sein.');
    expect(screen.getByTestId('account-save')).toBeDisabled();
  });

  it('asks before it deletes and deletes only after the confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    await user.click(screen.getByTestId('account-delete'));
    const dialog = screen.getByTestId('dialog-delete-account');
    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByText('Das Testkonto „Standard-Testkonto“ wird gelöscht. Gespeicherte Backtests behalten ihre Kopie der Werte.')).toBeInTheDocument();
    expect(within(dialog).getByText(/legt pipwerk replay beim nächsten Start/)).toBeInTheDocument();

    await user.click(within(dialog).getByTestId('delete-cancel'));
    expect(backend.callsTo('DELETE', `/api/v1/accounts/${String(DEFAULT_ACCOUNT_JSON.id)}`)).toHaveLength(0);
    expect(screen.getAllByTestId('account-item')).toHaveLength(1);

    await user.click(screen.getByTestId('account-delete'));
    await user.click(within(screen.getByTestId('dialog-delete-account')).getByTestId('delete-ok'));

    await waitFor(() => {
      expect(screen.queryAllByTestId('account-item')).toHaveLength(0);
    });
    expect(backend.callsTo('DELETE', `/api/v1/accounts/${String(DEFAULT_ACCOUNT_JSON.id)}`)).toHaveLength(1);
    // The next step is named again.
    expect(screen.getByTestId('accounts-empty')).toBeInTheDocument();
  });

  it('shows the next account after the shown one is deleted', async () => {
    const user = userEvent.setup();
    backend.accounts.push({ ...DEFAULT_ACCOUNT_JSON, id: '00000000-0000-4000-8000-000000000009', name: 'Zweites', is_default: false });
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    await user.click(screen.getByTestId('account-delete'));
    await user.click(within(screen.getByTestId('dialog-delete-account')).getByTestId('delete-ok'));

    await waitFor(() => {
      expect(screen.getAllByTestId('account-item')).toHaveLength(1);
    });
    expect(await screen.findByDisplayValue('Zweites')).toBeInTheDocument();
  });

  it('shows the reason when saving fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');
    backend.accounts = [];

    await user.type(screen.getByLabelText('Name'), 'x');
    await user.click(screen.getByTestId('account-save'));

    expect(await screen.findByTestId('account-save-error')).toHaveTextContent('Das Testkonto konnte nicht gespeichert werden. Das Gesuchte gibt es nicht (mehr).');
  });

  it('sets the text of the user as text and never as HTML', async () => {
    const user = userEvent.setup();
    const name = '<img src=x onerror=alert(1)>';
    backend.accounts.push({ ...DEFAULT_ACCOUNT_JSON, id: '00000000-0000-4000-8000-000000000008', name, is_default: false });
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    await user.click(screen.getAllByTestId('account-item')[1] as HTMLElement);

    expect(document.querySelector('img')).toBeNull();
    expect(screen.getAllByText(name).length).toBeGreaterThan(0);
  });

  it('gives every field an explanation that the mouse and the keyboard reach', async () => {
    renderWithProviders(<AccountsView />);
    await screen.findAllByTestId('account-item');

    const fields = document.querySelectorAll('[data-testid^="field-"]');
    expect(fields.length).toBe(6);
    for (const field of fields) {
      const label = field.querySelector('.field-label');
      const info = field.querySelector<HTMLElement>('.info');
      expect(label?.getAttribute('data-tip')?.trim()).toBeTruthy();
      expect(info?.getAttribute('data-tip')).toBe(label?.getAttribute('data-tip'));
      // The keyboard reaches the explanation: the symbol is in the tab order.
      expect(info?.tabIndex).toBe(0);
    }
  });
});
