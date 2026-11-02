// scripts/figma-export.mjs
// Exports logo, signpost and section reference renders straight from Figma.
// Usage: FIGMA_TOKEN=xxxx node scripts/figma-export.mjs
// Create a token at Figma > Settings > Security > Personal access tokens (scope: File content, read-only).
// Node 18+ (global fetch). No dependencies.

import { mkdir, writeFile } from 'node:fs/promises';

const FILE_KEY = 'KnUSayWOjaZpVjMqNRCmja';
const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) {
  console.error('Missing FIGMA_TOKEN. Create a read-only personal access token in Figma and re-run.');
  process.exit(1);
}

// Vector assets (SVG)
const SVGS = {
  'logo-nav': 'I546:3156;311:1825', // yellow cloud logo in the header
  'logo-footer': '546:3345',        // large white cloud logo in the footer
  'signpost': '546:3418',           // pole, ball and base (signs are HTML)
  'cta-blob': '546:3331',           // also embedded in DESIGN_SPEC.md
};

// Section renders for visual reference (PNG, 2x)
const SECTIONS = {
  '01-navigation': '546:3154',
  '02-hero': '546:3157',
  '03-selected-work': '546:3173',
  '04-experience': '549:2515',
  '05-services': '546:3196',
  '06-about': '546:3203',
  '07-testimonials': '546:3319',
  '08-cta': '546:3328',
  '09-footer': '546:3342',
  'full-page': '546:3153',
};

async function render(ids, format, scale) {
  const params = new URLSearchParams({
    ids: Object.values(ids).join(','),
    format,
    ...(format === 'png' ? { scale: String(scale) } : { svg_include_id: 'false', svg_simplify_stroke: 'true' }),
  });
  const res = await fetch(`https://api.figma.com/v1/images/${FILE_KEY}?${params}`, {
    headers: { 'X-Figma-Token': TOKEN },
  });
  if (!res.ok) throw new Error(`Figma API ${res.status}: ${await res.text()}`);
  const { images, err } = await res.json();
  if (err) throw new Error(err);
  return images;
}

async function download(url, path) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed ${r.status} for ${path}`);
  await writeFile(path, Buffer.from(await r.arrayBuffer()));
  console.log('wrote', path);
}

await mkdir('src/assets/svg', { recursive: true });
await mkdir('reference/figma', { recursive: true });

const svgImages = await render(SVGS, 'svg');
for (const [name, id] of Object.entries(SVGS)) {
  if (svgImages[id]) await download(svgImages[id], `src/assets/svg/${name}.svg`);
  else console.warn('no image for', name, id);
}

const pngImages = await render(SECTIONS, 'png', 2);
for (const [name, id] of Object.entries(SECTIONS)) {
  if (pngImages[id]) await download(pngImages[id], `reference/figma/${name}.png`);
  else console.warn('no image for', name, id);
}

console.log('Done. Next: run SVGO on src/assets/svg/*.svg and inline them as React components.');
