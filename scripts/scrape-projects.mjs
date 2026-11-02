// scripts/scrape-projects.mjs
// Downloads project images and copy from the ORIGINAL portfolio (https://trulylois.work).
// The site is JavaScript-rendered, so a plain fetch returns nothing; this uses Playwright.
//
// Setup:  npm i -D playwright && npx playwright install chromium
// Usage:  node scripts/scrape-projects.mjs [--deep] [--url=https://trulylois.work]
//   --deep  also follows same-origin links one level (project/case-study pages)
//
// Output:
//   public/images/old-site/*            downloaded images (original bytes, hashed names)
//   src/data/old-site-manifest.json     every image with page, alt, size, nearest heading, DOM order
//   src/data/old-site-content.json      headings, paragraphs and links per page (for services copy, socials, etc.)
//   reference/old-site-fullpage.png     full-page screenshot of each visited page

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const args = process.argv.slice(2);
const DEEP = args.includes('--deep');
const START = (args.find(a => a.startsWith('--url=')) || '--url=https://trulylois.work').split('=')[1];
const ORIGIN = new URL(START).origin;

await mkdir('public/images/old-site', { recursive: true });
await mkdir('src/data', { recursive: true });
await mkdir('reference', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const manifest = [];
const content = {};
const seenUrls = new Set();
const visited = new Set();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let y = 0;
      const step = 400;
      const t = setInterval(() => {
        window.scrollBy(0, step);
        y += step;
        if (y >= document.documentElement.scrollHeight + 800) { clearInterval(t); resolve(); }
      }, 180);
    });
    window.scrollTo(0, 0);
  });
}

async function collect(page, url) {
  const data = await page.evaluate(() => {
    const abs = u => { try { return new URL(u, location.href).href; } catch { return null; } };
    const nearestHeading = el => {
      let n = el;
      for (let i = 0; i < 8 && n; i++, n = n.parentElement) {
        const h = n.querySelector && n.querySelector('h1,h2,h3,h4');
        if (h && h.textContent.trim()) return h.textContent.trim().slice(0, 120);
      }
      return '';
    };
    const imgs = [];
    let order = 0;
    document.querySelectorAll('img, picture source, video, [style*="background"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      const common = { order: order++, heading: nearestHeading(el), w: Math.round(rect.width), h: Math.round(rect.height) };
      if (el.tagName === 'IMG') {
        const srcset = el.getAttribute('srcset');
        let best = el.currentSrc || el.src;
        if (srcset) {
          const parts = srcset.split(',').map(s => s.trim().split(/\s+/));
          parts.sort((a, b) => parseFloat(b[1] || '0') - parseFloat(a[1] || '0'));
          if (parts[0] && parts[0][0]) best = abs(parts[0][0]);
        }
        imgs.push({ ...common, url: abs(best), alt: el.alt || '', kind: 'img' });
      } else if (el.tagName === 'SOURCE') {
        const s = el.getAttribute('srcset');
        if (s) imgs.push({ ...common, url: abs(s.split(',').pop().trim().split(/\s+/)[0]), alt: '', kind: 'source' });
      } else if (el.tagName === 'VIDEO') {
        if (el.poster) imgs.push({ ...common, url: abs(el.poster), alt: 'video poster', kind: 'poster' });
        const v = el.currentSrc || el.src;
        if (v) imgs.push({ ...common, url: abs(v), alt: 'video', kind: 'video' });
      }
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/g);
      if (m) m.forEach(x => imgs.push({ ...common, url: abs(x.replace(/url\(["']?|["']?\)/g, '')), alt: '', kind: 'bg' }));
    });
    const text = [...document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,span')]
      .map(e => ({ tag: e.tagName.toLowerCase(), text: e.textContent.trim().replace(/\s+/g, ' '), href: e.href || null }))
      .filter(t => t.text && t.text.length < 600);
    const links = [...document.querySelectorAll('a[href]')].map(a => ({ text: a.textContent.trim(), href: a.href }));
    return { imgs: imgs.filter(i => i.url), text, links };
  });
  content[url] = { text: data.text, links: data.links };
  return data.imgs;
}

async function download(url) {
  if (seenUrls.has(url) || url.startsWith('data:')) return null;
  seenUrls.add(url);
  try {
    const res = await ctx.request.get(url);
    if (!res.ok()) return null;
    const buf = await res.body();
    const ext = path.extname(new URL(url).pathname) || '.bin';
    const name = createHash('sha1').update(url).digest('hex').slice(0, 12) + ext;
    await writeFile(path.join('public/images/old-site', name), buf);
    return { file: `/images/old-site/${name}`, bytes: buf.length };
  } catch (e) {
    console.warn('download failed', url, e.message);
    return null;
  }
}

async function visit(url) {
  if (visited.has(url)) return [];
  visited.add(url);
  const page = await ctx.newPage();
  console.log('visiting', url);
  await page.goto(url, { waitUntil: 'networkidle' });
  await autoScroll(page);
  await page.waitForTimeout(1200);
  const slug = new URL(url).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
  await page.screenshot({ path: `reference/old-site-${slug}.png`, fullPage: true });
  const imgs = await collect(page, url);
  for (const i of imgs) {
    const saved = await download(i.url);
    if (saved) manifest.push({ page: url, ...i, ...saved });
  }
  const links = DEEP
    ? await page.$$eval('a[href]', as => as.map(a => a.href))
    : [];
  await page.close();
  return [...new Set(links)].filter(l => l.startsWith(ORIGIN) && !l.includes('#') && !visited.has(l));
}

const next = await visit(START);
if (DEEP) for (const l of next.slice(0, 25)) await visit(l);

await writeFile('src/data/old-site-manifest.json', JSON.stringify(manifest, null, 2));
await writeFile('src/data/old-site-content.json', JSON.stringify(content, null, 2));
await browser.close();
console.log(`Done. ${manifest.length} images saved. Review src/data/old-site-manifest.json and map images to projects in src/data/projects.json.`);
