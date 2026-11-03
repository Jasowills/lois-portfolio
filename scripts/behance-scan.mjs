// Read-only discovery tool: reads the public Behance galleries for Garri & Granola
// and Heure Doree and records the project artwork module URLs. Documented in
// OPEN_QUESTIONS.md entry 20; the galleries are linked from the old site.
// Usage: node scripts/behance-scan.mjs
// Note: Behance serves a one-line JS cookie challenge (sets js_challenge_value,
// then reloads). Node's fetch cannot run it, so this replays the cookie manually:
// first response sets the challenge, the second request carries it.
import { mkdir, writeFile } from 'node:fs/promises';

const PAGES = [
  ['garri-granola', 'https://www.behance.net/gallery/256889419/Garri-Granola'],
  ['heure-doree', 'https://www.behance.net/gallery/246039965/Heure-Dore-The-Golden-Hour'],
];

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const SIZES = ['1400', 'max_1200', 'hd', 'source', '2800', 'fs', '1400_webp', '2800_webp', 'max_3840_webp', 'fs_webp'];

async function fetchGallery(url) {
  // First response: the challenge page (453 bytes) with document.cookie = js_challenge_value=...
  const seed = await fetch(url, { headers: { 'User-Agent': UA } }).then((r) => r.text());
  const m = seed.match(/js_challenge_value=([A-Za-z0-9]+)/);
  if (!m) return { challenge: false, html: seed };
  const cookie = `js_challenge_value=${m[1]}; Path=/`;
  const html = await fetch(url, { headers: { 'User-Agent': UA, Cookie: cookie }, redirect: 'follow' }).then((r) =>
    r.text(),
  );
  return { challenge: true, html };
}

function collect(html) {
  const og = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? '';
  const title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').replace(':: Behance', '').trim();
  const handles = [...new Set([...html.matchAll(/https:\/\/www\.behance\.net\/([a-zA-Z0-9_-]{2,})[/"?]/g)].map((m) => m[1]))];
  // Modules: mir-s3-cdn-cf.behance.net/project_modules/<size>/<hash>.<ext>
  const mods = new Map();
  for (const m of html.matchAll(/project_modules\/([a-z0-9_]+)\/([a-z0-9]+)\.([a-z0-9]+)/g)) {
    const [, size, hash, ext] = m;
    if (!mods.has(hash)) mods.set(hash, { hash, ext, sizes: [] });
    if (!mods.get(hash).sizes.includes(size)) mods.get(hash).sizes.push(size);
  }
  for (const mod of mods.values()) mod.sizes.sort((a, b) => SIZES.indexOf(a) - SIZES.indexOf(b));
  return { og, title, handles, modules: [...mods.values()] };
}

await mkdir('reference/behance', { recursive: true });
const out = {};
for (const [slug, url] of PAGES) {
  try {
    const { challenge, html } = await fetchGallery(url);
    const data = collect(html);
    out[slug] = { url, challengeBypassed: challenge, ...data, moduleCount: data.modules.length };
    console.log(slug, 'title:', data.title, 'og:', data.og.slice(0, 80), 'modules:', data.modules.length, 'handles:', data.handles.slice(0, 4).join(','));
  } catch (e) {
    out[slug] = { url, error: String(e).slice(0, 200) };
    console.log(slug, 'failed:', String(e).slice(0, 80));
  }
}
await writeFile('reference/behance/behance-scan.json', JSON.stringify(out, null, 2) + '\n');
console.log('scan saved');
