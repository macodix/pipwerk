import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import type { ExpressionNames } from './api/objects';
import type { StrategyDocument } from './document/types';
import { clickNode, elementNodes, menu, nodeByTitle, openStored, switchLanguage, waitForReady } from './testing/actions';

import { mockBackend, type MockBackendOptions } from './testing/backend';
import { loadTestcase } from './testing/fixtures';
import { renderWithProviders } from './test-utils';

const stored = loadTestcase('str-03');
const condition = stored.elements.find((element) => element.title === 'Kreuzen')!;

/** The names the check recognizes in the expression of the condition: the parts in front of and behind the points. */
function recognizeNames(document: StrategyDocument): ExpressionNames[] {
  const text = String(document.elements.find((element) => element.id === condition.id)?.parameters.ausdruck?.value ?? '');
  const names = Array.from(text.matchAll(/[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+/g)).map((match) => {
    const start = match.index;
    const segments: { identifier: string; start: number; end: number }[] = [];
    let offset = start;
    for (const part of match[0].split('.')) {
      segments.push({ identifier: part, start: offset, end: offset + part.length });
      offset += part.length + 1;
    }
    return { start, end: start + match[0].length, identifier: match[0], resolved: true, previous: false, segments };
  });
  return [{ element: condition.id, subject: null, field: 'parameter:ausdruck', names }];
}

async function start(options: MockBackendOptions = { strategies: [stored], expressions: recognizeNames }) {
  const user = userEvent.setup();
  const backend = mockBackend(options);
  renderWithProviders(<App />);
  await waitForReady();
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(elementNodes().length).toBeGreaterThan(0);
  });
  clickNode(nodeByTitle('Kreuzen'));
  const input = await screen.findByRole('combobox', { name: 'Ausdruck' });
  await user.clear(input);
  return { user, backend, input };
}

/** The expression as it is shown below the input. */
function shown(): string | null {
  return document.querySelector('.expression-display code')?.textContent ?? null;
}

function suggestions(): string[] {
  const list = screen.queryByRole('listbox', { name: 'Vorschläge' });
  return list === null ? [] : within(list).getAllByRole('option').map((option) => option.querySelector('.suggestion-label')?.textContent ?? '');
}

describe('the expression input', () => {
  it('offers the properties of an object of the application after the name and a point', async () => {
    const { user, input } = await start();

    await user.type(input, 'Konto.');

    expect(suggestions()).toEqual(['Kapital', 'freie Margin', 'Währung']);
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('writes the identifier of the chosen property, not its name in the language', async () => {
    const { user, input } = await start();

    await user.type(input, 'Konto.');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(input).toHaveValue('Konto.freie_margin');
    expect(screen.queryByRole('listbox', { name: 'Vorschläge' })).toBeNull();
  });

  it('chooses with the mouse and keeps the focus in the input', async () => {
    const { user, input } = await start();

    await user.type(input, 'Order.vol');
    await user.click(within(screen.getByRole('listbox', { name: 'Vorschläge' })).getByRole('option', { name: /Volumen/ }));

    expect(input).toHaveValue('Order.volumen');
    expect(input).toHaveFocus();
  });

  it('narrows the suggestions while typing and goes round with the arrow keys', async () => {
    const { user, input } = await start();
    await user.type(input, 'Kerze.');
    expect(suggestions()).toEqual(['Eröffnung', 'Hoch', 'Tief', 'Schluss', 'Volumen', 'Zeitpunkt']);

    await user.clear(input);
    await user.type(input, 'Order.st');
    expect(suggestions()).toEqual(['Status', 'Strategie-ID', 'Stop-Loss']);
    expect(screen.getByRole('option', { name: /Status/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: /Stop-Loss/ })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Status/ })).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /Status/ }).id);
  });

  it('closes the suggestions with Escape and shows them again after the next key', async () => {
    const { user, input } = await start();
    await user.type(input, 'Konto.');
    expect(screen.queryByRole('listbox', { name: 'Vorschläge' })).not.toBeNull();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox', { name: 'Vorschläge' })).toBeNull();
    expect(input).toHaveValue('Konto.');

    await user.type(input, 'k');
    expect(suggestions()).toEqual(['Kapital']);
  });

  it('offers instances, names and functions without a point', async () => {
    const { user, input } = await start();

    await user.type(input, 'IF');

    expect(suggestions()).toEqual(['IF', 'IFNA']);
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('IF(');
  });

  it('offers the properties of an instance and the result of a calculation', async () => {
    const { user, input } = await start();

    await user.type(input, 'ema20.');
    expect(suggestions()).toEqual(['Wert']);
    await user.clear(input);
    await user.type(input, 'richtung.');
    expect(suggestions()).toEqual(['Ergebnis']);
  });

  it('offers the properties of order and position, also those that only an order type has', async () => {
    const { user, input } = await start();

    await user.type(input, 'Order.');

    expect(suggestions()).toEqual(expect.arrayContaining(['Status', 'Volumen', 'Limitpreis', 'Stop-Loss']));
  });

  it('does not offer anything inside a text', async () => {
    const { user, input } = await start();

    await user.type(input, '"Konto.');

    expect(screen.queryByRole('listbox', { name: 'Vorschläge' })).toBeNull();
  });

  it('shows the expression with the names in the language of the interface, from the names the check recognized', async () => {
    const { user, input } = await start();

    await user.type(input, 'Konto.kapital > ema20.wert');

    await waitFor(
      () => {
        expect(shown()).toBe('Konto.Kapital > ema20.Wert');
      },
      { timeout: 3000 },
    );
    expect(screen.getByText(/^Anzeige:/)).toBeInTheDocument();

    await switchLanguage(user, 'English');

    await waitFor(
      () => {
        expect(shown()).toBe('Account.Equity > ema20.Value');
      },
      { timeout: 3000 },
    );
  });

  it('asks the backend for the names after a pause and not at every key press', async () => {
    const { user, backend, input } = await start();
    const before = backend.requests('POST', /\/api\/v1\/check$/).length;

    await user.type(input, 'Konto.kapital > 100 + Konto.kapital');

    await waitFor(
      () => {
        expect(backend.requests('POST', /\/api\/v1\/check$/).length).toBeGreaterThan(before);
      },
      { timeout: 3000 },
    );
    const asked = backend.requests('POST', /\/api\/v1\/check$/).length - before;
    expect(asked).toBeLessThanOrEqual(3);
    const last = backend.requests('POST', /\/api\/v1\/check$/).at(-1)?.body as StrategyDocument;
    expect(last.elements.find((element) => element.id === condition.id)?.parameters.ausdruck?.value).toBe(
      'Konto.kapital > 100 + Konto.kapital',
    );
  });

  it('shows the text as typed while the names of the old text are not valid for the new one', async () => {
    const { user, input } = await start();
    await user.type(input, 'Konto.kapital');
    await waitFor(() => {
      expect(shown()).toBe('Konto.Kapital');
    }, { timeout: 3000 });

    await user.type(input, ' + 1');

    expect(shown()).toBe('Konto.kapital + 1');
  });

  it('stores what was typed in the document, and the document counts as changed', async () => {
    const { user, backend, input } = await start();

    await user.type(input, 'Konto.kapital > 0');
    await menu(user, 'Speichern');

    await waitFor(() => {
      expect(backend.requests('PUT', /strategies\/.+/)).toHaveLength(1);
    });
    const saved = backend.requests('PUT', /strategies\/.+/)[0]?.body as StrategyDocument;
    expect(saved.elements.find((element) => element.id === condition.id)?.parameters.ausdruck).toEqual({
      kind: 'expression',
      value: 'Konto.kapital > 0',
    });
  });

  it('works in the expression of a rule with the names a rule sees: its parameters first, then the rules', async () => {
    const { user } = await start();
    fireEvent.click(document.querySelector('.react-flow__pane') as HTMLElement);
    await user.click(await screen.findByRole('button', { name: 'Regel risiko auswählen' }));
    const expression = await screen.findByRole('combobox', { name: 'Ausdruck' });

    await user.clear(expression);
    await user.type(expression, 'risi');

    expect(suggestions()).toEqual(['risikogrenze', 'risiko']);
  });
});
