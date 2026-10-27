import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import type { ElementDocument, InputDocument, StrategyDocument } from './document/types';
import { renderWithProviders } from './test-utils';
import {
  choiceGroups,
  choose as pickOption,
  clickNode,
  disabledChoices,
  menu,
  nodeByName,
  offeredChoices,
  offeredGroups,
  openChoices,
  openStored,
  waitForReady,
} from './testing/actions';
import { mockApi } from './testing/backend';
import { emaTrendfolge } from './testing/emaTrendfolge';
import type { FakeApiOptions } from './testing/fakeApi';
import { inventedStrategy, inventedTypesWithMethodJson } from './testing/inventedTypes';

// Specification 5.4 (order 13): "Verwendete Werte" with the choice of property or method, the arguments and "Aktualisieren",
// the element of the first use of an instance, the blocks with methods and the question before a removal. The invented
// types have a type with a method that can refresh ("Pegel") and one that cannot ("Messer").

const gauge: ElementDocument = {
  id: '99999999-9999-4999-8999-999999999999',
  type: 'zz.gauge',
  name: null,
  key: null,
  position: null,
  parameters: {},
  properties: {},
  inputs: [],
  rules: [],
  management_of: null,
  instance: {
    name: 'Pegel',
    key: 'pegel',
    object_type: 'zz.gauge',
    origin: { object_type: 'zz.gauge', template_id: null },
    first_use: null,
    parameter_values: { takt: { kind: 'fixed', value: 'fast' } },
  },
};

const averageInput: InputDocument = { instance: 'pegel', property: 'mittel', kind: 'method', arguments: [3, 0.5], refresh: false };

/** The invented strategy with the gauge; "Tun" uses the average of the gauge with two arguments, "Weiche" names the meter in its formula. */
function strategy(options: { usesGauge?: boolean; formula?: string } = {}): StrategyDocument {
  const base = inventedStrategy();
  const doIt = base.elements.find((element) => element.name === 'Tun') as ElementDocument;
  const when = base.elements.find((element) => element.name === 'Weiche') as ElementDocument;
  const meter = base.elements.find((element) => element.instance?.key === 'messer') as ElementDocument;
  const usesGauge = options.usesGauge ?? true;
  return {
    ...base,
    elements: base.elements
      .map((element) => {
        if (element === doIt) {
          return { ...doIt, inputs: usesGauge ? [averageInput] : [] };
        }
        if (element === when && options.formula !== undefined) {
          return { ...when, parameters: { ...when.parameters, formel: { kind: 'expression' as const, value: options.formula } } };
        }
        if (element === meter) {
          return { ...meter, instance: { ...(meter.instance as NonNullable<ElementDocument['instance']>), first_use: when.id } };
        }
        return element;
      })
      .concat(usesGauge ? { ...gauge, instance: { ...(gauge.instance as NonNullable<ElementDocument['instance']>), first_use: doIt.id } } : gauge),
  };
}

type Run = { user: ReturnType<typeof userEvent.setup>; api: ReturnType<typeof mockApi>; document: StrategyDocument };

async function open(document: StrategyDocument, options: FakeApiOptions = {}): Promise<Run> {
  const user = userEvent.setup();
  const api = mockApi({ types: inventedTypesWithMethodJson, strategies: [document as unknown as Record<string, unknown>], ...options });
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await openStored(user, document.name);
  await waitFor(() => {
    expect(nodeByName('Weiche')).toBeInTheDocument();
  });
  return { user, api, document };
}

async function choose(name: string): Promise<void> {
  clickNode(nodeByName(name));
  await waitFor(() => {
    expect(screen.getByTestId('element-name')).toHaveValue(name);
  });
}

async function saved(run: Run): Promise<StrategyDocument> {
  await menu(run.user, 'save');
  await waitFor(() => {
    expect(run.api.requests('PUT', /strategies/).length).toBeGreaterThan(0);
  });
  const calls = run.api.requests('PUT', /strategies/);
  return calls[calls.length - 1]?.body as StrategyDocument;
}

const elementOf = (document: StrategyDocument, name: string): ElementDocument => document.elements.find((element) => element.name === name) as ElementDocument;

describe('"Verwendete Werte" of an element', () => {
  it('names per object the values the element uses, with the choice of property or method and the arguments', async () => {
    const run = await open(strategy());
    await choose('Tun');

    const section = screen.getByTestId('sec-used');
    expect(within(section).getByTestId('used-group')).toHaveTextContent('Pegel');
    const select = within(section).getByTestId('used-pegel-mittel-select');
    expect(select).toHaveValue('m:mittel');
    // properties and methods are two lists of the choice; the method is shown by its label
    expect((await offeredGroups(run.user, select)).map((group) => group.label)).toEqual(['Eigenschaften', 'Methoden']);
    expect(within(section).getByTestId('used-pegel-mittel-arg-anzahl')).toHaveValue('3');
    expect(within(section).getByTestId('used-pegel-mittel-arg-gewicht')).toHaveValue('0.5');
    // the argument carries its explanation and says that it is optional
    expect(within(section).getByTestId('used-pegel-mittel-args')).toHaveTextContent('Gewicht (freiwillig)');
  });

  it('changes the arguments of a method in the input', async () => {
    const run = await open(strategy());
    await choose('Tun');

    const field = screen.getByTestId('used-pegel-mittel-arg-anzahl');
    await run.user.clear(field);
    await run.user.type(field, '7');

    const stored = await saved(run);
    expect(elementOf(stored, 'Tun').inputs).toEqual([{ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [7, 0.5], refresh: false }]);
  });

  it('changes a method to a property of the object, and the input follows', async () => {
    const run = await open(strategy());
    await choose('Tun');

    await pickOption(run.user, screen.getByTestId('used-pegel-mittel-select'), 'Stand');

    const stored = await saved(run);
    expect(elementOf(stored, 'Tun').inputs).toEqual([{ instance: 'pegel', property: 'stand', kind: 'property', arguments: [], refresh: false }]);
  });

  it('offers "Aktualisieren" only for an object whose type has it, and writes it to the input', async () => {
    const run = await open(strategy());
    await choose('Tun');
    expect(screen.getByTestId('used-pegel-mittel-refresh')).not.toBeChecked();

    await run.user.click(screen.getByTestId('used-pegel-mittel-refresh'));

    const stored = await saved(run);
    expect(elementOf(stored, 'Tun').inputs).toEqual([{ ...averageInput, refresh: true }]);
    // the meter cannot refresh: a step that uses it has no such switch
    await choose('Weiche');
    expect(await screen.findByTestId('used-messer-stand-select')).toBeInTheDocument();
    expect(screen.queryByTestId('used-messer-stand-refresh')).toBeNull();
  });

  it('writes the chosen property into the expression of the element that names the value', async () => {
    const run = await open(strategy());
    await choose('Weiche');
    // the expression is read by the backend: the value appears when its answer is there
    const row = await screen.findByTestId('used-messer-stand-select');
    expect(screen.getByTestId('used-messer-stand-where')).toHaveTextContent('im Ausdruck – dort entfernen');
    // a value that only an expression names cannot be removed here
    expect(screen.queryByTestId('used-messer-stand-remove')).toBeNull();

    await pickOption(run.user, row, 'Höchststand');

    await waitFor(() => {
      expect(screen.getByTestId('used-messer-hoch-select')).toBeInTheDocument();
    });
    const stored = await saved(run);
    expect(elementOf(stored, 'Weiche').parameters.formel?.value).toBe('messer.hoch > 1');
    // the expression, not an input, holds the value: no input appeared
    expect(elementOf(stored, 'Weiche').inputs).toEqual([]);
  });

  it('makes an input of a value that only an expression names when "Aktualisieren" is chosen', async () => {
    const run = await open(strategy({ usesGauge: false, formula: 'pegel.stand > 1' }));
    await choose('Weiche');
    const refresh = await screen.findByTestId('used-pegel-stand-refresh');
    expect(screen.queryByTestId('used-pegel-stand-remove')).toBeNull();

    await run.user.click(refresh);

    const stored = await saved(run);
    expect(elementOf(stored, 'Weiche').inputs).toEqual([{ instance: 'pegel', property: 'stand', kind: 'property', arguments: [], refresh: true }]);
    expect(elementOf(stored, 'Weiche').parameters.formel?.value).toBe('pegel.stand > 1');
  });

  it('connects a further value without dragging, with the standard values of a method, and removes an input it made', async () => {
    const run = await open(strategy({ usesGauge: false }));
    await choose('Tun');

    await pickOption(run.user, screen.getByTestId('used-add-object'), 'Pegel');
    await pickOption(run.user, screen.getByTestId('used-add-value'), 'Mittel');
    expect(screen.getByTestId('used-add-arg-anzahl')).toHaveValue('1');
    await run.user.click(screen.getByTestId('used-add-button'));

    expect(screen.getAllByTestId('used-row')).toHaveLength(1);
    // the instance that no element used becomes used here: this is the element of its first use
    const stored = await saved(run);
    expect(elementOf(stored, 'Tun').inputs).toEqual([{ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [1, 1], refresh: false }]);
    expect(stored.elements.find((element) => element.instance?.key === 'pegel')?.instance?.first_use).toBe(elementOf(stored, 'Tun').id);

    await run.user.click(screen.getByTestId('used-pegel-mittel-remove'));
    expect(screen.queryAllByTestId('used-row')).toHaveLength(0);
  });

  it('offers only the objects that can be used at the element, and says so when there is none', async () => {
    const document = strategy({ usesGauge: false });
    const when = elementOf(document, 'Weiche');
    // the report of the backend: the gauge is determined at "Weiche" and cannot be used at "Tun"; the meter can be used everywhere
    const usage = (): Record<string, unknown> => ({
      instances: [
        { instance: 'messer', name: 'Messer', element: 'm', object_type: 'zz.meter', can_refresh: false, connected: false, first_use: null, first_use_source: null, usable_everywhere: true, usable_at: [], usable_at_omitted: false },
        { instance: 'pegel', name: 'Pegel', element: gauge.id, object_type: 'zz.gauge', can_refresh: true, connected: true, first_use: when.id, first_use_source: 'stored', usable_everywhere: false, usable_at: [when.id], usable_at_omitted: false },
      ],
      elements: [{ element: when.id, uses: [{ instance: 'pegel', kind: 'input', by_instance: null, members: [{ name: 'stand', kind: 'property', arguments: [], refresh: false }] }] }],
      strategy_rules: [],
      truncated: false,
    });
    const run = await open(document, { usage });
    await choose('Tun');

    const offered = (): Promise<string[]> => offeredChoices(run.user, screen.getByTestId('used-add-object'));
    // the report of the backend arrives a moment after the document
    await waitFor(async () => {
      expect(await offered()).toEqual(['Objekt wählen …', 'Messer']);
    });
    // the element of the first use takes the gauge
    await choose('Weiche');
    await waitFor(async () => {
      expect(await offered()).toEqual(['Objekt wählen …', 'Messer', 'Pegel']);
    });
  });

  it('shows the findings of a value in its own words: "Aktualisieren" not possible, not usable here', async () => {
    const document = strategy();
    const doIt = elementOf(document, 'Tun');
    const run = await open(document, {
      findings: () => [
        { level: 'error', code: 'input.refresh_not_allowed', element: doIt.id, subject: 'messer', details: { instance: 'messer', property: 'stand', object_type: 'zz.meter' } },
        { level: 'error', code: 'instance.not_usable', element: doIt.id, subject: 'pegel', details: { instance: 'pegel', first_use: doIt.id, use: 'input', by_instance: null, property: 'mittel' } },
      ],
    });
    await menu(run.user, 'check');
    await choose('Tun');

    await waitFor(() => {
      expect(within(screen.getByTestId('sec-used')).getAllByTestId('finding')).toHaveLength(2);
    });
    const findings = within(screen.getByTestId('sec-used')).getAllByTestId('finding');
    expect(findings[0]).toHaveTextContent('kann seine Werte aber nicht neu ermitteln');
    expect(findings[0]).toHaveTextContent('Schalten Sie „Aktualisieren“ für diesen Wert aus');
    expect(findings[1]?.getAttribute('data-code')).toBe('instance.not_usable');
    expect(findings[1]).toHaveTextContent('Pegel');
  });
});

describe('the element of the first use of an object', () => {
  it('is named in the properties view of the object and chosen there without dragging', async () => {
    const run = await open(strategy({ usesGauge: false }));
    await choose('Pegel');

    expect(screen.getByTestId('first-use-text')).toHaveTextContent('Noch kein Element verwendet dieses Objekt.');
    const select = screen.getByTestId('first-use-select');
    expect(await offeredChoices(run.user, select)).toContain('Tun');
    await pickOption(run.user, select, 'Tun');

    await waitFor(() => {
      expect(screen.getByTestId('first-use-text')).toHaveTextContent('Das Objekt wird bei „Tun“ ermittelt.');
    });
    const stored = await saved(run);
    const doIt = elementOf(stored, 'Tun');
    expect(stored.elements.find((element) => element.instance?.key === 'pegel')?.instance?.first_use).toBe(doIt.id);
    // the element needs a value of the object to use it: the first one the object supplies
    expect(doIt.inputs).toEqual([{ instance: 'pegel', property: 'stand', kind: 'property', arguments: [], refresh: false }]);
    await run.user.click(screen.getByTestId('first-use-goto'));
    await waitFor(() => {
      expect(screen.getByTestId('element-name')).toHaveValue('Tun');
    });
  });
});

describe('renaming', () => {
  it('shows the new name at every use at once and keeps the identifier in expressions', async () => {
    const run = await open(strategy());
    await choose('Pegel');

    const name = screen.getByTestId('element-name');
    await run.user.clear(name);
    await run.user.type(name, 'Füllstand');

    expect(nodeByName('Füllstand')).toBeInTheDocument();
    await choose('Tun');
    expect(within(screen.getByTestId('used-group')).getByRole('heading')).toHaveTextContent('Füllstand');
    expect(screen.queryByRole('dialog')).toBeNull();
    const stored = await saved(run);
    expect(stored.elements.find((element) => element.instance?.key === 'pegel')?.instance?.name).toBe('Füllstand');
    expect(elementOf(stored, 'Tun').inputs[0]?.instance).toBe('pegel');
  });
});

describe('the blocks with methods and the earlier value', () => {
  async function formula(_run: Run): Promise<HTMLElement> {
    await choose('Weiche');
    return screen.findByTestId('expression-formel');
  }

  it('offer the methods of an object with their arguments, and connecting one makes an input and the object used here', async () => {
    const run = await open(strategy({ usesGauge: false, formula: 'messer.stand > 1' }));
    const panel = await formula(run);

    const left = await within(panel).findByTestId('cmp-left-select');
    expect(within(await openChoices(run.user, left)).getByRole('option', { name: 'Pegel › Mittel (Methode)' })).toBeInTheDocument();
    await run.user.keyboard('{Escape}');
    await pickOption(run.user, left, 'Pegel › Mittel (Methode)');

    // the arguments are blocks of their own, with their captions
    await waitFor(() => {
      expect(within(panel).getByTestId('method-args')).toHaveTextContent('Anzahl');
    });
    expect(within(panel).getByTestId('method-args')).toHaveTextContent('Gewicht');
    const stored = await saved(run);
    expect(elementOf(stored, 'Weiche').parameters.formel?.value).toBe('pegel.mittel(1; 1) > 1');
    expect(elementOf(stored, 'Weiche').inputs).toEqual([{ instance: 'pegel', property: 'mittel', kind: 'method', arguments: [1, 1], refresh: false }]);
    // no element used the gauge before: "Weiche" is the element of its first use, as when it is connected on the drawing area
    expect(stored.elements.find((element) => element.instance?.key === 'pegel')?.instance?.first_use).toBe(elementOf(stored, 'Weiche').id);
  });

  it('keep the element of the first use when an element uses the object already', async () => {
    const run = await open(strategy({ formula: 'messer.stand > 1' }));
    const panel = await formula(run);

    const left = await within(panel).findByTestId('cmp-left-select');
    await pickOption(run.user, left, 'Pegel › Mittel (Methode)');

    const stored = await saved(run);
    expect(stored.elements.find((element) => element.instance?.key === 'pegel')?.instance?.first_use).toBe(elementOf(stored, 'Tun').id);
  });

  it('list a method that is connected with the element first, with the values of its arguments', async () => {
    const run = await open(strategy({ usesGauge: false, formula: 'messer.stand > 1' }));
    await choose('Weiche');
    await pickOption(run.user, screen.getByTestId('used-add-object'), 'Pegel');
    await pickOption(run.user, screen.getByTestId('used-add-value'), 'Mittel');
    await run.user.click(screen.getByTestId('used-add-button'));

    const left = await within(await screen.findByTestId('expression-formel')).findByTestId('cmp-left-select');
    const groups = choiceGroups(await openChoices(run.user, left)).filter((group) => group.label !== null);
    expect(groups[0]?.label).toBe('Verbundene Werte');
    expect(groups[0]?.options).toEqual(['Pegel › Mittel (1; 1)']);
    // the plain entry of the method stays in the list of the objects, for the standard values of its arguments
    expect(groups.flatMap((group) => group.options)).toContain('Pegel › Mittel (Methode)');
  });

  it('put "vorheriger Wert von" around a value, with the number of candles back', async () => {
    const run = await open(strategy({ formula: 'messer.stand > 1' }));
    const panel = await formula(run);

    const left = await within(panel).findByTestId('cmp-left-select');
    await pickOption(run.user, left, 'k:prev');
    const count = await within(panel).findByTestId('cmp-left-previous-count');
    await run.user.clear(count);
    await run.user.type(count, '3');

    const stored = await saved(run);
    expect(String(elementOf(stored, 'Weiche').parameters.formel?.value)).toBe('PREVIOUS(messer.stand; 3) > 1');
  });

  it('do not offer a crossing when neither side has an earlier value', async () => {
    const run = await open(strategy({ usesGauge: false, formula: 'pegel.stand > 2' }));
    const panel = await formula(run);

    const kind = await within(panel).findByTestId('cond-kind');
    expect(disabledChoices(await openChoices(run.user, kind))).toEqual(['Kreuzung']);
    await run.user.keyboard('{Escape}');
    // a value with an earlier value on one side: the comparison can become a crossing
    await pickOption(run.user, await within(panel).findByTestId('cmp-left-select'), 'n:messer\u001fwert');
    await waitFor(async () => {
      expect(disabledChoices(await openChoices(run.user, within(panel).getByTestId('cond-kind')))).toEqual([]);
      await run.user.keyboard('{Escape}');
    });
  });
});

describe('removing what others use', () => {
  it('asks with the list of the elements that use an object, and removes it with an empty place in the expression', async () => {
    const run = await open(strategy({ formula: 'messer.stand > 1' }));
    await choose('Messer');

    await run.user.click(screen.getByTestId('remove-element'));

    const dialog = await screen.findByRole('dialog', { name: 'Element entfernen?' });
    expect(within(dialog).getByTestId('remove-users')).toHaveTextContent('Weiche');
    expect(within(dialog).getByTestId('remove-users')).not.toHaveTextContent('Tun');
    await run.user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));

    await waitFor(() => {
      expect(screen.queryAllByTestId('node').filter((node) => node.dataset.nodeName === 'Messer')).toHaveLength(0);
    });
    expect(run.api.requests('POST', /\/api\/v1\/removals$/)).toHaveLength(2);
    const stored = await saved(run);
    expect(stored.elements.some((element) => element.instance?.key === 'messer')).toBe(false);
    expect(elementOf(stored, 'Weiche').parameters.formel?.value).toBe(' > 1');
  });

  it('removes an input together with the object it came from', async () => {
    const run = await open(strategy());
    await choose('Pegel');

    await run.user.click(screen.getByTestId('remove-element'));
    const dialog = await screen.findByRole('dialog', { name: 'Element entfernen?' });
    expect(within(dialog).getByTestId('remove-users')).toHaveTextContent('Tun');
    await run.user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));

    await waitFor(() => {
      expect(screen.queryAllByTestId('card').filter((node) => node.dataset.nodeName === 'Pegel')).toHaveLength(0);
    });
    const stored = await saved(run);
    expect(elementOf(stored, 'Tun').inputs).toEqual([]);
  });

  it('removes a step nobody uses without a question, and joins its neighbours', async () => {
    const run = await open(strategy());
    await choose('Tun');

    await run.user.click(screen.getByTestId('remove-element'));

    await waitFor(() => {
      expect(screen.queryAllByTestId('node').filter((node) => node.dataset.nodeName === 'Tun')).toHaveLength(0);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    const stored = await saved(run);
    const when = elementOf(stored, 'Weiche');
    const place = elementOf(stored, 'Ausführen');
    expect(stored.connections.some((connection) => connection.source === when.id && connection.output === 'yes' && connection.target === place.id)).toBe(true);
  });
});

describe('with the strategy of the client', () => {
  async function ema(): Promise<Run> {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await openStored(user, 'EMA-Trendfolge');
    await waitFor(() => {
      expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
    });
    return { user, api, document: emaTrendfolge() as unknown as StrategyDocument };
  }

  it('asks before a strategy parameter that expressions use is removed, and lists the steps that use it', async () => {
    const run = await ema();
    await run.user.click(screen.getAllByTestId('param-chip').find((chip) => chip.textContent?.includes('Stop abstand')) as HTMLElement);

    await run.user.click(screen.getByTestId('param-delete'));

    const dialog = await screen.findByRole('dialog', { name: 'Strategieparameter entfernen?' });
    expect(within(dialog).getByTestId('remove-users')).toHaveTextContent('StopLoss');
    await run.user.click(within(dialog).getByRole('button', { name: 'Entfernen' }));
    await waitFor(() => {
      expect(screen.queryAllByTestId('param-chip').some((chip) => chip.textContent?.includes('Stop abstand'))).toBe(false);
    });
    const stored = await saved(run);
    expect(JSON.stringify(stored)).not.toContain('stop_abstand');
  });

  it('describes the objects of the application that are not on the drawing area in the properties view of the strategy', async () => {
    const run = await ema();
    await run.user.click(screen.getByTestId('status-pill'));

    const section = await screen.findByTestId('sec-application-objects');
    const objects = within(section).getAllByTestId('app-object');
    expect(objects.map((object) => object.getAttribute('data-type'))).toEqual(expect.arrayContaining(['Order', 'Position', 'Strategie']));
    const order = objects.find((object) => object.getAttribute('data-type') === 'Order') as HTMLElement;
    // each entry has its data type and a description that stands there, not only when pointed at
    const row = within(order).getAllByTestId('prop-row')[0] as HTMLElement;
    expect(within(row).getByTestId('prop-desc').textContent).not.toBe('');
    expect(order.textContent).not.toMatch(/[a-z]+_[a-z]+/);
  });
});
