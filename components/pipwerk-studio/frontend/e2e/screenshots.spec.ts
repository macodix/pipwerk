import { openApp, openStrategy, SIZES, test } from './support';

// Screenshots of the open strategy "EMA-Trendfolge" in the six window sizes. They land in the directory of the test run
// (`test-results/…`, not versioned); whoever needs them copies them from there.
for (const size of SIZES) {
  test(`screenshot of EMA-Trendfolge in ${size.width} x ${size.height}`, async ({ page, api }, testInfo) => {
    void api;
    await openApp(page, { width: size.width, height: size.height });
    await openStrategy(page, 'EMA-Trendfolge');
    await page.mouse.move(1, size.height - 1);
    await page.waitForTimeout(700);
    await page.screenshot({ path: testInfo.outputPath(`ema-trendfolge-${size.width}x${size.height}.png`) });
  });
}
