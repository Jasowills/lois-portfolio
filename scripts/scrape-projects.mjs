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
//
// Site specifics handled here:
//   - Wix lazy media resolves to blob: URLs, which the request API cannot fetch. Those bytes
//     are read in the page context (fetch + FileReader) while the page is still open.
//   - The site has no real h-tags; big-text sections are recorded with their computed font
//     size and offsetTop so images can be mapped to the nearest section above them.

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const args = process.argv.slice(2);
const DEEP = args.includes('--deep');
const START = (args.find(a => a.startsWith('--url=')) || '--url=https://trulylois.work').split('=')[1];
const ORIGIN = new URL(START).origin;

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

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
    const topOf = el => Math.round(el.getBoundingClientRect().top + window.scrollY);
    const fontSize = el => {
      const s = getComputedStyle(el);
      return s ? Math.round(parseFloat(s.fontSize)) : 0;
    };
    const nearestHeading = el => {
      // First: any ancestor with visible text at display size (the site styles
      // headings as p/span/font_*, so h-tag search alone returns nothing).
      let n = el.parentElement;
      for (let hop = 0; hop < 8 && n; hop++, n = n.parentElement) {
        if (!n.querySelector) continue;
        const texts = [...n.querySelectorAll('p,h1,h2,h3,h4,h5,span,div')]
          .filter(t => {
            const rect = t.getBoundingClientRect();
            const fs = fontSize(t);
            return fs >= 22 && rect.width > 0 && rect.top + window.scrollY <= topOf(el) && t.textContent.trim();
          });
        if (texts.length) {
          return texts[texts.length - 1].textContent.trim().replace(/\s+/g, ' ').slice(0, 120);
        }
      }
      // Fallback: the classic h-tag walk.
      n = el;
      for (let i = 0; i < 8 && n; i++, n = n.parentElement) {
        if (n.querySelector && n.querySelector('h1,h2,h3,h4')) {
          const h = n.querySelector('h1,h2,h3,h4');
          if (h && h.textContent.trim()) return h.textContent.trim().slice(0, 120);
        }
      }
      return '';
    };
    const imgs = [];
    let order = 0;
    document.querySelectorAll('img, picture source, video, [style*="background"]').forEach(el => {
      const rect = el.getBoundingClientRect();
      const common = {
        order: order++,
        heading: nearestHeading(el),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        top: topOf(el),
        fontSize: fontSize(el.parentElement || el),
      };
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
        if (v && v.startsWith('blob:')) imgs.push({ ...common, url: v, alt: 'video', kind: 'video' });
        else if (v) imgs.push({ ...common, url: abs(v), alt: 'video', kind: 'video' });
      }
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\(["']?([^"')]+)["']?\)/g);
      if (m) m.forEach(x => imgs.push({ ...common, url: abs(x.replace(/url\(["']?|["']?\)/g, '')), alt: '', kind: 'bg' }));
    });
    const text = [...document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,span')]
      .map(e => {
        const common = { tag: e.tagName.toLowerCase(), text: e.textContent.trim().replace(/\s+/g, ' '), href: e.href || null };
        if (!common.text || common.text.length >= 600) return null;
        const fs = fontSize(e);
        if (fs >= 20) {
          return { ...common, fontSize: fs, top: topOf(e) };
        }
        return common;
      })
      .filter(Boolean);
    const links = [...document.querySelectorAll('a[href]')].map(a => ({ text: a.textContent.trim(), href: a.href }));
    return { imgs: imgs.filter(i => i.url), text, links, host: location.host };
  });
  content[url] = { text: data.text, links: data.links, host: data.host };
  return data.imgs;
}

// Reads the raw bytes of the collected image URLs, resolving blob: URLs inside
// the page while it is still open.
async function readBlobs(page, blobUrls) {
  return page.evaluate(async urls => {
    const out = {};
    for (const u of urls) {
      try {
        const res = await fetch(u);
        const blob = await res.blob();
        const base64 = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onloadend = () => resolve(String(fr.result).split(',')[1]);
          fr.onerror = () => reject(new Error('FileReader failed'));
          fr.readAsDataURL(blob);
        });
        out[u] = { base64, mime: blob.type || 'application/octet-stream' };
      } catch {
        out[u] = null;
      }
    }
    return out;
  }, blobUrls);
}

async function download(url, opts = {}) {
  const { blob = null, kind = 'img' } = opts;
  if (seenUrls.has(url) || url.startsWith('data:')) return null;
  seenUrls.add(url);

  if (blob) {
    if (!blob.base64) { console.warn('blob read failed', url.slice(0, 60)); return null; }
    const ext = EXT_BY_MIME[blob.mime] || '.bin';
    const name = createHash('sha1').update(url).digest('hex').slice(0, 12) + ext;
    await writeFile(path.join('public/images/old-site', name), Buffer.from(blob.base64, 'base64'));
    return { file: `/images/old-site/${name}`, bytes: Math.round((blob.base64.length * 3) / 4), mime: blob.mime, kind };
  }

  try {
    const res = await ctx.request.get(url);
    if (!res.ok()) return null;
    const buf = await res.body();
    const ext = (path.extname(new URL(url).pathname) || '.bin').toLowerCase();
    const name = createHash('sha1').update(url).digest('hex').slice(0, 12) + ext;
    await writeFile(path.join('public/images/old-site', name), buf);
    return { file: `/images/old-site/${name}`, bytes: buf.length, mime: res.headers()['content-type'] || '', kind };
  } catch (e) {
    console.warn('download failed', url.slice(0, 80), e.message ? e.message.slice(0, 80) : '');
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
  await page.waitForTimeout(2000);
  const slug = new URL(url).pathname.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'home';
  await page.screenshot({ path: `reference/old-site-${slug}.png`, fullPage: true });
  const imgs = await collect(page, url);

  // Blob media first, while the page that owns the URLs is still open.
  const blobUrls = imgs.map(i => i.url).filter(u => u.startsWith('blob:'));
  let blobMap = {};
  if (blobUrls.length) {
    try {
      blobMap = await readBlobs(page, blobUrls);
      console.log(`blob media: ${Object.values(blobMap).filter(Boolean).length}/${blobUrls.length} read`);
    } catch (e) {
      console.warn('blob read pass failed:', e.message);
    }
  }
  await page.close();

  for (const i of imgs) {
    const saved = await download(i.url, {
      blob: blobMap[i.url] || null,
      kind: i.kind,
    });
    if (saved) manifest.push({ page: url, ...i, ...saved });
  }
  return DEEP ? await deepLinks(url) : [];
}

// Same-origin links are gathered from the stored content (page is closed already).
function deepLinks(url) {
  const links = (content[url] && content[url].links.map(l => l.href)) || [];
  return [...new Set(links)].filter(l => l.startsWith(ORIGIN) && !l.includes('#') && !visited.has(l));
}

const next = await visit(START);
if (DEEP) for (const l of next.slice(0, 25)) await visit(l);

await writeFile('src/data/old-site-manifest.json', JSON.stringify(manifest, null, 2));
await writeFile('src/data/old-site-content.json', JSON.stringify(content, null, 2));
await browser.close();
console.log(`Done. ${manifest.length} images saved. Review src/data/old-site-manifest.json and map images to projects in src/data/projects.json.`);
