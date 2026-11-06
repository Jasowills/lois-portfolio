// CTA (DESIGN_SPEC 10, 12, 13): the #deeab3 blob section with the centered
// headline, paragraph and button, plus the contact drawer.
//
// Section (1440 x 828.3): bg #deeab3 (bg-cta-bg), 1px black borders top/bottom
// (framed in App), padding 76px 72px 64px. Blob SVG (section 2) fills x 64..1376,
// y 86..754 (1312x668), fill #fffef9 (var --cream), stroke 1px black. Centered
// content: 1312 wide column, text blocks 1055 wide at x=192.5.
//   - H2 "Got a project in mind? Let's talk." Outfit 400 45/50 ls -1.35 #040100,
//     centered, y=298.1.
//   - Paragraph Outfit 400 26/36 ls -0.52 #040100, centered, 1055x72 at y=380.1.
//   - Button "Tell me what you're working on" #fef5b6, 317x58 at x=561.5, y=484.1.
// Block is vertically centered in the blob.
//
// Motion (MOTION_SPEC 10, DOM/SVG version), layered so each effect owns one
// property:
//   cta-reveal   clip-path circle wipe from the previous section boundary
//   cta-blob     ScrollFeel depth y
//   cta-blob-pop elastic inflate as the section enters
//   cta-blob-lean cursor/scroll-velocity spring (transform + skewX)
//   path `d`     MorphSVGPlugin idle loop across the four variants (4s, sine.inOut, yoyo)
//   confetti     8 outlined palette stickers burst on the primary click
// The GL metaball pass is skipped (optional in MOTION_SPEC 10); the drawer
// slides with glide and its fields stagger in (motion/react). Static and
// reduced motion render the exact DESIGN_SPEC frame: no wipe, no inflate, no
// morph, no lean, no confetti.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EASE } from '../motion/ease';
import { gsap } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import { CtaBlob } from './svg/CtaBlob';
import { CTA_BLOB_PATH } from './svg/blobPath';
import { BLOB_VARIANTS } from './svg/blobVariants';
import { Button } from './ui/Button';
import { ContactDrawer } from './ContactDrawer';
import { SectionEdge } from './SectionEdge';

/* MOTION_SPEC 10 values. */
const MOTION = {
  wipe: { from: 'circle(0% at 50% 0%)', to: 'circle(150% at 50% 0%)', duration: 1.15, start: 'top 85%' },
  inflate: { from: 0.2, duration: 1.5, ease: 'elastic.out(1, 0.45)', origin: '50% 45%' },
  morph: { duration: 4, ease: 'sine.inOut' },
  lean: { x: 26, y: 12, skew: 1.4, ease: 0.075 },
  touchLean: { y: 14, skew: 0.9 },
} as const;

const CONFETTI_SHAPES = ['star', 'heart', 'circle', 'star', 'heart', 'circle', 'star', 'heart'] as const;
const CONFETTI_COLORS = ['var(--orange-cta)', 'var(--lime)', 'var(--blue)', 'var(--yellow)'] as const;

type ConfettiShape = (typeof CONFETTI_SHAPES)[number];
type ConfettiPiece = {
  id: number;
  shape: ConfettiShape;
  dx: number;
  dy: number;
  rotate: number;
  scale: number;
  color: string;
};

/* Outline artwork inside a 24 viewBox; the burst stays outlined on the palette. */
const SHAPE_STAR = 'M12 2.9l2.8 6.3 6.9.6-5.2 4.4 1.5 6.7L12 17.7 6 20.9l1.5-6.7-5.2-4.4 6.9-.6z';
const SHAPE_HEART =
  'M12 20.2s-7.3-4.8-9.5-9C1.4 7.9 4 4.8 7.3 4.8c2.1 0 3.5 1.1 4.7 2.5 1.2-1.4 2.6-2.5 4.7-2.5 3.3 0 5.9 3.1 4.8 6.4-2.2 4.2-9.5 9-9.5 9z';

const clamp = (value: number, max: number) => Math.max(-max, Math.min(max, value));

function generatePieces(): ConfettiPiece[] {
  return CONFETTI_SHAPES.map((shape, index) => {
    const angle = (index * Math.PI * 2) / CONFETTI_SHAPES.length + (Math.random() - 0.5) * 0.7;
    const distance = 70 + Math.random() * 110;
    return {
      id: index,
      shape,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rotate: (Math.random() - 0.5) * 260,
      scale: 0.75 + Math.random() * 0.6,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    };
  });
}

function CtaConfetti({ pieces, onDone }: { pieces: ConfettiPiece[]; onDone: () => void }) {
  const pieceRefs = useRef<Array<SVGGElement | null>>([]);

  useLayoutEffect(() => {
    const elements = pieces.map((_, index) => pieceRefs.current[index]);
    const timeline = gsap.timeline({ onComplete: onDone });
    elements.forEach((element, index) => {
      if (!element) return;
      const piece = pieces[index];
      timeline
        .fromTo(
          element,
          { x: 0, y: 0, scale: 0.2, rotation: 0, opacity: 0 },
          {
            x: piece.dx,
            y: piece.dy,
            scale: piece.scale,
            rotation: piece.rotate,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(2)',
          },
          index * 0.03,
        )
        .to(element, { opacity: 0, duration: 0.25, ease: 'power1.in' }, index * 0.03 + 0.5);
    });
    return () => {
      timeline.kill();
    };
    // Pieces are generated per burst; the timeline only needs to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg className="cta-burst" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {pieces.map((piece) => (
        <g
          key={piece.id}
          ref={(element) => {
            pieceRefs.current[piece.id] = element;
          }}
          opacity={0}
        >
          {piece.shape === 'circle' ? (
            <circle cx={12} cy={12} r={7.5} stroke={piece.color} strokeWidth={1.8} fill="none" />
          ) : (
            <path
              d={piece.shape === 'star' ? SHAPE_STAR : SHAPE_HEART}
              stroke={piece.color}
              strokeWidth={1.8}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>
      ))}
    </svg>
  );
}

export function CTA() {
  const { reducedMotion } = useMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const pieces = useMemo(() => (burstId > 0 ? generatePieces() : []), [burstId]);

  const sectionRef = useRef<HTMLElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const leanRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // 10 entrance + morph. The clip-path wipe and the inflate run once when the
  // section enters; the morph loops until unmount or reduced motion.
  useLayoutEffect(() => {
    if (reducedMotion) return;

    const section = sectionRef.current;
    const wipe = wipeRef.current;
    const pop = popRef.current;
    const path = pathRef.current;

    const timelines: gsap.core.Timeline[] = [];
    const tweens: gsap.core.Animation[] = [];

    if (section && wipe) {
      const reveal = gsap.fromTo(
        wipe,
        { clipPath: MOTION.wipe.from },
        {
          clipPath: MOTION.wipe.to,
          duration: MOTION.wipe.duration,
          ease: EASE.glide,
          scrollTrigger: { trigger: section, start: MOTION.wipe.start, once: true },
        },
      );
      tweens.push(reveal);
    }

    if (section && pop) {
      const inflate = gsap.fromTo(
        pop,
        { scale: MOTION.inflate.from, transformOrigin: MOTION.inflate.origin },
        {
          scale: 1,
          duration: MOTION.inflate.duration,
          ease: MOTION.inflate.ease,
          scrollTrigger: { trigger: section, start: MOTION.wipe.start, once: true },
        },
      );
      tweens.push(inflate);
    }

    if (path) {
      const morph = gsap.timeline({ repeat: -1, yoyo: true });
      morph
        .to(path, { morphSVG: BLOB_VARIANTS[1], duration: MOTION.morph.duration, ease: MOTION.morph.ease })
        .to(path, { morphSVG: BLOB_VARIANTS[2], duration: MOTION.morph.duration, ease: MOTION.morph.ease })
        .to(path, { morphSVG: BLOB_VARIANTS[3], duration: MOTION.morph.duration, ease: MOTION.morph.ease })
        .to(path, { morphSVG: BLOB_VARIANTS[0], duration: MOTION.morph.duration, ease: MOTION.morph.ease });
      timelines.push(morph);
    }

    return () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      for (const timeline of timelines) timeline.kill();
      if (path) gsap.set(path, { attr: { d: CTA_BLOB_PATH } });
      if (wipe) gsap.set(wipe, { clearProps: 'clipPath' });
      if (pop) gsap.set(pop, { clearProps: 'transform' });
    };
  }, [reducedMotion]);

  // 10 cursor liquid, as a spring lean on the blob wrapper. The idle morph owns
  // the path d, so the lean stays an affine transform: translate toward the
  // pointer plus a faint skewX, wobbling back when the pointer leaves. Touch
  // gets the same lean driven by raw scroll velocity.
  useEffect(() => {
    if (reducedMotion) return;
    const lean = leanRef.current;
    if (!lean) return;
    const section = lean.closest<HTMLElement>('[data-section="cta"]');
    if (!section) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const state = { x: 0, y: 0, skew: 0, tx: 0, ty: 0, tskew: 0 };
    let lastY = window.scrollY;
    let velocity = 0;

    const onScroll = () => {
      velocity = window.scrollY - lastY;
      lastY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const onMove = (event: PointerEvent) => {
      if (!finePointer) return;
      const rect = section.getBoundingClientRect();
      const nx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      state.tx = clamp(nx * MOTION.lean.x, MOTION.lean.x);
      state.ty = clamp(ny * MOTION.lean.y, MOTION.lean.y);
      state.tskew = clamp(nx * MOTION.lean.skew, MOTION.lean.skew);
    };
    const onLeave = () => {
      state.tx = 0;
      state.ty = 0;
      state.tskew = 0;
    };
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);

    const tick = () => {
      if (!finePointer) {
        velocity *= 0.92;
        state.ty += (clamp(velocity * 0.4, MOTION.touchLean.y) - state.ty) * 0.1;
        state.tx += (0 - state.tx) * 0.1;
        state.tskew += (clamp(velocity * 0.045, MOTION.touchLean.skew) - state.tskew) * 0.1;
      }
      state.x += (state.tx - state.x) * MOTION.lean.ease;
      state.y += (state.ty - state.y) * MOTION.lean.ease;
      state.skew += (state.tskew - state.skew) * MOTION.lean.ease;
      lean.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0) skewX(${state.skew.toFixed(3)}deg)`;
    };
    gsap.ticker.add(tick);

    return () => {
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      gsap.ticker.remove(tick);
      lean.style.transform = '';
    };
  }, [reducedMotion]);

  const onPrimaryClick = () => {
    if (reducedMotion) {
      setDrawerOpen(true);
      return;
    }
    setBurstId((id) => id + 1);
    window.setTimeout(() => setDrawerOpen(true), 350);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-cta-trigger] button, [data-cta-trigger] a')?.focus({ preventScroll: true });
    });
  };

  return (
    <>
      <section
        ref={sectionRef}
        data-section="cta"
        id="contact"
        aria-label="Contact"
        className="cta-section relative w-full bg-cta-bg border-y border-ink"
        style={{ height: '830px' }}
      >
        <SectionEdge variant="blob" from="var(--cream-white)" />
        {/* Wipe-clipped reveal: everything below animates in as one unit. */}
        <div ref={wipeRef} className="cta-reveal" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Blob: absolute x 64..1376, y 86..754, 1312x668, overflow visible. */}
          <div className="cta-blob" data-depth="-0.2" style={{ position: 'absolute', top: '86px', left: '64px', width: '1312px', height: '668px', overflow: 'visible' }}>
            <div ref={popRef} className="cta-blob-pop" style={{ width: '100%', height: '100%' }}>
              <div ref={leanRef} className="cta-blob-lean" style={{ width: '100%', height: '100%' }}>
                <CtaBlob pathRef={pathRef} />
              </div>
            </div>
          </div>

          {/* Centered content block, vertically centered in the blob. */}
          <div className="cta-content" style={{ position: 'absolute', top: '0px', left: '0px', right: '0px', bottom: '0px' }}>
            {/* Content column: H2 top 298.1, para top 380.1, button top 484.1. */}
            <div className="cta-copy" style={{ position: 'absolute', top: '298.1px', left: '192.5px', width: '1055px', height: '244px' }}>
              {/* H2, box 1055x50 at (192.5, 298.1), centered. */}
              <h2
                data-skew
                data-split="lines"
                className="cta-h2"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '1055px',
                  height: '50px',
                  fontFamily: 'var(--ff-outfit)',
                  fontWeight: 400,
                  fontSize: '45px',
                  lineHeight: '50px',
                  letterSpacing: '-0.03em',
                  color: 'var(--heading)',
                  textAlign: 'center',
                }}
              >
                Got a project in mind? Let&apos;s talk.
              </h2>

              {/* Paragraph, box 1055x72 at (192.5, 380.1), centered, two lines. */}
              <p
                data-split="words"
                className="cta-para"
                style={{
                  position: 'absolute',
                  top: '80px',
                  left: 0,
                  width: '1055px',
                  height: '72px',
                  fontFamily: 'var(--ff-outfit)',
                  fontWeight: 400,
                  fontSize: '26px',
                  lineHeight: '36px',
                  letterSpacing: '-0.02em',
                  color: 'var(--heading)',
                  textAlign: 'center',
                }}
              >
                Tell me what you&apos;re building, what&apos;s not working yet, or what you need an extra pair of creative hands for. We&apos;ll take it from there.
              </p>

              {/* Button, 317x58 at (561.5, 484.1). Bursts stickers, then opens the drawer. */}
              <div className="cta-button" data-cta-trigger style={{ position: 'absolute', top: '184px', left: 0, width: '1055px', height: '58px', display: 'flex', justifyContent: 'center' }}>
                <Button
                  label="Tell me what you're working on"
                  arrow="up-right"
                  fill="var(--yellow)"
                  className="w-[317px]"
                  onClick={onPrimaryClick}
                />
                {burstId > 0 ? <CtaConfetti key={burstId} pieces={pieces} onDone={() => undefined} /> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  );
}
