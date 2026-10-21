import { expect, test } from '@playwright/test';
import { STR01, STR03, jumpUntil, node, nowNode, openApp, runBacktest, startSingle, stepUntil } from './support';

// Acceptance criterion 2: a walk through the operation only, with clicks. Single-step test of str-01 from the
// start to the first acting place, a step, a breakpoint, the jump to the breakpoint, a rejected order with its
// reason; backtest of str-03 with the result, a click on a trade, saving and the comparison of two saved backtests.

test('single-step test of str-01: first acting place, step, breakpoint, jump, rejected order', async ({ page }) => {
  const errors = await openApp(page);
  await startSingle(page, STR01);

  // it stops at the first acting place, at the first element of the flow
  await expect(page.getByTestId('eval-acting')).toBeVisible();
  await expect(page.getByTestId('run-why')).toContainText('ersten handelnden Stelle');
  await expect(nowNode(page)).toHaveCount(1);
  await expect(nowNode(page)).toHaveAttribute('data-type', 'trigger.candle_close');
  await expect(page.getByTestId('eval-element')).toContainText('(1/');
  // the chart marks the acting places and shows the candles with black border (rising green, falling red)
  await expect(page.getByTestId('marker-acting').first()).toBeVisible();
  await expect(page.getByTestId('chart')).toHaveCount(2);
  const candle = page.locator('[data-testid="chart"] .candle rect').first();
  await expect(candle).toHaveAttribute('stroke', '#000');
  expect(['#1f9d55', '#d64545']).toContain(await candle.getAttribute('fill'));

  // one step: the next element of the flow is highlighted
  const first = await nowNode(page).getAttribute('data-node-id');
  await page.getByTestId('btn-step').click();
  await expect(nowNode(page)).toHaveCount(1);
  expect(await nowNode(page).getAttribute('data-node-id')).not.toBe(first);
  await expect(page.getByTestId('eval-element')).toContainText('(2/');

  // a breakpoint at "Order aufgeben", then the jump stops there
  await page.getByTestId('zoom-fit').click();
  const order = node(page, 'Order aufgeben').first();
  await order.hover();
  await order.getByTestId('bp-toggle').click();
  await expect(order).toHaveAttribute('data-bp', '1');
  await page.getByTestId('btn-jump').click();
  await expect(nowNode(page)).toHaveAttribute('data-node-name', 'Order aufgeben');
  await expect(page.getByTestId('run-why')).toContainText('Haltepunkt');

  // the order was placed: it is in the orders and in the chart
  await expect(page.getByTestId('order-row').first()).toBeVisible();
  await expect(page.getByTestId('marker-placed').first()).toBeVisible();

  // on to an evaluation that ends with a rejected order; the reason is at the element
  await jumpUntil(page, 'eval-reject');
  await stepUntil(page, async () => (await page.locator('[data-testid="node"][data-rejected="1"]').count()) > 0);
  const rejected = page.locator('[data-testid="node"][data-rejected="1"]').first();
  await expect(rejected).toHaveAttribute('data-node-name', 'Order aufgeben');
  await expect(page.getByTestId('reject-callout')).toBeVisible();
  await expect(page.getByTestId('reject-callout')).toContainText('Broker');
  await expect(rejected.getByTestId('taken')).toContainText('nicht gestellt');
  await page.mouse.move(2, 2);
  // the properties view shows the same reason
  await rejected.click({ position: { x: 40, y: 20 } });
  await expect(page.getByTestId('props-reject')).toContainText('Broker');

  // remove the breakpoint again
  await rejected.hover();
  await rejected.getByTestId('bp-toggle').click();
  await expect(rejected).toHaveAttribute('data-bp', '0');
  expect(errors).toEqual([]);
});

test('backtest of str-03: result, trade in the chart, saving and comparing two saved backtests', async ({ page }) => {
  const errors = await openApp(page);
  await runBacktest(page, STR03);

  // key figures, curve with drawdown below it, trades, chart with markers
  for (const id of ['net', 'trades', 'hit', 'pf', 'dd', 'avgwin', 'avgloss']) await expect(page.getByTestId(`fig-${id}`)).toBeVisible();
  await expect(page.getByTestId('chart-equity')).toBeVisible();
  await expect(page.getByTestId('chart-drawdown')).toBeVisible();
  const eq = await page.getByTestId('chart-equity').boundingBox();
  const dd = await page.getByTestId('chart-drawdown').boundingBox();
  expect((eq as { y: number }).y).toBeLessThan((dd as { y: number }).y);
  const rows = page.getByTestId('trade-row');
  expect(await rows.count()).toBeGreaterThan(5);
  await expect(page.getByTestId('trade-table').locator('thead')).toContainText('Eröffnung');
  await expect(page.getByTestId('trade-table').locator('thead')).toContainText('Gewinn/Verlust');
  await expect(page.getByTestId('trade-table').locator('thead')).toContainText('Kosten');

  // a click on a trade shows its place in the chart
  const before = await page.getByTestId('chart-trades').getAttribute('data-first');
  await rows.nth(40).click();
  await expect(page.locator('[data-testid="marker-trade"].selected')).toHaveCount(1);
  expect(await page.getByTestId('chart-trades').getAttribute('data-first')).not.toBe(before);
  const id = await rows.nth(40).getAttribute('data-trade');
  await expect(page.locator('[data-testid="marker-trade"].selected')).toHaveAttribute('data-trade', id as string);

  // save explicitly
  await page.getByTestId('btn-save-bt').click();
  await page.getByTestId('save-bt-name').fill('str-03 Standard');
  await page.getByTestId('save-bt-ok').click();
  await expect(page.getByTestId('saved-tag')).toBeVisible();
  await expect(page.getByTestId('menu-saved')).toContainText('(1)');

  // a second backtest with another strategy parameter, saved too
  await page.getByTestId('btn-back').click();
  await page.getByTestId('param-p-stop').fill('3');
  await expect(page.getByTestId('field-param-p-stop')).toHaveAttribute('data-changed', '1');
  await page.getByTestId('start-test').click();
  await expect(page.getByTestId('result')).toBeVisible({ timeout: 120_000 });
  await page.getByTestId('btn-save-bt').click();
  await page.getByTestId('save-bt-name').fill('str-03 Stop-Abstand 3');
  await page.getByTestId('save-bt-ok').click();
  await expect(page.getByTestId('menu-saved')).toContainText('(2)');

  // list of the saved backtests, compare two
  await page.getByTestId('menu-saved').click();
  await expect(page.getByTestId('saved-row')).toHaveCount(2);
  await expect(page.getByTestId('btn-compare')).toBeDisabled();
  await page.getByTestId('saved-check').nth(0).check();
  await page.getByTestId('saved-check').nth(1).check();
  await expect(page.getByTestId('btn-compare')).toBeEnabled();
  await page.getByTestId('btn-compare').click();
  await expect(page.getByTestId('compare')).toBeVisible();
  await expect(page.getByTestId('cmp-head')).toHaveCount(2);
  await expect(page.getByTestId('chart-compare').getByTestId('line-series')).toHaveCount(2);
  for (const k of ['net', 'trades', 'hit', 'pf', 'dd', 'avgwin', 'avgloss']) await expect(page.getByTestId(`cmp-${k}`)).toBeVisible();
  await expect(page.getByTestId('cmp-value').first()).toBeVisible();
  // the tested version of the strategy is shown read only
  await page.getByTestId('cmp-view-strategy').first().click();
  await expect(page.getByTestId('dialog-strategy')).toBeVisible();
  await expect(page.getByTestId('flow-tested')).toBeVisible();
  await expect(page.getByTestId('dialog-strategy').getByTestId('node').first()).toBeVisible();
  await page.getByTestId('strategy-close').click();
  expect(errors).toEqual([]);
});
