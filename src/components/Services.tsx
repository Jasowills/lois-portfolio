// Services (DESIGN_SPEC 7, 12, 13): the cream folder section with the
// "A few ways I can help" sticker, the Outfit H2 and the folder component
// (three folder tabs + panel with the service content).
//
// Geometry is pinned by the spec numbers, in section-local coordinates that
// the section root owns (DESIGN_SPEC section 0: content column 1312 at x=64,
// padding 76px 64px 64px, frame height 1225.9).
//
// Vertical chain (all px, section-local):
//   sticker y=76 (36 tall, rotated -2deg) -> H2 top 149.9 (two lines, 45/50,
//   ls -1.35, 674x100 box) -> gap 60 -> folder top 309.9 (1312x852) -> folder
//   bottom = panel bottom = 1161.9 = frame bottom - paddingBottom(64).

import { useMemo, useState } from 'react';
import data from '../data/services.json';
import { StickerLabel } from './ui/StickerLabel';
import { Button } from './ui/Button';
import { useStaticMode } from '../motion/useStaticMode';

const TAB_X = [0, 437.33, 874.66]; // 7.1: tab lefts rel. to the folder content box

function PanelBody({ tab }: { tab: (typeof data.tabs)[number] }) {
  const included = tab.whatsIncluded ?? [];
  const goodFit = tab.goodFitFor ?? [];

  // Coordinates inside the inner card content box (content top = 523.9 abs,
  // card content bottom = 1093.9 abs, height 570), per DESIGN_SPEC 7.2.
  const titleTop = 0; // 7.2: title y=0, desc y=59 rel. inner content
  const descTop = 59.3; // 7.2: gap 24 between title (35.3) and desc
  const dividerTop = descTop + 32; // 7.2: divider 32 below desc
  const columnsTop = dividerTop + 1; // below the 1px divider
  const bottomRowTop = 486; // bottom row top; meta rows end at content bottom (570)

  const meta: Array<[string, string]> = [
    ['TIMELINE:', 'Timeline agreed together'],
    ['PROJECT SCOPE:', 'Scoped to your project'],
  ];

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '36px' }}>
      {/* 7.2.1 title + desc */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <h3
          className="font-outfit"
          style={{ position: 'absolute', top: titleTop, left: 0, right: 0, fontSize: '28px', lineHeight: '35.3px', letterSpacing: '-0.03em', fontWeight: 500, color: '#0d0d0d' }}
        >
          {tab.title}
        </h3>
        <p
          style={{ position: 'absolute', top: descTop, left: 0, right: 0, fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: '#202020' }}
        >
          {tab.description}
        </p>
      </div>

      {/* 7.2.2 divider */}
      <div style={{ position: 'absolute', top: dividerTop, left: 0, right: 0, height: 1, background: '#dadada' }} />

      {/* 7.2.3 two columns */}
      <div style={{ position: 'absolute', top: columnsTop, left: 0, right: 0, display: 'flex', gap: 24 }}>
        <div style={{ width: 576, flexShrink: 0 }}>
          <p style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: '#202020' }}>WHAT&#x27;S INCLUDED:</p>
          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
            {included.map((item) => (
              <li key={item} style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: '#202020', whiteSpace: 'normal', paddingLeft: 16 }}>{`• ${item}`}</li>
            ))}
          </ul>
        </div>
        <div style={{ width: 576, flexShrink: 0 }}>
          <p style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: '#202020' }}>A GOOD FIT FOR:</p>
          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
            {goodFit.map((item) => (
              <li key={item} style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: '#202020', whiteSpace: 'normal', paddingLeft: 16 }}>{`• ${item}`}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7.2.4 bottom row: meta lines + See what I do button */}
      <div style={{ position: 'absolute', top: bottomRowTop, left: 0, right: 0, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {meta.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
              <span style={{ background: '#f5f5f5', height: 32, padding: '0 8px', borderRadius: 32, display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', lineHeight: '32px', fontWeight: 500, color: '#0d0d0d' }}>{label}</span>
              </span>
              <span style={{ fontSize: '22px', lineHeight: '32px', fontWeight: 400, color: '#202020' }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 990, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
          <Button label="See what I do" arrow="up-right" fill="var(--yellow)" href="#contact" aria-label="See what I do" />
        </div>
      </div>
    </div>
  );
}

export function Services() {
  const staticMode = useStaticMode();
  const [selectedId, setSelectedId] = useState<string>(data.tabs[0]?.id ?? 'brand-identity');
  const params = useMemo(() => (staticMode ? new URLSearchParams(window.location.search) : null), [staticMode]);
  const forcedPair = useMemo<[number, number] | null>(() => {
    const tab = params?.get('tab');
    const panel = params?.get('panel');
    if (tab === null || panel === null) return null;
    const t = Number(tab);
    const p = Number(panel);
    if (!Number.isFinite(t) || !Number.isFinite(p)) return null;
    // Static-mode diff override (OPENCODE_PROMPTS Phase 6 DoD): ?tab=2&panel=1
    // forces the Figma reference state (Marketing tab active, Brand content).
    // Not surfaced as a shipped control; static mode only.
    if (t < 1 || t > 3 || p < 1 || p > 3) return null;
    return [t, p];
  }, [params]);

  const tabs = data.tabs;
  const selectedIdx = Math.max(0, tabs.findIndex((t) => t.id === selectedId));
  const activeIdx = forcedPair ? Math.max(0, forcedPair[0] - 1) : selectedIdx;
  const contentIdx = forcedPair ? Math.max(0, forcedPair[1] - 1) : activeIdx;
  const panelTab = tabs[contentIdx];

  const tabListId = 'services-tabs';

  return (
    <section
      data-section="services"
      id="services"
      aria-label="Services"
      className="relative w-full bg-cream px-5 pb-20 pt-[76px] min-[1280px]:h-[1226px] min-[1280px]:px-[64px] min-[1280px]:pb-0"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col">
        {/* 7: sticker label */}
        <div className="flex justify-center" style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StickerLabel label="A few ways I can help" fill="var(--lav-label)" rotate={-2} aria-hidden="true" />
        </div>

        {/* 7: H2, two lines */}
        <h2
          className="relative mx-auto mt-[37.9px] w-full max-w-[674px] text-center font-outfit"
          style={{ fontSize: '45px', lineHeight: '50px', letterSpacing: '-0.03em', fontWeight: 400, color: 'var(--heading)' }}
        >
          <span className="block">The right kind of creative help, for</span>
          <span className="block">what you need.</span>
        </h2>

        {/* 7: folder */}
        <div style={{ position: 'relative', width: 1312, height: 852, marginTop: '60px' }}>
          {/* 7.2 panel */}
          <div
            role="tabpanel"
            id={`${tabListId}-panel`}
            aria-labelledby={`${tabListId}-tab-${contentIdx}`}
            style={{
              position: 'absolute',
              top: 144,
              left: 0,
              right: 0,
              height: 708,
              background: panelTab.panelColor,
              border: '1px solid #000',
              borderTopLeftRadius: '0px',
              borderTopRightRadius: '0px',
              borderBottomLeftRadius: '36px',
              borderBottomRightRadius: '36px',
              padding: 32,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 32,
                left: 32,
                width: 1248,
                height: 644,
                background: '#fffef9',
                border: '1px solid #000',
                borderRadius: '36px',
                overflow: 'hidden',
              }}
            >
              <PanelBody tab={panelTab} />
            </div>
          </div>

          {/* 7.1 tabs */}
          <div
            role="tablist"
            aria-label="Ways I can help"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 144 }}
          >
            {tabs.map((tab, i) => {
              const isActive = i === activeIdx;
              return (
                <div
                  key={tab.id}
                  role="tab"
                  id={`${tabListId}-tab-${i}`}
                  aria-selected={isActive}
                  aria-controls={`${tabListId}-panel`}
                  tabIndex={isActive ? 0 : -1}
                  data-tab-index={i}
                  onClick={() => {
                    if (forcedPair) return;
                    const idx = tabs.findIndex((t) => t.id === tab.id);
                    const next = tabs[(idx + 1) % tabs.length];
                    setSelectedId(next.id);
                  }}
                  onKeyDown={(e) => {
                    if (forcedPair) return;
                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const idx = tabs.findIndex((t) => t.id === tab.id);
                      const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
                      setSelectedId(next.id);
                    }
                  }}
                  className="absolute"
                  style={{
                    top: isActive ? 0 : '20px',
                    left: TAB_X[i],
                    width: 437.33,
                    height: isActive ? 144 : 104,
                    background: tab.panelColor,
                    border: '1px solid #000',
                    borderTopLeftRadius: '36px',
                    borderTopRightRadius: '36px',
                    borderBottomLeftRadius: '0px',
                    borderBottomRightRadius: '0px',
                    padding: '32px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: isActive ? 'flex-start' : 'flex-start',
                    color: '#0d0d0d',
                    fontFamily: 'var(--ff-outfit)',
                    fontWeight: 400,
                    fontSize: 32,
                    lineHeight: '40.3px',
                    letterSpacing: '-0.03em',
                    borderBottomWidth: isActive ? '0px' : '1px',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
