/**
 * Real-project screenshot suite (runs in CI with Playwright Chromium).
 * Captures genuine renders of the simulator at mobile, small-phone and
 * desktop viewports, plus a machine-readable responsive audit report.
 *
 * All gestures are computed from the live .phone-screen bounding box so
 * they stay correct whatever the responsive scale factor is. Each capture
 * is wrapped in try/catch: one flaky interaction must not kill the suite.
 *
 * Usage:  BASE_URL=http://localhost:4173 node scripts/screenshot.mjs
 */
import { chromium } from 'playwright';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, dsf: 2 },
  { name: 'small', width: 320, height: 568, dsf: 2 },
  { name: 'landscape', width: 844, height: 390, dsf: 2 },
  { name: 'desktop', width: 1440, height: 900, dsf: 1 },
];

const report = [];
await mkdir(out, { recursive: true });
const browser = await chromium.launch();

/** Drag inside the phone screen using its live bounding rect. */
async function dragInPhone(page, fromF, toF, steps = 14) {
  const box = await page.locator('.phone-screen').boundingBox();
  if (!box) throw new Error('phone-screen not found');
  const fx = box.x + box.width * fromF[0];
  const fy = box.y + box.height * fromF[1];
  const tx = box.x + box.width * toF[0];
  const ty = box.y + box.height * toF[1];
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  await page.mouse.move(tx, ty, { steps });
  await page.mouse.up();
}

async function guarded(name, fn) {
  try {
    await fn();
    report.push({ capture: name, ok: true });
  } catch (err) {
    report.push({ capture: name, ok: false, error: String(err?.message ?? err) });
  }
}

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
    await guarded('01-lock-screen', async () => {
      await page.screenshot({ path: join(out, '01-lock-screen.png') });
    });

    await guarded('02-home-screen', async () => {
      await page.locator('.lock-screen').click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(out, '02-home-screen.png') });
    });

    await guarded('03-control-center', async () => {
      await dragInPhone(page, [0.5, 0.02], [0.5, 0.34]);
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(out, '03-control-center.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    });

    await guarded('04-calculator', async () => {
      // Open the app drawer with a bottom-edge swipe; retry once if the
      // gesture threshold was missed.
      await dragInPhone(page, [0.5, 0.98], [0.5, 0.45]);
      const drawer = page.locator('.drawer-grid');
      if (!(await drawer.isVisible().catch(() => false))) {
        await dragInPhone(page, [0.5, 0.98], [0.5, 0.4]);
      }
      await drawer.waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(500);
      // AppIcon opens on pointerup (with a pointerdown-armed long-press
      // timer), not onClick — dispatch both events on its wrap element.
      // Synthetic events bubble to React's root listeners and are immune
      // to the animated drawer scrim's hit-testing.
      await page.evaluate(() => {
        const label = [...document.querySelectorAll('.app-icon-label')]
          .find((el) => el.textContent === 'Calculator');
        const wrap = label?.closest('.app-icon-wrap');
        if (!wrap) throw new Error('Calculator icon not found in drawer');
        const opts = { bubbles: true, cancelable: true, isPrimary: true };
        wrap.dispatchEvent(new PointerEvent('pointerdown', opts));
        wrap.dispatchEvent(new PointerEvent('pointerup', opts));
      });
      await page.locator('.calc-app').waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(out, '04-calculator.png') });

      await page.getByRole('button', { name: '7' }).click();
      await page.getByRole('button', { name: '×' }).click();
      await page.getByRole('button', { name: '6' }).click();
      await page.getByRole('button', { name: '=' }).click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(out, '05-calculator-result.png') });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    });

    await guarded('06-glyph-back', async () => {
      // On phone viewports the stage controls collapse behind a toggle.
      await page.getByRole('button', { name: 'Stage controls' }).click().catch(() => {});
      await page.getByRole('button', { name: 'Flip phone' }).click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: join(out, '06-glyph-back.png') });
      await page.getByRole('button', { name: 'Front view' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Stage controls' }).click().catch(() => {});
    });

    await guarded('07-always-on-display', async () => {
      await page.evaluate(() => {
        const raw = localStorage.getItem('np3:v1:system');
        const sys = raw ? JSON.parse(raw) : {};
        sys.powerState = 'aod';
        localStorage.setItem('np3:v1:system', JSON.stringify(sys));
      });
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(out, '07-always-on-display.png') });
    });
  }

  if (vp.name === 'small') {
    await guarded('08-small-viewport', async () => {
      await page.screenshot({ path: join(out, '08-small-viewport.png') });
    });
  }

  if (vp.name === 'landscape') {
    await guarded('10-landscape-stage', async () => {
      await page.locator('.lock-screen').click().catch(() => {});
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(out, '10-landscape-stage.png') });
    });
  }

  if (vp.name === 'desktop') {
    await guarded('09-desktop-stage', async () => {
      await page.locator('.lock-screen').click().catch(() => {});
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(out, '09-desktop-stage.png') });
    });
  }

  await ctx.close();
}

await browser.close();
await writeFile(join(out, 'responsive-audit.json'), JSON.stringify(report, null, 2));
const failed = report.filter((r) => r.ok === false);
const pngs = (await readdir(out)).filter((f) => f.endsWith('.png'));
console.log(`Screenshots + audit written to ${out} (${pngs.length} images, ${failed.length} failed captures)`);
if (failed.length) console.log(JSON.stringify(failed, null, 2));
// A total failure (server down, selectors all broken) should fail the job;
// individual flaky captures are recorded in the audit instead.
if (pngs.length === 0) process.exit(1);
