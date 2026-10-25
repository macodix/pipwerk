// The view "Einstellungen" (specification 5.7): the four settings with name, value and explanation,
// saving all four together, the refusal of a directory with its reason per field, reopening.
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { App } from './App';
import { SettingsView } from './SettingsView';
import { FakeBackend, fileSettingsJson, json, renderWithProviders } from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

function puts() {
  return backend.callsTo('PUT', '/api/replay/settings/files');
}

function tipOf(testid: string): string {
  return screen.getByTestId(testid).querySelector('[data-tip]')?.getAttribute('data-tip') ?? '';
}

async function shown(): Promise<void> {
  await screen.findByTestId('settings-form');
}

describe('SettingsView, showing the settings', () => {
  it('shows the four settings with name, value and what applies', async () => {
    renderWithProviders(<SettingsView />);
    await shown();

    expect(screen.getByRole('heading', { name: 'Einstellungen' })).toBeInTheDocument();
    expect(screen.getByLabelText('Importierte Dateien behalten')).not.toBeChecked();
    expect(screen.getByLabelText('Ablageverzeichnis')).toHaveValue('/data/storage');
    expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('/data/import');
    expect(screen.getByLabelText('Exportverzeichnis')).toHaveValue('/data/export');
    // Nothing is stored: the default of the operating system is shown and said to apply.
    for (const key of ['storage', 'import', 'export']) {
      expect(screen.getByTestId(`settings-${key}-origin`)).toHaveTextContent('Es gilt der Standard des Betriebssystems.');
    }
    expect(screen.getByTestId('settings-save')).toBeDisabled();
    expect(screen.getByTestId('settings-discard')).toBeDisabled();
  });

  it('shows stored values as stored', async () => {
    backend.fileSettings = fileSettingsJson({
      keep_imported_files: true,
      import_directory: { path: '/home/trader/files', is_default: false },
    });
    renderWithProviders(<SettingsView />);
    await shown();

    expect(screen.getByLabelText('Importierte Dateien behalten')).toBeChecked();
    expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('/home/trader/files');
    expect(screen.getByTestId('settings-import-origin')).toHaveTextContent('Gespeicherter Pfad.');
    expect(screen.getByTestId('settings-storage-origin')).toHaveTextContent('Es gilt der Standard des Betriebssystems.');
  });

  it('says so if the default cannot be determined', async () => {
    backend.fileSettings = fileSettingsJson({ export_directory: { path: null, is_default: true } });
    renderWithProviders(<SettingsView />);
    await shown();

    expect(screen.getByLabelText('Exportverzeichnis')).toHaveValue('');
    expect(screen.getByTestId('settings-export-origin')).toHaveTextContent('kein Pfad bestimmen');
  });

  it('explains each setting at its name and says that the export directory takes effect with the first export', async () => {
    renderWithProviders(<SettingsView />);
    await shown();

    expect(tipOf('field-settings-storage')).toContain('Ein Wechsel verschiebt keine Dateien');
    expect(tipOf('field-settings-storage')).toContain('entfernt behaltene Dateien nie');
    expect(tipOf('field-settings-import')).toContain('liest dort nur');
    expect(tipOf('field-settings-import')).toContain('kopiert nichts');
    expect(tipOf('field-settings-export')).toContain('wirkt mit dem ersten Export');
    expect(screen.getByTestId('field-settings-export')).toHaveTextContent('Die Einstellung wirkt mit dem ersten Export.');
    expect(screen.getByTestId('field-settings-keep').querySelector('[data-tip]')?.getAttribute('data-tip')).toContain(
      'Voreinstellung für das Kästchen „Dateien behalten“',
    );
    // Every field has a symbol for the keyboard.
    for (const testid of ['field-settings-keep', 'field-settings-storage', 'field-settings-import', 'field-settings-export']) {
      expect(screen.getByTestId(testid).querySelector('.info')).toHaveAttribute('tabindex', '0');
    }
  });

  it('is in English', async () => {
    renderWithProviders(<SettingsView />, 'en');
    await shown();

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Keep imported files')).toBeInTheDocument();
    expect(screen.getByLabelText('Storage directory')).toBeInTheDocument();
    expect(screen.getByLabelText('Import directory')).toBeInTheDocument();
    expect(screen.getByLabelText('Export directory')).toBeInTheDocument();
    expect(screen.getByTestId('field-settings-export')).toHaveTextContent('The setting takes effect with the first export.');
    expect(screen.getByTestId('settings-import-origin')).toHaveTextContent('The default of the operating system applies.');
  });

  it('shows the error and tries again when the settings cannot be read', async () => {
    const user = userEvent.setup();
    backend.fileSettingsAnswer = () => json(503, { detail: 'A stored pipwerk replay directory is invalid.' });
    renderWithProviders(<SettingsView />);

    const error = await screen.findByTestId('settings-load-error');
    expect(error).toHaveTextContent('Die Einstellungen konnten nicht gelesen werden.');
    expect(screen.queryByTestId('settings-form')).not.toBeInTheDocument();

    backend.fileSettingsAnswer = null;
    await user.click(screen.getByTestId('settings-retry'));

    await shown();
  });
});

describe('SettingsView, saving', () => {
  it('saves all four values together and shows them stored; reopening shows the stored values', async () => {
    const user = userEvent.setup();
    const first = renderWithProviders(<SettingsView />);
    await shown();

    await user.click(screen.getByLabelText('Importierte Dateien behalten'));
    await user.clear(screen.getByLabelText('Ablageverzeichnis'));
    await user.type(screen.getByLabelText('Ablageverzeichnis'), '/srv/keep');
    await user.clear(screen.getByLabelText('Importverzeichnis'));
    await user.type(screen.getByLabelText('Importverzeichnis'), '/srv/in');
    expect(screen.getByTestId('settings-unsaved')).toHaveTextContent('Ungespeicherte Änderungen.');
    expect(screen.getByTestId('settings-save')).toBeEnabled();

    await user.click(screen.getByTestId('settings-save'));

    expect(await screen.findByTestId('settings-saved')).toHaveTextContent('Die Einstellungen sind gespeichert.');
    expect(puts()).toHaveLength(1);
    // All four fields are sent; the export directory still shows the default, so it goes as `null`.
    expect(puts()[0]?.body).toEqual({
      keep_imported_files: true,
      storage_directory: '/srv/keep',
      import_directory: '/srv/in',
      export_directory: null,
    });
    expect(screen.getByTestId('settings-storage-origin')).toHaveTextContent('Gespeicherter Pfad.');
    expect(screen.getByTestId('settings-export-origin')).toHaveTextContent('Es gilt der Standard des Betriebssystems.');
    expect(screen.getByTestId('settings-save')).toBeDisabled();

    // Reopening (a new view, a new query client) shows what the backend holds.
    first.unmount();
    renderWithProviders(<SettingsView />);
    await shown();
    expect(screen.getByLabelText('Importierte Dateien behalten')).toBeChecked();
    expect(screen.getByLabelText('Ablageverzeichnis')).toHaveValue('/srv/keep');
    expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('/srv/in');
    expect(screen.getByLabelText('Exportverzeichnis')).toHaveValue('/data/export');
    expect(screen.queryByTestId('settings-saved')).not.toBeInTheDocument();
  });

  it('sends a stored path as it is and `null` for a field that was emptied', async () => {
    backend.fileSettings = fileSettingsJson({ storage_directory: { path: '/srv/keep', is_default: false } });
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);
    await shown();

    await user.clear(screen.getByLabelText('Importverzeichnis'));
    await user.click(screen.getByLabelText('Importierte Dateien behalten'));
    await user.click(screen.getByTestId('settings-save'));

    await screen.findByTestId('settings-saved');
    expect(puts()[0]?.body).toEqual({
      keep_imported_files: true,
      storage_directory: '/srv/keep',
      import_directory: null,
      export_directory: null,
    });
    // The emptied field shows the default again.
    expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('/data/import');
  });

  it('sends storage and import directory as typed if they are the same or one lies in the other (no check in the view)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);
    await shown();

    await user.clear(screen.getByLabelText('Ablageverzeichnis'));
    await user.type(screen.getByLabelText('Ablageverzeichnis'), '/srv/files');
    await user.clear(screen.getByLabelText('Importverzeichnis'));
    await user.type(screen.getByLabelText('Importverzeichnis'), '/srv/files');
    expect(screen.getByTestId('settings-save')).toBeEnabled();
    await user.click(screen.getByTestId('settings-save'));

    await screen.findByTestId('settings-saved');
    expect(puts()[0]?.body).toMatchObject({ storage_directory: '/srv/files', import_directory: '/srv/files' });
    expect(screen.queryByTestId('settings-storage-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('settings-import-error')).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Importverzeichnis'));
    await user.type(screen.getByLabelText('Importverzeichnis'), '/srv/files/in');
    await user.click(screen.getByTestId('settings-save'));

    await waitFor(() => {
      expect(puts()).toHaveLength(2);
    });
    expect(puts()[1]?.body).toMatchObject({ storage_directory: '/srv/files', import_directory: '/srv/files/in' });
    expect(await screen.findByTestId('settings-saved')).toBeInTheDocument();
  });

  it('saves only a changed tick', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);
    await shown();

    await user.click(screen.getByLabelText('Importierte Dateien behalten'));
    await user.click(screen.getByLabelText('Importierte Dateien behalten'));
    expect(screen.getByTestId('settings-save')).toBeDisabled();
    await user.click(screen.getByLabelText('Importierte Dateien behalten'));
    await user.click(screen.getByTestId('settings-save'));

    await screen.findByTestId('settings-saved');
    expect(puts()[0]?.body).toMatchObject({ keep_imported_files: true });
  });

  it('discards the changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);
    await shown();
    await user.type(screen.getByLabelText('Exportverzeichnis'), 'x');

    await user.click(screen.getByTestId('settings-discard'));

    expect(screen.getByLabelText('Exportverzeichnis')).toHaveValue('/data/export');
    expect(puts()).toHaveLength(0);
    expect(screen.queryByTestId('settings-unsaved')).not.toBeInTheDocument();
  });

  it('shows a path of a name that looks like HTML as text', async () => {
    backend.fileSettings = fileSettingsJson({ import_directory: { path: '/x/<img src=x onerror=alert(1)>', is_default: false } });
    renderWithProviders(<SettingsView />);
    await shown();

    expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('/x/<img src=x onerror=alert(1)>');
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('SettingsView, refusal of a directory', () => {
  const REASONS = [
    ['not_absolute', 'Der Pfad ist nicht vollständig.'],
    ['not_a_directory', 'Unter diesem Pfad liegt kein Verzeichnis, sondern etwas anderes.'],
    ['cannot_be_created', 'Das Verzeichnis gibt es nicht, und das Backend konnte es nicht anlegen.'],
    ['not_writable', 'Das Backend darf in dieses Verzeichnis nicht schreiben.'],
    ['not_readable', 'Das Backend darf dieses Verzeichnis nicht lesen.'],
  ] as const;

  it.each(REASONS)('names the reason %s at the field, with the next step, and keeps what was typed', async (reason, text) => {
    const user = userEvent.setup();
    backend.fileSettingsRefusal = { import_directory: reason };
    renderWithProviders(<SettingsView />);
    await shown();
    await user.clear(screen.getByLabelText('Importverzeichnis'));
    await user.type(screen.getByLabelText('Importverzeichnis'), 'relative/dir');
    await user.type(screen.getByLabelText('Exportverzeichnis'), '/y');

    await user.click(screen.getByTestId('settings-save'));

    const error = await screen.findByTestId('settings-import-error');
    expect(error).toHaveTextContent(text);
    expect(error).toHaveTextContent('Nächster Schritt:');
    expect(error).toHaveAttribute('data-reason', reason);
    expect(screen.getByTestId('settings-refused')).toHaveTextContent('Die Einstellungen wurden nicht gespeichert.');
    // The input stays, in the refused field and in the others; nothing counts as saved.
    expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('relative/dir');
    expect(screen.getByLabelText('Exportverzeichnis')).toHaveValue('/data/export/y');
    expect(screen.queryByTestId('settings-saved')).not.toBeInTheDocument();
    expect(screen.getByTestId('settings-save')).toBeEnabled();
    expect(screen.queryByTestId('settings-storage-error')).not.toBeInTheDocument();
  });

  it('names the reason for each refused directory', async () => {
    const user = userEvent.setup();
    backend.fileSettingsRefusal = { storage_directory: 'not_writable', export_directory: 'not_absolute' };
    renderWithProviders(<SettingsView />);
    await shown();
    await user.type(screen.getByLabelText('Ablageverzeichnis'), 'x');

    await user.click(screen.getByTestId('settings-save'));

    expect(await screen.findByTestId('settings-storage-error')).toHaveAttribute('data-reason', 'not_writable');
    expect(screen.getByTestId('settings-export-error')).toHaveAttribute('data-reason', 'not_absolute');
    expect(screen.queryByTestId('settings-import-error')).not.toBeInTheDocument();
  });

  it('takes the reason away when the field is changed, and saves after the correction', async () => {
    const user = userEvent.setup();
    backend.fileSettingsRefusal = { import_directory: 'not_absolute' };
    renderWithProviders(<SettingsView />);
    await shown();
    await user.clear(screen.getByLabelText('Importverzeichnis'));
    await user.type(screen.getByLabelText('Importverzeichnis'), 'rel');
    await user.click(screen.getByTestId('settings-save'));
    await screen.findByTestId('settings-import-error');

    await user.clear(screen.getByLabelText('Importverzeichnis'));
    await user.type(screen.getByLabelText('Importverzeichnis'), '/abs');
    expect(screen.queryByTestId('settings-import-error')).not.toBeInTheDocument();
    backend.fileSettingsRefusal = null;
    await user.click(screen.getByTestId('settings-save'));

    expect(await screen.findByTestId('settings-saved')).toBeInTheDocument();
    expect(puts()).toHaveLength(2);
    expect(screen.queryByTestId('settings-refused')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('/abs');
  });

  it('shows the reasons in English', async () => {
    const user = userEvent.setup();
    backend.fileSettingsRefusal = { storage_directory: 'cannot_be_created' };
    renderWithProviders(<SettingsView />, 'en');
    await shown();
    await user.type(screen.getByLabelText('Storage directory'), 'x');

    await user.click(screen.getByTestId('settings-save'));

    expect(await screen.findByTestId('settings-storage-error')).toHaveTextContent(
      'The directory does not exist, and the backend could not create it. Next step:',
    );
    expect(screen.getByTestId('settings-refused')).toHaveTextContent('The settings were not saved.');
  });

  it('shows another failure with the general text and keeps what was typed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);
    await shown();
    await user.type(screen.getByLabelText('Exportverzeichnis'), 'x');
    backend.fileSettingsAnswer = () => json(503, { detail: 'A stored pipwerk replay directory is invalid.' });

    await user.click(screen.getByTestId('settings-save'));

    expect(await screen.findByTestId('settings-error')).toHaveTextContent('Die Einstellungen konnten nicht gespeichert werden.');
    expect(screen.queryByTestId('settings-refused')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Exportverzeichnis')).toHaveValue('/data/exportx');
  });
});

describe('SettingsView in the app', () => {
  it('is reached by the menu entry "Einstellungen" and reads the settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByTestId('data');

    await user.click(screen.getByTestId('menu-settings'));

    await shown();
    await waitFor(() => {
      expect(screen.getByLabelText('Importverzeichnis')).toHaveValue('/data/import');
    });
  });

  it('is reached from the dialog "Datei importieren" when the import directory is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await user.click(await screen.findByTestId('import-open'));
    await user.click(await screen.findByTestId('import-choose-directory'));
    await user.click(await screen.findByTestId('picker-settings'));

    await shown();
    expect(screen.queryByTestId('dialog-import')).not.toBeInTheDocument();
    expect(screen.getByTestId('menu-settings')).toHaveAttribute('aria-current', 'page');
  });

  it('stores nothing in the browser', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />);
    await shown();
    await user.type(screen.getByLabelText('Exportverzeichnis'), 'x');
    await user.click(screen.getByTestId('settings-save'));
    await screen.findByTestId('settings-saved');

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
