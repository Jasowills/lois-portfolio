// scripts/capture-motion.mjs
// Records a 10 second scroll review of the motion build. The first visit in a
// fresh context runs the intro loader; the scroll then travels the full page
// with Lenis wheel smoothing, ending on the footer. Playwright writes a WebM
// and ffmpeg trims the last 10 seconds to reference/motion/scroll-10s.mp4.
//
// Usage: npm run build && npx vite preview --port 5173 (or npm run dev)
//        node scripts/capture-motion.mjs [--url=http://localhost:5173]
//
// The capture uses a 1440x900 viewport at 1x. The video is a review artifact,
// not part of the page build; pass --keep-raw to retain the untrimmed WebM.

import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const run = promisify(execFile);
const URL_BASE = (process.argv.find((arg) => arg.startsWith('--url=')) || '--url=http://localhost:5173/')
  .split('=')
  .slice(1)
  .join('=');
const OUT_DIR = 'reference/motion';
const OUT_FILE = `${OUT_DIR}/scroll-10s.mp4`;
const CLIP_SECONDS = 10;
const SCROLL_SECONDS = 8;
const KEEP_RAW = process.argv.includes('--keep-raw');

const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

await mkdir(OUT_DIR, { recursive: true });
const rawDir = await mkdtemp(join(tmpdir(), 'lois-motion-'));
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

try {
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts?.ready);

  // The loader releases the page when its cloud wipe starts. Wait for the
  // wipe to finish, then let the banner finish typing before scrolling.
  await page
    .waitForFunction(() => !document.documentElement.dataset.loader, null, { timeout: 6000 })
    .catch(() => {});
  await page.waitForTimeout(1000);

  const maxScroll = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );

  // Sine-eased wheel deltas: Lenis smooths the accumulation, so the visible
  // motion starts and ends gently while covering the whole document.
  const started = Date.now();
  let sent = 0;
  while (true) {
    const elapsed = (Date.now() - started) / 1000;
    const t = Math.min(1, elapsed / SCROLL_SECONDS);
    const want = Math.round(maxScroll * easeInOutSine(t));
    const delta = want - sent;
    if (delta > 0) {
      await page.mouse.wheel(0, delta);
      sent = want;
    }
    if (t >= 1) break;
    await page.waitForTimeout(50);
  }

  // Let the lerp settle on the footer, then hold it for the final frame.
  const settleBy = Date.now() + 2500;
  let position = 0;
  while (Date.now() < settleBy) {
    position = await page.evaluate(() => window.scrollY);
    if (Math.abs(position - maxScroll) < 2) break;
    await page.waitForTimeout(100);
  }
  if (position < maxScroll - 2) {
    await page.mouse.wheel(0, maxScroll - position);
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(350);
} finally {
  await context.close();
  await browser.close();
}

const recordings = (await readdir(rawDir)).filter((file) => file.endsWith('.webm'));
if (!recordings.length) {
  throw new Error('Playwright did not produce a WebM recording.');
}
const rawVideo = join(rawDir, recordings[0]);
const rawPath = `${OUT_DIR}/scroll-raw.webm`;

let duration = 0;
try {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    rawVideo,
  ]);
  duration = Number.parseFloat(stdout.trim());
} catch {
  // ffprobe missing: keep the raw recording and report its path.
}

if (Number.isFinite(duration) && duration > 0) {
  const start = Math.max(0, duration - CLIP_SECONDS);
  try {
    await run('ffmpeg', [
      '-y',
      '-i',
      rawVideo,
      '-ss',
      start.toFixed(3),
      '-t',
      String(CLIP_SECONDS),
      '-an',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      OUT_FILE,
    ]);
    console.log(`Wrote ${OUT_FILE} (${CLIP_SECONDS}s, 1440x900, ${duration.toFixed(2)}s source)`);
  } catch (error) {
    await copyFile(rawVideo, rawPath);
    console.warn(`ffmpeg failed, kept the raw recording at ${rawPath}`);
    console.warn(String(error));
  }
} else {
  await copyFile(rawVideo, rawPath);
  console.warn(`ffprobe unavailable, kept the raw recording at ${rawPath}`);
}

if (KEEP_RAW) {
  await copyFile(rawVideo, rawPath);
  console.log(`Raw recording kept at ${rawPath}`);
}
await rm(rawDir, { recursive: true, force: true });
