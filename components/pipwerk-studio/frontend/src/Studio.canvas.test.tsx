import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import { syncedFrames } from './canvas/canvasEditing';
import type { ElementDocument, StrategyDocument } from './document/types';
import { LIBRARY_DRAG_TYPE, serializeSource, type LibrarySource } from './library/libraryModel';
import { clickNode, elementNodes, menu, nodeByTitle, openStored, waitForReady } from './testing/actions';
import { mockBackend, type MockBackendOptions } from './testing/backend';
import { loadTestcase, realTypes } from './testing/fixtures';
import { renderWithProviders } from './test-utils';

const stored = loadTestcase('str-03');

async function start(options: MockBackendOptions = {}) {
  const user = userEvent.setup();
  const backend = mockBackend(options);
  renderWithProviders(<App />);
  await waitForReady();
  return { user, backend };
}

async function openStrategy(options: MockBackendOptions = { strategies: [stored] }, title = 'EMA-Trendfolge') {
  const started = await start(options);
  await openStored(started.user, title);
  await waitFor(() => {
    expect(elementNodes().length).toBeGreaterThan(0);
  });
  return started;
}

function entry(name: RegExp | string): HTMLElement {
  return screen.getByRole('option', { name });
}

function dataTransfer(source: LibrarySource) {
  return {
    types: [LIBRARY_DRAG_TYPE],
    getData: (type: string) => (type === LIBRARY_DRAG_TYPE ? serializeSource(source) : ''),
    setData: () => undefined,
    dropEffect: 'none',
    effectAllowed: 'all',
  };
}

function canvasPane(): HTMLElement {
  return document.querySelector<HTMLElement>('.react-flow') as HTMLElement;
}

/** jsdom has no `DragEvent`; the mouse event carries the place and the data of the drag. */
function drop(transfer: object, x: number, y: number): void {
  const event = new MouseEvent('drop', { bubbles: true, cancelable: true, clientX: x, clientY: y });
  Object.defineProperty(event, 'dataTransfer', { value: transfer });
  fireEvent(canvasPane(), event);
}

async function lastSaved(user: ReturnType<typeof userEvent.setup>, backend: ReturnType<typeof mockBackend>): Promise<StrategyDocument> {
  await menu(user, 'Speichern');
  await waitFor(() => {
    expect(backend.requests('PUT', /strategies\/.+/).length + backend.requests('POST', /strategies$/).length).toBeGreaterThan(0);
  });
  const calls = [...backend.requests('POST', /strategies$/), ...backend.requests('PUT', /strategies\/.+/)];
  return calls[calls.length - 1]?.body as StrategyDocument;
}

describe('the element library', () => {
  it('shows the groups of the specification', async () => {
    await start();

    const library = screen.getByRole('complementary', { name: 'Elementbibliothek' });
    expect(within(library).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Auslöser',
      'Elemente des Ablaufs',
      'Objekte der Anwendung',
      'Objekttypen',
      'Mitgelieferte Vorlagen',
      'Gespeicherte Vorlagen',
    ]);
    expect(within(library).getByText('Keine Einträge.')).toBeInTheDocument();
    expect(within(library).getByRole('option', { name: /^Risiko je Trade/ })).toBeInTheDocument();
    expect(within(library).queryByRole('button', { name: /Neues Objekt|Als Vorlage speichern/ })).toBeNull();
  });

  it('shows the stored templates from the lists of the backend', async () => {
    await start({
      templates: {
        indicators: [{ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Mein Indikator', description: 'x', object_type: 'Indikator' }],
        rules: [{ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Meine Regel', description: 'y', object_type: 'Regel' }],
      },
    });

    expect(await screen.findByRole('option', { name: /^Mein Indikator/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^Meine Regel/ })).toBeInTheDocument();
  });

  it('inserts an entry with the Enter key into the middle of the visible drawing area and selects it', async () => {
    const { user, backend } = await start();
    await menu(user, 'Neue Strategie');

    expect(elementNodes()).toHaveLength(0);
    await user.click(entry(/^Bedingung/));
    expect(entry(/^Bedingung/)).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(1);
    });
    expect(nodeByTitle('Bedingung')).toBeInTheDocument();
    // The new element is selected: its property view is shown.
    expect(screen.getByRole('heading', { level: 2, name: 'Bedingung' })).toBeInTheDocument();
    const saved = await lastSaved(user, backend);
    const condition = saved.elements.find((element) => element.type === 'flow.condition');
    expect(condition).toMatchObject({ title: 'Bedingung', management_of: null, parameters: {}, rules: [] });
  });

  it('does not insert anything while no strategy is open', async () => {
    const { user } = await start();

    entry(/^Bedingung/).focus();
    await user.keyboard('{Enter}');

    expect(elementNodes()).toHaveLength(0);
    expect(entry(/^Bedingung/)).toHaveAttribute('draggable', 'false');
  });

  it('inserts an object type as an element that holds an instance with a free name', async () => {
    const { user, backend } = await start();
    await menu(user, 'Neue Strategie');

    await user.click(entry(/^EMA/));
    await user.keyboard('{Enter}');
    await user.click(entry(/^EMA/));
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(2);
    });
    const saved = await lastSaved(user, backend);
    const emas = saved.elements.filter((element) => element.type === 'EMA');
    expect(emas.map((element) => element.instance?.name)).toEqual(['ema', 'ema1']);
    expect(emas[0]?.instance?.parameter_values).toMatchObject({ verschiebung: { kind: 'fixed', value: 0 } });
    // The two elements do not lie on top of each other.
    expect(new Set(emas.map((element) => `${element.x}/${element.y}`)).size).toBe(2);
  });

  it('inserts a dropped entry at the place where it is dropped', async () => {
    const { user, backend } = await start();
    await menu(user, 'Neue Strategie');

    fireEvent.dragOver(canvasPane(), { dataTransfer: dataTransfer({ kind: 'type', typeId: 'flow.calculation' }) });
    drop(dataTransfer({ kind: 'type', typeId: 'flow.calculation' }), 640, 480);

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(1);
    });
    const saved = await lastSaved(user, backend);
    const calculation = saved.elements.find((element) => element.type === 'flow.calculation')!;
    // The center of the new element lies at the place of the drop.
    expect(calculation.x + 80).toBeCloseTo(640, 0);
    expect(calculation.y).toBeGreaterThan(400);
    expect(calculation.y).toBeLessThan(480);
  });

  it('ignores a drop that is not an entry of the library', async () => {
    const { user } = await start();
    await menu(user, 'Neue Strategie');

    drop({ types: ['text/plain'], getData: () => 'hello' }, 10, 10);
    drop({ types: [LIBRARY_DRAG_TYPE], getData: () => '{"kind":"type","typeId":"no.such.type"}' }, 10, 10);
    drop(dataTransfer({ kind: 'type', typeId: 'Regel' }), 10, 10);

    // An entry for rules does not belong on the drawing area either.
    expect(elementNodes()).toHaveLength(0);
  });

  it('puts an element dropped into a frame into that management, and one dropped outside into the main flow', async () => {
    const { user, backend } = await openStrategy();
    const owner = stored.elements.find((element) => element.type === 'flow.place_order')!;
    const frame = syncedFrames(stored, realTypes, {}, 'de')[owner.id]!;

    drop(dataTransfer({ kind: 'type', typeId: 'flow.delete_order' }), frame.x + 100, frame.y + frame.height - 60);
    drop(dataTransfer({ kind: 'type', typeId: 'flow.delete_order' }), frame.x - 500, frame.y - 500);

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length + 2);
    });
    const saved = await lastSaved(user, backend);
    const added = saved.elements.filter((element) => !stored.elements.some((old) => old.id === element.id));
    expect(added.map((element) => element.management_of).sort()).toEqual([null, owner.id].sort());
  });

  it('inserts a stored template as an instance with its origin, after reading the template', async () => {
    const template = {
      format: 'pipwerk.indicator',
      format_version: '1.0',
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      title: 'Mein Indikator',
      description: 'x',
      object_type: 'Indikator',
      parameter_values: {},
      parameters: [{ name: 'periode', datatype: 'integer', required: true, default: 14, choices: [] }],
      properties: [{ name: 'wert', datatype: 'number', expression: 'periode', choices: [] }],
      instances: [],
      rules: [],
      expression: null,
      determined_property: null,
      comparison: null,
      result_expression: null,
    };
    const { user, backend } = await start({ templates: { indicators: [template] } });
    await menu(user, 'Neue Strategie');

    await user.click(await screen.findByRole('option', { name: /^Mein Indikator/ }));
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(1);
    });
    expect(backend.requests('GET', /\/api\/v1\/indicators\/aaaaaaaa/)).toHaveLength(1);
    const saved = await lastSaved(user, backend);
    const element = saved.elements.find((candidate) => candidate.type === 'Indikator')!;
    expect(element.instance).toMatchObject({
      name: 'mein_indikator',
      object_type: 'Indikator',
      origin: { object_type: 'Indikator', template_id: template.id, template_title: 'Mein Indikator' },
      parameters: template.parameters,
      properties: template.properties,
      parameter_values: { periode: { kind: 'fixed', value: 14 } },
    });
  });

  it('tells when a template cannot be read and inserts nothing', async () => {
    const template = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Mein Indikator', description: '', object_type: 'Indikator' };
    const { user } = await start({
      templates: { indicators: [template] },
      fail: { template: { status: 409, body: { detail: 'The object file cannot be read or does not fit the document schema. It is left unchanged.' } } },
    });
    await menu(user, 'Neue Strategie');

    await user.click(await screen.findByRole('option', { name: /^Mein Indikator/ }));
    await user.keyboard('{Enter}');

    const alert = await screen.findByRole('alertdialog', { name: 'Der Eintrag konnte nicht eingefügt werden.' });
    expect(within(alert).getByText(/cannot be read/)).toBeInTheDocument();
    await user.click(within(alert).getByRole('button', { name: 'OK' }));
    expect(elementNodes()).toHaveLength(0);
  });
});

describe('the elements on the drawing area', () => {
  it('show the title, the type and the outputs as connectors; objects have none', async () => {
    await openStrategy();

    const condition = nodeByTitle('Kreuzen');
    expect(within(condition).getByText('Bedingung')).toBeInTheDocument();
    expect(within(condition).getByText('wahr')).toBeInTheDocument();
    expect(within(condition).getByText('falsch')).toBeInTheDocument();
    expect(condition.querySelectorAll('.react-flow__handle.source')).toHaveLength(2);
    expect(condition.querySelectorAll('.react-flow__handle.target')).toHaveLength(1);
    const ema = nodeByTitle('ema20');
    expect(within(ema).getByText('EMA')).toBeInTheDocument();
    expect(ema.querySelectorAll('.react-flow__handle')).toHaveLength(0);
    // A trigger has no input.
    const trigger = elementNodes().find((node) => node.textContent?.startsWith('Kerzenschluss'))!;
    expect(trigger.querySelectorAll('.react-flow__handle.target')).toHaveLength(0);
    expect(trigger.querySelectorAll('.react-flow__handle.source')).toHaveLength(1);
  });

  it('show the name of the instance for an object and the name of a calculation beside its type', async () => {
    await openStrategy();

    expect(within(nodeByTitle('Richtung')).getByText('Berechnung · richtung')).toBeInTheDocument();
    expect(nodeByTitle('ema50')).toBeInTheDocument();
  });

  it('show the management as a frame that is connected to the element that places the order', async () => {
    await openStrategy();

    const frame = document.querySelector<HTMLElement>('.react-flow__node-management')!;
    expect(frame).toHaveTextContent('Verwaltung: Order aufgeben');
    expect(within(nodeByTitle('Order aufgeben')).getByText('gestellt')).toBeInTheDocument();
    // The frame hangs at the output "gestellt" (no connector of its own); no connection can start there.
    const owner = nodeByTitle('Order aufgeben');
    expect(owner.querySelectorAll('.react-flow__handle.source')).toHaveLength(2);
    expect(owner.querySelector('.react-flow__handle[data-handleid="gestellt"]')).not.toHaveClass('connectable');
    expect(owner.querySelector('.react-flow__handle[data-handleid="nicht_gestellt"]')).toHaveClass('connectable');
  });

  it('collapse and expand the frame; the elements stay in the document and the document is not changed', async () => {
    const { user, backend } = await openStrategy();
    const members = stored.elements.filter((element) => element.management_of !== null).length;
    expect(members).toBeGreaterThan(0);
    const toggle = screen.getByRole('button', { name: 'Verwaltung „Order aufgeben“ einklappen' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    const expand = screen.getByRole('button', { name: 'Verwaltung „Order aufgeben“ aufklappen' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length - members);
    });
    // Nothing was changed: closing does not ask, and saving writes the same document.
    const saved = await lastSaved(user, backend);
    expect(saved).toEqual(stored);

    await user.click(expand);

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length);
    });
  });

  it('are removed with the Delete key, together with their connections', async () => {
    const { user, backend } = await openStrategy();
    const removed = stored.elements.find((element) => element.name === 'richtung')!;

    clickNode(nodeByTitle('Richtung'));
    await user.keyboard('{Delete}');

    await waitFor(() => {
      expect(elementNodes()).toHaveLength(stored.elements.length - 1);
    });
    const saved = await lastSaved(user, backend);
    expect(saved.elements.map((element) => element.id)).not.toContain(removed.id);
    expect(saved.connections.some((connection) => connection.source === removed.id || connection.target === removed.id)).toBe(false);
    expect(saved.connections).toHaveLength(stored.connections.length - 2);
  });

  it('are not removed by the keys Backspace and Delete while the user types in a field of the property view', async () => {
    const { user } = await openStrategy();
    clickNode(nodeByTitle('Richtung'));
    const label = await screen.findByLabelText('Bezeichnung');

    await user.click(label);
    await user.keyboard('{End}{Backspace}{Backspace}{Delete}');

    expect(elementNodes()).toHaveLength(stored.elements.length);
    expect(label).toHaveValue('Richtu');
  });

  it('select a node, and the click on the empty drawing area shows the strategy again', async () => {
    await openStrategy();
    clickNode(nodeByTitle('Kreuzen'));
    expect(await screen.findByRole('heading', { level: 2, name: 'Kreuzen' })).toBeInTheDocument();

    fireEvent.click(document.querySelector('.react-flow__pane') as HTMLElement);

    expect(await screen.findByRole('heading', { level: 2, name: 'Strategie' })).toBeInTheDocument();
  });
});

describe('an element of a type that is not known', () => {
  const unknown: ElementDocument = {
    id: '00000000-0000-4000-8000-0000000000aa',
    type: 'vendor.mystery',
    title: '',
    name: null,
    x: 300,
    y: 300,
    parameters: { secret: { kind: 'fixed', value: 3 }, formula: { kind: 'expression', value: 'a + b' } },
    properties: { hidden: { kind: 'application' } },
    rules: [],
    management_of: null,
  };
  const trigger = stored.elements.find((element) => element.type === 'trigger.candle_close' && element.management_of === null)!;
  const withUnknown: StrategyDocument = {
    ...stored,
    elements: [...stored.elements, unknown],
    connections: [
      ...stored.connections,
      { source: trigger.id, output: 'weiter', target: unknown.id },
      { source: unknown.id, output: 'links', target: trigger.id },
    ],
  };

  it('is shown red with the identifier of its type, with one input and an output per stored output', async () => {
    await openStrategy({ strategies: [withUnknown] });

    const node = nodeByTitle('vendor.mystery');
    expect(node.querySelector('.element-node')).toHaveClass('unknown-type');
    expect(node).toHaveTextContent('vendor.mystery');
    expect(node.querySelectorAll('.react-flow__handle.target')).toHaveLength(1);
    expect(node.querySelectorAll('.react-flow__handle.source')).toHaveLength(1);
    expect(within(node).getByText('links')).toBeInTheDocument();
  });

  it('shows its values only for reading', async () => {
    await openStrategy({ strategies: [withUnknown] });

    clickNode(nodeByTitle('vendor.mystery'));

    const properties = await screen.findByRole('complementary', { name: 'Eigenschaften' });
    expect(await within(properties).findByText(/Unbekannter Typ „vendor.mystery“/)).toBeInTheDocument();
    expect(within(properties).getByText('secret')).toBeInTheDocument();
    expect(within(properties).getByText('fester Wert: 3')).toBeInTheDocument();
    expect(within(properties).getByText('Ausdruck: a + b')).toBeInTheDocument();
    expect(within(properties).queryByRole('combobox', { name: /secret|formula/ })).toBeNull();
    expect(within(properties).queryByRole('spinbutton')).toBeNull();
    expect(within(properties).queryByLabelText('Name')).toBeNull();
  });

  it('is saved with its values unchanged, and can be moved and deleted', async () => {
    const { user, backend } = await openStrategy({ strategies: [withUnknown] });

    const saved = await lastSaved(user, backend);

    expect(saved).toEqual(withUnknown);
    expect(saved.elements.find((element) => element.id === unknown.id)).toEqual(unknown);

    clickNode(nodeByTitle('vendor.mystery'));
    await user.keyboard('{Delete}');
    await waitFor(() => {
      expect(elementNodes()).toHaveLength(withUnknown.elements.length - 1);
    });
    const afterDelete = await lastSaved(user, backend);
    expect(afterDelete.elements.map((element) => element.id)).not.toContain(unknown.id);
    expect(afterDelete.connections).toHaveLength(stored.connections.length);
  });

  it('is shown red also for an object type that is not known', async () => {
    const instanceOfUnknown = {
      name: 'zork',
      object_type: 'Zork9',
      origin: { object_type: 'Zork9', template_id: null, template_title: null },
      parameter_values: { size: { kind: 'fixed' as const, value: 7 } },
      parameters: [],
      properties: [],
      instances: [],
      rules: [],
    };
    const document: StrategyDocument = {
      ...stored,
      elements: [{ ...unknown, type: 'Zork9', instance: instanceOfUnknown, parameters: {}, properties: {} }],
      connections: [],
    };
    await openStrategy({ strategies: [document] });

    expect(nodeByTitle('zork').querySelector('.element-node')).toHaveClass('unknown-type');
    clickNode(nodeByTitle('zork'));
    const properties = await screen.findByRole('complementary', { name: 'Eigenschaften' });
    expect(await within(properties).findByText('size')).toBeInTheDocument();
  });
});

describe('the language', () => {
  it('changes the texts of the type descriptions in the drawing area, the library and the property view, but not the strategy', async () => {
    const { user } = await openStrategy();
    expect(within(nodeByTitle('Kreuzen')).getByText('Bedingung')).toBeInTheDocument();
    clickNode(nodeByTitle('Kreuzen'));
    expect(await screen.findByLabelText('Ausdruck')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Einstellungen' }));
    const dialog = screen.getByRole('dialog', { name: 'Einstellungen' });
    await user.selectOptions(within(dialog).getByLabelText('Sprache'), 'English');
    await waitFor(() => {
      expect(within(dialog).getByLabelText('Language')).toBeEnabled();
    });
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(within(nodeByTitle('Kreuzen')).getByText('Condition')).toBeInTheDocument();
    expect(screen.getByLabelText('Expression')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^Condition/ })).toBeInTheDocument();
    // The title that the user gave stays as it is, and nothing was changed in the document.
    expect(nodeByTitle('Kreuzen')).toBeInTheDocument();
    await menu(user, 'Close');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
