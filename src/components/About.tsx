// About (DESIGN_SPEC 8, 12, 13): the split section with the yellow stripe
// field + tilted image cards on the left half, and the sticker / H2 / bio /
// CTA on the right half.
//
// Static geometry is unchanged. Motion (MOTION_SPEC 8, DOM/CSS version) is
// layered so each transform has one owner:
//   card       absolute frame, entrance x + extra rotation, depth y
//   lift       hover lift y (carries the badge with the card)
//   inner      resting card rotation, straightens to 0 on hover
//   badge      absolute corner position, depth y
//   badge-rot  resting counter-rotation against the card
//   badge-float idle y +/-3px
//   badge-peel corner-peel rotation and shadow on card hover
//   badge-face squash on badge hover
// The stripe field drifts with a CSS background-position loop (40s, one
// period), the label slaps in, the stitch under "sign" draws on scroll, and
// the needle sticker is a pointer-only easter egg. Static and reduced motion
// never reach this effect, so the DESIGN_SPEC render stays exact.
//
// Left half (720 wide, full height): vertical stripes alternating
// #fef5b6 / #fbf1a8, ~47px bands with soft 5px gradient edges, 1px black right
// border. Padding 64px 52px 64px 72px. Two tilted image cards, true size
// 593x397.5, radius 36, 1px black stroke, overflow hidden: card 1 rotated -3.32
// (unrotated top-left (73, 65.05), center (369.5, 263.8)), card 2 rotated +1.64
// (unrotated top-left (73, 505.75), center (369.5, 704.5)). Cloud sticker badges
// counter-rotated against the cards at rot +3.32 fill #f5e8ec and rot -15.12
// fill #ff9c39. Both cards use local project covers from the old portfolio
// until Lois supplies portrait/work photography (OPEN_QUESTIONS 19).
// portraits (OPEN_QUESTIONS 19).

import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { EASE } from '../motion/ease';
import { gsap, ScrollTrigger } from '../motion/gsap';
import { useMediaQuery } from '../motion/useMediaQuery';
import { useMotion } from '../motion/useMotion';
import { StickerLabel } from './ui/StickerLabel';
import { Button } from './ui/Button';
import { SectionEdge } from './SectionEdge';
import { Logo } from './svg/Logo';

// Stripe field: repeating period 94px (47px bands), soft ramps of 5px at each
// band edge. Stops: #fef5b6 0, hold to 42px, ramp to #fbf1a8 at 47px, hold to
// 89px, ramp back to #fef5b6 at 94px (repeating period 94px).
const STRIPES =
  'repeating-linear-gradient(to right, #fef5b6 0, #fef5b6 42px, #fbf1a8 47px, #fbf1a8 89px, #fef5b6 94px)';

const ABOUT_PARAS = [
  "I’m Lois Amadi, a brand and visual designer with a soft spot for thoughtful ideas and the details that make them stick. I work across brand identity, campaign and marketing design, and digital content, bringing strategy and visuals into the same room (they get along better than you’d think).",
  "My experience spans consumer brands, creative projects and tech teams. I’ve shaped brand and content work, designed for digital channels, and helped turn big piles of information into clear, engaging stories.",
];

// Exact geometry from DESIGN_SPEC section 8 (px, section-local).
const SPEC = {
  sectionH: '969px', // 8: 968.2 -> 969 (integer-height contract, OPEN_QUESTIONS 35)
  card: {
    w: '593px', // 8: true size 593x397.5
    h: '397.5px',
    rad: '36px', // 8: radius 36
    stroke: '1px solid var(--ink)',
  },
  card1: { left: '73px', top: '65.05px', rot: -3.32 }, // 8: unrot top-left (73,65.05), center (369.5,263.8)
  card2: { left: '73px', top: '505.75px', rot: 1.64 }, // 8: unrot top-left (73,505.75), center (369.5,704.5)
  // Badge coordinates are relative to their card frame so the badge travels
  // with the card entrance and hover lift. The values are the old section
  // coordinates minus the card origin, so the static render is unchanged.
  badge: [
    { // 8.1 badge 1: top-right of card 1, rot +3.32, fill #f5e8ec, true size 101.8x50.1
      className: 'about-badge--1',
      fill: '#f5e8ec',
      left: '502.1px', // 8: unrot section x 575.1 - card x 73
      top: '-32.33px', // 8: unrot section y 32.72 - card y 65.05
      w: '101.8px',
      h: '50.1px',
      rot: 3.32,
      peel: -18, // MOTION_SPEC 8: peel about the corner by 18deg
      origin: '0% 100%',
      depth: '0.35',
    },
    { // 8.1 badge 2: top-left of card 2, rot -15.12, fill #ff9c39, true size 104.3x53.5
      className: 'about-badge--2',
      fill: '#ff9c39',
      left: '-4.05px', // 8: unrot section x 68.95 - card x 73
      top: '-12.3px', // 8: unrot section y 493.45 - card y 505.75
      w: '104.3px',
      h: '53.5px',
      rot: -15.12,
      peel: 18,
      origin: '100% 0%',
      depth: '0.3',
    },
  ],
  rightPadT: '76px',
  rightPadB: '64px',
  rightPadL: '62px',
  rightPadR: '62px',
  contentX: '782px',
  contentW: '596px',
  sticker: { text: 'About', rotate: -5.4, fill: 'var(--lime)', w: '68px', h: '36px', top: '76px', left: '782px' },
  h2: { text: "Hi, I’m Lois. I make the thinking visible.", fs: '45px', lh: '50px', ls: '-0.03em', color: 'var(--heading)', top: '150.2px', left: '782px', w: '596px', h: '100px' },
  bio: { top: '282.2px', h: '512px', fs: '24px', lh: '32px', ls: '-0.02em', color: 'var(--body)' },
  btn: { label: 'A little more about me', arrow: 'up-right', fill: 'var(--orange-cta)', top: '846.2px', left: '782px', w: '252px', h: '58px' },
} as const;

const CARD_ROT = [SPEC.card1.rot, SPEC.card2.rot] as const;

/* MOTION_SPEC 8 values. */
const MOTION = {
  sticker: {
    scale: 2,
    rotation: -20,
    // The base wrapper owns the -5.4 rest angle (SPEC.sticker.rotate), so the
    // slap tween settles at 0 rather than doubling the rotation.
    rest: 0,
    shadow: '4px 4px 0 var(--shadow-paper)',
    none: '0px 0px 0 var(--shadow-paper)',
  },
  card: {
    x: 80,
    extraRotation: 8,
    start: 'top 95%',
    end: 'top 45%',
    scrub: 0.6,
    lift: 10,
    duration: 0.5,
  },
  badge: {
    float: 3,
    floatBase: 3.2,
    floatOffset: 0.4,
    enterScaleX: 1.08,
    enterScaleY: 0.92,
    shadow: (x: number, y: number, color: string) => `${x}px ${y}px 0 0 ${color}`,
  },
  stitch: { duration: 0.8, start: 'top 92%' },
  needle: {
    threadLength: 90,
    pop: 0.45,
    draw: 0.65,
  },
} as const;

const CARD_IMAGES = [
  { src: '/images/projects/portrait-1024.webp', srcSet: '/images/projects/portrait-640.webp 640w, /images/projects/portrait-1024.webp 1024w, /images/projects/portrait-1600.webp 1600w', alt: 'Lois Amadi portrait from the old portfolio' },
  { src: '/images/old-portfolio/garri-granola.webp', srcSet: '/images/old-portfolio/garri-granola.webp 1600w', alt: 'Garri and Granola homeware brand cover from the old portfolio' },
] as const;

function CardImage({ index }: { index: number }) {
  const image = CARD_IMAGES[index % CARD_IMAGES.length];
  return (
    <picture
      data-diff-ignore
      style={{ position: 'absolute', inset: 0, display: 'block' }}
    >
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes="593px"
        alt={image.alt}
        width={1600}
        height={900}
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </picture>
  );
}

export function About() {
  const { reducedMotion } = useMotion();
  const active = !reducedMotion;
  const finePointer = useMediaQuery('(pointer: fine)');

  const stickerWrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const liftRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const badgeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const badgeFloatRefs = useRef<Array<HTMLDivElement | null>>([]);
  const badgePeelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const badgeFaceRefs = useRef<Array<HTMLDivElement | null>>([]);
  const bioRef = useRef<HTMLDivElement>(null);
  const lastParaRef = useRef<HTMLParagraphElement>(null);
  const stitchRef = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGSVGElement>(null);
  const threadRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    if (!active) return;

    const stickerWrap = stickerWrapRef.current;
    const sticker = stickerWrap?.querySelector<HTMLElement>('[data-about-sticker-slap]') ?? null;
    const cards = cardRefs.current;
    const lifts = liftRefs.current;
    const inners = innerRefs.current;
    const badges = badgeRefs.current;
    const floats = badgeFloatRefs.current;
    const peels = badgePeelRefs.current;
    const faces = badgeFaceRefs.current;
    const bio = bioRef.current;
    const lastPara = lastParaRef.current;
    const stitch = stitchRef.current;
    const needle = needleRef.current;
    const thread = threadRef.current;

    const tweens: gsap.core.Animation[] = [];
    const floatsTimelines: gsap.core.Timeline[] = [];
    const triggers: ScrollTrigger[] = [];
    const listeners: Array<() => void> = [];
    let splitObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let measureFrame = 0;
    let disposed = false;

    // 8 label: the About sticker slaps in, same language as the Work sticker.
    if (stickerWrap && sticker) {
      const slap = gsap.timeline({
        scrollTrigger: { trigger: stickerWrap, start: 'top 80%', once: true },
      });
      slap
        .fromTo(
          stickerWrap,
          { scale: MOTION.sticker.scale, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.55, ease: EASE.pop },
          0,
        )
        .fromTo(
          sticker,
          { rotation: MOTION.sticker.rotation, boxShadow: MOTION.sticker.shadow },
          {
            rotation: MOTION.sticker.rest,
            boxShadow: MOTION.sticker.none,
            duration: 0.55,
            ease: EASE.pop,
          },
          0.04,
        );
      tweens.push(slap);
    }

    // 8 cards: scrub in from opposite sides with extra rotation, then settle.
    // The entrance lives on the outer frame so hover can own the inner card
    // rotation and the lift wrapper can own the hover y.
    cards.forEach((card, index) => {
      if (!card) return;
      const direction = index === 0 ? -1 : 1;
      const entrance = gsap.fromTo(
        card,
        {
          x: direction * MOTION.card.x,
          rotation: direction * MOTION.card.extraRotation,
        },
        {
          x: 0,
          rotation: 0,
          duration: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: MOTION.card.start,
            end: MOTION.card.end,
            scrub: MOTION.card.scrub,
          },
        },
      );
      tweens.push(entrance);
    });

    // 8 hover: straighten, lift, peel the badge and grow its shadow. Touch
    // keeps the entrance and idle float but has no hover state.
    if (finePointer) {
      const shadowColor =
        getComputedStyle(document.documentElement).getPropertyValue('--logo-shadow').trim() ||
        'var(--logo-shadow)';
      cards.forEach((card, index) => {
        const lift = lifts[index];
        const inner = inners[index];
        const peel = peels[index];
        const face = faces[index];
        if (!card || !lift || !inner || !peel || !face) return;

        const badge = SPEC.badge[index];
        let hovered = false;

        const onEnter = () => {
          if (hovered) return;
          hovered = true;
          gsap.to(lift, {
            y: -MOTION.card.lift,
            duration: MOTION.card.duration,
            ease: EASE.glide,
            overwrite: 'auto',
          });
          gsap.to(inner, {
            rotation: -CARD_ROT[index],
            duration: MOTION.card.duration,
            ease: EASE.glide,
            overwrite: 'auto',
          });
          gsap.to(peel, {
            rotation: badge.peel,
            y: -2,
            duration: 0.5,
            ease: EASE.pop,
            overwrite: 'auto',
          });
          gsap.to(face, {
            boxShadow: MOTION.badge.shadow(6, 8, shadowColor),
            duration: 0.5,
            ease: EASE.glide,
            overwrite: 'auto',
          });
        };

        const onLeave = () => {
          if (!hovered) return;
          hovered = false;
          gsap.to(lift, {
            y: 0,
            duration: 0.45,
            ease: EASE.glide,
            overwrite: 'auto',
          });
          gsap.to(inner, {
            rotation: 0,
            duration: 0.5,
            ease: EASE.glide,
            overwrite: 'auto',
          });
          gsap.to(peel, {
            rotation: 0,
            y: 0,
            duration: 0.4,
            ease: EASE.glide,
            overwrite: 'auto',
          });
          gsap.to(face, {
            boxShadow: MOTION.badge.shadow(2, 2, shadowColor),
            duration: 0.45,
            ease: EASE.glide,
            overwrite: 'auto',
          });
        };

        card.addEventListener('pointerenter', onEnter);
        card.addEventListener('pointerleave', onLeave);
        listeners.push(() => {
          card.removeEventListener('pointerenter', onEnter);
          card.removeEventListener('pointerleave', onLeave);
        });
      });

      // 8 cloud badges squash when they are hovered directly. They are inside
      // the card frame, so the card's peel is already active at the same time.
      badges.forEach((badge, index) => {
        const face = faces[index];
        if (!badge || !face) return;
        const onEnter = () => {
          gsap.to(face, {
            scaleX: MOTION.badge.enterScaleX,
            scaleY: MOTION.badge.enterScaleY,
            duration: 0.18,
            ease: EASE.glide,
            overwrite: 'auto',
          });
        };
        const onLeave = () => {
          gsap.to(face, {
            scaleX: 1,
            scaleY: 1,
            duration: 0.6,
            ease: EASE.pop,
            overwrite: 'auto',
          });
        };
        badge.addEventListener('pointerenter', onEnter);
        badge.addEventListener('pointerleave', onLeave);
        listeners.push(() => {
          badge.removeEventListener('pointerenter', onEnter);
          badge.removeEventListener('pointerleave', onLeave);
        });
      });
    }

    // 8 badge idle: gentle float, 3 to 4s per badge, offset. Pause when the
    // badge is out of view so offscreen sections stay quiet.
    floats.forEach((float, index) => {
      const badge = badges[index];
      if (!float || !badge) return;
      const tl = gsap.timeline({
        paused: true,
        repeat: -1,
        yoyo: true,
        defaults: { ease: 'sine.inOut' },
      });
      tl.fromTo(
        float,
        { y: 0 },
        { y: MOTION.badge.float, duration: MOTION.badge.floatBase + index * MOTION.badge.floatOffset },
      );
      const trigger = ScrollTrigger.create({
        trigger: badge,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (self.isActive && !document.hidden) tl.play();
          else tl.pause();
        },
      });
      if (trigger.isActive) tl.play();
      floatsTimelines.push(tl);
      triggers.push(trigger);
    });

    // 8 stitch + easter egg: TextSystem splits the bio after mount and again
    // on resize or font swap, so word-level nodes cannot hold these
    // decorations. Both SVGs are direct children of the bio, positioned from
    // Ranges over the current text nodes and re-measured whenever the split
    // mutates or the bio resizes. The copy stays plain text.
    let signBox: DOMRect | null = null;
    let sewingBox: DOMRect | null = null;
    let sewingLocal: { left: number; top: number; right: number; bottom: number } | null = null;

    const findWord = (root: HTMLElement, word: string): DOMRect | null => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const pattern = new RegExp(`\\b${word}\\b`);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent ?? '';
        const match = pattern.exec(text);
        if (!match) continue;
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + word.length);
        const rect = range.getBoundingClientRect();
        range.detach();
        if (rect.width > 0 || rect.height > 0) return rect;
      }
      return null;
    };

    const measure = () => {
      if (!bio || !lastPara) return;
      const bioBox = bio.getBoundingClientRect();
      signBox = findWord(lastPara, 'sign');
      sewingBox = findWord(lastPara, 'sewing');

      // The hit target is stored relative to the bio so scrolling between
      // measurements cannot invalidate it.
      sewingLocal = sewingBox
        ? {
            left: sewingBox.left - bioBox.left,
            top: sewingBox.top - bioBox.top,
            right: sewingBox.right - bioBox.left,
            bottom: sewingBox.bottom - bioBox.top,
          }
        : null;

      // Stitch: hand-drawn overshoot of 4px past each end, sitting just under
      // the word's baseline box.
      if (stitch && signBox) {
        const pad = 4;
        gsap.set(stitch, {
          x: signBox.left - bioBox.left - pad,
          y: signBox.bottom - bioBox.top - 2,
          width: signBox.width + pad * 2,
        });
      }

      // Needle: the old inline placement sat at 35% across "sewing" and 27px
      // above it, so the thread floats over the following word.
      if (needle && sewingBox) {
        gsap.set(needle, {
          x: sewingBox.left - bioBox.left + sewingBox.width * 0.35,
          y: sewingBox.top - bioBox.top - 27,
        });
      }
    };

    measure();

    const measureSoon = () => {
      if (disposed || measureFrame) return;
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        if (!disposed) measure();
      });
    };

    if (lastPara) {
      splitObserver = new MutationObserver(measureSoon);
      splitObserver.observe(lastPara, { childList: true, subtree: true, characterData: true });
    }
    if (bio) {
      resizeObserver = new ResizeObserver(measureSoon);
      resizeObserver.observe(bio);
    }
    void document.fonts.ready.then(() => {
      if (!disposed) measureSoon();
    });

    // 8 stitch: the hand-drawn underline draws under "sign" as the last
    // paragraph enters.
    if (lastPara && stitch) {
      const draw = gsap.fromTo(
        stitch,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: MOTION.stitch.duration,
          ease: EASE.glide,
          scrollTrigger: {
            trigger: lastPara,
            start: MOTION.stitch.start,
            once: true,
          },
        },
      );
      tweens.push(draw);
    }

    // 8 easter egg: hovering "sewing" pops a needle and draws its thread.
    // Hit testing runs on the bio because the split replaces the word nodes;
    // the Range rectangle follows every re-split.
    if (finePointer && bio && lastPara && needle && thread) {
      gsap.set(needle, { opacity: 0, scale: 0.4, rotation: -30, transformOrigin: '50% 50%' });
      gsap.set(thread, { opacity: 0, strokeDashoffset: MOTION.needle.threadLength });
      let shown = false;

      const onEnter = () => {
        if (shown) return;
        shown = true;
        gsap.to(needle, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: MOTION.needle.pop,
          ease: EASE.pop,
          overwrite: 'auto',
        });
        gsap.fromTo(
          thread,
          { opacity: 1, strokeDashoffset: MOTION.needle.threadLength },
          {
            opacity: 1,
            strokeDashoffset: 0,
            duration: MOTION.needle.draw,
            ease: EASE.glide,
            overwrite: 'auto',
          },
        );
      };

      const onLeave = () => {
        if (!shown) return;
        shown = false;
        gsap.to(needle, {
          opacity: 0,
          scale: 0.4,
          rotation: -30,
          duration: 0.25,
          ease: 'power2.in',
          overwrite: 'auto',
        });
        gsap.to(thread, {
          opacity: 0,
          strokeDashoffset: MOTION.needle.threadLength,
          duration: 0.25,
          ease: 'power2.in',
          overwrite: 'auto',
        });
      };

      const onMove = (event: PointerEvent) => {
        if (!sewingLocal) return;
        const box = bio.getBoundingClientRect();
        const x = event.clientX - box.left;
        const y = event.clientY - box.top;
        const pad = 2;
        const inside =
          x >= sewingLocal.left - pad &&
          x <= sewingLocal.right + pad &&
          y >= sewingLocal.top - pad &&
          y <= sewingLocal.bottom + pad;
        if (inside) onEnter();
        else onLeave();
      };

      bio.addEventListener('pointermove', onMove);
      bio.addEventListener('pointerleave', onLeave);
      listeners.push(() => {
        bio.removeEventListener('pointermove', onMove);
        bio.removeEventListener('pointerleave', onLeave);
      });
    }

    return () => {
      disposed = true;
      if (measureFrame) cancelAnimationFrame(measureFrame);
      splitObserver?.disconnect();
      resizeObserver?.disconnect();
      for (const listener of listeners) listener();
      for (const trigger of triggers) trigger.kill();
      for (const timeline of floatsTimelines) timeline.kill();
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      for (const card of cards) if (card) gsap.set(card, { clearProps: 'transform' });
      for (const lift of lifts) if (lift) gsap.set(lift, { clearProps: 'transform' });
      for (const inner of inners) if (inner) gsap.set(inner, { clearProps: 'transform' });
      for (const peel of peels) if (peel) gsap.set(peel, { clearProps: 'transform,opacity' });
      for (const float of floats) if (float) gsap.set(float, { clearProps: 'transform' });
      for (const face of faces) if (face) gsap.set(face, { clearProps: 'transform,boxShadow' });
      if (stickerWrap) gsap.set(stickerWrap, { clearProps: 'transform,opacity' });
      if (sticker) gsap.set(sticker, { clearProps: 'transform,boxShadow' });
      if (stitch) gsap.set(stitch, { clearProps: 'clipPath,transform,width' });
      if (needle) gsap.set(needle, { clearProps: 'transform,opacity' });
      if (thread) gsap.set(thread, { clearProps: 'opacity,strokeDashoffset' });
    };
  }, [active, finePointer]);

  return (
    <section
      data-section="about"
      id="about"
      aria-label="About"
      className="about-section relative w-full overflow-hidden"
      style={{ height: SPEC.sectionH }}
    >
      <SectionEdge variant="blob" from="var(--cream)" />
      {/* 8.1 Left half: yellow stripe field with 1px black right border. */}
      <div
        className={`about-left${active ? ' about-stripes--drift' : ''}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '720px',
          height: SPEC.sectionH,
          background: STRIPES,
          borderRight: '1px solid var(--ink)',
        }}
      >
        {/* content context for the left half (children use absolute coords) */}
        <div className="about-left-canvas" data-skew style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {[SPEC.card1, SPEC.card2].map((card, index) => {
            const badge = SPEC.badge[index];
            return (
              <div
                key={index}
                ref={(element) => {
                  cardRefs.current[index] = element;
                }}
                className="about-card"
                data-depth={index === 0 ? '-0.08' : '0.06'}
                style={{
                  position: 'absolute',
                  left: card.left,
                  top: card.top,
                  width: SPEC.card.w,
                  height: SPEC.card.h,
                  transformOrigin: 'center center',
                }}
              >
                <div
                  ref={(element) => {
                    liftRefs.current[index] = element;
                  }}
                  className="about-card-lift"
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <div
                    className="about-card-rot"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      transform: `rotate(${card.rot}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    <div
                      ref={(element) => {
                        innerRefs.current[index] = element;
                      }}
                      className="about-card-inner"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        border: SPEC.card.stroke,
                        borderRadius: SPEC.card.rad,
                        overflow: 'hidden',
                      }}
                    >
                      <CardImage index={index} />
                    </div>
                  </div>

                  {/* 8.1 cloud sticker badge, pinned to the card corner. */}
                  <div
                    ref={(element) => {
                      badgeRefs.current[index] = element;
                    }}
                    className={`about-badge ${badge.className}`}
                    data-depth={badge.depth}
                    style={{
                      position: 'absolute',
                      left: badge.left,
                      top: badge.top,
                      width: badge.w,
                      height: badge.h,
                    }}
                  >
                    <div
                      className="about-badge-rot"
                      style={{ width: '100%', height: '100%', transform: `rotate(${badge.rot}deg)`, transformOrigin: 'center center' }}
                    >
                      <div
                        ref={(element) => {
                          badgeFloatRefs.current[index] = element;
                        }}
                        className="about-badge-float"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <div
                          ref={(element) => {
                            badgePeelRefs.current[index] = element;
                          }}
                          className="about-badge-peel"
                          style={{ width: '100%', height: '100%', transformOrigin: badge.origin }}
                        >
                          <div
                            ref={(element) => {
                              badgeFaceRefs.current[index] = element;
                            }}
                            className="about-badge-face"
                            style={
                              {
                                width: '100%',
                                height: '100%',
                                background: badge.fill,
                                borderRadius: '48%',
                                '--yellow': badge.fill,
                              } as CSSProperties & { '--yellow': string }
                            }
                          >
                            <Logo
                              variant="nav"
                              aria-hidden="true"
                              style={{ width: '100%', height: '100%', display: 'block' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8.2 Right half: bg #fffefe. */}
      <div
        className="about-right"
        style={{
          position: 'absolute',
          left: '720px',
          top: 0,
          width: '720px',
          height: SPEC.sectionH,
          background: '#fffefe',
        }}
      >
        {/* content context for the right half (children use absolute coords) */}
        <div className="about-right-inner" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* sticker */}
          <div ref={stickerWrapRef} className="about-sticker" data-depth="0.4" style={{ position: 'absolute', top: '76px', left: '62px', width: '68px', height: '36px' }}>
            <div className="sticker-base" style={{ transform: `rotate(${SPEC.sticker.rotate}deg)`, transformOrigin: 'center center' }}>
              <div data-about-sticker-slap className="about-sticker-slap">
                <StickerLabel label="About" fill="var(--lime)" />
              </div>
            </div>
          </div>

          {/* H2 */}
          <h2
            data-skew
            data-split="lines"
            className="about-h2 font-outfit"
            style={{
              position: 'absolute',
              top: '150.2px',
              left: '62px',
              width: '596px',
              height: '100px',
              fontFamily: 'var(--ff-ink)',
              fontWeight: 600,
              fontSize: '45px',
              lineHeight: '50px',
              letterSpacing: '-0.03em',
              color: 'var(--heading)',
            }}
          >
            {SPEC.h2.text}
          </h2>

          {/* bio */}
          <div ref={bioRef} className="about-bio" style={{ position: 'absolute', top: '282.2px', left: '62px', width: '596px', height: '512px' }}>
            {ABOUT_PARAS.map((p, i) => (
              <p
                key={i}
                data-split="words"
                style={{
                  margin: i === 0 ? 0 : '32px 0 0 0',
                  fontFamily: 'var(--ff-outfit)',
                  fontWeight: 400,
                  fontSize: '24px',
                  lineHeight: '32px',
                  letterSpacing: '-0.02em',
                  color: 'var(--body)',
                }}
              >
                {p}
              </p>
            ))}
            <p
              ref={lastParaRef}
              data-split="words"
              style={{
                margin: '32px 0 0 0',
                fontFamily: 'var(--ff-outfit)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.02em',
                color: 'var(--body)',
              }}
            >
              I started in fashion, so I’ll always care about the details. When I’m not
              designing, I’m probably sewing something, watching a K-drama, or mentally
              redesigning a sign I passed on the way here.
            </p>

            {/* 8 stitch and needle: measured overlays, never inside the split
                text nodes. Static and reduced motion omit them entirely. */}
            {active ? (
              <svg
                ref={stitchRef}
                className="about-stitch"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M2 4.5 C 18 2.5, 34 6.5, 50 4.5 S 82 2.5, 98 4.5"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}
            {active && finePointer ? (
              <svg
                ref={needleRef}
                className="about-needle"
                viewBox="0 0 100 40"
                width="96"
                height="40"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  ref={threadRef}
                  d="M30 8 C 50 18, 70 4, 98 10"
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                <g>
                  <path
                    d="M4 32 L30 7"
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <ellipse cx="27.5" cy="9.5" rx="2.2" ry="3.4" transform="rotate(-43 27.5 9.5)" stroke="var(--ink)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </g>
              </svg>
            ) : null}
          </div>

          {/* button */}
          <div className="about-btn" style={{ position: 'absolute', top: '846.2px', left: '62px' }}>
            <Button
              label="A little more about me"
              arrow="up-right"
              fill="var(--orange-cta)"
              href="#contact"
              className="w-[252px]"
              aria-label="A little more about me"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
