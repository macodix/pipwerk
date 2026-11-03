import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from './App';
import type { ElementDocument, StrategyDocument } from './document/types';
import { renderWithProviders } from './test-utils';
import { choose, clickNode, menu, nodeByName, openStored, switchLanguage, waitForReady } from './testing/actions';
import { mockApi } from './testing/backend';
import { EMA_ELEMENT_IDS, emaTrendfolge } from './testing/emaTrendfolge';

// Order 21 (fix after the fourth acceptance): F2 name of the strategy, F7 "Verwendete Werte", F9 remove a part of a
// condition, F10 change of the kind of a condition, F11 labels. The tables of the changes of kind are in `blocks.test.ts`.

type User = ReturnType<typeof userEvent.setup>;
type Api = ReturnType<typeof mockApi>;
type Stored = StrategyDocument & { elements: ElementDocument[] };

async function open(user: User, options: Parameters<typeof mockApi>[0] = {}): Promise<Api> {
  const api = mockApi(options);
  renderWithProviders(<App />, 'de');
  await waitForReady();
  await openStored(user, 'EMA-Trendfolge');
  await waitFor(() => {
    expect(screen.getByTestId('status-pill')).toHaveTextContent('EMA-Trendfolge');
  });
  return api;
}

async function saved(user: User, api: Api): Promise<Stored> {
  await menu(user, 'save');
  await waitFor(() => {
    expect(api.requests('PUT', /strategies/).length).toBeGreaterThan(0);
  });
  const calls = api.requests('PUT', /strategies/);
  return calls[calls.length - 1]?.body as Stored;
}

const formulaOf = (document: Stored, id: string): string => String(document.elements.find((element) => element.id === id)?.parameters.ausdruck?.value);

/** The panel of the formula of the selected element, once its blocks are shown. */
async function panelOf(name: string): Promise<HTMLElement> {
  clickNode(nodeByName(name));
  const panel = await screen.findByTestId('expression-ausdruck');
  await waitFor(() => {
    expect(within(panel).getAllByTestId('cond-block').length).toBeGreaterThan(0);
  });
  return panel;
}

describe('F2: the name of a new strategy', () => {
  it('is a labelled, empty input with a grey hint, like the description; saving works as before', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');

    const view = await screen.findByTestId('props-strategy');
    // the heading "Strategie" stays, the field has its own visible label
    expect(within(view).getByRole('heading', { name: 'Strategie' })).toBeInTheDocument();
    expect(within(view).getByRole('heading', { name: 'Name der Strategie' })).toBeInTheDocument();
    const field = within(view).getByTestId('strategy-name');
    expect(field).toHaveValue('');
    expect(field).toHaveAttribute('placeholder', 'Name eingeben');
    expect(field).toHaveClass('input');
    expect(field).not.toHaveClass('title-input');
    // the description is built the same way
    expect(within(view).getByTestId('strategy-description')).toHaveAttribute('placeholder', 'Worum geht es in dieser Strategie?');
    // an unnamed strategy is called so where its name stands elsewhere
    expect(screen.getByTestId('status-pill')).toHaveTextContent('(noch ohne Name)');

    // typing replaces the hint (a browser shows it only while the field is empty)
    await user.type(field, 'Meine Strategie');
    expect(field).toHaveValue('Meine Strategie');
    expect(screen.getByTestId('status-pill')).toHaveTextContent('Meine Strategie');

    await menu(user, 'save');
    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/strategies$/)).toHaveLength(1);
    });
    expect((api.requests('POST', /\/api\/v1\/strategies$/)[0]?.body as { name: string }).name).toBe('Meine Strategie');
  });

  it('saves a strategy whose name stays empty as before: no check, no question', async () => {
    const user = userEvent.setup();
    const api = mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await menu(user, 'new');
    await screen.findByTestId('props-strategy');

    await menu(user, 'save');

    await waitFor(() => {
      expect(api.requests('POST', /\/api\/v1\/strategies$/)).toHaveLength(1);
    });
    expect((api.requests('POST', /\/api\/v1\/strategies$/)[0]?.body as { name: string }).name).toBe('');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has the label and the hint in English', async () => {
    const user = userEvent.setup();
    mockApi();
    renderWithProviders(<App />, 'de');
    await waitForReady();
    await switchLanguage(user, 'English');
    await menu(user, 'new');

    const view = await screen.findByTestId('props-strategy');
    expect(within(view).getByRole('heading', { name: 'Name of the strategy' })).toBeInTheDocument();
    expect(within(view).getByTestId('strategy-name')).toHaveAttribute('placeholder', 'Enter a name');
  });
});

describe('F7: "Verwendete Werte" of an element', () => {
  /**
   * A report of the use in which an object can be used from its first use on only (the backend walks the flow): the
   * indicators of the strategy are determined at the condition and at the stop; `usable_at` names the elements from there on.
   */
  function flowReport(document: Record<string, unknown>): Record<string, unknown> {
    const elements = document.elements as { id: string; name: string | null; instance?: { key: string; name: string; object_type: string } | null }[];
    const order = elements.map((element) => element.id);
    const firstUse: Record<string, string> = { ema20: EMA_ELEMENT_IDS.cross, ema50: EMA_ELEMENT_IDS.cross, atr14: EMA_ELEMENT_IDS.stop };
    const instances = elements
      .filter((element) => element.instance !== undefined && element.instance !== null)
      .map((element) => {
        const instance = element.instance as { key: string; name: string; object_type: string };
        const first = firstUse[instance.key] as string;
        return {
          instance: instance.key,
          name: instance.name,
          element: element.id,
          object_type: instance.object_type,
          can_refresh: false,
          connected: true,
          first_use: first,
          first_use_source: 'flow',
          usable_everywhere: false,
          usable_at: order.slice(order.indexOf(first)),
          usable_at_omitted: false,
        };
      });
    const uses = (instance: string, names: string[]) => ({
      instance,
      kind: 'expression',
      by_instance: null,
      members: names.map((name) => ({ name, kind: 'property', arguments: [], refresh: false })),
    });
    return {
      instances,
      elements: [
        { element: EMA_ELEMENT_IDS.cross, uses: [uses('ema20', ['wert']), uses('ema50', ['wert'])] },
        { element: EMA_ELEMENT_IDS.direction, uses: [uses('ema20', ['wert']), uses('ema50', ['wert'])] },
        { element: EMA_ELEMENT_IDS.stop, uses: [uses('atr14', ['wert'])] },
      ],
      strategy_rules: [],
      truncated: false,
    };
  }

  /** Selects the element and waits for the report of the use (the interface asks for it a short time after the last change). */
  async function show(_user: User, name: string): Promise<HTMLElement | null> {
    await waitFor(() => {
      expect(screen.getByTestId('props')).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 450));
    clickNode(nodeByName(name));
    await waitFor(() => {
      expect(screen.getByTestId('element-name')).toHaveValue(name);
    });
    return screen.queryByTestId('sec-used');
  }

  it('shows a trigger that can use no object a single sentence and no second paragraph', async () => {
    const user = userEvent.setup();
    await open(user, { usage: flowReport });

    const section = await show(user, 'Kerzenschluss');

    expect(section).not.toBeNull();
    const text = (section as HTMLElement).textContent ?? '';
    expect(within(section as HTMLElement).getByTestId('used-elsewhere')).toHaveTextContent(
      'Weitere Objekte lassen sich hier erst verwenden, wenn Sie bei ihnen dieses oder ein früheres Element als Element der ersten Verwendung wählen.',
    );
    // neither the empty note nor the old second paragraph, and nothing to connect
    expect(within(section as HTMLElement).queryByTestId('used-empty')).toBeNull();
    expect(within(section as HTMLElement).queryByTestId('used-add')).toBeNull();
    expect(text).not.toContain('kein Objekt verwendbar');
    expect(text).not.toContain('Legen Sie dafür ein weiteres Objekt');
  });

  it('shows the values a condition uses, and the one sentence only for the objects it cannot use', async () => {
    const user = userEvent.setup();
    await open(user, { usage: flowReport });

    const section = (await show(user, 'Kreuzen')) as HTMLElement;

    expect(within(section).getAllByTestId('used-group').map((group) => group.getAttribute('data-instance'))).toEqual(['ema20', 'ema50']);
    expect(within(section).getByTestId('used-elsewhere')).toBeInTheDocument();
    expect(section.textContent).not.toContain('kein Objekt verwendbar');
  });

  it('lets a calculation connect a value, with the note that nothing is connected yet and without a second paragraph', async () => {
    const user = userEvent.setup();
    await open(user, { usage: flowReport });

    const section = (await show(user, 'StopLoss')) as HTMLElement;

    expect(within(section).getByTestId('used-add')).toBeInTheDocument();
    expect(within(section).queryByTestId('used-elsewhere')).toBeNull();
    expect(section.textContent).not.toContain('kein Objekt verwendbar');
  });

  it('lets an action connect a value when every object is usable there', async () => {
    const user = userEvent.setup();
    await open(user, { usage: flowReport });

    const section = (await show(user, 'Order aufgeben')) as HTMLElement;

    expect(within(section).getByTestId('used-empty')).toHaveTextContent('Es ist noch kein Wert eines Objekts verbunden. Wählen Sie unten ein Objekt und einen Wert.');
    expect(within(section).getByTestId('used-add')).toBeInTheDocument();
    expect(within(section).queryByTestId('used-elsewhere')).toBeNull();
  });

  it('hides the section of an element that uses no value when the strategy has no object at all', async () => {
    const user = userEvent.setup();
    const document = emaTrendfolge();
    const without = { ...document, elements: (document.elements as ElementDocument[]).filter((element) => element.instance === undefined || element.instance === null) };
    await open(user, { strategies: [without as never], usage: flowReport });
    await new Promise((resolve) => setTimeout(resolve, 450));

    for (const name of ['Kerzenschluss', 'Kreuzen', 'Order aufgeben']) {
      clickNode(nodeByName(name));
      await waitFor(() => {
        expect(screen.getByTestId('element-name')).toHaveValue(name);
      });
      expect(screen.queryByTestId('sec-used'), name).toBeNull();
    }
  });
});

describe('F9: remove a part of a condition', () => {
  it('gives every part of "und" and "oder" a quiet "Entfernen" with an explanation, reachable by keyboard', async () => {
    const user = userEvent.setup();
    await open(user);
    const panel = await panelOf('Kreuzen');

    const buttons = within(panel).getAllByTestId('cond-remove');
    // "oder" of two times "und" of two comparisons: two parts at the top and two in each "und"
    expect(buttons).toHaveLength(6);
    for (const button of buttons) {
      expect(button).toHaveTextContent('Entfernen');
      expect(button).toHaveClass('btn-quiet');
      expect(button.getAttribute('aria-label')).toMatch(/^Bedingung [12] entfernen$/);
      expect(button).toHaveAttribute('data-tip', 'Entfernt diese Bedingung. Die übrigen bleiben erhalten.');
      expect(button.tagName).toBe('BUTTON');
      expect(button).not.toHaveAttribute('tabindex', '-1');
    }
    // the keyboard reaches it and presses it
    (buttons[0] as HTMLElement).focus();
    expect(buttons[0]).toHaveFocus();
  });

  it('removes the part that is meant and leaves the rest', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    const panel = await panelOf('Kreuzen');

    // the first comparison of the first "und"
    await user.click(within(panel).getAllByTestId('cond-remove')[0] as HTMLElement);

    await waitFor(() => {
      expect(within(panel).getAllByTestId('cond-remove')).toHaveLength(5);
    });
    const stored = await saved(user, api);
    expect(formulaOf(stored, EMA_ELEMENT_IDS.cross)).toBe(
      'OR(AND(ema20.wert > ema50.wert); AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert))',
    );
  });

  it('removes a whole part of "oder" with what is inside it', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    const panel = await panelOf('Kreuzen');

    // the buttons stand behind the part they belong to: the nested ones first, then the one of the first part of "oder"
    await user.click(within(panel).getAllByTestId('cond-remove')[2] as HTMLElement);

    await waitFor(() => {
      expect(within(panel).getAllByTestId('cond-remove')).toHaveLength(3);
    });
    const stored = await saved(user, api);
    expect(formulaOf(stored, EMA_ELEMENT_IDS.cross)).toBe('OR(AND(PREVIOUS(ema20.wert) >= PREVIOUS(ema50.wert); ema20.wert < ema50.wert))');
  });

  it('leaves a part with an empty place when the last part is removed, and the condition stays editable', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    const panel = await panelOf('Kreuzen');

    // both comparisons of the first "und", one after the other
    await user.click(within(panel).getAllByTestId('cond-remove')[0] as HTMLElement);
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cond-remove')).toHaveLength(5);
    });
    await user.click(within(panel).getAllByTestId('cond-remove')[0] as HTMLElement);

    // still five buttons: the first "und" has one blank comparison in place of the removed ones
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cmp-left-select')).toHaveLength(3);
    });
    expect(within(panel).getAllByTestId('cond-remove')).toHaveLength(5);
    expect(within(panel).queryByTestId('expr-bad')).toBeNull();
    expect(within(panel).queryByTestId('expr-failed')).toBeNull();
    expect(within(panel).getAllByTestId('cmp-left-select')[0]).toHaveTextContent('Wert wählen …');

    // the blank part can be filled again
    await choose(user, within(panel).getAllByTestId('cmp-left-select')[0] as HTMLElement, 'EMA20 › Wert');
    const stored = await saved(user, api);
    expect(formulaOf(stored, EMA_ELEMENT_IDS.cross)).toContain('AND(ema20.wert >');
  });
});

describe('F9: remove a value of a function that takes more values', () => {
  it('removes the value that is meant and leaves the others', async () => {
    const user = userEvent.setup();
    const document = emaTrendfolge();
    const direction = (document.elements as { id: string; parameters: Record<string, unknown> }[]).find((element) => element.id === EMA_ELEMENT_IDS.direction);
    (direction as { parameters: Record<string, unknown> }).parameters.ausdruck = { kind: 'expression', value: 'MIN(1; 2; 3)' };
    const api = await open(user, { strategies: [document] });
    clickNode(nodeByName('Richtung'));
    const panel = await screen.findByTestId('expression-ausdruck');
    await waitFor(() => {
      expect(within(panel).getAllByTestId('arg-remove')).toHaveLength(3);
    });
    const buttons = within(panel).getAllByTestId('arg-remove');
    expect(buttons[0]).toHaveTextContent('Entfernen');
    expect(buttons[0]).toHaveAttribute('aria-label', 'Wert 1 entfernen');

    await user.click(buttons[0] as HTMLElement);

    await waitFor(() => {
      expect(within(panel).getAllByTestId('arg-remove')).toHaveLength(2);
    });
    expect(formulaOf(await saved(user, api), EMA_ELEMENT_IDS.direction)).toBe('MIN(2; 3)');
  });
});

describe('F10: change of the kind of a condition', () => {
  const kind = (panel: HTMLElement): HTMLElement => within(panel).getAllByTestId('cond-kind')[0] as HTMLElement;

  it('asks the question "Was soll geprüft werden?" and answers in whole words', async () => {
    const user = userEvent.setup();
    await open(user);
    const panel = await panelOf('Kreuzen');

    expect(within(panel).getAllByLabelText('Was soll geprüft werden?').length).toBeGreaterThan(0);
    expect(kind(panel)).toHaveTextContent('Mindestens eine Bedingung muss gelten (oder)');
  });

  it('takes a comparison over as the first part of "und" and "oder" without asking', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    const panel = await panelOf('Order ausgefuehrt');
    expect(kind(panel)).toHaveTextContent('Zwei Werte vergleichen');

    await choose(user, kind(panel), 'Alle Bedingungen müssen gelten (und)');

    expect(screen.queryByTestId('switch-question')).toBeNull();
    await waitFor(() => {
      expect(within(panel).getAllByTestId('cmp-left-select')).toHaveLength(2);
    });
    // the first part is the comparison the user had, the second a blank one
    expect(within(panel).getAllByTestId('cmp-left-select')[0]).toHaveValue('n:Order\u001fstatus');
    expect(within(panel).getAllByTestId('cmp-left-select')[1]).toHaveTextContent('Wert wählen …');
    const stored = await saved(user, api);
    expect(formulaOf(stored, EMA_ELEMENT_IDS.executed)).toMatch(/^AND\(Order\.status = "ausgefuehrt";/);

    // and from "und" to "oder" the parts stay
    await choose(user, kind(panel), 'Mindestens eine Bedingung muss gelten (oder)');
    expect(screen.queryByTestId('switch-question')).toBeNull();
    expect(within(panel).getAllByTestId('cmp-left-select')[0]).toHaveValue('n:Order\u001fstatus');
  });

  it('asks before a change that loses entries: "Abbrechen" leaves the condition as it is', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    const panel = await panelOf('Kreuzen');
    const before = formulaOf(await saved(user, api), EMA_ELEMENT_IDS.cross);

    await choose(user, kind(panel), 'Zwei Werte vergleichen');

    const dialog = await screen.findByRole('dialog', { name: 'Andere Prüfung wählen?' });
    expect(within(dialog).getByTestId('switch-question')).toHaveTextContent('Dabei gehen die Eingaben dieser Bedingung verloren. Trotzdem wechseln?');
    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Abbrechen', 'Wechseln']);
    await user.click(within(dialog).getByRole('button', { name: 'Abbrechen' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(kind(panel)).toHaveTextContent('Mindestens eine Bedingung muss gelten (oder)');
    expect(within(panel).getAllByTestId('cmp-left-select')).toHaveLength(4);
    expect(formulaOf(await saved(user, api), EMA_ELEMENT_IDS.cross)).toBe(before);
  });

  it('changes after "Wechseln", and then the new condition is blank', async () => {
    const user = userEvent.setup();
    const api = await open(user);
    const panel = await panelOf('Kreuzen');

    await choose(user, kind(panel), 'Zwei Werte vergleichen');
    const dialog = await screen.findByRole('dialog', { name: 'Andere Prüfung wählen?' });
    await user.click(within(dialog).getByRole('button', { name: 'Wechseln' }));

    await waitFor(() => {
      expect(kind(panel)).toHaveTextContent('Zwei Werte vergleichen');
    });
    expect(within(panel).getAllByTestId('cmp-left-select')).toHaveLength(1);
    expect(within(panel).getByTestId('cmp-left-select')).toHaveTextContent('Wert wählen …');
    expect(formulaOf(await saved(user, api), EMA_ELEMENT_IDS.cross)).not.toContain('ema20');

    // a blank condition changes without a question, in every direction
    await choose(user, kind(panel), 'Alle Bedingungen müssen gelten (und)');
    await choose(user, kind(panel), 'Eine Bedingung umkehren (nicht)');
    await choose(user, kind(panel), 'Prüfen, ob ein Wert wahr ist');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(kind(panel)).toHaveTextContent('Prüfen, ob ein Wert wahr ist');
  });

  it('asks in English with whole words on the buttons', async () => {
    const user = userEvent.setup();
    await open(user);
    await switchLanguage(user, 'English');
    const panel = await panelOf('Kreuzen');

    expect(within(panel).getAllByLabelText('What should be checked?').length).toBeGreaterThan(0);
    await choose(user, kind(panel), 'Compare two values');

    const dialog = await screen.findByRole('dialog', { name: 'Choose a different check?' });
    expect(within(dialog).getByTestId('switch-question')).toHaveTextContent('The entries of this condition will be lost. Switch anyway?');
    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Cancel', 'Switch']);
  });
});

describe('F11: labels', () => {
  it('calls the field of a formula "Formel" and not by the word of the library, on the properties view and in a finding', async () => {
    const user = userEvent.setup();
    await open(user, {
      findings: () => [
        { level: 'error', code: 'expression.empty', element: EMA_ELEMENT_IDS.cross, subject: null, details: { field: 'parameter:ausdruck' }, element_name: null, subject_name: null, field_label: { de: 'Ausdruck', en: 'Expression' } },
      ],
    });
    await panelOf('Kreuzen');

    const section = screen.getByTestId('sec-ausdruck');
    expect(within(section).getAllByText('Formel').length).toBeGreaterThan(0);
    expect(section.textContent).not.toContain('Ausdruck');
    await menu(user, 'check');
    await user.click(await screen.findByTestId('findings-count'));
    expect(await screen.findByTestId('finding')).toHaveTextContent('Im Feld „Formel“ fehlt die Formel, oder sie ist unvollständig.');
  });
});
