import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';

import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AboutDialog } from './AboutDialog';
import { renderWithProviders } from './test-utils';

const state = vi.hoisted(() => ({
  revision: null as { commit: string; committedAt: string } | null,
  repository: null as string | null,
}));

// The dialog reads these two values at render time; the tests replace them.
vi.mock('./buildRevision', () => ({
  get buildRevision() {
    return state.revision;
  },
}));
vi.mock('./repository', () => ({
  get repositoryUrl() {
    return state.repository;
  },
}));

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const REPOSITORY = 'https://github.com/macodix/pipwerk';
const LICENSE = readFileSync(resolve(import.meta.dirname, '../../../../LICENSE'), 'utf-8');

const originalTimeZone = process.env.TZ;

beforeEach(() => {
  process.env.TZ = 'Europe/Berlin';
  state.revision = { commit: COMMIT, committedAt: '2026-10-09T14:52:03+02:00' };
  state.repository = REPOSITORY;
});

afterEach(() => {
  if (originalTimeZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimeZone;
  }
});

function renderDialog(language: 'de' | 'en' = 'de', onClose = vi.fn()) {
  const view = renderWithProviders(<AboutDialog open onClose={onClose} />, language);
  return { ...view, onClose };
}

describe('AboutDialog content', () => {
  it('shows heading, name, labels and the close button in German', () => {
    renderDialog('de');

    const dialog = screen.getByRole('dialog', { name: 'Über pipwerk Studio' });
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Über pipwerk Studio' })).toBeInTheDocument();
    expect(within(dialog).getByText('pipwerk Studio')).toBeInTheDocument();
    expect(within(dialog).getByText('Stand')).toBeInTheDocument();
    expect(within(dialog).getByText('Lizenz')).toBeInTheDocument();
    expect(within(dialog).getByText('Quelltext')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Schließen' })).toBeInTheDocument();
  });

  it('shows heading, name, labels and the close button in English', () => {
    renderDialog('en');

    const dialog = screen.getByRole('dialog', { name: 'About pipwerk Studio' });
    expect(within(dialog).getByRole('heading', { level: 2, name: 'About pipwerk Studio' })).toBeInTheDocument();
    expect(within(dialog).getByText('pipwerk Studio')).toBeInTheDocument();
    expect(within(dialog).getByText('Revision')).toBeInTheDocument();
    expect(within(dialog).getByText('License')).toBeInTheDocument();
    expect(within(dialog).getByText('Source code')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('does not translate the name', () => {
    const { i18n } = renderDialog('de');
    expect(screen.getByText('pipwerk Studio')).toBeInTheDocument();

    act(() => {
      void i18n.changeLanguage('en');
    });

    expect(screen.getByText('pipwerk Studio')).toBeInTheDocument();
  });

  it('is not available to the accessibility tree while it is closed', () => {
    renderWithProviders(<AboutDialog open={false} onClose={vi.fn()} />, 'de');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { hidden: true })).toBeInTheDocument();
  });
});

describe('AboutDialog revision', () => {
  it('shows commit and date in German in the local time zone', () => {
    renderDialog('de');

    expect(screen.getByText(`${COMMIT} vom 09.10.2026, 14:52 Uhr`)).toBeInTheDocument();
  });

  it('shows commit and date in English in the local time zone', () => {
    renderDialog('en');

    expect(screen.getByText(`${COMMIT} from 2026-10-09 14:52`)).toBeInTheDocument();
  });

  it('shows the full commit with 40 characters', () => {
    renderDialog('de');

    expect(screen.getByText(new RegExp(`^${COMMIT} vom`))).toBeInTheDocument();
    expect(COMMIT).toHaveLength(40);
  });

  it('converts the date to a fixed time zone and pads with zeros', () => {
    process.env.TZ = 'UTC';
    state.revision = { commit: COMMIT, committedAt: '2026-01-02T03:04:05+00:00' };
    renderDialog('de');

    expect(screen.getByText(`${COMMIT} vom 02.01.2026, 03:04 Uhr`)).toBeInTheDocument();
  });

  it('lets the time zone change the day', () => {
    process.env.TZ = 'Asia/Kolkata';
    state.revision = { commit: COMMIT, committedAt: '2026-10-09T22:00:00+00:00' };
    renderDialog('en');

    expect(screen.getByText(`${COMMIT} from 2026-10-10 03:30`)).toBeInTheDocument();
  });

  it('shows unknown in German if there is no revision', () => {
    state.revision = null;
    renderDialog('de');

    const revision = screen.getByText('Stand').nextElementSibling;
    expect(revision).toHaveTextContent('unbekannt');
  });

  it('shows unknown in English if there is no revision', () => {
    state.revision = null;
    renderDialog('en');

    const revision = screen.getByText('Revision').nextElementSibling;
    expect(revision).toHaveTextContent('unknown');
  });
});

describe('AboutDialog language change', () => {
  it('switches the texts of the open dialog at once and keeps license, name and address', () => {
    const { i18n } = renderDialog('de');
    const licenseBefore = screen.getByText(/GNU GENERAL PUBLIC LICENSE/).textContent;
    const link = screen.getByRole('link', { name: REPOSITORY });

    act(() => {
      void i18n.changeLanguage('en');
    });

    const dialog = screen.getByRole('dialog', { name: 'About pipwerk Studio' });
    expect(dialog).toHaveAttribute('open');
    expect(within(dialog).getByText('Revision')).toBeInTheDocument();
    expect(within(dialog).getByText('License')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(dialog).getByText(`${COMMIT} from 2026-10-09 14:52`)).toBeInTheDocument();
    expect(within(dialog).getByText('pipwerk Studio')).toBeInTheDocument();
    expect(within(dialog).getByText('GNU General Public License, Version 3')).toBeInTheDocument();
    expect(screen.getByText(/GNU GENERAL PUBLIC LICENSE/).textContent).toBe(licenseBefore);
    expect(screen.getByRole('link', { name: REPOSITORY })).toBe(link);
  });

  it('keeps the focus where it is', () => {
    const { i18n } = renderDialog('de');
    expect(screen.getByRole('button', { name: 'Schließen' })).toHaveFocus();

    act(() => {
      void i18n.changeLanguage('en');
    });

    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });
});

describe('AboutDialog license', () => {
  it('shows the name of the license with lang="en"', () => {
    renderDialog('de');

    const name = screen.getByText('GNU General Public License, Version 3');
    expect(name).toHaveAttribute('lang', 'en');
  });

  it('shows the text character by character like LICENSE, with lang="en"', () => {
    renderDialog('de');

    const text = screen.getByText(/GNU GENERAL PUBLIC LICENSE/);
    expect(text.tagName).toBe('PRE');
    expect(text).toHaveAttribute('lang', 'en');
    expect(text.textContent).toBe(LICENSE);
  });

  it('shows the same name and text in English', () => {
    renderDialog('en');

    expect(screen.getByText('GNU General Public License, Version 3')).toBeInTheDocument();
    expect(screen.getByText(/GNU GENERAL PUBLIC LICENSE/).textContent).toBe(LICENSE);
  });

  it('makes the license field reachable with the keyboard', async () => {
    const user = userEvent.setup();
    renderDialog('de');
    const text = screen.getByText(/GNU GENERAL PUBLIC LICENSE/);
    expect(text).toHaveAttribute('tabindex', '0');
    (document.activeElement as HTMLElement).blur();

    await user.tab();

    expect(text).toHaveFocus();
  });
});

describe('AboutDialog repository', () => {
  it('shows the address as a link that opens a new tab', () => {
    renderDialog('de');

    const link = screen.getByRole('link', { name: REPOSITORY });
    expect(link).toHaveAttribute('href', REPOSITORY);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent(REPOSITORY);
  });

  it('shows unknown without a link if the address is not valid', () => {
    state.repository = null;
    renderDialog('de');

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Quelltext').nextElementSibling).toHaveTextContent('unbekannt');
  });

  it('shows unknown in English without a link if the address is not valid', () => {
    state.repository = null;
    renderDialog('en');

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Source code').nextElementSibling).toHaveTextContent('unknown');
  });
});

describe('AboutDialog opening and closing', () => {
  it('puts the focus on the close button when it opens', () => {
    renderDialog('de');

    expect(screen.getByRole('button', { name: 'Schließen' })).toHaveFocus();
  });

  it('closes with the close button and calls onClose once', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog('de');

    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not prevent the event cancel and ends in the event close', () => {
    const { onClose } = renderDialog('de');
    const dialog = screen.getByRole('dialog');

    // The browser fires `cancel` for Escape and then closes the dialog.
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(false);
    (dialog as HTMLDialogElement).close();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not set the attribute closedby', () => {
    renderDialog('de');

    expect(screen.getByRole('dialog')).not.toHaveAttribute('closedby');
  });

  it('opens and closes again when the property open changes', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
            }}
          >
            open it
          </button>
          <AboutDialog
            open={open}
            onClose={() => {
              setOpen(false);
            }}
          />
        </>
      );
    }
    renderWithProviders(<Harness />, 'de');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'open it' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('open');

    await user.click(screen.getByRole('button', { name: 'Schließen' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('AboutDialog focus', () => {
  it('goes from the last element to the first with Tab', async () => {
    const user = userEvent.setup();
    renderDialog('de');
    const button = screen.getByRole('button', { name: 'Schließen' });
    expect(button).toHaveFocus();

    await user.tab();

    expect(screen.getByText(/GNU GENERAL PUBLIC LICENSE/)).toHaveFocus();
  });

  it('goes from the first element to the last with Shift+Tab', async () => {
    const user = userEvent.setup();
    renderDialog('de');
    screen.getByText(/GNU GENERAL PUBLIC LICENSE/).focus();

    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'Schließen' })).toHaveFocus();
  });

  it('moves through the elements in order and keeps the focus in the dialog', async () => {
    const user = userEvent.setup();
    renderDialog('de');
    const dialog = screen.getByRole('dialog');

    for (let step = 0; step < 7; step += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(document.body);
    }
    for (let step = 0; step < 7; step += 1) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
      expect(document.activeElement).not.toBe(document.body);
    }
  });

  it('goes through text, link and button with Tab', async () => {
    const user = userEvent.setup();
    renderDialog('de');
    screen.getByText(/GNU GENERAL PUBLIC LICENSE/).focus();

    await user.tab();
    expect(screen.getByRole('link', { name: REPOSITORY })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Schließen' })).toHaveFocus();
  });

  it('leads the focus into the dialog if it is on the document or on the dialog itself', async () => {
    const user = userEvent.setup();
    renderDialog('de');
    const dialog = screen.getByRole('dialog');

    (document.activeElement as HTMLElement).blur();
    await user.tab();
    expect(screen.getByText(/GNU GENERAL PUBLIC LICENSE/)).toHaveFocus();

    dialog.tabIndex = -1;
    dialog.focus();
    expect(dialog).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Schließen' })).toHaveFocus();
  });

  it('does not use Tab after the dialog is closed', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog('de');
    await user.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });

    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});

describe('AboutDialog network', () => {
  it('does not call fetch when it opens', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    renderDialog('de');

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
