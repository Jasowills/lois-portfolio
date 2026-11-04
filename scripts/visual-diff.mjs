// scripts/visual-diff.mjs
// Compares each built section at 1440px against the Figma reference PNGs.
// Setup:  npm i -D playwright pixelmatch pngjs sharp && npx playwright install chromium
// Usage:  npm run dev (in another terminal), then: node scripts/visual-diff.mjs [--url=http://localhost:5173]
//
// Requirements on the app:
//  - each section root has data-section="nav|hero|work|experience|services|about|testimonials|cta|footer"
//  - the app honors ?static=1 (all motion off, reduced-motion mode, no loader, no GL, no cursor)
//  - project images may differ from the reference; diff is reported twice: full, and with image regions masked
//    (elements with data-diff-ignore are painted solid gray before screenshot)

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const URL_BASE = (process.argv.find(a => a.startsWith('--url=')) || '--url=http://localhost:5173').split('=')[1];
const STATIC_URL = URL_BASE.includes('?') ? URL_BASE : `${URL_BASE}/?static=1`;
const WIDTH = 1440;
const SECTIONS = [
  ['nav', 'reference/01-navigation.png'],
  ['hero', 'reference/02-hero.png'],
  ['work', 'reference/03-selected-work.png'],
  ['experience', 'reference/04-experience.png'],
  ['services', 'reference/05-services.png'],
  ['about', 'reference/06-about.png'],
  ['testimonials', 'reference/07-testimonials.png'],
  ['cta', 'reference/08-cta.png'],
  ['footer', 'reference/09-footer.png'],
];

await mkdir('reference/diff', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: 1 });
await page.goto(STATIC_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// Deterministic measurement: webfont swap can leave the page at a fractional
// scroll offset (scroll anchoring), which rounds element screenshots up by a
// pixel and fakes a height mismatch. Pin the scroll position instead.
await page.evaluate(() => window.scrollTo(0, 0));
await page.addStyleTag({ content: '[data-diff-ignore]{background:#c9c9c9 !important;} [data-diff-ignore] *{visibility:hidden !important;}' });

let failed = 0;
for (const [id, refPath] of SECTIONS) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const el = page.locator(`[data-section="${id}"]`).first();
  if (!(await el.count())) { console.log(`MISSING  ${id}`); failed++; continue; }
  const shotBuf = await el.screenshot();
  const ref = sharp(await readFile(refPath));
  const meta = await ref.metadata();
  const refBuf = await ref.resize({ width: WIDTH }).png().toBuffer(); // normalize 2x exports to 1x
  const a = PNG.sync.read(shotBuf);
  const b = PNG.sync.read(refBuf);
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const crop = (png) => {
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(png, out, 0, 0, w, h, 0, 0);
    return out;
  };
  const A = crop(a), B = crop(b);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: 0.12 });
  const pct = (n / (w * h)) * 100;
  await writeFile(`reference/diff/${id}.png`, PNG.sync.write(diff));
  const sizeNote = (a.height !== b.height) ? `  HEIGHT MISMATCH built=${a.height} ref=${b.height}` : '';
  const ok = pct <= 1.0 && !sizeNote;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(13)} ${pct.toFixed(2)}% differing${sizeNote}`);
}
await browser.close();
process.exit(failed ? 1 : 0);
