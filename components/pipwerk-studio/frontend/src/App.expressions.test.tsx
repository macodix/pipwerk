import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { renderWithProviders } from './test-utils';
import { clickNode, menu, nodeByName, openStored, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { EMA_ELEMENT_IDS, emaTrendfolge } from './testing/emaTrendfolge';

type Stored = { elements: { id: string; parameters: Record<string, { value?: unknown }>; inputs: { instance: string; property: string }[] }[]; rules: { key: string; name: string }[] };

async function open(user: ReturnType<typeof userEvent.setup>, options: Parameters<typeof mockApi>[0] = {}) {
  const api = mockApi(options);
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });
  return api;
}

/** Saves and returns the document the interface sent. */
async function saved(user: ReturnType<typeof userEvent.setup>, api: ReturnType<typeof mockApi>): Promise<Stored> {
  await menu(user, 'save');
  await waitFor(() => {
    expect(api.requests('PUT', /strategies/)).toHaveLength(1);
  });
  return api.requests('PUT', /strategies/)[0]?.body as Stored;
}

const expressionOf = (document: Stored, id: string): string => String(document.elements.find((element) => element.id === id)?.parameters.ausdruck?.value);

describe('the blocks (specification 5.4)', () => {
  it('show the expression of a step as an editor of blocks and as a sentence', async () => {
    const user = userEvent.setup();
    await open(user);
    clickNode(nodeByName('Richtung'));

    const panel = await screen.findByTestId('expression-ausdruck');
    await waitFor(() => {
      expect(within(panel).getByTestId('expr-sentence')).toHaveTextContent('IF(ema20.wert > ema50.wert');
    });
    expect(within(panel).getByTestId('calc-root-select')).toHaveValue('k:if');
    expect(within(panel).getByTestId('cmp-op')).toHaveValue('>');
  });

  it('change the expression through the expression endpoint and write only its answer to the document', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    clickNode(nodeByName('Richtung'));
    const panel = await screen.findByTestId('expression-ausdruck');

    await user.selectOptions(await within(panel).findByTestId('cmp-op'), '<');

    await waitFor(() => {
      // the editor sends the blocks, never a text it formed itself
      const sent = api.requests('POST', /expressions/).flatMap((call) => (call.body as { items: { blocks?: { kind: string }; stored?: string }[] }).items);
      expect(sent.some((item) => item.blocks?.kind === 'if')).toBe(true);
    });
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('ungespeichert');
    });
    const document = await saved(user, api);
    expect(expressionOf(document, EMA_ELEMENT_IDS.direction)).toBe('IF(ema20.wert < ema50.wert; "buy"; "sell")');
  });

  it('list the values in the order connected, objects, application, results, strategy parameters, and a chosen value becomes an input', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    clickNode(nodeByName('StopLoss'));
    const panel = await screen.findByTestId('expression-ausdruck');
    expect(within(screen.getByTestId('props-element')).queryAllByTestId('input-chip')).toHaveLength(0);

    // the first operand of the comparison is "Richtung › Ergebnis": pick a value of an object instead
    const left = await within(panel).findByTestId('cmp-left-select');
    await user.selectOptions(left, within(left).getAllByRole('option', { name: 'EMA20 › Wert' })[0] as HTMLOptionElement);

    // every object whose value the expression uses is an input of the step: the one chosen and the one that was there
    await waitFor(() => {
      expect(within(screen.getByTestId('props-element')).getAllByTestId('input-chip')).toHaveLength(2);
    });
    const groups = Array.from(panel.querySelectorAll('[data-testid="cmp-left-select"] optgroup')).map((group) => group.getAttribute('label'));
    expect(groups.slice(0, 5)).toEqual(['Verbundene Werte', 'Objekte der Strategie', 'Objekte der Anwendung', 'Ergebnisse', 'Strategieparameter']);
    const document = await saved(user, api);
    expect(document.elements.find((element) => element.id === EMA_ELEMENT_IDS.stop)?.inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instance: 'ema20', property: 'wert', kind: 'property', arguments: [], refresh: false }),
        expect.objectContaining({ instance: 'atr14', property: 'wert' }),
      ]),
    );
  });
});

describe('the formula view', () => {
  it('shows the display form, writes what is typed through the endpoint and marks a typing error at its place', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    clickNode(nodeByName('Richtung'));
    const panel = await screen.findByTestId('expression-ausdruck');

    await user.click(within(panel).getByTestId('view-formula'));
    const input = within(panel).getByTestId('formula-input') as HTMLTextAreaElement;
    expect(input.value).toBe('IF(ema20.wert > ema50.wert; "buy"; "sell")');

    fireEvent.change(input, { target: { value: 'ema20.wert * 2' } });
    await waitFor(() => {
      const calls = api.requests('POST', /expressions/);
      expect((calls[calls.length - 1]?.body as { items: { display?: string }[] }).items[0]?.display).toBe('ema20.wert * 2');
    });
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('ungespeichert');
    });

    fireEvent.change(input, { target: { value: 'ema20.wert *' } });
    await waitFor(() => {
      expect(panel.querySelector('.tk-error')).not.toBeNull();
    });
    // an expression with a typing error is shown only in the formula view
    await user.click(within(panel).getByTestId('view-blocks'));
    expect(within(panel).getByTestId('expr-bad')).toBeInTheDocument();
  });

  it('is opened at the spot of a finding by "Zur Stelle"', async () => {
    const user = userEvent.setup();
    const broken = emaTrendfolge();
    const element = (broken.elements as { id: string; parameters: Record<string, { value: string }> }[]).find((candidate) => candidate.id === EMA_ELEMENT_IDS.direction);
    (element as { parameters: Record<string, { value: string }> }).parameters.ausdruck = { kind: 'expression', value: 'ema20.wert *' } as never;
    await open(user, {
      strategies: [broken],
      findings: () => [
        { level: 'error', code: 'expression.invalid', element: EMA_ELEMENT_IDS.direction, subject: null, details: { field: 'parameter:ausdruck', issue: 'syntax', reason: 'unexpected_end', start: 11, end: 12 } },
      ],
    });
    await menu(user, 'check');
    await user.click(await screen.findByTestId('findings-count'));
    const finding = await screen.findByTestId('finding');

    await user.click(within(finding).getByTestId('finding-goto'));

    const panel = await screen.findByTestId('expression-ausdruck');
    const input = (await within(panel).findByTestId('formula-input')) as HTMLTextAreaElement;
    await waitFor(() => {
      expect(input).toHaveFocus();
      expect([input.selectionStart, input.selectionEnd]).toEqual([11, 12]);
    });
  });
});

describe('rules (specification 5.4)', () => {
  it('are added to the strategy from the library, renamed, reordered and removed', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    await user.click(screen.getByTestId('status-pill'));
    const section = await screen.findByTestId('sec-rules');
    const before = within(section).queryAllByTestId('rule-card').length;

    const select = within(section).getByTestId('rule-add-select');
    await user.selectOptions(select, within(select).getByRole('option', { name: 'Risiko je Trade' }));
    await waitFor(() => {
      expect(within(section).getAllByTestId('rule-card')).toHaveLength(before + 1);
    });
    const cards = within(section).getAllByTestId('rule-card');
    const added = cards[cards.length - 1] as HTMLElement;
    await user.clear(within(added).getByTestId('instance-name'));
    await user.type(within(added).getByTestId('instance-name'), 'Risiko');
    await user.click(within(added).getByTestId('instance-up'));
    await waitFor(() => {
      const names = within(section).getAllByTestId('instance-name').map((field) => (field as HTMLInputElement).value);
      expect(names[names.length - 2]).toBe('Risiko');
    });

    const document = await saved(user, api);
    expect(document.rules.map((rule) => rule.name)).toContain('Risiko');

    const again = within(section).getAllByTestId('rule-card').find((card) => (within(card).getByTestId('instance-name') as HTMLInputElement).value === 'Risiko') as HTMLElement;
    await user.click(within(again).getByTestId('instance-remove'));
    await waitFor(() => {
      expect(within(section).queryAllByTestId('rule-card')).toHaveLength(before);
    });
  });

  it('an own rule of a step has parameters, an expression from blocks, a determined property and a comparison', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    clickNode(nodeByName('Order aufgeben'));
    const section = await screen.findByTestId('sec-element-rules');
    const select = within(section).getByTestId('rule-add-select');

    await user.selectOptions(select, within(select).getByRole('option', { name: 'eigene Regel' }));

    await waitFor(() => {
      expect(within(section).getAllByTestId('rule-card')).toHaveLength(2);
    });
    const card = within(section).getAllByTestId('rule-card')[1] as HTMLElement;
    const ruleKey = card.getAttribute('data-key');
    expect(within(card).getByTestId('rule-expression')).toBeInTheDocument();
    expect(within(card).getByTestId('rule-determined')).toBeInTheDocument();
    await user.selectOptions(within(card).getByTestId('rule-determined'), 'volumen');
    await waitFor(() => {
      expect(within(card).getByTestId('rule-comparison')).toHaveValue('hoechstens');
    });
    await user.selectOptions(within(card).getByTestId('rule-comparison'), 'mindestens');
    const document = (await saved(user, api)) as unknown as { elements: { id: string; rules: { key: string; determined_property: string; comparison: string }[] }[] };
    const rule = document.elements.find((element) => element.id === EMA_ELEMENT_IDS.order)?.rules.find((candidate) => candidate.key === ruleKey);
    expect(rule).toMatchObject({ determined_property: 'volumen', comparison: 'mindestens' });
  });
});

describe('own indicators and trends (specification 5.4)', () => {
  it('get their own parameters and properties in the strategy', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    const entry = document.querySelector<HTMLElement>('[data-testid="lib-item"][data-label="eigener Indikator"]');
    await user.click(entry as HTMLElement);
    const section = await screen.findByTestId('sec-own-parameters');

    await user.type(within(section).getByTestId('own-parameter-new-name'), 'Faktor');
    await user.click(within(section).getByTestId('own-parameter-add'));
    const properties = await screen.findByTestId('sec-instance-properties');
    await user.type(within(properties).getByTestId('own-property-new-name'), 'Doppelt');
    await user.click(within(properties).getByTestId('own-property-add'));

    await waitFor(() => {
      expect(within(screen.getByTestId('sec-own-parameters')).getAllByTestId('own-parameter')).toHaveLength(1);
      expect(within(screen.getByTestId('sec-instance-properties')).getAllByTestId('instance-property')).toHaveLength(1);
    });
    await menu(user, 'save');
    await waitFor(() => {
      expect(api.requests('PUT', /strategies/)).toHaveLength(1);
    });
    const sent = JSON.stringify(api.requests('PUT', /strategies/)[0]?.body);
    expect(sent).toContain('"name":"Faktor"');
    expect(sent).toContain('"name":"Doppelt"');
  });
});

describe('renaming (specification 5.4)', () => {
  it('needs no question, changes the name only and leaves the identifier in the expressions', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    clickNode(nodeByName('EMA50'));
    const field = await screen.findByTestId('element-name');

    await user.clear(field);
    await user.type(field, 'Schnelle EMA');

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => {
      expect(nodeByName('Schnelle EMA')).toBeInTheDocument();
    });
    const document = (await saved(user, api)) as unknown as { elements: { id: string; instance: { name: string; key: string } | null }[] };
    expect(document.elements.find((element) => element.id === EMA_ELEMENT_IDS.ema50)?.instance).toMatchObject({ name: 'Schnelle EMA', key: 'ema50' });
    expect(expressionOf(document as unknown as Stored, EMA_ELEMENT_IDS.direction)).toBe('IF(ema20.wert > ema50.wert; "buy"; "sell")');
  });
});

describe('removing (specification 5.4)', () => {
  it('asks, lists the steps that use the object, and leaves an empty place in their expressions', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    clickNode(nodeByName('EMA50'));
    await user.click(await screen.findByTestId('remove-element'));
    const dialog = await screen.findByRole('dialog');
    const users = within(dialog).getByTestId('remove-users');
    expect(users).toHaveTextContent('Kreuzen');
    expect(users).toHaveTextContent('Richtung');

    await user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    const document = await saved(user, api);
    expect(document.elements.some((element) => element.id === EMA_ELEMENT_IDS.ema50)).toBe(false);
    expect(expressionOf(document, EMA_ELEMENT_IDS.direction)).toBe('IF(ema20.wert > ; "buy"; "sell")');
  });

  it('keeps everything when the question is cancelled', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    clickNode(nodeByName('EMA50'));
    await user.click(await screen.findByTestId('remove-element'));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(nodeByName('EMA50')).toBeInTheDocument();
    expect(api.requests('PUT', /strategies/)).toHaveLength(0);
  });
});
