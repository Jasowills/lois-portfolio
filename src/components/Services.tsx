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
//
// Motion (MOTION_SPEC 7.1 and 7.3, not the 7.2 scroll tour): a tab rises by
// clipping its fixed 144px face to 104px at rest (no height/position tween),
// a scaled CTA blob wipes the new panel colour in from the tab, and the panel
// content swaps behind SplitText line masks. Static and reduced motion render
// the exact DESIGN_SPEC state: every animated property is a transform, a clip
// path or an opacity, so the initial paint is unchanged.

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import data from '../data/services.json';
import { EASE } from '../motion/ease';
import { gsap, SplitText, ScrollTrigger } from '../motion/gsap';
import { useMediaQuery } from '../motion/useMediaQuery';
import { useMotion } from '../motion/useMotion';
import { useStaticMode } from '../motion/useStaticMode';
import { SectionEdge } from './SectionEdge';
import { CTA_BLOB_PATH } from './svg/blobPath';
import { Button } from './ui/Button';
import { StickerLabel } from './ui/StickerLabel';

const TAB_X = [0, 437.33, 874.66]; // 7.1: tab lefts rel. to the folder content box

// Exact values from the spec (DESIGN_SPEC 7.1 / 7.2). Colours live in tokens
// or in services.json (per-service fills).
const SPEC = {
  tab: {
    width: 437.33, // 7.1
    height: 144, // 7.1 active
    restHeight: 104, // 7.1 inactive
    restOffset: 20, // 7.1 inactive top
    pad: 32, // 7.1
  },
  panel: {
    top: 144, // 7.2
    height: 708, // 7.2
  },
  blob: { width: 1315, height: 671 }, // CTA blob path box, DESIGN_SPEC section 2
} as const;

/* MOTION_SPEC 7.1 / 7.3 values. */
const MOTION = {
  tab: {
    rise: 20,
    duration: 0.5,
    clipRest: 'inset(20px 0px 20px 0px)',
    clipActive: 'inset(0px 0px 0px 0px)',
  },
  blob: { start: 0.06, duration: 0.7, overshoot: 1.45 },
  out: { duration: 0.28, stagger: 0.035, swapAt: 0.32 },
  in: {
    duration: 0.6,
    stagger: 0.06,
    itemStagger: 0.04,
    lowStagger: 0.02,
  },
} as const;

type ServiceTab = (typeof data.tabs)[number];

function PanelBody({ tab }: { tab: ServiceTab }) {
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
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '36px' }} className="svc-body" data-svc-body>
      {/* 7.2.1 title + desc */}
      <div className="svc-head" style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <h3
          data-svc-title
          className="svc-title font-outfit"
          style={{ position: 'absolute', top: titleTop, left: 0, right: 0, fontSize: '28px', lineHeight: '35.3px', letterSpacing: '-0.03em', fontWeight: 500, color: 'var(--svc-title)' }}
        >
          {tab.title}
        </h3>
        <p
          data-svc-desc
          className="svc-desc"
          style={{ position: 'absolute', top: descTop, left: 0, right: 0, fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--body)' }}
        >
          {tab.description}
        </p>
      </div>

      {/* 7.2.2 divider */}
      <div data-svc-divider className="svc-divider" style={{ position: 'absolute', top: dividerTop, left: 0, right: 0, height: 1, background: 'var(--divider)' }} />

      {/* 7.2.3 two columns */}
      <div data-svc-cols className="svc-cols" style={{ position: 'absolute', top: columnsTop, left: 0, right: 0, display: 'flex', gap: 24 }}>
        <div className="svc-col" style={{ width: 576, flexShrink: 0 }}>
          <p data-svc-col-head style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--body)' }}>WHAT&#x27;S INCLUDED:</p>
          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
            {included.map((item) => (
              <li key={item} data-svc-item style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--body)', whiteSpace: 'normal', paddingLeft: 16 }}>
                <span data-svc-bullet className="svc-bullet">{'\u2022'}</span> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="svc-col" style={{ width: 576, flexShrink: 0 }}>
          <p data-svc-col-head style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--body)' }}>A GOOD FIT FOR:</p>
          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
            {goodFit.map((item) => (
              <li key={item} data-svc-item style={{ fontSize: '22px', lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--body)', whiteSpace: 'normal', paddingLeft: 16 }}>
                <span data-svc-bullet className="svc-bullet">{'\u2022'}</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 7.2.4 bottom row: meta lines + See what I do button */}
      <div data-svc-bottom className="svc-bottom" style={{ position: 'absolute', top: bottomRowTop, left: 0, right: 0, display: 'flex', alignItems: 'center' }}>
        <div className="svc-meta" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {meta.map(([label, value]) => (
            <div key={label} data-svc-chip style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
              <span style={{ background: 'var(--svc-chip)', height: 32, padding: '0 8px', borderRadius: 32, display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontSize: '22px', lineHeight: '32px', fontWeight: 500, color: 'var(--svc-title)' }}>{label}</span>
              </span>
              <span style={{ fontSize: '22px', lineHeight: '32px', fontWeight: 400, color: 'var(--body)' }}>{value}</span>
            </div>
          ))}
        </div>
        <div className="svc-btn" style={{ position: 'absolute', left: 990, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
          <Button label="See what I do" arrow="up-right" fill="var(--yellow)" href="#contact" aria-label="See what I do" />
        </div>
      </div>
    </div>
  );
}

export function Services() {
  const staticMode = useStaticMode();
  const { quality, reducedMotion, scrollTo } = useMotion();
  const active = !reducedMotion;
  const low = quality === 'low';
  const desktop = useMediaQuery('(min-width: 1440px)');
  // Scroll tour disabled after review: clicking a tab while pinned only jumped scroll
  // and left the panel stuck on the old tab, which read as empty tabs. Clicks now swap
  // instantly at all widths; the tour code stays for an opt in re enable.
  const _tourViewport = useMediaQuery('(min-width: 1024px) and (orientation: landscape)');
  void _tourViewport;
  const canTour = false;

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

  // The forced reference state is resolved in the initializers, before first
  // paint, so the visual diff never sees a frame of the default tab.
  const [selectedIdx, setSelectedIdx] = useState(() => (forcedPair ? forcedPair[0] - 1 : 0));
  const [shapeIdx, setShapeIdx] = useState(() => (forcedPair ? forcedPair[0] - 1 : 0));
  const [displayIdx, setDisplayIdx] = useState(() => (forcedPair ? forcedPair[1] - 1 : 0));
  const [baseIdx, setBaseIdx] = useState(() => (forcedPair ? forcedPair[1] - 1 : 0));

  const panelRef = useRef<HTMLDivElement>(null);
  const folderRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<SVGSVGElement>(null);
  const blobPathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pendingInRef = useRef(false);
  const splitsRef = useRef<SplitText[]>([]);
  const tabTlRef = useRef<gsap.core.Timeline | null>(null);
  const blobTlRef = useRef<gsap.core.Timeline | null>(null);
  const contentTlRef = useRef<gsap.core.Timeline | null>(null);
  const inTlRef = useRef<gsap.core.Timeline | null>(null);
  const tourTriggerRef = useRef<ScrollTrigger | null>(null);
  const tourActiveRef = useRef(false);
  const selectedIdxRef = useRef(selectedIdx);
  const lastHapticRef = useRef(0);

  const tabs = data.tabs;
  const panelTab = tabs[displayIdx];
  const tabListId = 'services-tabs';

  // Drop every timer, tween and split on unmount. StrictMode runs this once
  // between the two dev mounts, before any interaction, so it is a no-op then.
  useLayoutEffect(() => {
    return () => {
      tabTlRef.current?.kill();
      blobTlRef.current?.kill();
      contentTlRef.current?.kill();
      inTlRef.current?.kill();
      for (const split of splitsRef.current) {
        split.revert();
        split.kill();
      }
      splitsRef.current = [];
    };
  }, []);

  const commitInstant = (next: number) => {
    selectedIdxRef.current = next;
    setSelectedIdx(next);
    setShapeIdx(next);
    setDisplayIdx(next);
    setBaseIdx(next);
  };

  const selectTab = (
    next: number,
    tabEl: HTMLElement | null,
    eventTime: number,
    source: 'user' | 'scroll' = 'user',
  ) => {
    if (forcedPair || next === selectedIdx) return;

    // 7.2 while pinned, click and keyboard activation jump the tour to the
    // stage instead of instant-selecting. The scrub state then runs the normal
    // tab/colour/content transition.
    if (source === 'user' && tourTriggerRef.current && tourActiveRef.current) {
      const trigger = tourTriggerRef.current;
      const range = trigger.end - trigger.start;
      if (range > 0) {
        scrollTo(trigger.start + (next / tabs.length) * range);
        return;
      }
    }

    const panel = panelRef.current;
    const tab = tabEl ?? tabRefs.current[next];
    if (!active || !panel || !tab) {
      commitInstant(next);
      return;
    }

    // Haptics on tab changes, throttled (MOTION_SPEC 12).
    if (eventTime - lastHapticRef.current > 150 && typeof navigator.vibrate === 'function') {
      lastHapticRef.current = eventTime;
      navigator.vibrate(8);
    }

    // A change can start while the previous content is still arriving. Drop
    // the old tweens and restore split text before measuring again.
    tabTlRef.current?.kill();
    blobTlRef.current?.kill();
    contentTlRef.current?.kill();
    inTlRef.current?.kill();
    for (const split of splitsRef.current) {
      split.revert();
      split.kill();
    }
    splitsRef.current = [];

    selectedIdxRef.current = next;
    setSelectedIdx(next);

    // 7.1 tab rise: the face is a fixed 144px box clipped to the inactive
    // 104px, so only clip-path and transforms move. Below 1440 the tabs are a
    // flow strip with no rise.
    if (desktop) {
      const tl = gsap.timeline({
        onComplete: () => {
          setShapeIdx(next);
        },
      });
      tabs.forEach((_, i) => {
        const root = tabRefs.current[i];
        if (!root) return;
        const face = root.querySelector<HTMLElement>('[data-svc-tab-bg]');
        const label = root.querySelector<HTMLElement>('[data-svc-tab-label]');
        const line = root.querySelector<HTMLElement>('[data-svc-tab-line]');
        const isNext = i === next;
        if (face) {
          tl.to(
            face,
            {
              clipPath: isNext ? MOTION.tab.clipActive : MOTION.tab.clipRest,
              duration: MOTION.tab.duration,
              ease: EASE.glide,
            },
            0,
          );
        }
        if (label) {
          tl.to(
            label,
            {
              y: isNext ? 0 : MOTION.tab.rise,
              duration: MOTION.tab.duration,
              ease: EASE.glide,
            },
            0,
          );
        }
        if (line) {
          tl.to(
            line,
            {
              y: isNext ? 0 : -MOTION.tab.rise,
              opacity: isNext ? 0 : 1,
              duration: MOTION.tab.duration,
              ease: EASE.glide,
            },
            0,
          );
        }
      });
      tabTlRef.current = tl;
    } else {
      setShapeIdx(next);
    }

    // 7.1 blob wipe: the CTA silhouette expands from the clicked tab down
    // across the panel. The low tier keeps the colour change but skips the
    // morph (13), so the colour commits with the content swap instead.
    const blob = blobRef.current;
    const fillPath = blobPathRef.current;
    const willBlob = !low && blob !== null && fillPath !== null;
    if (willBlob && blob && fillPath) {
      const panelBox = panel.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();
      const originX = tabBox.left + tabBox.width / 2 - panelBox.left;
      const originY = Math.max(0, tabBox.top + tabBox.height / 2 - panelBox.top);
      const halfW = SPEC.blob.width / 2;
      const halfH = SPEC.blob.height / 2;
      const corners: Array<[number, number]> = [
        [0, 0],
        [panelBox.width, 0],
        [0, panelBox.height],
        [panelBox.width, panelBox.height],
      ];
      let reach = 0;
      for (const [x, y] of corners) {
        reach = Math.max(reach, Math.abs(x - originX) / halfW, Math.abs(y - originY) / halfH);
      }
      fillPath.setAttribute('fill', tabs[next].panelColor);
      gsap.set(blob, {
        x: originX - halfW,
        y: originY - halfH,
        scale: MOTION.blob.start,
        opacity: 1,
      });
      const tl = gsap.timeline({
        onComplete: () => {
          // Paint the committed colour under the blob first, then hide it,
          // so the handoff never shows a frame of the old panel.
          panel.style.backgroundColor = tabs[next].panelColor;
          gsap.set(blob, { opacity: 0, scale: MOTION.blob.start });
          setBaseIdx(next);
        },
      });
      tl.to(blob, {
        scale: reach * MOTION.blob.overshoot + 0.35,
        duration: MOTION.blob.duration,
        ease: 'power2.inOut',
      });
      blobTlRef.current = tl;
    }

    // 7.1 / 7.3 content: old lines slide up out of their masks, then the new
    // body mounts and its lines, list, bullets and chips arrive.
    const body = panel.querySelector<HTMLElement>('[data-svc-body]');
    const out = gsap.timeline();
    if (body) {
      const headLines: Element[] = [];
      const title = body.querySelector<HTMLElement>('[data-svc-title]');
      const desc = body.querySelector<HTMLElement>('[data-svc-desc]');
      if (title) {
        const split = SplitText.create(title, { type: 'lines', mask: 'lines', autoSplit: false, aria: 'auto' });
        splitsRef.current.push(split);
        headLines.push(...split.lines);
      }
      if (desc) {
        const split = SplitText.create(desc, { type: 'lines', mask: 'lines', autoSplit: false, aria: 'auto' });
        splitsRef.current.push(split);
        headLines.push(...split.lines);
      }
      const blocks = [
        body.querySelector('[data-svc-divider]'),
        body.querySelector('[data-svc-cols]'),
        body.querySelector('[data-svc-bottom]'),
      ].filter((el): el is Element => el !== null);
      const items = Array.from(body.querySelectorAll('[data-svc-item]'));
      if (headLines.length) {
        out.to(
          headLines,
          { yPercent: -110, opacity: 0, duration: MOTION.out.duration, stagger: MOTION.out.stagger, ease: 'power2.in' },
          0,
        );
      }
      if (blocks.length) {
        out.to(blocks, { opacity: 0, y: -8, duration: 0.22, ease: 'power2.in' }, 0.02);
      }
      if (items.length) {
        out.to(items, { opacity: 0, y: -6, duration: 0.2, stagger: 0.012, ease: 'power2.in' }, 0.02);
      }
    }
    out.call(
      () => {
        for (const split of splitsRef.current) {
          split.revert();
          split.kill();
        }
        splitsRef.current = [];
        pendingInRef.current = true;
        setDisplayIdx(next);
        if (!willBlob) {
          panel.style.backgroundColor = tabs[next].panelColor;
          setBaseIdx(next);
        }
      },
      undefined,
      MOTION.out.swapAt,
    );
    contentTlRef.current = out;
  };

  // The new body is a fresh keyed subtree, so its entrance is measured and
  // split after React commits it. The ref guard keeps first paint still.
  useLayoutEffect(() => {
    if (!active || !pendingInRef.current) return;
    pendingInRef.current = false;
    const body = panelRef.current?.querySelector<HTMLElement>('[data-svc-body]');
    if (!body) return;

    const splits: SplitText[] = [];
    const headLines: Element[] = [];
    const title = body.querySelector<HTMLElement>('[data-svc-title]');
    const desc = body.querySelector<HTMLElement>('[data-svc-desc]');
    if (title) {
      const split = SplitText.create(title, { type: 'lines', mask: 'lines', autoSplit: false, aria: 'auto' });
      splits.push(split);
      headLines.push(...split.lines);
    }
    if (desc) {
      const split = SplitText.create(desc, { type: 'lines', mask: 'lines', autoSplit: false, aria: 'auto' });
      splits.push(split);
      headLines.push(...split.lines);
    }
    splitsRef.current = splits;

    const tl = gsap.timeline({
      onComplete: () => {
        for (const split of splits) {
          split.revert();
          split.kill();
        }
        splitsRef.current = splitsRef.current.filter((split) => !splits.includes(split));
      },
    });
    const stagger = low ? MOTION.in.lowStagger : MOTION.in.stagger;
    const itemStagger = low ? MOTION.in.lowStagger : MOTION.in.itemStagger;

    if (headLines.length) {
      tl.from(
        headLines,
        { yPercent: 110, opacity: 0, duration: MOTION.in.duration, stagger, ease: EASE.glide },
        0,
      );
    }
    const divider = body.querySelector('[data-svc-divider]');
    if (divider) {
      tl.from(divider, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, ease: EASE.glide }, 0.04);
    }
    const colHeads = Array.from(body.querySelectorAll('[data-svc-col-head]'));
    if (colHeads.length) {
      tl.from(colHeads, { opacity: 0, y: 10, duration: 0.4, stagger: 0.06, ease: EASE.glide }, 0.1);
    }
    const items = Array.from(body.querySelectorAll('[data-svc-item]'));
    if (items.length) {
      tl.from(items, { opacity: 0, y: 14, duration: 0.45, stagger: itemStagger, ease: EASE.glide }, 0.14);
    }
    // 7.3 each bullet dot stamps in from scale 2 with a 1px hard shadow.
    const bullets = Array.from(body.querySelectorAll('[data-svc-bullet]'));
    if (bullets.length) {
      tl.fromTo(
        bullets,
        { scale: 2, opacity: 0, textShadow: '0px 0px 0 rgba(0, 0, 0, 0)' },
        {
          scale: 1,
          opacity: 1,
          textShadow: '1px 1px 0 rgba(0, 0, 0, 0.32)',
          duration: 0.35,
          stagger: itemStagger,
          ease: EASE.snap,
          transformOrigin: '50% 55%',
        },
        0.16,
      );
      tl.to(
        bullets,
        { textShadow: '0px 0px 0 rgba(0, 0, 0, 0)', duration: 0.4, stagger: itemStagger, ease: 'power1.out' },
        0.55,
      );
    }
    // 7.3 meta chips slide in from the left on a tape-label angle.
    const chips = Array.from(body.querySelectorAll('[data-svc-chip]'));
    if (chips.length) {
      tl.from(chips, { x: -24, rotation: -1, opacity: 0, duration: 0.5, stagger: 0.08, ease: EASE.glide }, 0.26);
    }
    inTlRef.current = tl;
  }, [displayIdx, active, low]);

  // 7.2 scroll tour: pin the folder as it reaches viewport centre and scrub it
  // through 180vh of scroll. The 3D turntable angle and dashed progress thread
  // are driven directly, so no layout changes happen during the pin.
  useLayoutEffect(() => {
    if (!canTour || forcedPair) return;
    const folder = folderRef.current;
    const progressElement = progressRef.current;
    if (!folder) return;

    const rotateTo = (progress: number) => {
      gsap.set(folder, {
        transformPerspective: 1600,
        rotationY: progress * 8 - 4,
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: folder,
      start: 'top center',
      end: '+=180%',
      pin: true,
      pinSpacing: true,
      scrub: 0.2,
      snap: 1 / tabs.length,
      onToggle: (self) => {
        tourActiveRef.current = self.isActive;
        if (!self.isActive) {
          gsap.to(folder, { rotationY: 0, duration: 0.6, ease: EASE.glide, overwrite: 'auto' });
        }
      },
      onUpdate: (self) => {
        tourActiveRef.current = self.isActive;
        const progress = Math.max(0, Math.min(1, self.progress));
        rotateTo(progress);
        if (progressElement) {
          gsap.set(progressElement, { scaleX: progress });
        }
        const next = Math.min(tabs.length - 1, Math.floor(progress * tabs.length));
        if (next !== selectedIdxRef.current) {
          selectTab(next, null, performance.now(), 'scroll');
        }
      },
      onLeave: () => {
        tourActiveRef.current = false;
        gsap.to(folder, { rotationY: 0, duration: 0.6, ease: EASE.glide, overwrite: 'auto' });
      },
      onLeaveBack: () => {
        tourActiveRef.current = false;
        gsap.to(folder, { rotationY: 0, duration: 0.6, ease: EASE.glide, overwrite: 'auto' });
      },
    });
    tourTriggerRef.current = trigger;

    return () => {
      tourTriggerRef.current = null;
      tourActiveRef.current = false;
      trigger.kill();
      gsap.set(folder, { clearProps: 'transform' });
      if (progressElement) gsap.set(progressElement, { scaleX: 0 });
    };
    // Tabs are fixed by services.json; the effect only needs tour availability.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canTour, forcedPair]);

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (forcedPair) return;
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    const target = tabRefs.current[next];
    target?.focus();
    selectTab(next, target, event.timeStamp);
  };

  return (
    <section
      data-section="services"
      id="services"
      aria-label="Services"
      className="services-section relative w-full bg-cream px-5 pb-20 pt-[76px] min-[1440px]:h-[1226px] min-[1440px]:px-[64px] min-[1440px]:pb-0"
      style={canTour ? { height: 'auto' } : undefined}
    >
      <SectionEdge variant="tear" from="var(--lav-exp)" />
      <div className="mx-auto flex w-full max-w-[1440px] flex-col">
        {/* 7: sticker label */}
        <div className="flex justify-center" style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StickerLabel label="A few ways I can help" fill="var(--lav-label)" rotate={-2} aria-hidden="true" data-depth="0.4" />
        </div>

        {/* 7: H2, two lines */}
        <h2
          data-skew
          data-split="lines"
          className="relative mx-auto mt-[37.9px] w-full max-w-[674px] text-center font-outfit"
          style={{ fontSize: '45px', lineHeight: '50px', letterSpacing: '-0.03em', fontWeight: 400, color: 'var(--heading)' }}
        >
          <span className="block">The right kind of creative help, for</span>{' '}
          <span className="block">what you need.</span>
        </h2>

        {/* 7: folder */}
        <div ref={folderRef} className="svc-folder" data-skew style={{ position: 'relative', width: 1312, height: 852, marginTop: '60px' }}>
          {/* 7.2 panel */}
          <div
            ref={panelRef}
            role="tabpanel"
            id={`${tabListId}-panel`}
            aria-labelledby={`${tabListId}-tab-${displayIdx}`}
            className="svc-panel"
            style={{
              position: 'absolute',
              top: SPEC.panel.top,
              left: 0,
              right: 0,
              height: SPEC.panel.height,
              background: tabs[baseIdx].panelColor,
              border: '1px solid var(--ink)',
              borderTopLeftRadius: '0px',
              borderTopRightRadius: '0px',
              borderBottomLeftRadius: '36px',
              borderBottomRightRadius: '36px',
              padding: 32,
              overflow: 'hidden',
            }}
          >
            {/* 7.1 blob wipe layer, behind the inner card. */}
            <svg
              ref={blobRef}
              aria-hidden="true"
              focusable="false"
              viewBox={`0 0 ${SPEC.blob.width} ${SPEC.blob.height}`}
              width={SPEC.blob.width}
              height={SPEC.blob.height}
              style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: 0, transformOrigin: '50% 50%', willChange: 'transform' }}
            >
              <path ref={blobPathRef} d={CTA_BLOB_PATH} fill={tabs[baseIdx].panelColor} />
            </svg>
            <div
              className="svc-card"
              style={{
                position: 'absolute',
                top: 32,
                left: 32,
                width: 1248,
                height: 644,
                background: 'var(--cream)',
                border: '1px solid var(--ink)',
                borderRadius: '36px',
                overflow: 'hidden',
                zIndex: 1,
              }}
            >
              <PanelBody key={displayIdx} tab={panelTab} />
            </div>
            {canTour ? (
              <div aria-hidden="true" className="svc-progress" style={{ position: 'absolute', bottom: 12, left: 24, right: 24, height: 8, zIndex: 2, pointerEvents: 'none' }}>
                <div ref={progressRef} data-svc-progress className="svc-progress-fill" style={{ position: 'absolute', inset: 0, transform: 'scaleX(0)', transformOrigin: '0% 50%' }} />
              </div>
            ) : null}
          </div>

          {/* 7.1 tabs */}
          <div
            role="tablist"
            aria-label="Ways I can help"
            className="svc-tabs"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 144 }}
          >
            {tabs.map((tab, i) => {
              const isSelected = i === selectedIdx;
              return (
                <div
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[i] = element;
                  }}
                  role="tab"
                  id={`${tabListId}-tab-${i}`}
                  aria-selected={isSelected}
                  aria-controls={`${tabListId}-panel`}
                  tabIndex={isSelected ? 0 : -1}
                  data-tab-index={i}
                  data-active={i === shapeIdx}
                  onClick={(event) => selectTab(i, tabRefs.current[i], event.timeStamp)}
                  onKeyDown={(event) => onTabKeyDown(event, i)}
                  className="svc-tab absolute"
                  style={{
                    top: 0,
                    left: TAB_X[i],
                    width: SPEC.tab.width,
                    height: SPEC.tab.height,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    data-svc-tab-bg
                    aria-hidden="true"
                    className="svc-tab-bg"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: tab.panelColor,
                      border: '1px solid var(--ink)',
                      borderBottom: 'none',
                      borderTopLeftRadius: '36px',
                      borderTopRightRadius: '36px',
                    }}
                  />
                  <span
                    data-svc-tab-line
                    aria-hidden="true"
                    className="svc-tab-line"
                    style={{ position: 'absolute', left: 0, right: 0, top: 143, height: 1, background: 'var(--ink)' }}
                  />
                  <span
                    data-svc-tab-label
                    className="svc-tab-label"
                    style={{
                      position: 'absolute',
                      left: SPEC.tab.pad,
                      right: SPEC.tab.pad,
                      top: SPEC.tab.pad,
                      fontFamily: 'var(--ff-outfit)',
                      fontWeight: 400,
                      fontSize: 32,
                      lineHeight: '40.3px',
                      letterSpacing: '-0.03em',
                      color: 'var(--svc-title)',
                      whiteSpace: desktop && !isSelected ? 'nowrap' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tab.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
