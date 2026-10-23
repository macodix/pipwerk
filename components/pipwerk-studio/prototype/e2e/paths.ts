// The ways in which instances (indicators, trends, objects of the application) get onto the canvas, as a user takes them.
// Used by the screenshots (before and after the change of order 06) and by the placement test.
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { lib, openApp } from './support';

type Size = { width: number; height: number };

export interface Way {
  id: string;
  /** Names of the instances that must be connected at the end. */
  cards: string[];
  open: (page: Page, size: Size) => Promise<void>;
}

async function menu(page: Page, size: Size, id: string): Promise<void> {
  if (size.width >= 1280) await page.getByTestId(`menu-${id}`).click();
  else {
    await page.getByTestId('menu-toggle').click();
    await page.getByTestId(`cmenu-${id}`).click();
  }
}

/** The canvas must be shown (phones show one region at a time). */
export async function showCanvas(page: Page, size: Size): Promise<void> {
  if (size.width < 700) await page.getByTestId('bar-canvas').click();
}

async function showProps(page: Page, size: Size): Promise<void> {
  if (size.width < 700) await page.getByTestId('bar-props').click();
  else if (size.width < 1100) await page.locator('[data-testid="tab-props"]:visible').click();
}

/** A click on an entry of the element library (in small windows the library is opened first). */
async function pick(page: Page, size: Size, key: string): Promise<void> {
  if (size.width < 700) await page.getByTestId('bar-library').click();
  else if (size.width < 1100) await page.locator('[data-testid="tab-library"]:visible').click();
  await lib(page, key).click();
}

async function startEmpty(page: Page, size: Size): Promise<void> {
  await openApp(page, size);
  await menu(page, size, 'new');
  await page.getByTestId('wz-leave').click();
}

async function openSample(page: Page, size: Size, sample: string): Promise<void> {
  await openApp(page, size);
  await menu(page, size, 'open');
  await page.locator(`[data-testid="open-row"][data-sample="${sample}"]`).click();
}

export const WAYS: Way[] = [
  {
    id: 'ema-trendfolge', cards: ['EMA20', 'EMA50', 'ATR14'],
    open: async (page, size) => { await openApp(page, size); },
  },
  { id: 'str-01', cards: ['Markttechnik Signal', 'Markttechnik Handel'], open: (page, size) => openSample(page, size, 'str01') },
  { id: 'str-03', cards: ['EMA 20', 'EMA 50', 'ATR 14'], open: (page, size) => openSample(page, size, 'str03') },
  {
    id: 'assistent', cards: ['EMA 20', 'EMA 50'],
    open: async (page, size) => {
      await openApp(page, size);
      await menu(page, size, 'new');
      await page.getByTestId('wz-next').click();
      await page.getByTestId('wz-next').click();
      await page.getByTestId('wz-add-EMA').click();
      await page.getByTestId('wz-add-EMA').click();
      await page.getByTestId('wz-next').click();
      await page.getByTestId('wz-a').selectOption({ index: 1 });
      await page.getByTestId('wz-b').selectOption({ index: 2 });
      await page.getByTestId('wz-next').click();
      await page.getByTestId('wz-next').click();
      await expect(page.getByTestId('wizard')).toHaveCount(0);
    },
  },
  {
    // an EMA from the library with the condition chosen: it is connected at once
    id: 'bibliothek-gewaehlte-bedingung', cards: ['EMA'],
    open: async (page, size) => {
      await startEmpty(page, size);
      await pick(page, size, 'trigger.candle_close');
      await pick(page, size, 'flow.condition');
      await pick(page, size, 'EMA');
    },
  },
  {
    // an EMA from the library with nothing chosen: free, then connected with the condition through its properties
    id: 'bibliothek-danach-verbunden', cards: ['EMA'],
    open: async (page, size) => {
      await startEmpty(page, size);
      await pick(page, size, 'trigger.candle_close');
      await pick(page, size, 'flow.condition');
      await showProps(page, size);
      await page.getByTestId('crumb-strategy').click();
      await pick(page, size, 'EMA');
      await showProps(page, size);
      await expect(page.getByTestId('first-use-none')).toBeVisible();
      await page.getByTestId('host-select').selectOption({ label: 'Bedingung' });
      await expect(page.getByTestId('first-use-text')).toContainText('Bedingung');
    },
  },
];

/** Ways that leave an instance without a first use for the moment (pictures only, not part of the placement test). */
export const FREE_WAYS: Way[] = [
  {
    id: 'assistent-schritt-3', cards: ['EMA 20', 'EMA 50'],
    open: async (page, size) => {
      await openApp(page, size);
      await menu(page, size, 'new');
      await page.getByTestId('wz-next').click();
      await page.getByTestId('wz-next').click();
      await page.getByTestId('wz-add-EMA').click();
      await page.getByTestId('wz-add-EMA').click();
    },
  },
  {
    id: 'bibliothek-frei-mit-ablauf', cards: ['EMA'],
    open: async (page, size) => {
      await startEmpty(page, size);
      await pick(page, size, 'trigger.candle_close');
      await pick(page, size, 'flow.condition');
      await pick(page, size, 'flow.place_order');
      await showProps(page, size);
      await page.getByTestId('crumb-strategy').click();
      await pick(page, size, 'EMA');
    },
  },
];
