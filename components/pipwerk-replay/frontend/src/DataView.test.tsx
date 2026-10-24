import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { DataView } from './DataView';
import { FakeBackend, INSTRUMENT_JSON, json, renderWithProviders, rowJson } from './test-utils';

let backend: FakeBackend;

beforeEach(() => {
  backend = new FakeBackend();
  backend.install();
});

const GAP = { start: '2026-01-07T04:00:00Z', end: '2026-01-07T09:00:00Z', reason: 'gap' };

/** 25 rows PAIR01 to PAIR25 of one broker. */
function manyRows(count = 25) {
  return Array.from({ length: count }, (_, index) =>
    rowJson({ instrument: `PAIR${String(index + 1).padStart(2, '0')}` }),
  );
}

function seriesCalls() {
  return backend.callsTo('GET', '/api/v1/market-data/series');
}

describe('DataView, bar and headings', () => {
  it('has the bar with the import button and the broker for test runs above the table', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    renderWithProviders(<DataView />);

    await screen.findByTestId('stock-row');

    const bar = screen.getByTestId('data-bar');
    expect(within(bar).getByRole('button', { name: 'Datei importieren …' })).toBeInTheDocument();
    expect(within(bar).getByLabelText('Broker für Testläufe')).toBe(screen.getByTestId('select-test-broker'));
    expect(bar.compareDocumentPosition(screen.getByTestId('stock'))).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('has short headings and none of the removed areas, and no text about "unten" or "oben"', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');
    await user.click(screen.getByTestId('stock-row'));
    await screen.findByTestId('stock-detail');
    await user.click(screen.getByTestId('import-open'));

    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings).toEqual(
      expect.arrayContaining(['Datenbestand', 'Datenreihen', 'Datei importieren', 'Lücken', 'Kontraktdaten']),
    );
    const text = document.body.textContent ?? '';
    for (const removed of ['Was vorliegt', 'Angaben zum Instrument je Broker', 'Datei von Hand importieren', 'Beschaffung von Hand anstoßen']) {
      expect(text).not.toContain(removed);
    }
    expect(text).not.toMatch(/\b(unten|oben)\b/);
    expect(text).not.toMatch(/beschaff|Standardquelle/i);
  });

  it('explains every field with a text', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Demo-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');
    await user.click(screen.getByTestId('import-open'));
    await user.upload(screen.getByTestId('import-files'), new File(['x'], 'EURUSD_H1.csv'));
    await screen.findByTestId('import-item');

    const fields = document.querySelectorAll('[data-testid^="field-"]');
    expect(fields.length).toBeGreaterThanOrEqual(7);
    for (const field of fields) {
      const tip = field.querySelector('.field-label')?.getAttribute('data-tip') ?? '';
      expect(tip.length, field.getAttribute('data-testid') ?? '').toBeGreaterThan(10);
      expect(field.querySelector('.info')).toHaveAttribute('tabindex', '0');
    }
    for (const header of screen.getByTestId('stock-table').querySelectorAll('th')) {
      expect(header.getAttribute('data-tip')?.length ?? 0).toBeGreaterThan(10);
    }
  });
});

describe('DataView, table', () => {
  it('names the next step when the data stock is empty and offers the import', async () => {
    renderWithProviders(<DataView />);

    const note = await screen.findByTestId('stock-empty');

    expect(note).toHaveTextContent('Nächster Schritt: Holen Sie Kursdaten mit pipwerk-fetch-mt5 auf dem Rechner von MetaTrader 5');
    expect(note).toHaveTextContent('„Datei importieren …“');
    expect(screen.queryByTestId('stock-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('stock-filters')).not.toBeInTheDocument();
    expect(screen.getByTestId('select-test-broker')).toBeDisabled();
    expect(screen.getByTestId('select-test-broker')).toHaveDisplayValue('kein Broker');
  });

  it('shows one row per series with broker, instrument, data, period in days and gaps', async () => {
    backend.rows = [
      rowJson({ gap_count: 2 }),
      rowJson({ data: 'ticks', first: '2026-01-05T08:00:00.250000Z', last: '2026-01-06T10:00:00Z' }),
      rowJson({ instrument: 'GBPUSD', data: 'contract', first: null, last: null }),
    ];
    renderWithProviders(<DataView />);

    const rows = await screen.findAllByTestId('stock-row');

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Demo-ServerEURUSDKerzen H105.01.2026 – 09.01.20262');
    expect(rows[0]).toHaveAttribute('data-data', 'h1');
    expect(rows[1]).toHaveTextContent('Ticks05.01.2026 – 06.01.20260');
    expect(rows[2]).toHaveTextContent('Demo-ServerGBPUSDKontraktdaten––');
    const headers = within(screen.getByTestId('stock-table')).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual(['Broker', 'Instrument', 'Daten', 'Zeitraum', 'Lücken']);
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–3 von 3 Reihen');
  });

  it('shows the English texts and the date format of English', async () => {
    backend.rows = [rowJson(), rowJson({ instrument: 'GBPUSD', data: 'contract', first: null, last: null })];
    renderWithProviders(<DataView />, 'en');

    const rows = await screen.findAllByTestId('stock-row');

    expect(rows[0]).toHaveTextContent('Candles H12026-01-05 – 2026-01-09');
    expect(rows[1]).toHaveTextContent('Contract data');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Data stock');
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–2 of 2 series');
    expect(screen.getByRole('button', { name: 'Import files …' })).toBeInTheDocument();
  });

  it('pages through the rows on the server, ten at a time', async () => {
    backend.rows = manyRows(25);
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await screen.findAllByTestId('stock-row');
    expect(screen.getAllByTestId('stock-row')).toHaveLength(10);
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–10 von 25 Reihen');
    expect(screen.getByTestId('page-no')).toHaveTextContent('Seite 1 von 3');
    expect(screen.getByTestId('page-prev')).toBeDisabled();
    expect(seriesCalls().at(-1)?.query.get('offset')).toBe('0');
    expect(seriesCalls().at(-1)?.query.get('limit')).toBe('10');

    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.getByTestId('stock-count')).toHaveTextContent('11–20 von 25 Reihen');
    });
    expect(screen.getAllByTestId('stock-row')[0]).toHaveAttribute('data-instrument', 'PAIR11');
    expect(seriesCalls().at(-1)?.query.get('offset')).toBe('10');

    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.getByTestId('stock-count')).toHaveTextContent('21–25 von 25 Reihen');
    });
    expect(screen.getAllByTestId('stock-row')).toHaveLength(5);
    expect(screen.getByTestId('page-next')).toBeDisabled();

    await user.click(screen.getByTestId('page-prev'));
    await waitFor(() => {
      expect(screen.getByTestId('page-no')).toHaveTextContent('Seite 2 von 3');
    });
  });

  it('filters by broker, instrument and data on the server and starts again at page one', async () => {
    backend.rows = [
      ...manyRows(15),
      rowJson({ broker: 'Other-Server', instrument: 'XAUUSD', data: 'h12' }),
      rowJson({ broker: 'Other-Server', instrument: 'XAUUSD', data: 'ticks' }),
    ];
    backend.brokers = ['Demo-Server', 'Other-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findAllByTestId('stock-row');
    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.getByTestId('page-no')).toHaveTextContent('Seite 2 von 2');
    });

    await user.type(screen.getByTestId('filter-broker'), 'OTHER');

    await waitFor(() => {
      expect(screen.getAllByTestId('stock-row')).toHaveLength(2);
    });
    expect(seriesCalls().at(-1)?.query.get('broker')).toBe('OTHER');
    expect(seriesCalls().at(-1)?.query.get('offset')).toBe('0');
    expect(screen.getByTestId('stock-count')).toHaveTextContent('1–2 von 2 Reihen (gefiltert)');

    await user.type(screen.getByTestId('filter-instrument'), 'xau');
    await user.type(screen.getByTestId('filter-data'), 'Kerzen H12');
    await waitFor(() => {
      expect(screen.getAllByTestId('stock-row')).toHaveLength(1);
    });
    expect(seriesCalls().at(-1)?.query.get('instrument')).toBe('xau');
    expect(seriesCalls().at(-1)?.query.get('data')).toBe('h12');
  });

  it('says that no series matches the filter, keeps the filters and shows all rows again after clearing', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');

    await user.type(screen.getByTestId('filter-instrument'), 'ZZZ');

    expect(await screen.findByTestId('stock-nomatch')).toHaveTextContent('Keine Reihe passt zum Filter. Nächster Schritt: Ändern Sie einen Filter oder leeren Sie ihn.');
    expect(screen.getByTestId('filter-instrument')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('stock-count')).toHaveTextContent('0 Reihen');

    await user.clear(screen.getByTestId('filter-instrument'));
    expect(await screen.findByTestId('stock-row')).toBeInTheDocument();
    expect(screen.queryByTestId('stock-nomatch')).not.toBeInTheDocument();
  });

  it('maps the displayed names of the data to their identifiers in the filter', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    await screen.findByTestId('stock-row');

    for (const [typed, sent] of [['Kontraktdaten', 'contract'], ['Candles H1', 'h1'], ['tick', 'tick']]) {
      await user.clear(screen.getByTestId('filter-data'));
      await user.type(screen.getByTestId('filter-data'), typed as string);
      await waitFor(() => {
        expect(seriesCalls().at(-1)?.query.get('data')).toBe(sent);
      });
    }
  });

  it('shows the error when the data stock cannot be read', async () => {
    backend.seriesAnswer = () => json(503, { detail: 'The data stock could not be read or changed.' });
    renderWithProviders(<DataView />);

    const error = await screen.findByTestId('stock-error');

    expect(error).toHaveTextContent('Der Datenbestand konnte nicht gelesen werden.');
    expect(error).toHaveTextContent('Nächster Schritt');
  });
});

describe('DataView, details of a row', () => {
  it('shows all gaps and the contract data of the instrument at this broker after a click', async () => {
    backend.rows = [rowJson({ gap_count: 2 })];
    backend.gaps['Demo-Server|EURUSD|h1'] = [GAP, { start: '2026-01-08T00:00:00Z', end: '2026-01-08T02:00:00Z', reason: 'gap' }];
    backend.contracts['Demo-Server|EURUSD'] = { ...INSTRUMENT_JSON, margin_per_lot: 3650 };
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    const row = await screen.findByTestId('stock-row');
    expect(row).toHaveAttribute('aria-expanded', 'false');
    await user.click(row);

    const detail = await screen.findByTestId('stock-detail');
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByTestId('gap-item').map((item) => item.textContent)).toEqual([
      '07.01.2026 04:00 – 07.01.2026 09:00',
      '08.01.2026 00:00 – 08.01.2026 02:00',
    ]);
    expect(within(detail).getByRole('heading', { name: 'Lücken' })).toBeInTheDocument();
    expect(within(detail).getByRole('heading', { name: 'Kontraktdaten' })).toBeInTheDocument();
    expect(screen.getByTestId('contract-contractSize')).toHaveTextContent('100.000');
    expect(screen.getByTestId('contract-tickValue')).toHaveTextContent('1 USD');
    expect(screen.getByTestId('contract-swap')).toHaveTextContent('-6,5 / 2,1');
    expect(screen.getByTestId('contract-tripleSwap')).toHaveTextContent('Mittwoch');
    expect(screen.getByTestId('contract-margin')).toHaveTextContent('3.650');
    expect(screen.getByTestId('contract-contractFrom')).toHaveTextContent('05.01.2026 08:00');
    const query = backend.callsTo('GET', '/api/v1/market-data/series/details')[0]?.query;
    expect([query?.get('broker'), query?.get('instrument'), query?.get('data')]).toEqual(['Demo-Server', 'EURUSD', 'h1']);

    await user.click(row);
    expect(screen.queryByTestId('stock-detail')).not.toBeInTheDocument();
  });

  it('opens with the keyboard and tells that there are no gaps', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const row = await screen.findByTestId('stock-row');

    row.focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByTestId('gaps-none')).toHaveTextContent('Keine Lücken.');
    expect(row).toHaveAttribute('data-tip', 'Klicken zeigt die Einzelheiten dieser Reihe.');
  });

  it('says in a sentence that a test run does not start when the contract data are missing', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await user.click(await screen.findByTestId('stock-row'));

    const note = await screen.findByTestId('contract-missing');
    expect(note).toHaveTextContent('Ein Testlauf mit diesem Instrument startet dann nicht.');
    expect(note).toHaveTextContent('pipwerk-fetch-mt5');
    expect(screen.queryByTestId('contract-contractSize')).not.toBeInTheDocument();
  });

  it('shows only the contract data for a row of contract data', async () => {
    backend.rows = [rowJson({ data: 'contract', first: null, last: null })];
    backend.contracts['Demo-Server|EURUSD'] = INSTRUMENT_JSON;
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await user.click(await screen.findByTestId('stock-row'));

    expect(await screen.findByTestId('detail-contract')).toBeInTheDocument();
    expect(screen.queryByTestId('detail-gaps')).not.toBeInTheDocument();
    expect(screen.getByTestId('contract-margin')).toHaveTextContent('–');
  });

  it('says how many gaps are shown when the list is cut', async () => {
    backend.rows = [rowJson({ gap_count: 5000 })];
    backend.gaps['Demo-Server|EURUSD|h1'] = [GAP];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await user.click(await screen.findByTestId('stock-row'));

    expect(await screen.findByTestId('gaps-cut')).toHaveTextContent('Gezeigt werden 1 von 5.000 Lücken.');
  });

  it('shows a message when the details cannot be read and closes the details with the next page', async () => {
    backend.rows = manyRows(12);
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const rows = await screen.findAllByTestId('stock-row');
    // The row is gone from the data stock by the time the details are asked for.
    backend.rows = backend.rows.slice(1);

    await user.click(rows[0] as HTMLElement);

    expect(await screen.findByTestId('detail-error')).toHaveTextContent('Die Einzelheiten konnten nicht gelesen werden.');
    await user.click(screen.getByTestId('page-next'));
    await waitFor(() => {
      expect(screen.queryByTestId('stock-detail')).not.toBeInTheDocument();
    });
  });
});

describe('DataView, gaps', () => {
  it('explains what a gap is and that weekends, holidays and times without trade are none', async () => {
    backend.rows = [rowJson({ gap_count: 1 })];
    backend.gaps['Demo-Server|EURUSD|h1'] = [GAP];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);

    await user.click(await screen.findByTestId('stock-row'));

    const explain = await screen.findByTestId('gaps-explain');
    expect(explain).toHaveTextContent('Wochenenden, Feiertage und andere Zeiten ohne Handel sind keine Lücken.');
    const header = screen.getAllByRole('columnheader').find((cell) => cell.textContent === 'Lücken');
    expect(header?.getAttribute('data-tip')).toContain('Wochenenden, Feiertage und andere Zeiten ohne Handel zählen nicht.');
  });

  it('explains it in English, too', async () => {
    backend.rows = [rowJson()];
    const user = userEvent.setup();
    renderWithProviders(<DataView />, 'en');

    await user.click(await screen.findByTestId('stock-row'));

    expect(await screen.findByTestId('gaps-explain')).toHaveTextContent(
      'Weekends, holidays and other times without trade are no gaps.',
    );
  });
});

describe('DataView, broker for test runs', () => {
  it('offers only the brokers of the data stock and says that none is chosen, and which one applies then', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Zeta-Server', 'Alpha-Server'];
    renderWithProviders(<DataView />);

    const select = await screen.findByTestId('select-test-broker');

    await waitFor(() => {
      expect(screen.getByTestId('test-broker-applies')).toBeInTheDocument();
    });
    expect(select).toHaveDisplayValue('– keiner gewählt –');
    expect(screen.getByTestId('test-broker-applies')).toHaveTextContent(
      'Es ist kein Broker gewählt. Ein Testlauf liest die Daten von Alpha-Server, dem ersten Broker in alphabetischer Reihenfolge.',
    );
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual([
      '– keiner gewählt –',
      'Zeta-Server',
      'Alpha-Server',
    ]);
  });

  it('shows the choice and no note about the broker that applies', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Alpha-Server', 'Zeta-Server'];
    backend.testRunBroker = 'Zeta-Server';
    renderWithProviders(<DataView />);

    const select = await screen.findByTestId('select-test-broker');

    await waitFor(() => {
      expect(select).toHaveDisplayValue('Zeta-Server');
    });
    expect(screen.queryByTestId('test-broker-applies')).not.toBeInTheDocument();
  });

  it('sets the broker through the web API', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Alpha-Server', 'Zeta-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const select = await screen.findByTestId('select-test-broker');
    await waitFor(() => {
      expect(screen.getByTestId('test-broker-applies')).toBeInTheDocument();
    });

    await user.selectOptions(select, 'Zeta-Server');

    await waitFor(() => {
      expect(backend.callsTo('PUT', '/api/replay/settings/test-run-broker')[0]?.body).toEqual({ broker: 'Zeta-Server' });
    });
    expect(backend.testRunBroker).toBe('Zeta-Server');
    await waitFor(() => {
      expect(select).toHaveDisplayValue('Zeta-Server');
    });
  });

  it('takes the choice back with the first entry', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Alpha-Server', 'Zeta-Server'];
    backend.testRunBroker = 'Zeta-Server';
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const select = await screen.findByTestId('select-test-broker');
    await waitFor(() => {
      expect(select).toHaveDisplayValue('Zeta-Server');
    });

    await user.selectOptions(select, '– keiner gewählt –');

    await waitFor(() => {
      expect(backend.callsTo('PUT', '/api/replay/settings/test-run-broker')[0]?.body).toEqual({ broker: null });
    });
    expect(await screen.findByTestId('test-broker-applies')).toBeInTheDocument();
  });

  it('shows a message with the next step when the broker cannot be set', async () => {
    backend.rows = [rowJson()];
    backend.brokers = ['Alpha-Server', 'Zeta-Server'];
    const user = userEvent.setup();
    renderWithProviders(<DataView />);
    const select = await screen.findByTestId('select-test-broker');
    await waitFor(() => {
      expect(screen.getByTestId('test-broker-applies')).toBeInTheDocument();
    });
    backend.brokers = ['Alpha-Server'];

    await user.selectOptions(select, 'Zeta-Server');

    expect(await screen.findByTestId('test-broker-error')).toHaveTextContent('Nächster Schritt');
  });
});
