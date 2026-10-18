import { expect, type Page, test } from '@playwright/test';

import { StrategyBuilder } from './builder';
import {
  loadedPage,
  openStored,
  save,
  storedStrategies,
  testcase,
  useCleanRun,
  withoutIdentifiersAndPositions,
  type Binding,
  type ElementDocument,
  type StrategyDocument,
} from './support';

// The two test cases of the project, built from the empty drawing area with nothing but the
// operations of the user interface (element library, drawing area, property view, expression
// input, rules), saved, loaded again and compared with the test case document. The test case
// documents serve as the script of the user: they say which element is placed, how it is
// bound and which expression is typed. The Web API is used for nothing but reading what the
// user interface stored.

type TypeDescription = {
  id: string;
  kind: string;
  name: { de: string };
  parameters: { id: string; label: { de: string }; datatype: string; default: unknown }[];
  properties: { id: string; label: { de: string }; datatype: string }[];
};

test.use({ viewport: { width: 1900, height: 1300 } });

useCleanRun();

function escaped(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The group of the element library in which the type of an element stands. */
function groupOf(type: TypeDescription): string {
  if (type.kind === 'trigger') {
    return 'Auslöser';
  }
  return type.kind === 'flow' ? 'Elemente des Ablaufs' : 'Objekttypen';
}

/** Builds the element of a test case document with the operations of the user interface. */
async function buildElement(
  builder: StrategyBuilder,
  types: Map<string, TypeDescription>,
  element: ElementDocument,
  place: (type: TypeDescription) => Promise<string>,
): Promise<string> {
  const type = types.get(element.type);
  expect(type, `type ${element.type}`).toBeDefined();
  await place(type!);
  await builder.setTitle(element.title);
  if (element.instance !== null) {
    await builder.setName(element.instance.name);
  } else if (element.name !== null) {
    await builder.setName(element.name);
  }

  // The properties that the user sets at an element that places an order belong to the order type
  // that the element selects.
  const selected = element.parameters.ordertyp?.value;
  const orderType = typeof selected === 'string' ? types.get(selected) : undefined;
  type Row = { id: string; label: { de: string }; datatype: string; default?: unknown };
  // The standard value of a parameter is already bound when the element is placed; that of a
  // property is not (the third entry).
  const bindings: [Record<string, Binding>, Row[], boolean][] = [
    [element.instance === null ? element.parameters : element.instance.parameter_values, type!.parameters, true],
    [element.properties, [...type!.properties, ...(orderType?.properties ?? [])], false],
  ];
  for (const [stored, descriptions, preset] of bindings) {
    for (const [key, binding] of Object.entries(stored)) {
      const description = descriptions.find((candidate) => candidate.id === key);
      expect(description, `description of ${key}`).toBeDefined();
      const label = description!.label.de;
      if (binding.kind === 'parameter') {
        await builder.bindParameter(label, String(binding.value));
      } else if (binding.kind === 'expression') {
        await builder.bindExpression(label, String(binding.value));
      } else if (binding.kind === 'fixed') {
        if (!preset || description!.default !== binding.value) {
          const choice = ['choice', 'time_unit'].includes(description!.datatype);
          await builder.bindFixed(label, String(binding.value), choice ? 'choice' : 'text');
        }
      }
    }
  }
  for (const rule of element.rules) {
    await builder.addNewRule(rule.name, String(rule.expression));
  }
  return builder.ids.at(-1)!;
}

/** The whole test case, from "Neue Strategie" to the last connection. */
async function buildTestcase(page: Page, expected: StrategyDocument): Promise<StrategyBuilder> {
  const response = await page.request.get('/api/v1/element-types');
  const types = new Map(
    ((await response.json()) as { types: TypeDescription[] }).types.map((type) => [type.id, type] as const),
  );
  const builder = new StrategyBuilder(page);
  await builder.start(expected.title, expected.description);
  for (const parameter of expected.parameters) {
    await builder.addParameter(String(parameter.name), String(parameter.datatype), String(parameter.value));
  }
  for (const rule of expected.rules) {
    const origin = rule.origin;
    await builder.addRuleFromTemplate(String(origin.template_title), rule.name);
  }

  // The elements of the main flow first, the element that places the order at its own slot.
  const owners = new Set(expected.elements.map((element) => element.management_of).filter((id) => id !== null));
  // The slot 7 is kept free for the element with the management: the frame stands below it.
  const slots = [0, 1, 2, 3, 4, 5, 6, 8, 9];
  let next = 0;
  for (const element of expected.elements) {
    if (element.management_of !== null) {
      continue;
    }
    const at = owners.has(element.id) ? 7 : slots[next++]!;
    await buildElement(builder, types, element, (type) =>
      builder.dropMain(groupOf(type), new RegExp(`^${escaped(type.name.de)}`), at),
    );
  }
  // The elements of the management: dropped into the frame that stands below the element.
  for (const element of expected.elements) {
    if (element.management_of === null) {
      continue;
    }
    await buildElement(builder, types, element, (type) =>
      builder.dropIntoFrame(groupOf(type), new RegExp(`^${escaped(type.name.de)}`)),
    );
  }

  // The identifiers are in the order of creation, which differs from the order of the document.
  const created = new Map<string, string>();
  const creationOrder = [
    ...expected.elements.filter((element) => element.management_of === null),
    ...expected.elements.filter((element) => element.management_of !== null),
  ];
  creationOrder.forEach((element, position) => created.set(element.id, builder.ids[position]!));
  for (const connection of expected.connections) {
    await builder.connect(created.get(connection.source)!, connection.output, created.get(connection.target)!);
  }
  return builder;
}

async function expectStoredEqualsTestcase(page: Page, expected: StrategyDocument): Promise<void> {
  const stored = await storedStrategies(page);
  expect(stored).toHaveLength(1);
  expect(withoutIdentifiersAndPositions(stored[0]!)).toEqual(withoutIdentifiersAndPositions(expected));
  // The consistency check reports nothing for the stored document.
  const checked = await page.request.post('/api/v1/check', { data: stored[0] });
  expect(checked.ok()).toBe(true);
  expect(((await checked.json()) as { findings: unknown[] }).findings).toEqual([]);
}

/** The management is collapsed with the arrow in the header of the frame and expanded again. */
async function collapseAndExpand(page: Page, expected: StrategyDocument): Promise<void> {
  const members = expected.elements.filter((element) => element.management_of !== null).length;
  const all = expected.elements.length;
  const toggle = (action: 'einklappen' | 'aufklappen') =>
    page.getByRole('button', { name: `Verwaltung „Order aufgeben“ ${action}` });

  await expect(page.locator('.react-flow__node-management')).toHaveCount(1);
  await expect(page.locator('.react-flow__node-element')).toHaveCount(all);
  await toggle('einklappen').click();
  await expect(page.locator('.react-flow__node-element')).toHaveCount(all - members);
  await expect(toggle('aufklappen')).toHaveAttribute('aria-expanded', 'false');
  await toggle('aufklappen').click();
  await expect(page.locator('.react-flow__node-element')).toHaveCount(all);
  await expect(toggle('einklappen')).toHaveAttribute('aria-expanded', 'true');
}

test.describe('the test cases, built through the user interface', () => {
  test('str-03 (EMA-Trendfolge): build, save, reload, open, compare', async ({ page }) => {
    const expected = testcase('str-03');
    await loadedPage(page);

    await buildTestcase(page, expected);
    await save(page);
    await expect(page.getByText('Befunde: 0')).toBeVisible();

    await page.reload();
    await loadedPage(page);
    await openStored(page, expected.title);
    await expect(page.getByText('Befunde: 0')).toBeVisible();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(expected.elements.length);
    await expect(page.locator('.element-node[data-severity]')).toHaveCount(0);
    await expectStoredEqualsTestcase(page, expected);
  });

  test('str-01 (Scalping Punkt 2 Ausbruch): build with the management as a frame, collapse, save, reload, open, compare', async ({
    page,
  }) => {
    const expected = testcase('str-01');
    await loadedPage(page);

    await buildTestcase(page, expected);
    // The management stands as a frame at the output "gestellt" of "Order aufgeben": collapsed,
    // its elements are hidden, expanded they are back, and the document does not change.
    await collapseAndExpand(page, expected);
    await save(page);
    await expect(page.getByText('Befunde: 0')).toBeVisible();

    await page.reload();
    await loadedPage(page);
    await openStored(page, expected.title);
    await expect(page.getByText('Befunde: 0')).toBeVisible();
    await expect(page.locator('.react-flow__node-element')).toHaveCount(expected.elements.length);
    await expect(page.locator('.element-node[data-severity]')).toHaveCount(0);
    await collapseAndExpand(page, expected);
    // Closing does not ask: collapsing changed nothing in the document.
    await page.getByRole('button', { name: 'Schließen' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expectStoredEqualsTestcase(page, expected);
  });
});
