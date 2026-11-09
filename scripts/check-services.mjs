// scripts/check-services.mjs
// Measures Services (DESIGN_SPEC 7) at 1440x900 with ?static=1.
// Positions relative to inner card top-left unless noted (folder).
// Tolerance 1.5px. Prints PASS/FAIL per row.

import { chromium } from 'playwright';

const URL_BASE = process.argv.find((a) => a.startsWith('--url='))?.split('=')[1] ?? 'http://127.0.0.1:5173';
const STATIC_URL = URL_BASE.includes('?') ? URL_BASE : `${URL_BASE}/?static=1`;
const TOL = 1.5;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(STATIC_URL, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts?.ready);
await page.evaluate(() => document.querySelector('[data-section="services"]')?.scrollIntoView({ block: 'start' }));
await page.waitForTimeout(800);

const m = await page.evaluate(() => {
  const card = document.querySelector('.svc-card');
  const folder = document.querySelector('.svc-folder');
  const panel = document.querySelector('.svc-panel');
  const tabs = [...document.querySelectorAll('.svc-tab')];
  const title = document.querySelector('[data-svc-title]');
  const desc = document.querySelector('[data-svc-desc]');
  const div = document.querySelector('[data-svc-divider]');
  const heads = [...document.querySelectorAll('[data-svc-col-head]')];
  const items = [...document.querySelectorAll('[data-svc-item]')];
  const leftItems = items.slice(0, 8);
  const bottom = document.querySelector('[data-svc-bottom]');
  const metas = [...document.querySelectorAll('[data-svc-chip]')];
  const btnWrap = document.querySelector('.svc-btn');
  const btn = btnWrap ? btnWrap.querySelector('a,button') : null;
  const label = document.querySelector('[data-section="services"] .sticker-base span span, [data-section="services"] span');

  const rel = (el) => {
    if (!el || !card) return null;
    const r = el.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    return { top: r.top - c.top, bottom: r.bottom - c.top, left: r.left - c.left, right: r.right - c.left, w: r.width, h: r.height };
  };
  const relFolder = (el) => {
    if (!el || !folder) return null;
    const r = el.getBoundingClientRect();
    const f = folder.getBoundingClientRect();
    return { top: r.top - f.top, bottom: r.bottom - f.top, left: r.left - f.left, w: r.width, h: r.height };
  };

  const leftItemsBox = leftItems.length ? {
    top: leftItems[0].getBoundingClientRect().top - card.getBoundingClientRect().top,
    bottom: leftItems[leftItems.length - 1].getBoundingClientRect().bottom - card.getBoundingClientRect().top,
  } : null;

  const stickerEl = [...document.querySelectorAll('[data-section="services"] *')].find((e) => e.textContent === 'A few ways I can help' && e.tagName === 'SPAN');
  const stickerStyle = stickerEl ? getComputedStyle(stickerEl) : null;

  return {
    card: card ? { w: card.getBoundingClientRect().width, h: card.getBoundingClientRect().height } : null,
    title: rel(title),
    desc: rel(desc),
    div: rel(div),
    heads: heads.map((h) => rel(h)),
    firstItem: items[0] ? rel(items[0]) : null,
    leftList: leftItemsBox,
    rightCount: items.slice(8).length,
    bottom: rel(bottom),
    metas: metas.map((x) => rel(x)),
    btn: rel(btnWrap ?? btn),
    btnEl: btn ? rel(btn) : null,
    tabs: tabs.map((t) => ({
      ...relFolder(t),
      radius: getComputedStyle(t).borderRadius,
      radiusBg: t.querySelector('.svc-tab-bg') ? getComputedStyle(t.querySelector('.svc-tab-bg')).borderRadius : null,
      active: t.getAttribute('data-active'),
      ml: t.dataset.tabIndex,
    })),
    panel: relFolder(panel),
    sticker: stickerEl ? {
      transform: stickerStyle.transform,
      origin: stickerStyle.transformOrigin,
      w: stickerEl.getBoundingClientRect().width,
      h: stickerEl.getBoundingClientRect().height,
      fontSize: stickerStyle.fontSize,
    } : null,
    labelsText: [...document.querySelectorAll('[data-svc-tab-label]')].map((e) => e.textContent),
    includedHead: heads[0]?.textContent ?? null,
  };
});

function close(a, b, tol = TOL) {
  return a != null && b != null && Math.abs(a - b) <= tol;
}
function report(name, pass, detail = '') {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  return pass;
}

let fails = 0;
function chk(name, pass, detail) {
  if (!report(name, pass, detail)) fails++;
}

chk('inner card height 644', close(m?.card?.h, 644), `h=${m?.card?.h}`);
chk('title top 36', close(m?.title?.top, 36), `top=${m?.title?.top}`);
chk('title height 35', close(m?.title?.h, 35), `h=${m?.title?.h}`);
chk('desc top 95', close(m?.desc?.top, 95), `top=${m?.desc?.top}`);
chk('desc height 32', close(m?.desc?.h, 32), `h=${m?.desc?.h}`);
chk('divider top 159', close(m?.div?.top, 159), `top=${m?.div?.top}`);
chk('divider left 36', close(m?.div?.left, 36), `left=${m?.div?.left}`);
chk('divider width 1176', close(m?.div?.w, 1176), `w=${m?.div?.w}`);
chk('col head L top 192', close(m?.heads?.[0]?.top, 192), `top=${m?.heads?.[0]?.top}`);
chk('col head R top 192', close(m?.heads?.[1]?.top, 192), `top=${m?.heads?.[1]?.top}`);
chk('col head L x 36', close(m?.heads?.[0]?.left, 36), `x=${m?.heads?.[0]?.left}`);
chk('col head R x 636', close(m?.heads?.[1]?.left, 636), `x=${m?.heads?.[1]?.left}`);
chk('col head h 32', close(m?.heads?.[0]?.h, 32), `h=${m?.heads?.[0]?.h}`);
chk('first item top 236', close(m?.firstItem?.top, 236), `top=${m?.firstItem?.top}`);
chk('left list ends 492', close(m?.leftList?.bottom, 492), `bottom=${m?.leftList?.bottom}`);
chk('bottom row top 524', close(m?.bottom?.top, 524), `top=${m?.bottom?.top}`);
chk('meta line1 top 524', close(m?.metas?.[0]?.top, 524), `top=${m?.metas?.[0]?.top}`);
chk('meta line2 top 576', close(m?.metas?.[1]?.top, 576), `top=${m?.metas?.[1]?.top}`);
chk('meta lines h 32', close(m?.metas?.[0]?.h, 32) && close(m?.metas?.[1]?.h, 32), `h=${m?.metas?.map((x) => x?.h)}`);
chk('button x 1026', close(m?.btnEl?.left ?? m?.btn?.left, 1026), `x=${m?.btnEl?.left ?? m?.btn?.left}`);
chk('button y 537', close(m?.btnEl?.top ?? m?.btn?.top, 537), `y=${m?.btnEl?.top ?? m?.btn?.top}`);
chk('button size 186x58', close(m?.btnEl?.w ?? m?.btn?.w, 186) && close(m?.btnEl?.h ?? m?.btn?.h, 58), `w=${m?.btnEl?.w ?? m?.btn?.w} h=${m?.btnEl?.h ?? m?.btn?.h}`);
chk('content ends 608', close(m?.bottom?.bottom, 608), `bottom=${m?.bottom?.bottom}`);

const activeTab = m?.tabs?.find((t) => t.active === 'true') ?? m?.tabs?.[0];
const inactiveTabs = (m?.tabs ?? []).filter((t) => t.active !== 'true');
chk('active tab top 0', close(activeTab?.top, 0), `top=${activeTab?.top}`);
chk('active tab h 144', close(activeTab?.h, 144), `h=${activeTab?.h}`);
chk('inactive tab tops 20', inactiveTabs.every((t) => close(t.top, 20)), `tops=${inactiveTabs.map((t) => t.top)}`);
chk('inactive tab h 104', inactiveTabs.every((t) => close(t.h, 104)), `h=${inactiveTabs.map((t) => t.h)}`);
chk('panel top 144', close(m?.panel?.top, 144), `top=${m?.panel?.top}`);
chk('panel h 708', close(m?.panel?.h, 708), `h=${m?.panel?.h}`);
chk('tab widths 437.33', (m?.tabs ?? []).every((t) => close(t.w, 437.33)), `w=${m?.tabs?.map((t) => t.w)}`);
chk('tab radius 36 36 0 0', (m?.tabs ?? []).every((t) => t.radius === '36px 36px 0px 0px' || t.radiusBg === '36px 36px 0px 0px' || t.radius === '36px 36px 0px'), `r=${m?.tabs?.map((t) => `${t.radius}/${t.radiusBg}`)}`);
{
  const tr = m?.sticker?.transform ?? '';
  const mt = tr.match(/matrix\(([^)]+)\)/);
  let deg = null;
  if (mt) {
    const parts = mt[1].split(',').map((s) => parseFloat(s));
    if (!Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) deg = (Math.atan2(parts[1], parts[0]) * 180) / Math.PI;
  } else if (tr.includes('rotate(')) {
    deg = parseFloat(tr.match(/rotate\((-?[\d.]+)deg\)/)?.[1] ?? 'NaN');
  }
  chk('sticker rotate -2', deg != null && Math.abs(deg - -2) <= 0.1, `t=${tr} angle=${deg}`);
}
chk('included head curly', m?.includedHead === 'WHAT’S INCLUDED:', `got=${m?.includedHead}`);

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAIL`);
await browser.close();
process.exit(fails ? 1 : 0);
