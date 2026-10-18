import { expect, type Locator, type Page } from '@playwright/test';

import { center, drag, libraryEntry, nodeById, panel } from './support';

// The operations of a user who builds a strategy on the drawing area: only what the
// user interface offers (element library, drawing area, property view, expression
// input, rules). Nothing is put in through the Web API.

/** Where a library entry is dropped, in pixels from the top left corner of the drawing area. */
export type Place = { x: number; y: number };

/** The slots of the main flow: five in a row, further rows below. */
export function mainSlot(index: number): Place {
  return { x: 130 + (index % 5) * 200, y: 90 + Math.floor(index / 5) * 130 };
}

export class StrategyBuilder {
  /** The identifiers of the elements in the order in which they were created. */
  readonly ids: string[] = [];
  private framePoint: Place | null = null;

  constructor(private readonly page: Page) {}

  private get properties(): Locator {
    return panel(this.page);
  }

  private get pane(): Locator {
    return this.page.locator('.react-flow__pane');
  }

  /** "Neue Strategie": an empty drawing area, then title and description of the strategy. */
  async start(title: string, description: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Neue Strategie' }).click();
    await expect(this.page.locator('.react-flow__node')).toHaveCount(0);
    await this.properties.getByLabel('Bezeichnung', { exact: true }).fill(title);
    await this.properties.getByLabel('Beschreibung', { exact: true }).fill(description);
  }

  /** A parameter of the strategy in the property view of the strategy. */
  async addParameter(name: string, datatype: string, value: string): Promise<void> {
    await this.properties.getByRole('button', { name: 'Parameter hinzufügen' }).click();
    const names = this.properties.getByRole('textbox', { name: /^Name des Parameters \d+$/ });
    const number = await names.count();
    await this.properties.getByRole('textbox', { name: `Name des Parameters ${number}` }).fill(name);
    await this.properties.getByLabel(`Datentyp von ${name}`, { exact: true }).selectOption(datatype);
    const input = this.properties.getByLabel(`Wert von ${name}`, { exact: true });
    if (datatype === 'time_unit' || datatype === 'choice') {
      await input.selectOption(value);
    } else {
      await input.fill(value);
    }
  }

  /** A rule or rule set template of the element library is added to the rules of the strategy and renamed. */
  async addRuleFromTemplate(template: string, name: string): Promise<void> {
    const select = this.properties.getByLabel('Vorlage aus der Elementbibliothek', { exact: true });
    const value = await select.locator('option', { hasText: template }).first().getAttribute('value');
    expect(value).not.toBeNull();
    await select.selectOption(value as string);
    await this.properties.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
    await this.properties.getByLabel('Name', { exact: true }).fill(name);
    await this.properties.getByRole('button', { name: /^Zurück zu/ }).click();
  }

  /**
   * A new rule in the rule list of the strategy or of the selected element, with name and
   * expression. The property view returns to the owner afterwards.
   */
  async addNewRule(name: string, expression: string): Promise<void> {
    await this.properties.getByRole('button', { name: 'Neue Regel' }).click();
    await this.properties.getByLabel('Name', { exact: true }).fill(name);
    await this.properties.getByRole('combobox', { name: 'Ausdruck', exact: true }).fill(expression);
    await this.properties.getByRole('button', { name: /^Zurück zu/ }).click();
  }

  /** Drags an entry of the element library onto the drawing area; the new element is selected. */
  async drop(group: string, entry: string | RegExp, at: Place): Promise<string> {
    const elements = this.page.locator('.react-flow__node-element');
    const before = await elements.count();
    // A frame lets the drop through to the drawing area; the checks of the position are not needed.
    await libraryEntry(this.page, group, entry).dragTo(this.pane, { targetPosition: at, force: true });
    await expect(elements).toHaveCount(before + 1);
    const selected = this.page.locator('.react-flow__node-element.selected');
    await expect(selected).toHaveCount(1);
    const id = await selected.getAttribute('data-id');
    expect(id).not.toBeNull();
    this.ids.push(id as string);
    return id as string;
  }

  /** An entry that is dropped at a slot of the main flow. */
  async dropMain(group: string, entry: string | RegExp, slot: number): Promise<string> {
    return this.drop(group, entry, mainSlot(slot));
  }

  /**
   * An entry that is dropped into the frame of the management. All entries are dropped
   * at the same point inside the frame as it was when it was created; the element lands on
   * the nearest free place and the frame grows around it.
   */
  async dropIntoFrame(group: string, entry: string | RegExp): Promise<string> {
    if (this.framePoint === null) {
      const frame = (await this.page.locator('.react-flow__node-management').boundingBox())!;
      const pane = (await this.pane.boundingBox())!;
      this.framePoint = { x: frame.x - pane.x + 110, y: frame.y - pane.y + 200 };
    }
    return this.drop(group, entry, this.framePoint);
  }

  // --- the property view of the selected element -------------------------------------------------

  async setTitle(title: string): Promise<void> {
    await this.properties.getByLabel('Bezeichnung', { exact: true }).fill(title);
  }

  /** The name of an instance, a condition or a calculation. */
  async setName(name: string): Promise<void> {
    await this.properties.getByLabel('Name', { exact: true }).fill(name);
  }

  /** A row with the choice of the kind of binding (a row with one allowed kind has none). */
  private async chooseKind(label: string, kind: string): Promise<void> {
    const kinds = this.properties.getByLabel(`Bindungsart von ${label}`, { exact: true });
    if ((await kinds.count()) > 0) {
      await kinds.selectOption(kind);
    }
  }

  /** The row is bound to a parameter of the strategy. */
  async bindParameter(label: string, parameter: string): Promise<void> {
    await this.chooseKind(label, 'parameter');
    await this.properties.getByLabel(label, { exact: true }).selectOption(parameter);
  }

  /** The row is bound to a fixed text, number or value of a choice. */
  async bindFixed(label: string, value: string, input: 'text' | 'choice' = 'text'): Promise<void> {
    await this.chooseKind(label, 'fixed');
    const field = this.properties.getByLabel(label, { exact: true });
    if (input === 'choice') {
      await field.selectOption(value);
    } else {
      await field.fill(value);
    }
  }

  /** The row is bound to an expression. */
  async bindExpression(label: string, expression: string): Promise<void> {
    await this.chooseKind(label, 'expression');
    await this.properties.getByRole('combobox', { name: label, exact: true }).fill(expression);
  }

  // --- connections -------------------------------------------------------------------------------

  /** Draws a connection with the mouse from an output of an element to another element. */
  async connect(source: string, output: string, target: string): Promise<void> {
    const edges = this.page.locator('.react-flow__edge:not(.management-edge)');
    const before = await edges.count();
    await drag(
      this.page,
      await center(nodeById(this.page, source).locator(`.react-flow__handle.source[data-handleid="${output}"]`)),
      await center(nodeById(this.page, target).locator('.react-flow__handle.target')),
    );
    await expect(edges).toHaveCount(before + 1);
  }
}
