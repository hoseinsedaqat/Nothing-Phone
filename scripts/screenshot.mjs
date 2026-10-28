/**
 * Real-project screenshot suite (runs in CI with Playwright Chromium).
 * Captures genuine renders of the simulator at mobile, small-phone and
 * desktop viewports, plus a machine-readable responsive audit report.
 *
 * Usage:  BASE_URL=http://localhost:4173 node scripts/screenshot.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, dsf: 2 },
  { name: 'small', width: 320, height: 568, dsf: 2 },
  { name: 'desktop', width: 1440, height: 900, dsf: 1 },
];

const report = [];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => report.push({ viewport: vp.name, kind: 'pageerror', message: err.message }));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Responsive audit — horizontal overflow is the classic mobile breakage.
  const audit = await page.evaluate(() => {
    const de = document.documentElement;
    const frame = document.querySelector('.phone-frame');
    const screen = document.querySelector('.phone-screen');
    const r = frame?.getBoundingClientRect();
    const sr = screen?.getBoundingClientRect();
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      horizontalOverflow: de.scrollWidth > de.clientWidth + 1,
      frame: r ? { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) } : null,
      screen: sr ? { width: Math.round(sr.width), height: Math.round(sr.height) } : null,
      frameFitsViewport: r ? r.left >= -1 && r.right <= window.innerWidth + 1 && r.top >= -1 && r.bottom <= window.innerHeight + 1 : false,
    };
  });
  report.push({ viewport: vp.name, kind: 'audit', ...audit });

  if (vp.name === 'mobile') {
    await page.screenshot({ path: join(out, '01-lock-screen.png') });

    // Unlock with a single tap (the user-reported gesture contract).
    await page.locator('.lock-screen').click({ position: { x: 195, y: 420 } });
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(out, '02-home-screen.png') });

    // Control center: drag down from the top hot zone.
    await page.mouse.move(195, 24);
    await page.mouse.down();
    await page.mouse.move(195, 220, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(out, '03-control-center.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Calculator via app drawer (swipe up from bottom).
    await page.mouse.move(195, 830);
    await page.mouse.down();
    await page.mouse.move(195, 420, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    await page.getByText('Calculator', { exact: true }).first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(out, '04-calculator.png') });

    // Press some keys so the display isn't empty.
    await page.getByRole('button', { name: '7' }).click();
    await page.getByText('×', { exact: true }).click();
    await page.getByRole('button', { name: '6' }).click();
    await page.getByRole('button', { name: '=' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(out, '05-calculator-result.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // Rear Glyph view via the stage "Flip phone" control.
    await page.getByRole('button', { name: 'Flip phone' }).click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(out, '06-glyph-back.png') });
    await page.getByRole('button', { name: 'Front view' }).click();
    await page.waitForTimeout(500);

    // Always-On Display: write persisted state and reload.
    await page.evaluate(() => {
      const raw = localStorage.getItem('np3:v1:system');
      const sys = raw ? JSON.parse(raw) : {};
      sys.powerState = 'aod';
      localStorage.setItem('np3:v1:system', JSON.stringify(sys));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(out, '07-always-on-display.png') });
  }

  if (vp.name === 'small') {
    await page.screenshot({ path: join(out, '08-small-viewport.png') });
  }

  if (vp.name === 'desktop') {
    await page.locator('.lock-screen').click({ position: { x: 195, y: 420 } }).catch(() => {});
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(out, '09-desktop-stage.png') });
  }

  await ctx.close();
}

await browser.close();
await writeFile(join(out, 'responsive-audit.json'), JSON.stringify(report, null, 2));
console.log(`Screenshots + audit written to ${out}`);
