import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import type { Finding } from './api/objects';
import type { ElementDocument, StrategyDocument } from './document/types';
import { clickEmptyArea, clickNode, elementNodes, menu, nodeByTitle, openStored, waitForReady } from './testing/actions';
import { mockBackend, type MockBackendOptions } from './testing/backend';
import { loadTestcase } from './testing/fixtures';
import { inventedWire } from './testing/inventedTypes';
import { renderWithProviders } from './test-utils';

const stored = loadTestcase('str-03');

type User = ReturnType<typeof userEvent.setup>;

async function openStrategy(options: MockBackendOptions = { strategies: [stored] }, title = 'EMA-Trendfolge') {
  const user = userEvent.setup();
  const backend = mockBackend(options);
  renderWithProviders(<App />);
  await waitForReady();
  await openStored(user, title);
  await waitFor(() => {
    expect(elementNodes().length).toBeGreaterThan(0);
  });
  return { user, backend };
}

function properties(): HTMLElement {
  return screen.getByRole('complementary', { name: 'Eigenschaften' });
}

async function select(title: string) {
  clickNode(nodeByTitle(title));
  await within(properties()).findByRole('heading', { level: 2, name: title });
}

async function saved(user: User, backend: ReturnType<typeof mockBackend>): Promise<StrategyDocument> {
  await menu(user, 'Speichern');
  await waitFor(() => {
    expect(backend.requests('PUT', /strategies\/.+/).length).toBeGreaterThan(0);
  });
  const calls = backend.requests('PUT', /strategies\/.+/);
  return calls[calls.length - 1]?.body as StrategyDocument;
}

function element(document: StrategyDocument, predicate: (candidate: ElementDocument) => boolean): ElementDocument {
  return document.elements.find(predicate) as ElementDocument;
}

describe('the property view of an element, built from its type description', () => {
  it('shows label, name and the expression of a condition, and the type with its description', async () => {
    await openStrategy();

    await select('Kreuzen');

    const view = properties();
    expect(within(view).getByText('Bedingung')).toBeInTheDocument();
    expect(within(view).getByText('Verzweigt den Ablauf nach dem Ergebnis eines Ausdrucks.')).toBeInTheDocument();
    expect(within(view).getByLabelText('Bezeichnung')).toHaveValue('Kreuzen');
    expect(within(view).getByLabelText('Name')).toHaveValue('');
    const expression = within(view).getByRole('combobox', { name: 'Ausdruck' });
    expect(expression).toHaveValue(String(element(stored, (e) => e.title === 'Kreuzen').parameters.ausdruck?.value));
    // The expression is the only kind of binding of this parameter: no choice of the kind.
    expect(within(view).queryByLabelText('Bindungsart von Ausdruck')).toBeNull();
  });

  it('shows the name of a calculation, but none for an element that has no results', async () => {
    await openStrategy();

    await select('Richtung');
    expect(within(properties()).getByLabelText('Name')).toHaveValue('richtung');
    await select('Position schließen');
    expect(within(properties()).queryByLabelText('Name')).toBeNull();
  });

  it('changes the label and the name in the document and on the drawing area', async () => {
    const { user, backend } = await openStrategy();
    await select('Richtung');

    await user.clear(within(properties()).getByLabelText('Bezeichnung'));
    await user.type(within(properties()).getByLabelText('Bezeichnung'), 'Handelsrichtung');
    await user.clear(within(properties()).getByLabelText('Name'));
    await user.type(within(properties()).getByLabelText('Name'), 'handel');

    expect(nodeByTitle('Handelsrichtung')).toHaveTextContent('Berechnung · handel');
    const result = await saved(user, backend);
    expect(element(result, (e) => e.title === 'Handelsrichtung')).toMatchObject({ name: 'handel' });
  });

  it('shows the parameters of the type and the properties of the order that the user sets, by the selected order type', async () => {
    await openStrategy();

    await select('Order aufgeben');

    const view = properties();
    // The selection of the order type is fixed only: one value to choose, no kind of binding.
    expect(within(view).getByRole('combobox', { name: 'Ordertyp' })).toHaveDisplayValue('Marktorder');
    const labels = Array.from(view.querySelectorAll('.binding-row .binding-label')).map((label) =>
      label.textContent?.replace(/ \*$/, ''),
    );
    expect(labels).toEqual(['Ordertyp', 'Bemerkung', 'Richtung', 'Volumen', 'Stop-Loss', 'Take-Profit']);
    // Properties the application sets (Order-ID, Status, Konto, Instrument) are not offered.
    expect(within(view).queryByLabelText('Status')).toBeNull();
    expect(within(view).queryByLabelText('Order-ID')).toBeNull();
  });

  it('shows other properties after the order type is changed, and the conditional ones only for the matching value', async () => {
    const { user, backend } = await openStrategy();
    await select('Order aufgeben');
    const view = properties();

    await user.selectOptions(within(view).getByRole('combobox', { name: 'Ordertyp' }), 'Stop-Order');

    expect(within(view).getByRole('combobox', { name: 'Bindungsart von Preis' })).toBeInTheDocument();
    expect(within(view).getByRole('combobox', { name: 'Bindungsart von Gültigkeit' })).toBeInTheDocument();
    // The expiry time applies to the validity "bis Zeitpunkt" only.
    expect(within(view).queryByLabelText('Bindungsart von Ablaufzeit')).toBeNull();
    expect(within(view).queryByLabelText('Bindungsart von Datum')).toBeNull();
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Bindungsart von Gültigkeit' }), 'fester Wert');
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Gültigkeit' }), 'bis Zeitpunkt');
    expect(within(view).getByLabelText('Bindungsart von Ablaufzeit')).toBeInTheDocument();
    expect(within(view).queryByLabelText('Bindungsart von Datum')).toBeNull();
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Gültigkeit' }), 'bis Ende eines Tages');
    expect(within(view).queryByLabelText('Bindungsart von Ablaufzeit')).toBeNull();
    expect(within(view).getByLabelText('Bindungsart von Datum')).toBeInTheDocument();

    const result = await saved(user, backend);
    expect(element(result, (e) => e.type === 'flow.place_order').parameters.ordertyp).toEqual({ kind: 'fixed', value: 'StopOrder' });
    expect(element(result, (e) => e.type === 'flow.place_order').properties.gueltigkeit).toEqual({ kind: 'fixed', value: 'bis_ende_eines_tages' });
  });

  it('changes the binding of a property: fixed value, parameter, expression, application, not set', async () => {
    const { user, backend } = await openStrategy();
    await select('Order aufgeben');
    const view = properties();
    const kind = within(view).getByRole('combobox', { name: 'Bindungsart von Volumen' });
    expect(kind).toHaveDisplayValue('nicht belegt');

    await user.selectOptions(kind, 'fester Wert');
    const input = within(view).getByRole('textbox', { name: 'Volumen' });
    await user.clear(input);
    await user.type(input, '0.5');
    let result = await saved(user, backend);
    expect(element(result, (e) => e.type === 'flow.place_order').properties.volumen).toEqual({ kind: 'fixed', value: 0.5 });

    await user.selectOptions(kind, 'Parameter');
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Volumen' }), 'stop_abstand');
    result = await saved(user, backend);
    expect(element(result, (e) => e.type === 'flow.place_order').properties.volumen).toEqual({ kind: 'parameter', value: 'stop_abstand' });

    await user.selectOptions(kind, 'Ausdruck');
    await user.type(within(view).getByRole('combobox', { name: 'Volumen' }), 'Konto.kapital / 100');
    result = await saved(user, backend);
    expect(element(result, (e) => e.type === 'flow.place_order').properties.volumen).toEqual({ kind: 'expression', value: 'Konto.kapital / 100' });

    await user.selectOptions(kind, 'bei der Anwendung');
    result = await saved(user, backend);
    expect(element(result, (e) => e.type === 'flow.place_order').properties.volumen).toEqual({ kind: 'application' });

    await user.selectOptions(kind, 'nicht belegt');
    result = await saved(user, backend);
    expect(element(result, (e) => e.type === 'flow.place_order').properties).not.toHaveProperty('volumen');
  });

  it('does not store a number that is not a number, and marks the input', async () => {
    const { user, backend } = await openStrategy();
    await select('Order aufgeben');
    const view = properties();
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Bindungsart von Volumen' }), 'fester Wert');
    const input = within(view).getByRole('textbox', { name: 'Volumen' });
    await user.clear(input);

    await user.type(input, '1');
    await user.type(input, 'x');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    const result = await saved(user, backend);
    expect(element(result, (e) => e.type === 'flow.place_order').properties.volumen).toEqual({ kind: 'fixed', value: 1 });
  });

  it('shows an instance with its name, its origin and the parameters of its type, in the datatype of each', async () => {
    const { user, backend } = await openStrategy();

    await select('ema20');

    const view = properties();
    expect(within(view).getByText('ema20, aus Objekttyp EMA')).toBeInTheDocument();
    expect(within(view).getByLabelText('Name')).toHaveValue('ema20');
    // Zeiteinheit is bound to a strategy parameter, Periode is a whole number, Kursquelle a choice.
    expect(within(view).getByRole('combobox', { name: 'Bindungsart von Zeiteinheit' })).toHaveDisplayValue('Parameter');
    expect(within(view).getByRole('combobox', { name: 'Zeiteinheit' })).toHaveDisplayValue('zeiteinheit');
    expect(within(view).getByRole('textbox', { name: 'Periode' })).toHaveValue('20');
    expect(within(view).getByRole('combobox', { name: 'Kursquelle' })).toHaveDisplayValue('Schlusskurs');
    expect(within(view).getByRole('combobox', { name: 'Kursquelle' })).toBeEnabled();

    await user.clear(within(view).getByRole('textbox', { name: 'Periode' }));
    await user.type(within(view).getByRole('textbox', { name: 'Periode' }), '25');
    await user.type(within(view).getByRole('textbox', { name: 'Periode' }), '.5');
    expect(within(view).getByRole('textbox', { name: 'Periode' })).toHaveAttribute('aria-invalid', 'true');
    await user.type(within(view).getByRole('textbox', { name: 'Periode' }), '{Backspace}{Backspace}');

    const result = await saved(user, backend);
    expect(element(result, (e) => e.instance?.name === 'ema20').instance?.parameter_values?.periode).toEqual({ kind: 'fixed', value: 25 });
  });

  it('renames an instance, and the name is the title of its node', async () => {
    const { user, backend } = await openStrategy();
    await select('ema20');

    await user.clear(within(properties()).getByLabelText('Name'));
    await user.type(within(properties()).getByLabelText('Name'), 'schnell');

    expect(nodeByTitle('schnell')).toBeInTheDocument();
    const result = await saved(user, backend);
    expect(result.elements.filter((e) => e.instance?.name === 'schnell')).toHaveLength(1);
  });

  it('shows the time unit as a choice of all time units, in the capital letters of the units', async () => {
    const { user } = await openStrategy();
    await select('ema20');
    const view = properties();

    await user.selectOptions(within(view).getByRole('combobox', { name: 'Bindungsart von Zeiteinheit' }), 'fester Wert');

    const options = within(within(view).getByRole('combobox', { name: 'Zeiteinheit' })).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(expect.arrayContaining(['M1', 'M15', 'H1', 'H12', 'D1', 'W1', 'MN1']));
    expect(options.filter((option) => option !== 'bitte wählen')).toHaveLength(21);
  });

  it('tells for each parameter its label in the language of the interface, from the type description', async () => {
    const { user } = await openStrategy();
    await select('ema20');

    await user.click(screen.getByRole('button', { name: 'Einstellungen' }));
    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });
    await user.selectOptions(within(dialog).getByLabelText('Sprache'), 'English');
    await waitFor(() => {
      expect(within(dialog).getByLabelText('Language')).toBeEnabled();
    });
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    const view = screen.getByRole('complementary', { name: 'Properties' });
    expect(within(view).getByRole('textbox', { name: 'Period' })).toBeInTheDocument();
    expect(within(view).getByRole('combobox', { name: 'Price source' })).toHaveDisplayValue('close price');
    expect(within(view).getByText('ema20, from object type EMA')).toBeInTheDocument();
  });
});

describe('the property view of the strategy', () => {
  it('shows title, description and parameters, and changes them', async () => {
    const { user, backend } = await openStrategy();
    const view = properties();
    expect(within(view).getByLabelText('Bezeichnung')).toHaveValue('EMA-Trendfolge');
    // The parameter of a time unit is a choice of the time units, the other one a number.
    expect(within(view).getByRole('combobox', { name: 'Wert von zeiteinheit' })).toHaveDisplayValue('H1');
    expect(within(view).getByRole('textbox', { name: 'Wert von stop_abstand' })).toHaveValue('2');

    await user.clear(within(view).getByLabelText('Beschreibung'));
    await user.type(within(view).getByLabelText('Beschreibung'), 'Neu');
    await user.clear(within(view).getByRole('textbox', { name: 'Wert von stop_abstand' }));
    await user.type(within(view).getByRole('textbox', { name: 'Wert von stop_abstand' }), '3');

    const result = await saved(user, backend);
    expect(result.description).toBe('Neu');
    expect(result.parameters.find((parameter) => parameter.name === 'stop_abstand')).toMatchObject({ datatype: 'number', value: 3 });
  });

  it('adds, changes and removes parameters of every datatype', async () => {
    const { user, backend } = await openStrategy();
    const view = properties();

    await user.click(within(view).getByRole('button', { name: 'Parameter hinzufügen' }));
    expect(within(view).getByRole('textbox', { name: 'Name des Parameters 3' })).toHaveValue('parameter');
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Datentyp von parameter' }), 'Zeiteinheit');
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Wert von parameter' }), 'H4');
    await user.click(within(view).getByRole('button', { name: 'Parameter hinzufügen' }));
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Datentyp von parameter1' }), 'Prozent');
    await user.type(within(view).getByRole('textbox', { name: 'Wert von parameter1' }), '{Backspace}2.5');
    await user.click(within(view).getByRole('button', { name: 'Parameter hinzufügen' }));
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Datentyp von parameter2' }), 'Auswahl');
    await user.type(within(view).getByRole('textbox', { name: 'Werte von parameter2' }), 'a, b');
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Wert von parameter2' }), 'b');
    await user.click(within(view).getByRole('button', { name: 'Parameter hinzufügen' }));
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Datentyp von parameter3' }), 'Wahrheitswert');
    await user.click(within(view).getByRole('checkbox', { name: 'Wert von parameter3' }));
    await user.click(within(view).getByRole('button', { name: 'Parameter hinzufügen' }));
    await user.click(within(view).getAllByRole('checkbox', { name: 'bei der Anwendung' })[6] as HTMLElement);

    const result = await saved(user, backend);
    const added = result.parameters.slice(2);
    expect(added[0]).toMatchObject({ name: 'parameter', datatype: 'time_unit', value: 'h4' });
    expect(added[1]).toMatchObject({ name: 'parameter1', datatype: 'percent', value: 0.025 });
    expect(added[2]).toMatchObject({ name: 'parameter2', datatype: 'choice', value: 'b', choices: ['a', 'b'] });
    expect(added[3]).toMatchObject({ name: 'parameter3', datatype: 'boolean', value: true });
    expect(added[4]).toMatchObject({ name: 'parameter4', at_application: true, value: null });

    await user.click(within(properties()).getByRole('button', { name: 'Parameter parameter entfernen' }));
    expect((await saved(user, backend)).parameters.map((parameter) => parameter.name)).not.toContain('parameter');
  });

  it('names a parameter that is not stored a second time with the next free name', async () => {
    const { user } = await openStrategy();
    await user.click(within(properties()).getByRole('button', { name: 'Parameter hinzufügen' }));
    await user.click(within(properties()).getByRole('button', { name: 'Parameter hinzufügen' }));

    expect(within(properties()).getByRole('textbox', { name: 'Name des Parameters 3' })).toHaveValue('parameter');
    expect(within(properties()).getByRole('textbox', { name: 'Name des Parameters 4' })).toHaveValue('parameter1');
  });
});

describe('rules', () => {
  const owner = stored.elements.find((element) => element.type === 'flow.place_order') as ElementDocument;

  it('lists the rules of the strategy, and of an element that allows rules, and of no other element', async () => {
    await openStrategy();

    expect(within(properties()).getByRole('button', { name: 'Regel risiko auswählen' })).toHaveTextContent('Risiko je Trade');
    await select('Order aufgeben');
    expect(within(properties()).getByRole('button', { name: 'Regel mindestvolumen auswählen' })).toBeInTheDocument();
    await select('Kreuzen');
    expect(within(properties()).queryByRole('region', { name: 'Regeln' })).toBeNull();
  });

  it('adds a template from the element library to the strategy: a copy, with its origin', async () => {
    const { user, backend } = await openStrategy();

    await user.click(within(properties()).getByRole('button', { name: 'Hinzufügen' }));

    // The copy is selected: its view says where it comes from.
    expect(await screen.findByText('risiko_je_trade, aus Vorlage Risiko je Trade')).toBeInTheDocument();
    const result = await saved(user, backend);
    expect(result.rules).toHaveLength(2);
    expect(result.rules[1]).toMatchObject({
      name: 'risiko_je_trade',
      object_type: 'Regel',
      origin: { template_id: '7c1d4e2a-5b3f-4a86-9d27-e1f0a3c8b645', template_title: 'Risiko je Trade' },
      determined_property: 'volumen',
      comparison: 'hoechstens',
      parameter_values: { risikogrenze: { kind: 'fixed', value: 0.01 } },
    });
    expect(result.rules[1]?.expression).toBe(stored.rules[0]?.expression);
  });

  it('adds a new rule: name, parameters, expression, determined property, comparison', async () => {
    const { user, backend } = await openStrategy();

    await user.click(within(properties()).getByRole('button', { name: 'Neue Regel' }));
    const view = properties();
    expect(await within(view).findByRole('heading', { level: 2, name: 'regel' })).toBeInTheDocument();
    expect(within(view).getByText('regel, aus Objekttyp Regel')).toBeInTheDocument();

    await user.clear(within(view).getByLabelText('Name'));
    await user.type(within(view).getByLabelText('Name'), 'grenze');
    await user.click(within(view).getByRole('button', { name: 'Parameter hinzufügen' }));
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Datentyp von parameter' }), 'Prozent');
    await user.type(within(view).getByRole('combobox', { name: 'Ausdruck' }), 'Order.volumen <= parameter');
    await user.selectOptions(within(view).getByLabelText('Bestimmte Eigenschaft der Order'), 'Volumen');
    await user.selectOptions(within(view).getByLabelText('Vergleich beim Prüfen'), 'höchstens');

    const result = await saved(user, backend);
    expect(result.rules.at(-1)).toMatchObject({
      name: 'grenze',
      object_type: 'Regel',
      expression: 'Order.volumen <= parameter',
      determined_property: 'volumen',
      comparison: 'hoechstens',
      parameters: [{ name: 'parameter', datatype: 'percent', required: false }],
    });
  });

  it('offers the time units of the descriptions for the value of an own parameter of a rule', async () => {
    const { user, backend } = await openStrategy();
    await user.click(within(properties()).getByRole('button', { name: 'Neue Regel' }));
    const view = properties();
    await within(view).findByRole('heading', { level: 2, name: 'regel' });
    await user.click(within(view).getByRole('button', { name: 'Parameter hinzufügen' }));
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Datentyp von parameter' }), 'Zeiteinheit');

    await user.selectOptions(within(view).getByRole('combobox', { name: 'Bindungsart von parameter' }), 'fester Wert');

    const select = within(view).getByRole('combobox', { name: 'parameter' });
    const options = within(select).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(expect.arrayContaining(['M1', 'H1']));
    await user.selectOptions(select, 'H1');
    const result = await saved(user, backend);
    expect(result.rules.at(-1)?.parameter_values).toEqual({ parameter: { kind: 'fixed', value: 'h1' } });
  });

  it('adds a rule to an element', async () => {
    const { user, backend } = await openStrategy();
    await select('Order aufgeben');

    await user.click(within(properties()).getByRole('button', { name: 'Neue Regel' }));
    await user.click(await within(properties()).findByRole('button', { name: /Zurück zu Order aufgeben/ }));

    const view = properties();
    expect(await within(view).findByRole('heading', { level: 2, name: 'Order aufgeben' })).toBeInTheDocument();
    expect(within(view).getAllByRole('button', { name: /^Regel .* auswählen$/ })).toHaveLength(2);
    const result = await saved(user, backend);
    expect(element(result, (e) => e.id === owner.id).rules.map((rule) => rule.name)).toEqual(['mindestvolumen', 'regel']);
  });

  it('changes the order of the rules and removes a rule', async () => {
    const { user, backend } = await openStrategy();
    await user.click(within(properties()).getByRole('button', { name: 'Hinzufügen' }));
    await user.click(await screen.findByRole('button', { name: /Zurück zu Strategie/ }));
    const view = properties();
    expect(within(view).getByRole('button', { name: 'Regel risiko nach oben' })).toBeDisabled();
    expect(within(view).getByRole('button', { name: 'Regel risiko_je_trade nach unten' })).toBeDisabled();

    await user.click(within(view).getByRole('button', { name: 'Regel risiko_je_trade nach oben' }));
    let result = await saved(user, backend);
    expect(result.rules.map((rule) => rule.name)).toEqual(['risiko_je_trade', 'risiko']);

    await user.click(within(properties()).getByRole('button', { name: 'Regel risiko entfernen' }));
    result = await saved(user, backend);
    expect(result.rules.map((rule) => rule.name)).toEqual(['risiko_je_trade']);
  });

  it('shows a rule with its origin, parameters, expression and findings', async () => {
    const findings: Finding[] = [
      { level: 'error', code: 'rule.comparison_missing', element: null, subject: 'risiko', details: {} },
      { level: 'hint', code: 'flow.no_order_reachable', element: null, subject: null, details: {} },
    ];
    const { user } = await openStrategy({ strategies: [stored], findings });
    // The findings are known after the opening: the rule shows its own count, the strategy the other one.
    const view = properties();
    expect(await within(view).findByText('1 Fehler')).toBeInTheDocument();
    expect(within(view).getAllByText('Vom Auslöser aus ist kein Element erreichbar, das eine Order aufgibt.')).toHaveLength(1);

    await user.click(within(view).getByRole('button', { name: 'Regel risiko auswählen' }));

    const rule = properties();
    expect(within(rule).getByText('risiko, aus Vorlage Risiko je Trade')).toBeInTheDocument();
    expect(within(rule).getByText('Die bestimmende Regel nennt keinen Vergleich beim Prüfen.')).toBeInTheDocument();
    expect(within(rule).queryByText('Die Strategie hat keinen Auslöser.')).toBeNull();
    // The parameter "Risikogrenze" of the template is a percentage: 0.01 is shown as 1 %.
    expect(within(rule).getByRole('textbox', { name: 'risikogrenze' })).toHaveValue('1');
    expect(within(rule).getByRole('combobox', { name: 'Ausdruck' })).toHaveValue(String(stored.rules[0]?.expression));
    expect(within(rule).getByLabelText('Bestimmte Eigenschaft der Order')).toHaveDisplayValue('Volumen');
    expect(within(rule).getByLabelText('Vergleich beim Prüfen')).toHaveDisplayValue('höchstens');

    await user.click(within(rule).getByRole('button', { name: 'Zurück zu Strategie' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Strategie' })).toBeInTheDocument();
  });

  it('changes a percentage as the percent, and stores it as the share', async () => {
    const { user, backend } = await openStrategy();
    await user.click(within(properties()).getByRole('button', { name: 'Regel risiko auswählen' }));
    const input = within(properties()).getByRole('textbox', { name: 'risikogrenze' });

    await user.clear(input);
    await user.type(input, '7');

    const result = await saved(user, backend);
    // 7 % is the share 0.07, without a floating-point error (7 / 100 would be 0.07 too, 29 / 100 would not).
    expect(result.rules[0]?.parameter_values?.risikogrenze).toEqual({ kind: 'fixed', value: 0.07 });
    expect(JSON.stringify(result.rules[0]?.parameter_values)).toContain('0.07}');
  });

  it('renames the parameters of a rule and keeps their values', async () => {
    const { user, backend } = await openStrategy();
    await user.click(within(properties()).getByRole('button', { name: 'Regel risiko auswählen' }));

    const name = within(properties()).getByRole('textbox', { name: 'Name des Parameters 1' });
    await user.clear(name);
    await user.type(name, 'grenze');

    const result = await saved(user, backend);
    expect(result.rules[0]?.parameters?.[0]?.name).toBe('grenze');
    expect(result.rules[0]?.parameter_values).toEqual({ grenze: { kind: 'fixed', value: 0.01 } });
  });

  it('adds a rule of the library to a rule set, and the rule set shows its result expression', async () => {
    const ruleset = {
      name: 'werk',
      object_type: 'Regelwerk',
      origin: { object_type: 'Regelwerk', template_id: null, template_title: null },
      parameter_values: {},
      parameters: [],
      properties: [],
      instances: [],
      rules: [],
      expression: null,
      determined_property: null,
      comparison: null,
      result_expression: null,
    };
    const { user, backend } = await openStrategy({ strategies: [{ ...stored, rules: [...stored.rules, ruleset] }] });

    await user.click(within(properties()).getByRole('button', { name: 'Regel werk auswählen' }));
    const view = properties();
    expect(within(view).getByRole('combobox', { name: 'Ausdruck für das Gesamtergebnis' })).toBeInTheDocument();
    await user.click(within(view).getByRole('button', { name: 'Hinzufügen' }));

    const result = await saved(user, backend);
    expect(result.rules[1]?.rules?.map((rule) => rule.name)).toEqual(['risiko_je_trade']);
    expect(result.rules[0]?.name).toBe('risiko');
  });
});

describe('properties built from types the interface cannot know', () => {
  async function inventedStrategy() {
    const user = userEvent.setup();
    const backend = mockBackend({ elementTypes: inventedWire() });
    renderWithProviders(<App />);
    await waitForReady();
    await menu(user, 'Neue Strategie');
    return { user, backend };
  }

  it('offers the library and the new strategy from the descriptions', async () => {
    await inventedStrategy();

    // The new strategy is empty, whatever triggers the descriptions have.
    expect(elementNodes()).toHaveLength(0);
    for (const name of ['zz.pulse (de)', 'zz.gate (de)', 'zz.launch (de)', 'zz.sweep (de)', 'Planet (de)', 'Zork (de)', 'Zz limit']) {
      expect(screen.getAllByRole('option', { name: new RegExp(`^${name.replace(/[.()]/g, '\\$&')}`) }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole('option', { name: /Kerzenschluss/ })).toBeNull();
  });

  it('offers as time units the values the description lists, nothing else', async () => {
    const { user } = await inventedStrategy();
    await user.click(screen.getByRole('option', { name: /^zz\.pulse \(de\)/ }));
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 2, name: 'zz.pulse (de)' });
    const view = properties();

    await user.selectOptions(within(view).getByLabelText('Bindungsart von period (de)'), 'fester Wert');

    const select = within(view).getByRole('combobox', { name: 'period (de)' });
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['bitte wählen', 'QQ1', 'QQ7']);
    expect(within(select).queryByRole('option', { name: 'H1' })).toBeNull();
  });

  it('offers the same time units for a strategy parameter of the datatype time unit', async () => {
    const { user } = await inventedStrategy();
    clickEmptyArea();
    await user.click(screen.getByRole('button', { name: 'Parameter hinzufügen' }));
    const view = properties();
    await user.selectOptions(within(view).getByRole('combobox', { name: 'Datentyp von parameter' }), 'Zeiteinheit');

    const select = within(view).getByRole('combobox', { name: 'Wert von parameter' });
    expect(within(select).getAllByRole('option').map((option) => option.textContent)).toEqual(['bitte wählen', 'QQ1', 'QQ7']);
  });

  it('gives a name field to the element whose description says it is named, and to no other', async () => {
    const { user } = await inventedStrategy();
    await user.click(screen.getByRole('option', { name: /^zz\.gate \(de\)/ }));
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 2, name: 'zz.gate (de)' });
    expect(within(properties()).getByLabelText('Name')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /^zz\.sweep \(de\)/ }));
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 2, name: 'zz.sweep (de)' });
    expect(within(properties()).queryByLabelText('Name')).toBeNull();
  });

  it('hangs the frame at the output of the description and lets no connection start there', async () => {
    const { user } = await inventedStrategy();
    await user.click(screen.getByRole('option', { name: /^zz\.launch \(de\)/ }));
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 2, name: 'zz.launch (de)' });

    const owner = nodeByTitle('zz.launch (de)');
    expect(owner.querySelectorAll('.react-flow__handle.source')).toHaveLength(2);
    expect(owner.querySelector('.react-flow__handle[data-handleid="sent"]')).not.toHaveClass('connectable');
    expect(owner.querySelector('.react-flow__handle[data-handleid="refused"]')).toHaveClass('connectable');
    expect(document.querySelectorAll('.react-flow__node-management')).toHaveLength(1);
  });

  it('builds one input per parameter by its datatype, with the kinds of binding it allows', async () => {
    const { user } = await inventedStrategy();
    await user.click(screen.getByRole('option', { name: /^zz\.gate \(de\)/ }));
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 2, name: 'zz.gate (de)' });
    const view = properties();

    // An expression only allows the expression: no choice of the kind.
    expect(within(view).queryByLabelText('Bindungsart von formula (de)')).toBeNull();
    expect(within(view).getByRole('combobox', { name: 'formula (de)' })).toBeInTheDocument();
    // A percentage, a whole number with a standard value, a truth value, a text, a choice with a standard value.
    await user.selectOptions(within(view).getByLabelText('Bindungsart von limit (de)'), 'fester Wert');
    expect(within(view).getByRole('textbox', { name: 'limit (de)' })).toBeInTheDocument();
    expect(within(view).getByRole('textbox', { name: 'count (de)' })).toHaveValue('3');
    await user.selectOptions(within(view).getByLabelText('Bindungsart von flag (de)'), 'fester Wert');
    expect(within(view).getByRole('checkbox', { name: 'flag (de)' })).not.toBeChecked();
    await user.selectOptions(within(view).getByLabelText('Bindungsart von note (de)'), 'fester Wert');
    expect(within(view).getByRole('textbox', { name: 'note (de)' })).toHaveValue('');
    expect(within(view).getByRole('combobox', { name: 'mode (de)' })).toHaveDisplayValue('fast (de)');
    await user.selectOptions(within(view).getByLabelText('Bindungsart von day (de)'), 'fester Wert');
    expect(within(view).getByLabelText('day (de)')).toHaveAttribute('type', 'date');
    // The parameter that applies at the value "slow" of "mode" is not there for "fast".
    expect(within(view).queryByLabelText('since (de)')).toBeNull();
    await user.selectOptions(within(view).getByRole('combobox', { name: 'mode (de)' }), 'slow (de)');
    expect(within(view).getByLabelText('Bindungsart von since (de)')).toBeInTheDocument();
    await user.selectOptions(within(view).getByLabelText('Bindungsart von since (de)'), 'fester Wert');
    expect(within(view).getByLabelText('since (de)')).toHaveAttribute('type', 'datetime-local');
  });

  it('shows the properties of the order that the selected order type has, whatever its name, and a frame for the element', async () => {
    const { user } = await inventedStrategy();
    await user.click(screen.getByRole('option', { name: /^zz\.launch \(de\)/ }));
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 2, name: 'zz.launch (de)' });
    const view = properties();

    expect(within(view).getByRole('combobox', { name: 'shape (de)' })).toHaveDisplayValue('ZzOrderA (de)');
    expect(within(view).getByLabelText('Bindungsart von amount (de)')).toBeInTheDocument();
    expect(within(view).getByLabelText('Bindungsart von reason (de)')).toBeInTheDocument();
    expect(within(view).queryByLabelText('Bindungsart von serial (de)')).toBeNull();
    expect(within(view).queryByLabelText('Bindungsart von trigger_price (de)')).toBeNull();
    // The type allows rules.
    expect(within(view).getByRole('region', { name: 'Regeln' })).toBeInTheDocument();
    await user.selectOptions(within(view).getByRole('combobox', { name: 'shape (de)' }), 'ZzOrderB (de)');
    expect(within(view).getByLabelText('Bindungsart von trigger_price (de)')).toBeInTheDocument();
    expect(within(view).queryByLabelText('Bindungsart von reason (de)')).toBeNull();
    expect(document.querySelectorAll('.react-flow__node-management')).toHaveLength(1);
  });

  it('builds an instance of an object type with its own parameters', async () => {
    const { user, backend } = await inventedStrategy();
    await user.click(screen.getByRole('option', { name: /^Zork \(de\)/ }));
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 2, name: 'zork' });
    const view = properties();

    expect(within(view).getByText('zork, aus Objekttyp Zork (de)')).toBeInTheDocument();
    expect(within(view).getByLabelText('Bezeichnung')).toHaveValue('Zork (de)');
    await user.selectOptions(within(view).getByLabelText('Bindungsart von size (de)'), 'fester Wert');
    await user.clear(within(view).getByRole('textbox', { name: 'size (de)' }));
    await user.type(within(view).getByRole('textbox', { name: 'size (de)' }), '4');

    await menu(user, 'Speichern');
    await waitFor(() => {
      expect(backend.requests('POST', /strategies$/)).toHaveLength(1);
    });
    const body = backend.requests('POST', /strategies$/)[0]?.body as StrategyDocument;
    expect(body.elements.find((candidate) => candidate.type === 'Zork')?.instance?.parameter_values?.size).toEqual({ kind: 'fixed', value: 4 });
  });
});
