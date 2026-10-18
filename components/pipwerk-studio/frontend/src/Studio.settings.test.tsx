import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { elementNodes, menu, openSettings, openStored, waitForReady } from './testing/actions';
import { mockBackend, type MockBackendOptions } from './testing/backend';
import { loadTestcase } from './testing/fixtures';
import { renderWithProviders } from './test-utils';

const stored = loadTestcase('str-03');

async function start(options: MockBackendOptions = {}) {
  const user = userEvent.setup();
  const backend = mockBackend(options);
  renderWithProviders(<App />);
  await waitForReady();
  return { user, backend };
}

async function changeDirectory(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement, path: string) {
  const input = await within(dialog).findByLabelText('Verzeichnis (absoluter Pfad)');
  await user.clear(input);
  await user.type(input, path);
  await user.click(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' }));
}

describe('the settings', () => {
  it('show the language and the object directory', async () => {
    const { user } = await start({ directory: { path: '/var/lib/objekte', is_default: true } });

    const dialog = await openSettings(user);

    expect(within(dialog).getByLabelText('Sprache')).toHaveValue('de');
    expect(await within(dialog).findByLabelText('Verzeichnis (absoluter Pfad)')).toHaveValue('/var/lib/objekte');
    expect(within(dialog).getByText('Es gilt das Standardverzeichnis.')).toBeInTheDocument();
  });

  it('tell that no directory is set if none can be determined', async () => {
    const { user } = await start({ directory: { path: null, is_default: true } });

    const dialog = await openSettings(user);

    expect(await within(dialog).findByText('Es ist kein Objektverzeichnis festgelegt und es lässt sich kein Standard bestimmen.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Verzeichnis (absoluter Pfad)')).toHaveValue('');
    expect(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' })).toBeDisabled();
  });

  it('do not change the directory without a change of the path', async () => {
    const { user } = await start();
    const dialog = await openSettings(user);

    expect(await within(dialog).findByRole('button', { name: 'Verzeichnis ändern' })).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Verzeichnis (absoluter Pfad)'), '2');
    expect(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' })).toBeEnabled();
  });

  it('ask "Dateien verschieben?" and move the files on "Ja"', async () => {
    const { user, backend } = await start();
    const dialog = await openSettings(user);

    await changeDirectory(user, dialog, '/neu/objekte');
    expect(within(dialog).getByText('Dateien verschieben?')).toBeInTheDocument();
    expect(backend.requests('PUT', /object-directory/)).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Ja, Dateien verschieben' }));

    expect(await within(dialog).findByText('Das Objektverzeichnis wurde geändert.')).toBeInTheDocument();
    expect(backend.requests('PUT', /object-directory/)[0]?.body).toEqual({ path: '/neu/objekte', move: true });
    expect(within(dialog).getByText('Das Verzeichnis wurde festgelegt.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Verzeichnis (absoluter Pfad)')).toHaveValue('/neu/objekte');
  });

  describe('after a change of the directory', () => {
    const lists = /\/api\/v1\/(indicators|trends|rules|rulesets)$/;

    it.each([
      ['with moving', 'Ja, Dateien verschieben'],
      ['without moving', 'Nein, nur das Verzeichnis ändern'],
    ])('ask again for the lists of the stored templates %s', async (_name, button) => {
      const { user, backend } = await start();
      await waitFor(() => {
        expect(backend.requests('GET', lists)).toHaveLength(4);
      });
      const dialog = await openSettings(user);

      await changeDirectory(user, dialog, '/neu/objekte');
      await user.click(within(dialog).getByRole('button', { name: button }));
      await within(dialog).findByText('Das Objektverzeichnis wurde geändert.');

      await waitFor(() => {
        expect(backend.requests('GET', lists)).toHaveLength(8);
      });
    });

    it('ask again for the list of "Öffnen"', async () => {
      const { user, backend } = await start({ strategies: [stored] });
      const dialog = await openSettings(user);
      await changeDirectory(user, dialog, '/neu/objekte');
      await user.click(within(dialog).getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' }));
      await within(dialog).findByText('Das Objektverzeichnis wurde geändert.');
      await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));

      await menu(user, 'Öffnen');

      await screen.findByRole('button', { name: 'EMA-Trendfolge' });
      expect(backend.requests('GET', /\/api\/v1\/strategies$/).length).toBeGreaterThanOrEqual(1);
    });

    it('do not ask again if the change was cancelled or failed (counter-check)', async () => {
      const { user, backend } = await start({ fail: { directoryWrite: { status: 409, body: { detail: 'conflict' } } } });
      await waitFor(() => {
        expect(backend.requests('GET', lists)).toHaveLength(4);
      });
      const dialog = await openSettings(user);

      await changeDirectory(user, dialog, '/neu/objekte');
      await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));
      await user.click(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' }));
      await user.click(within(dialog).getByRole('button', { name: 'Ja, Dateien verschieben' }));
      await within(dialog).findByRole('alert');

      expect(backend.requests('GET', lists)).toHaveLength(4);
    });
  });

  it('change only the setting on "Nein"', async () => {
    const { user, backend } = await start();
    const dialog = await openSettings(user);

    await changeDirectory(user, dialog, '/neu/objekte');
    await user.click(within(dialog).getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' }));

    await within(dialog).findByText('Das Objektverzeichnis wurde geändert.');
    expect(backend.requests('PUT', /object-directory/)[0]?.body).toEqual({ path: '/neu/objekte', move: false });
  });

  it('change nothing on "Abbrechen" and keep the typed path', async () => {
    const { user, backend } = await start();
    const dialog = await openSettings(user);

    await changeDirectory(user, dialog, '/neu/objekte');
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    expect(within(dialog).queryByText('Dateien verschieben?')).toBeNull();
    expect(backend.requests('PUT', /object-directory/)).toHaveLength(0);
    expect(within(dialog).getByLabelText('Verzeichnis (absoluter Pfad)')).toHaveValue('/neu/objekte');
    expect(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' })).toBeEnabled();
  });

  it.each([
    [
      'a conflict while moving',
      { status: 409, body: { detail: 'The new object directory already contains files with the same names. Nothing was moved.' } },
      'Das Backend hat die Anfrage mit dem Status 409 abgelehnt.',
      'The new object directory already contains files with the same names. Nothing was moved.',
    ],
    [
      'a path that is not absolute',
      { status: 422, body: { detail: 'The object directory must be an absolute path.' } },
      'Das Backend hat die Anfrage mit dem Status 422 abgelehnt.',
      'The object directory must be an absolute path.',
    ],
    [
      'a directory that cannot be created',
      { status: 500, body: { detail: 'The new object directory could not be created. Nothing was moved and the object directory is unchanged.' } },
      'Das Backend hat die Anfrage mit dem Status 500 abgelehnt.',
      'The new object directory could not be created. Nothing was moved and the object directory is unchanged.',
    ],
  ])('show the cause in the dialog for %s', async (_name, answer, summary, detail) => {
    const { user } = await start({ fail: { directoryWrite: answer } });
    const dialog = await openSettings(user);

    await changeDirectory(user, dialog, 'relativ');
    await user.click(within(dialog).getByRole('button', { name: 'Ja, Dateien verschieben' }));

    const alert = await within(dialog).findByRole('alert');
    expect(within(alert).getByText('Das Objektverzeichnis konnte nicht geändert werden.')).toBeInTheDocument();
    expect(within(alert).getByText(summary)).toBeInTheDocument();
    expect(within(alert).getByText(detail)).toBeInTheDocument();
    // The dialog stays open and the old directory is still the shown one.
    expect(within(dialog).getByRole('button', { name: 'Verzeichnis ändern' })).toBeEnabled();
  });

  it('name both directories and the files if bringing the files back failed too', async () => {
    const body = {
      detail: 'Moving the object files failed and some files could not be brought back. The object directory is unchanged.',
      source_directory: '/alt',
      target_directory: '/neu',
      files: ['aaaa.strategy.json', 'bbbb.rule.json'],
    };
    const { user } = await start({ fail: { directoryWrite: { status: 500, body } } });
    const dialog = await openSettings(user);

    await changeDirectory(user, dialog, '/neu');
    await user.click(within(dialog).getByRole('button', { name: 'Ja, Dateien verschieben' }));

    const alert = await within(dialog).findByRole('alert');
    expect(within(alert).getByText(body.detail)).toBeInTheDocument();
    expect(within(alert).getByText('Altes Verzeichnis: /alt')).toBeInTheDocument();
    expect(within(alert).getByText(/Neues Verzeichnis.*: \/neu/)).toBeInTheDocument();
    expect(within(alert).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['aaaa.strategy.json', 'bbbb.rule.json']);
  });

  it('say that the backend cannot be reached', async () => {
    const { user } = await start({ fail: { directoryWrite: 'network-error' } });
    const dialog = await openSettings(user);

    await changeDirectory(user, dialog, '/neu');
    await user.click(within(dialog).getByRole('button', { name: 'Nein, nur das Verzeichnis ändern' }));

    expect(await within(dialog).findByText('Das Backend ist nicht erreichbar.')).toBeInTheDocument();
  });

  it('show an error when the directory cannot be read', async () => {
    const { user } = await start({
      fail: { directoryRead: { status: 503, body: { detail: 'The stored pipwerk Studio object directory is invalid.' } } },
    });

    const dialog = await openSettings(user);

    const alert = await within(dialog).findByRole('alert');
    expect(within(alert).getByText('Das Objektverzeichnis konnte nicht gelesen werden.')).toBeInTheDocument();
    expect(within(alert).getByText('The stored pipwerk Studio object directory is invalid.')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Verzeichnis (absoluter Pfad)')).toBeNull();
  });

  it('leave an open strategy open and unchanged (specification 4.1)', async () => {
    const { user, backend } = await start({ strategies: [stored] });
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length);
    });

    const dialog = await openSettings(user);
    await changeDirectory(user, dialog, '/neu');
    await user.click(within(dialog).getByRole('button', { name: 'Ja, Dateien verschieben' }));
    await within(dialog).findByText('Das Objektverzeichnis wurde geändert.');
    await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));

    expect(elementNodes()).toHaveLength(stored.elements.length);
    // Nothing has changed: the next close does not ask. The next save goes to the same strategy.
    await menu(user, 'Speichern');
    await waitFor(() => {
      expect(backend.requests('PUT', /strategies\/.+/)).toHaveLength(1);
    });
    await menu(user, 'Schließen');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('close with Escape', async () => {
    const { user } = await start();
    const dialog = await openSettings(user);

    dialog.dispatchEvent(new Event('close'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    void user;
  });
});
