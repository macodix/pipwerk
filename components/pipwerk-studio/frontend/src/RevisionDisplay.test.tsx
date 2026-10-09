import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { RevisionDisplay } from './RevisionDisplay';
import { mockFetchRoutes, mockFetchResponse, renderWithProviders } from './test-utils';

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const KNOWN = { revision: '0123456', commit: COMMIT, committed_at: '2026-10-09T14:52:03+02:00' };
const NO_DATE = { ...KNOWN, committed_at: null };
const UNKNOWN = { revision: null, commit: null, committed_at: null };

// The tooltip is shown in the local time zone of the browser; the tests fix it.
const originalTimeZone = process.env.TZ;
function useTimeZone(zone: string): void {
  process.env.TZ = zone;
}

beforeEach(() => {
  useTimeZone('Europe/Berlin');
});

afterEach(() => {
  if (originalTimeZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimeZone;
  }
});

/** The revision display with its tooltip (`title`) and accessible description. */
async function findDisplay(label: string): Promise<HTMLElement> {
  return screen.findByText(label);
}

describe('RevisionDisplay', () => {
  it('shows the revision in German', async () => {
    mockFetchResponse(200, KNOWN);
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(await screen.findByText('Stand: 0123456')).toBeInTheDocument();
  });

  it('shows the revision in English', async () => {
    mockFetchResponse(200, KNOWN);
    renderWithProviders(<RevisionDisplay />, 'en');

    expect(await screen.findByText('Revision: 0123456')).toBeInTheDocument();
  });

  it('shows unknown while the request is running', () => {
    mockFetchRoutes({ revision: 'pending' });
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(screen.getByText('Stand: unbekannt')).toBeInTheDocument();
  });

  it('shows unknown for null', async () => {
    mockFetchResponse(200, UNKNOWN);
    renderWithProviders(<RevisionDisplay />, 'en');

    expect(await screen.findByText('Revision: unknown')).toBeInTheDocument();
  });

  it('shows unknown on an HTTP error', async () => {
    mockFetchResponse(503, { detail: 'unavailable' });
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(await screen.findByText('Stand: unbekannt')).toBeInTheDocument();
  });

  it('shows unknown on a network error', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('network error')));
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(await screen.findByText('Stand: unbekannt')).toBeInTheDocument();
  });

  it.each([
    { revision: 'abc123' },
    { revision: 'abc12345' },
    { revision: 'ABC1234' },
    { revision: 'xyz1234' },
    { revision: 1234567 },
    { revision: '0123456' },
    { revision: '0123456', commit: COMMIT },
    { ...KNOWN, extra: true },
    { revision: null, commit: null },
    { ...KNOWN, commit: COMMIT.slice(0, 39) },
    { ...KNOWN, commit: COMMIT + '0' },
    { ...KNOWN, commit: COMMIT.toUpperCase() },
    { ...KNOWN, commit: 1 },
    { ...KNOWN, revision: 'abcdef0' },
    { ...KNOWN, revision: null },
    { ...KNOWN, commit: null },
    { ...UNKNOWN, committed_at: '2026-10-09T14:52:03+02:00' },
    { ...KNOWN, committed_at: '2026-10-09 14:52:03' },
    { ...KNOWN, committed_at: '2026-10-09T14:52:03' },
    { ...KNOWN, committed_at: '2026-10-09T14:52:03+0200' },
    { ...KNOWN, committed_at: '2026-10-09' },
    { ...KNOWN, committed_at: '2026-13-45T25:61:61+02:00' },
    { ...KNOWN, committed_at: 1760000000 },
    {},
    [],
    null,
    '0123456',
  ])('shows unknown without tooltip for the invalid response %j', async (body) => {
    mockFetchResponse(200, body);
    renderWithProviders(<RevisionDisplay />, 'en');

    // Let the request settle; the invalid answer must not change the display.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const display = screen.getByText('Revision: unknown');
    expect(display).toBeInTheDocument();
    expect(display).not.toHaveAttribute('title');
    expect(display).not.toHaveAttribute('aria-describedby');
    expect(document.querySelector('[hidden]')).toBeNull();
  });
});

describe('RevisionDisplay tooltip', () => {
  it('shows commit and date in German', async () => {
    mockFetchResponse(200, KNOWN);
    renderWithProviders(<RevisionDisplay />, 'de');

    const display = await findDisplay('Stand: 0123456');
    expect(display).toHaveAttribute('title', `Commit ${COMMIT} vom 09.10.2026 14:52`);
  });

  it('shows commit and date in English', async () => {
    mockFetchResponse(200, KNOWN);
    renderWithProviders(<RevisionDisplay />, 'en');

    const display = await findDisplay('Revision: 0123456');
    expect(display).toHaveAttribute('title', `Commit ${COMMIT} from 2026-10-09 14:52`);
  });

  it('offers the same text as accessible description', async () => {
    mockFetchResponse(200, KNOWN);
    renderWithProviders(<RevisionDisplay />, 'de');

    const display = await findDisplay('Stand: 0123456');
    expect(display).toHaveAccessibleDescription(`Commit ${COMMIT} vom 09.10.2026 14:52`);
    const id = display.getAttribute('aria-describedby');
    expect(id).not.toBeNull();
    const description = document.getElementById(id ?? '');
    expect(description).toHaveTextContent(`Commit ${COMMIT} vom 09.10.2026 14:52`);
    expect(description).not.toBeVisible();
  });

  it('is not focusable', async () => {
    mockFetchResponse(200, KNOWN);
    renderWithProviders(<RevisionDisplay />, 'de');

    const display = await findDisplay('Stand: 0123456');
    expect(display).not.toHaveAttribute('tabindex');
  });

  it('shows only the commit if the date is not determinable', async () => {
    mockFetchResponse(200, NO_DATE);
    renderWithProviders(<RevisionDisplay />, 'de');

    const display = await findDisplay('Stand: 0123456');
    expect(display).toHaveAttribute('title', `Commit ${COMMIT}`);
    expect(display).toHaveAccessibleDescription(`Commit ${COMMIT}`);
  });

  it('shows only the commit in English if the date is not determinable', async () => {
    mockFetchResponse(200, NO_DATE);
    renderWithProviders(<RevisionDisplay />, 'en');

    const display = await findDisplay('Revision: 0123456');
    expect(display).toHaveAttribute('title', `Commit ${COMMIT}`);
    expect(display).toHaveAccessibleDescription(`Commit ${COMMIT}`);
  });

  it('has no tooltip and no description for null', async () => {
    mockFetchResponse(200, UNKNOWN);
    renderWithProviders(<RevisionDisplay />, 'de');

    const display = await findDisplay('Stand: unbekannt');
    expect(display).not.toHaveAttribute('title');
    expect(display).not.toHaveAttribute('aria-describedby');
    expect(display).toHaveAccessibleDescription('');
  });

  it('has no tooltip while the request is running', () => {
    mockFetchRoutes({ revision: 'pending' });
    renderWithProviders(<RevisionDisplay />, 'de');

    const display = screen.getByText('Stand: unbekannt');
    expect(display).not.toHaveAttribute('title');
    expect(display).not.toHaveAttribute('aria-describedby');
  });

  it('has no tooltip on an error', async () => {
    mockFetchResponse(503, { detail: 'unavailable' });
    renderWithProviders(<RevisionDisplay />, 'en');

    const display = await findDisplay('Revision: unknown');
    expect(display).not.toHaveAttribute('title');
    expect(display).not.toHaveAttribute('aria-describedby');
  });

  it.each([
    ['Europe/Berlin', '09.10.2026 14:52', '2026-10-09 14:52'],
    ['UTC', '09.10.2026 12:52', '2026-10-09 12:52'],
    ['America/Los_Angeles', '09.10.2026 05:52', '2026-10-09 05:52'],
    ['Asia/Kolkata', '09.10.2026 18:22', '2026-10-09 18:22'],
    ['Pacific/Auckland', '10.10.2026 01:52', '2026-10-10 01:52'],
  ])('converts the date to the local time zone %s', async (zone, german, english) => {
    useTimeZone(zone);
    mockFetchResponse(200, KNOWN);
    const { i18n } = renderWithProviders(<RevisionDisplay />, 'de');

    expect(await findDisplay('Stand: 0123456')).toHaveAttribute(
      'title',
      `Commit ${COMMIT} vom ${german}`,
    );
    await i18n.changeLanguage('en');
    expect(await findDisplay('Revision: 0123456')).toHaveAttribute(
      'title',
      `Commit ${COMMIT} from ${english}`,
    );
  });

  it('pads date parts with zeros and uses the 24-hour clock', async () => {
    useTimeZone('UTC');
    mockFetchResponse(200, { ...KNOWN, committed_at: '2026-01-02T00:05:00Z' });
    renderWithProviders(<RevisionDisplay />, 'de');

    expect(await findDisplay('Stand: 0123456')).toHaveAttribute(
      'title',
      `Commit ${COMMIT} vom 02.01.2026 00:05`,
    );
  });
});

describe('RevisionDisplay in the footer', () => {
  it('sits right next to the backend status', async () => {
    mockFetchRoutes({ revision: { status: 200, body: KNOWN } });
    renderWithProviders(<App />, 'de');

    const revision = await screen.findByText('Stand: 0123456');
    const backend = await screen.findByText('Backend: verbunden');
    expect(revision.closest('footer')).toBe(backend.closest('footer'));
    expect(backend.compareDocumentPosition(revision) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(backend.nextElementSibling).toBe(revision);
  });

  it('switches the label and the tooltip with the language', async () => {
    const user = userEvent.setup();
    mockFetchRoutes({ revision: { status: 200, body: KNOWN } });
    renderWithProviders(<App />);
    expect(await screen.findByText('Stand: 0123456')).toHaveAttribute(
      'title',
      `Commit ${COMMIT} vom 09.10.2026 14:52`,
    );
    await screen.findByDisplayValue('Deutsch');

    await user.selectOptions(screen.getByLabelText('Sprache'), 'English');

    const english = await screen.findByText('Revision: 0123456');
    expect(english).toHaveAttribute('title', `Commit ${COMMIT} from 2026-10-09 14:52`);
    expect(english).toHaveAccessibleDescription(`Commit ${COMMIT} from 2026-10-09 14:52`);
    expect(screen.queryByText('Stand: 0123456')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Language'), 'Deutsch');

    const german = await screen.findByText('Stand: 0123456');
    expect(german).toHaveAttribute('title', `Commit ${COMMIT} vom 09.10.2026 14:52`);
    expect(german).toHaveAccessibleDescription(`Commit ${COMMIT} vom 09.10.2026 14:52`);
  });
});
