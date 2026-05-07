// [SCREENSHOT_CAPTURE] /scripts/capture-screenshots.mjs
// Captures the live deploy at 1440x900 (desktop) and 390x844 (mobile) into
// /docs/screenshots/. Run from repo root with `node scripts/capture-screenshots.mjs`.
// Requires `npx playwright install chromium` once.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'docs', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const URL = process.env.OPENCLAW_DEPLOY_URL ?? 'https://openclaw-deploy.prin7r.com';

const TARGETS = [
  {
    name: 'landing-desktop.png',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
  },
  {
    name: 'landing-mobile.png',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  },
];

const browser = await chromium.launch({ headless: true });
console.log(`[SCREENSHOT_CAPTURE] target URL: ${URL}`);

for (const t of TARGETS) {
  const context = await browser.newContext({
    viewport: t.viewport,
    deviceScaleFactor: t.deviceScaleFactor,
    isMobile: t.isMobile,
    hasTouch: t.isMobile,
  });
  const page = await context.newPage();
  console.log(`[SCREENSHOT_CAPTURE] navigating ${t.name} viewport=${t.viewport.width}x${t.viewport.height}`);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45_000 });
  // small settle for any font-swap / layout
  await page.waitForTimeout(800);
  const out = resolve(OUT_DIR, t.name);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`[SCREENSHOT_CAPTURE] wrote ${out}`);
  await context.close();
}

await browser.close();
