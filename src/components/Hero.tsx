// Hero (DESIGN_SPEC 4.1/4.2, 12, 13): the cream introduction section with the
// two-line H1, the tilted four-card deck, the intro paragraph and the orange
// CTA button.
//
// Static render is the exact DESIGN_SPEC state. Motion (MOTION_SPEC 4.1 to
// 4.3) is layered into wrappers so each transform has one owner:
//   card root   absolute position, drag x
//   fan         scroll-out rotation and spread
//   tilt        resting tilt, hover straighten, idle wobble
//   spread      neighbour push on hover
//   breathe     idle y and hover scale
//   move        entrance arc and pointer parallax
//   art         inner-image parallax and entrance zoom
// The final resting values equal the spec values; reduced motion and static
// mode never reach any of the animation code.
//
// Vertical rhythm note: DESIGN_SPEC 4.1 gives the paragraph node as 924x90,
// but the reference raster (`reference/02-hero.png`) shows three text lines at
// exactly 36px pitch (ink rows 601..624, 637..660, 673..691). Three line boxes
// at 36px line-height take 108px, 18px more than the recorded 90px node box:
// the node number is the ink extent, so the deck->paragraph offset is 31px and
// the pre-button margin is 43px, landing the button on the specified y=743.9
// and closing the section at exactly 865.9px. Logged in OPEN_QUESTIONS 29.
//
// Card stroke geometry: Figma strokes are center-aligned, so the visible card
// is the 391x250 frame plus 0.5px of 1px black stroke on every side. The
// rendered border box is therefore 392x251, offset -0.5px, radius 36.5. The
// checkerboard pattern origin sits at the frame corner (0.5px). Logged in
// OPEN_QUESTIONS 30.

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import projectsJson from '../data/projects.json';
import { Button } from './ui/Button';
import type { Project } from './Overlay';

// MOTION_SPEC 13 asks for the overlay to stay out of the initial bundle.
const ProjectOverlay = lazy(() =>
  import('./Overlay').then((module) => ({ default: module.ProjectOverlay })),
);
import { EASE } from '../motion/ease';
import { gsap, ScrollTrigger, SplitText, Draggable } from '../motion/gsap';
import { onLoaderRelease } from '../motion/loaderGate';
import { useMediaQuery } from '../motion/useMediaQuery';
import { useMotion } from '../motion/useMotion';

/* Exact geometry from the spec (DESIGN_SPEC 4.1 + 4.2 table + 12 hero row).
   Colors and fonts stay in tokens (tokens.css); pattern colors are tokens too. */
const SPEC = {
  // 4.1: content column 1328 wide at x=72 (padding 84 40 64 72), centered on
  // 736. Mobile (12): horizontal page padding 20px, H1 clamp(34px, 9.5vw, 60px)
  // at 1.2 line-height -0.04em, paragraph 18/26, button full width up to 320.
  maxW: '1440px', // 12: center the 1440 column; background full-bleed
  h1: {
    // Raster-derived per-line tracking (OPEN_QUESTIONS 29). Values in em per
    // the px/fontSize rule; the shared -0.04em applies below md.
    ls1: '-0.0183333em', // -1.1px at 60 (ref line 1 ink width 570px)
    ls2: '-0.0416667em', // -2.5px at 60 (ref line 2 ink width 762px)
  },
  h1Gap: 24, // 4.1 gap H1 -> deck, tightened for deck breathing room
  paraGap: 24, // deck -> paragraph, tightened for deck breathing room
  btnGap: 18, // pre-button gap, tightened for deck breathing room
  deck: {
    h: '341.9px', // 4.2 container height plus 24px top and bottom breathing room
    top: '45.9px', // frame top so the 251 box is centered in the taller deck
    cardW: 391, // 4.2 true size (the Figma frame the stroke is centered on)
    cardH: 250,
    boxW: 392, // stroke-centered border box (see header note)
    boxH: 251,
    boxDx: -0.5,
    boxDy: -0.5,
    checkPeriod: '48px', // measured raster: 24px squares, two per tile
    cards: [
      // 4.2 table: deck-relative left (of the 391px frame), rotation, z order
      { id: 'garri-granola', left: 11.2, rot: -5.54 },
      { id: 'heure-doree', left: 313.6, rot: 6.69 },
      { id: 'rika-trips', left: 612.2, rot: -3.56 },
      { id: 'africa-built', left: 907.7, rot: 4.96 },
    ],
  },
  btn: { fill: 'var(--orange-hero)' }, // 4.1 + 1.4 button row (186x58)
  motion: {
    stack: { scale: 0.7, y: 60 },
    stagger: 0.12,
    dealDuration: 1.05,
    shadow: '6px 6px 0 rgba(0, 0, 0, 1)',
    idle: { y: 4, rotation: 0.4, base: 5, step: 0.6 },
    parallax: 14,
    depths: [0.6, 1, 1.4, 0.8],
    innerParallax: 12,
    innerScale: 1.12,
    hover: { rotation: 0.2, scale: 1.06, neighbour: 24, dim: 0.9 },
    fan: { rotation: 0.6, spread: 30 },
    drag: 140,
  },
} as const;

/* The conic tile places the gray square in the top-right and bottom-left
   quadrants, reproducing the reference's 24px checkerboard with the white
   square at each card's local top-left (OPEN_QUESTIONS 28). */
const CHECKER_BG =
  `conic-gradient(var(--card-check-b) 0% 25%, var(--card-check-a) 25% 50%,` +
  ` var(--card-check-b) 50% 75%, var(--card-check-a) 75%)` +
  ` 0.5px 0.5px / ${SPEC.deck.checkPeriod} ${SPEC.deck.checkPeriod}`;

const CARD_IDS = new Set<string>(projectsJson.projects.map((project) => project.id));
const PROJECTS = new Map(
  projectsJson.projects.map((project) => [project.id, project] as const),
);

const imageWidth = (url: string) => {
  const match = /-(\d+)\.(?:avif|webp)$/.exec(url);
  return Number(match?.[1] ?? 1024);
};

const buildSrcSet = (urls: string[]) =>
  urls.map((url) => `${url} ${imageWidth(url)}w`).join(', ');

const coverFor = (id: string) => {
  const image = PROJECTS.get(id)?.images[0];
  if (!image || ('placeholder' in image && image.placeholder === true)) return null;
  const fallback = image.webp[image.webp.length - 1] ?? '';
  return {
    sources: [
      { type: 'image/avif', srcSet: buildSrcSet(image.avif) },
      { type: 'image/webp', srcSet: buildSrcSet(image.webp) },
    ],
    src: fallback,
    alt: image.alt,
    width: image.width,
    height: image.height,
  };
};

const LAYER = {
  position: 'absolute',
  inset: 0,
  display: 'block',
} as const;

type CardParts = {
  root: HTMLDivElement;
  fan: HTMLElement;
  tilt: HTMLElement;
  spread: HTMLElement;
  breathe: HTMLElement;
  move: HTMLElement;
  art: HTMLElement;
  artInner: HTMLElement;
  stitch: SVGRectElement | null;
  needle: SVGGElement | null;
  rotation: number;
};

function readCardParts(root: HTMLDivElement, rotation: number): CardParts | null {
  const find = (name: string) => root.querySelector<HTMLElement>(`[data-hero-${name}]`);
  const fan = find('fan');
  const tilt = find('tilt');
  const spread = find('spread');
  const breathe = find('breathe');
  const move = find('move');
  const art = find('art');
  const artInner = find('art-inner');
  if (!fan || !tilt || !spread || !breathe || !move || !art || !artInner) return null;
  return {
    root,
    fan,
    tilt,
    spread,
    breathe,
    move,
    art,
    artInner,
    stitch: root.querySelector<SVGRectElement>('[data-hero-stitch]'),
    needle: root.querySelector<SVGGElement>('[data-hero-needle]'),
    rotation,
  };
}

export function Hero() {
  const { quality, reducedMotion } = useMotion();
  const active = !reducedMotion;
  const rich = active && quality !== 'low';
  const desktop = useMediaQuery('(min-width: 1440px)');
  const finePointer = useMediaQuery('(pointer: fine)');

  const sectionRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [dealDone, setDealDone] = useState(false);
  const [tiltGranted, setTiltGranted] = useState(false);
  const [tiltDismissed, setTiltDismissed] = useState(false);
  const [openProject, setOpenProject] = useState<{
    project: Project;
    source: HTMLElement;
    trigger: HTMLButtonElement;
  } | null>(null);
  // A card drag must not also open the project overlay (MOTION_SPEC 4.3). The
  // Draggable release sets this ref, then clears it a beat later, so the
  // synthetic click that follows a drag is treated as the tail of the drag.
  const dragBlocked = useRef(false);

  const openCard = (id: string, trigger: HTMLButtonElement, source: HTMLElement) => {
    if (dragBlocked.current) return;
    const project = PROJECTS.get(id);
    if (!project) return;
    setOpenProject({ project, source, trigger });
  };

  // MOTION_SPEC 12 (Hero, touch): tilt the sub-1440 deck by gyroscope. iOS
  // needs a user gesture before DeviceOrientationEvent works, so it shows a
  // tiny "Tilt me" prompt. Other mobile devices attach on mount. A device with
  // no reliable orientation signal simply keeps the existing breathing fallback
  // because no orientation event updates the target.
  type OrientationConstructor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
  const canTilt = !desktop && !finePointer && !reducedMotion;
  const tiltNeedsPermission =
    canTilt &&
    typeof window !== 'undefined' &&
    typeof (window as Window & { DeviceOrientationEvent?: OrientationConstructor }).DeviceOrientationEvent === 'function' &&
    typeof (window as Window & { DeviceOrientationEvent?: OrientationConstructor }).DeviceOrientationEvent?.requestPermission === 'function' &&
    (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  const tiltPrompt = tiltNeedsPermission && !tiltGranted && !tiltDismissed;
  const tiltEnabled = canTilt && (!tiltNeedsPermission || tiltGranted);

  useEffect(() => {
    if (!tiltEnabled || desktop || finePointer || reducedMotion) return;
    const deck = sectionRef.current?.querySelector<HTMLElement>('.hero-mobile-deck');
    if (!deck) return;
    const wrappers = Array.from(
      deck.querySelectorAll<HTMLElement>('[data-hero-mobile-tilt]'),
    );
    if (wrappers.length === 0) return;

    const clamp = (value: number, max: number) => Math.max(-max, Math.min(max, value));
    let baseline: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let visible = false;
    const state = wrappers.map(() => ({ x: 0, y: 0 }));

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (!visible || event.beta == null || event.gamma == null) return;
      baseline ??= event.beta;
      targetX = clamp(event.beta - baseline, 12);
      targetY = clamp(event.gamma, 18);
    };
    const onOrientationSettled = () => {
      baseline = null;
      targetX = 0;
      targetY = 0;
    };
    const onResize = () => {
      baseline = null;
    };
    const tick = () => {
      if (!visible) {
        targetX = 0;
        targetY = 0;
      }
      state.forEach((entry, index) => {
        entry.x += (targetX - entry.x) * 0.08;
        entry.y += (targetY - entry.y) * 0.08;
        const influence = 1 - index * 0.05;
        wrappers[index].style.transform = `perspective(900px) rotateX(${(-entry.x * influence).toFixed(2)}deg) rotateY(${(entry.y * influence).toFixed(2)}deg)`;
      });
    };
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (!visible) onOrientationSettled();
    });
    observer.observe(deck);
    window.addEventListener('deviceorientation', onDeviceOrientation, false);
    window.addEventListener('deviceorientationabsolute', onDeviceOrientation, false);
    window.addEventListener('resize', onResize, false);
    window.addEventListener('blur', onOrientationSettled);
    gsap.ticker.add(tick);

    return () => {
      observer.disconnect();
      window.removeEventListener('deviceorientation', onDeviceOrientation, false);
      window.removeEventListener('deviceorientationabsolute', onDeviceOrientation, false);
      window.removeEventListener('resize', onResize, false);
      window.removeEventListener('blur', onOrientationSettled);
      gsap.ticker.remove(tick);
      wrappers.forEach((wrapper) => {
        wrapper.style.transform = '';
      });
    };
  }, [tiltEnabled, desktop, finePointer, reducedMotion]);

  const requestTilt = async () => {
    try {
      const grant = await (DeviceOrientationEvent as OrientationConstructor).requestPermission?.();
      if (grant === 'granted') setTiltGranted(true);
      else setTiltDismissed(true);
    } catch {
      setTiltDismissed(true);
    }
  };

  // Entrance: stacked deck deal, paragraph word rise and button pop. Runs
  // once per activation, after the loader cover starts its wipe.
  useEffect(() => {
    if (!active) return;
    const section = sectionRef.current;
    const deck = deckRef.current;
    if (!section || !deck) return;

    const cleanups: Array<() => void> = [];
    const cards = cardRefs.current
      .map((root, index) =>
        root ? readCardParts(root, SPEC.deck.cards[index]?.rot ?? 0) : null,
      )
      .filter((card): card is CardParts => card !== null);

    const timeline = gsap.timeline({
      paused: true,
      onComplete: () => setDealDone(true),
    });

    if (desktop && cards.length) {
      const width = deck.getBoundingClientRect().width;
      for (const [index, card] of cards.entries()) {
        const spec = SPEC.deck.cards[index];
        const fromCentre =
          width / 2 - (spec.left + SPEC.deck.boxW / 2 + SPEC.deck.boxDx);
        gsap.set(card.move, {
          x: fromCentre,
          y: SPEC.motion.stack.y,
          scale: SPEC.motion.stack.scale,
        });
        gsap.set(card.tilt, { rotation: 0 });
        gsap.set(card.artInner, { scale: SPEC.motion.innerScale });
        gsap.set(card.root, {
          opacity: 0,
          boxShadow: SPEC.motion.shadow,
        });

        const at = index * SPEC.motion.stagger;
        timeline
          .to(
            card.move,
            {
              x: 0,
              y: 0,
              scale: 1,
              duration: SPEC.motion.dealDuration,
              ease: EASE.glide,
            },
            at,
          )
          .to(
            card.tilt,
            {
              rotation: spec.rot,
              duration: 0.9,
              ease: EASE.deal,
            },
            at,
          )
          .to(
            card.artInner,
            {
              scale: 1,
              duration: 1.1,
              ease: EASE.glide,
            },
            at + 0.1,
          )
          .to(
            card.root,
            { opacity: 1, duration: 0.3, ease: 'none' },
            at,
          )
          .to(
            card.root,
            {
              boxShadow: '0px 0px 0 rgba(0, 0, 0, 0)',
              duration: 0.3,
              ease: 'none',
            },
            at + 0.85,
          );
      }
    } else if (!desktop) {
      const mobileCards = Array.from(
        section.querySelectorAll<HTMLElement>('[data-hero-mobile-card]'),
      );
      if (mobileCards.length) {
        gsap.set(mobileCards, { opacity: 0, y: 28, scale: 0.94 });
        timeline.to(
          mobileCards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: EASE.glide,
          },
          0,
        );
      }
    }

    let split: SplitText | null = null;
    const para = paraRef.current;
    if (para) {
      split = SplitText.create(para, {
        type: 'words',
        autoSplit: false,
        aria: 'auto',
      });
      if (split.words.length) {
        gsap.set(split.words, { opacity: 0, y: 14 });
        timeline.to(
          split.words,
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.02,
            ease: EASE.glide,
          },
          0.65,
        );
      }
    }

    const button = buttonRef.current;
    if (button) {
      gsap.set(button, { opacity: 0, scale: 0.8 });
      timeline.to(
        button,
        {
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease: EASE.pop,
        },
        0.85,
      );
    }

    cleanups.push(onLoaderRelease(() => timeline.play()));
    cleanups.push(() => {
      timeline.kill();
      split?.revert();
      split?.kill();
      for (const card of cards) {
        gsap.set(card.move, { clearProps: 'transform' });
        gsap.set(card.tilt, { clearProps: 'transform' });
        gsap.set(card.artInner, { clearProps: 'transform' });
        gsap.set(card.root, {
          clearProps: 'opacity,box-shadow',
        });
      }
      if (!desktop) {
        const mobileCards = Array.from(
          section.querySelectorAll<HTMLElement>('[data-hero-mobile-card]'),
        );
        for (const mobileCard of mobileCards) {
          gsap.set(mobileCard, { clearProps: 'opacity,transform' });
        }
      }
      if (button) gsap.set(button, { clearProps: 'opacity,transform' });
    });

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [active, desktop]);

  // Scroll-out fan: cards rotate 1.6x their resting tilt and spread outward.
  useEffect(() => {
    if (!active || !desktop) return;
    const section = sectionRef.current;
    if (!section) return;

    const cards = cardRefs.current
      .map((root, index) =>
        root ? readCardParts(root, SPEC.deck.cards[index]?.rot ?? 0) : null,
      )
      .filter((card): card is CardParts => card !== null);
    if (!cards.length) return;

    const tweens: gsap.core.Tween[] = [];
    for (const [index, card] of cards.entries()) {
      const sign = index < 2 ? -1 : 1;
      const drift = [18, 44, -20, 52][index] ?? 0;
      tweens.push(
        gsap.fromTo(
          card.fan,
          { rotation: 0, x: 0, y: 0 },
          {
            rotation: card.rotation * SPEC.motion.fan.rotation,
            x: sign * SPEC.motion.fan.spread,
            y: drift,
            immediateRender: false,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          },
        ),
      );
    }

    return () => {
      for (const tween of [...tweens]) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      for (const card of cards) {
        gsap.set(card.fan, { clearProps: 'transform,opacity' });
      }
    };
  }, [active, desktop]);

  // After the deal: idle breathing, pointer parallax, hover stitch and drag.
  useEffect(() => {
    if (!dealDone || !rich || !desktop) return;
    const debugHero =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('debug') === 'hero';
    const log = (...args: unknown[]) => {
      if (debugHero) console.log('[hero:debug]', ...args);
    };
    const section = sectionRef.current;
    const deck = deckRef.current;
    if (!section || !deck) return;

    const cards = cardRefs.current
      .map((root, index) =>
        root ? readCardParts(root, SPEC.deck.cards[index]?.rot ?? 0) : null,
      )
      .filter((card): card is CardParts => card !== null);
    if (!cards.length) return;

    let sectionActive = true;
    let hovered = -1;
    let dragging = -1;
    const idleByCard = new Map<number, gsap.core.Tween[]>();
    const quick = cards.map((card) => ({
      moveX: gsap.quickTo(card.move, 'x', { duration: 0.6, ease: EASE.glide }),
      moveY: gsap.quickTo(card.move, 'y', { duration: 0.6, ease: EASE.glide }),
      artX: gsap.quickTo(card.artInner, 'x', { duration: 0.6, ease: EASE.glide }),
      artY: gsap.quickTo(card.artInner, 'y', { duration: 0.6, ease: EASE.glide }),
    }));

    const shouldPause = () => document.hidden || !sectionActive;

    const stopIdle = (index: number) => {
      const tweens = idleByCard.get(index);
      if (!tweens) return;
      for (const tween of tweens) tween.kill();
      idleByCard.delete(index);
    };

    const startIdle = (index: number) => {
      const card = cards[index];
      if (!card) return;
      stopIdle(index);
      const direction = index % 2 === 0 ? 1 : -1;
      const tweens = [
        gsap.to(card.breathe, {
          y: SPEC.motion.idle.y * direction,
          duration: SPEC.motion.idle.base + index * SPEC.motion.idle.step,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }),
        gsap.to(card.tilt, {
          rotation:
            card.rotation +
            SPEC.motion.idle.rotation * (index % 2 === 0 ? 1 : -1),
          duration:
            SPEC.motion.idle.base +
            0.5 +
            index * SPEC.motion.idle.step,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }),
      ];
      if (shouldPause()) for (const tween of tweens) tween.pause();
      idleByCard.set(index, tweens);
    };

    const placeNeedle = (card: CardParts, progress: number) => {
      if (!card.stitch || !card.needle) return;
      const total = card.stitch.getTotalLength();
      const point = card.stitch.getPointAtLength(total * progress);
      const ahead = card.stitch.getPointAtLength(
        Math.min(total, total * progress + 1),
      );
      const angle =
        (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
      card.needle.setAttribute(
        'transform',
        `translate(${point.x} ${point.y}) rotate(${angle})`,
      );
    };

    const enter = (index: number) => {
      log('enter', { index, hovered, dragging, y: Math.round(window.scrollY), active: sectionActive });
      if (hovered === index || dragging >= 0) return;
      if (hovered >= 0) leave(hovered);
      hovered = index;
      stopIdle(index);
      for (const [i, card] of cards.entries()) {
        const isFocus = i === index;
        const direction = i < index ? -1 : 1;
        gsap.to(card.spread, {
          x: isFocus ? 0 : direction * SPEC.motion.hover.neighbour,
          duration: 0.35,
          ease: EASE.glide,
          overwrite: true,
        });
        gsap.to(card.tilt, {
          filter: isFocus
            ? 'brightness(1)'
            : `brightness(${SPEC.motion.hover.dim})`,
          duration: 0.3,
          ease: EASE.glide,
          overwrite: true,
        });
        card.root.style.zIndex = String(isFocus ? 50 : i + 1);
      }
      const card = cards[index];
      gsap.to(card.tilt, {
        rotation: card.rotation * SPEC.motion.hover.rotation,
        duration: 0.35,
        ease: EASE.glide,
        overwrite: true,
      });
      gsap.to(card.breathe, {
        y: 0,
        scale: SPEC.motion.hover.scale,
        duration: 0.35,
        ease: EASE.glide,
        overwrite: true,
      });
      if (card.stitch) {
        gsap.killTweensOf(card.stitch);
        gsap.set(card.stitch, { opacity: 1 });
        gsap.set(card.needle, { opacity: 1 });
        const draw = gsap.to(card.stitch, {
          strokeDashoffset: 0,
          duration: 0.7,
          ease: EASE.glide,
          onUpdate: () => placeNeedle(card, draw.progress()),
          onComplete: () => {
            gsap.to(card.needle, { opacity: 0, duration: 0.2 });
          },
        });
        placeNeedle(card, 0);
      }
    };

    const leave = (index: number) => {
      log('leave', { index, hovered, y: Math.round(window.scrollY), active: sectionActive });
      const card = cards[index];
      if (!card) return;
      if (hovered === index) hovered = -1;
      for (const [i, other] of cards.entries()) {
        gsap.to(other.spread, {
          x: 0,
          duration: 0.35,
          ease: EASE.glide,
          overwrite: true,
        });
        gsap.to(other.tilt, {
          filter: 'brightness(1)',
          rotation: other.rotation,
          duration: 0.35,
          ease: EASE.glide,
          overwrite: true,
          onComplete: () => {
            if (hovered !== i) startIdle(i);
          },
        });
        if (i !== index) other.root.style.zIndex = String(i + 1);
      }
      gsap.to(card.breathe, {
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: EASE.glide,
        overwrite: true,
      });
      card.root.style.zIndex = String(index + 1);
      if (card.stitch) {
        gsap.killTweensOf(card.stitch);
        gsap.to(card.stitch, {
          strokeDashoffset: card.stitch.getTotalLength(),
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        });
        gsap.to(card.needle, { opacity: 0, duration: 0.2 });
      }
    };

    const listeners: Array<() => void> = [];
    cards.forEach((card, index) => {
      const onEnter = () => enter(index);
      const onLeave = () => leave(index);
      card.root.addEventListener('pointerenter', onEnter);
      card.root.addEventListener('pointerleave', onLeave);
      listeners.push(() => {
        card.root.removeEventListener('pointerenter', onEnter);
        card.root.removeEventListener('pointerleave', onLeave);
      });

      if (card.stitch) {
        const total = card.stitch.getTotalLength();
        card.stitch.style.strokeDasharray = '10 8';
        card.stitch.style.strokeDashoffset = String(total);
        gsap.set(card.stitch, { opacity: 0 });
        gsap.set(card.needle, { opacity: 0 });
      }
      startIdle(index);
    });

    const onPointerMove = (event: PointerEvent) => {
      if (dragging >= 0) return;
      const rect = deck.getBoundingClientRect();
      const nx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      for (const index of cards.keys()) {
        const depth = SPEC.motion.depths[index] ?? 1;
        quick[index]?.moveX(-nx * SPEC.motion.parallax * depth);
        quick[index]?.moveY(-ny * SPEC.motion.parallax * depth * 0.6);
        quick[index]?.artX(-nx * SPEC.motion.innerParallax * depth);
        quick[index]?.artY(-ny * SPEC.motion.innerParallax * depth * 0.6);
      }
    };

    const onPointerLeave = () => {
      for (const index of cards.keys()) {
        quick[index]?.moveX(0);
        quick[index]?.moveY(0);
        quick[index]?.artX(0);
        quick[index]?.artY(0);
        if (hovered === index) leave(index);
      }
    };

    deck.addEventListener('pointermove', onPointerMove);
    deck.addEventListener('pointerleave', onPointerLeave);
    listeners.push(() => {
      deck.removeEventListener('pointermove', onPointerMove);
      deck.removeEventListener('pointerleave', onPointerLeave);
    });

    // Scrolling moves cards out from under a stationary cursor without a
    // reliable pointerleave on all browsers. Clear hover as soon as scroll
    // starts so a stale straightened, scaled, raised card does not look
    // stuck when the user returns.
    const onScrollClearHover = () => {
      log('scroll-clear', { hovered, dragging, y: Math.round(window.scrollY) });
      if (hovered >= 0) leave(hovered);
    };
    window.addEventListener('scroll', onScrollClearHover, { passive: true });
    listeners.push(() => window.removeEventListener('scroll', onScrollClearHover));

    const draggables: Array<{ kill: () => void }> = [];
    if (finePointer) {
      cards.forEach((card, index) => {
        let wasDragged = false;
        const instance = Draggable.create(card.root, {
          type: 'x',
          bounds: {
            minX: -SPEC.motion.drag,
            maxX: SPEC.motion.drag,
            minY: 0,
            maxY: 0,
          },
          dragClickables: true,
          onDragStart: () => {
            wasDragged = true;
            dragging = index;
            stopIdle(index);
            card.root.style.zIndex = '60';
          },
          onDrag: () => {
            const centre = (item: CardParts) => {
              const rect = item.root.getBoundingClientRect();
              return rect.left + rect.width / 2;
            };
            const order = [...cards].sort((a, b) => centre(a) - centre(b));
            order.forEach((item, rank) => {
              item.root.style.zIndex = String(rank + 1);
            });
            card.root.style.zIndex = '60';
          },
          onRelease: () => {
            if (wasDragged) {
              wasDragged = false;
              dragBlocked.current = true;
              window.setTimeout(() => {
                dragBlocked.current = false;
              }, 250);
            }
            gsap.to(card.root, {
              x: 0,
              duration: 0.6,
              ease: EASE.glide,
              onComplete: () => {
                dragging = -1;
                card.root.style.zIndex = String(index + 1);
                if (hovered !== index) startIdle(index);
              },
            });
          },
        })[0];
        if (instance) draggables.push(instance);
      });
    }

    const fanTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        log('fanToggle', { isActive: self.isActive, progress: +self.progress.toFixed(3), y: Math.round(window.scrollY) });
        sectionActive = self.isActive;
        for (const tweens of idleByCard.values()) {
          for (const tween of tweens) {
            if (shouldPause()) tween.pause();
            else tween.resume();
          }
        }
      },
    });

    const onVisibility = () => {
      for (const tweens of idleByCard.values()) {
        for (const tween of tweens) {
          if (shouldPause()) tween.pause();
          else tween.resume();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      for (const cleanup of listeners) cleanup();
      for (const [index] of cards.entries()) stopIdle(index);
      for (const instance of draggables) instance.kill();
      fanTrigger.kill();
      document.removeEventListener('visibilitychange', onVisibility);
      for (const card of cards) {
        gsap.killTweensOf(card.root);
        gsap.killTweensOf(card.fan);
        gsap.killTweensOf(card.tilt);
        gsap.killTweensOf(card.spread);
        gsap.killTweensOf(card.breathe);
        gsap.killTweensOf(card.move);
        gsap.killTweensOf(card.art);
        gsap.killTweensOf(card.artInner);
        if (card.stitch) gsap.killTweensOf(card.stitch);
        if (card.needle) gsap.killTweensOf(card.needle);
        gsap.set(card.root, {
          x: 0,
          opacity: 1,
          boxShadow: 'none',
          zIndex: cards.indexOf(card) + 1,
        });
        gsap.set(card.tilt, {
          rotation: card.rotation,
          filter: 'none',
        });
        gsap.set(card.spread, { x: 0 });
        gsap.set(card.breathe, { y: 0, scale: 1 });
        gsap.set(card.art, { x: 0, y: 0 });
        gsap.set(card.artInner, { x: 0, y: 0, scale: 1 });
        if (card.stitch) {
          card.stitch.style.strokeDashoffset = String(
            card.stitch.getTotalLength(),
          );
          gsap.set(card.stitch, { opacity: 0 });
        }
        if (card.needle) gsap.set(card.needle, { opacity: 0 });
      }
    };
  }, [dealDone, rich, desktop, finePointer]);

  return (
    <section
      ref={sectionRef}
      data-section="hero"
      className="hero-section relative w-full bg-cream-hero px-5 pt-[64px] pb-16 md:px-10 md:pt-[84px] md:pb-16 md:pl-[72px] min-[1440px]:h-[866px]"
    >
      <div className="mx-auto w-full max-w-[1440px] flex flex-col items-center">
        <div className="flex w-full max-w-[1328px] flex-col items-center">
          {/* 4.1 H1: explicit two lines; one <h1> per page (13). Per-line
              tracking from the reference raster (OPEN_QUESTIONS 29). */}
          <h1
            data-skew
            data-split="lines"
            className="text-center font-semibold md:font-semibold font-ink text-ink text-[clamp(34px,9.5vw,60px)] leading-[1.2] tracking-[-0.04em] md:text-[60px] md:leading-[72px] md:tracking-normal"
          >
            <span className="block tracking-[-0.04em] md:tracking-[-0.0183333em]">
              Good work deserves
            </span>{' '}
            <span className="block tracking-[-0.04em] md:tracking-[-0.0416667em]">
              a better-looking introduction.
            </span>
          </h1>

          {/* 4.2 Card deck: 1328x293.9 container, four absolutely positioned
              tilted cards, stacking order rises left to right. Decorative
              placeholder raster; real covers expose alt text when they land. */}
          <div
            ref={deckRef}
            role="group"
            aria-label="Featured projects"
            data-cursor="drag"
            data-skew
            className="relative hidden min-[1440px]:block"
            style={{ width: '100%', height: SPEC.deck.h, marginTop: `${SPEC.h1Gap}px` }}
          >
            {SPEC.deck.cards.map((card, i) => (
              <div
                key={card.id}
                ref={(node) => {
                  cardRefs.current[i] = node;
                }}
                data-hero-card={card.id}
                data-project-id={CARD_IDS.has(card.id) ? card.id : undefined}
                data-cursor="view"
                className="group"
                style={{
                  position: 'absolute',
                  left: `${card.left + SPEC.deck.boxDx}px`,
                  top: `calc(${SPEC.deck.top} + ${SPEC.deck.boxDy}px)`,
                  width: `${SPEC.deck.boxW}px`,
                  height: `${SPEC.deck.boxH}px`,
                  boxSizing: 'border-box',
                  borderRadius: '36.5px',
                  overflow: 'hidden',
                  zIndex: i + 1,
                  background: 'transparent',
                  lineHeight: 0,
                }}
              >
                <div data-hero-fan style={LAYER}>
                  <div
                    data-hero-tilt
                    style={{
                      ...LAYER,
                      transform: `rotate(${card.rot}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    <div data-hero-spread style={LAYER}>
                      <div data-hero-breathe style={LAYER}>
                        <div data-hero-move style={LAYER}>
                          <div
                            data-hero-art
                            style={{
                              ...LAYER,
                              overflow: 'hidden',
                              borderRadius: '36.5px',
                              background: CHECKER_BG,
                            }}
                          >
                            <div
                              data-hero-art-inner
                              style={{
                                ...LAYER,
                                background: CHECKER_BG,
                              }}
                            >
                              {(() => {
                                const cover = coverFor(card.id);
                                if (!cover) return null;
                                return (
                                  <picture
                                    data-diff-ignore
                                    style={{
                                      position: 'absolute',
                                      inset: 0,
                                      display: 'block',
                                    }}
                                  >
                                    {cover.sources.map((source) => (
                                      <source key={source.type} type={source.type} srcSet={source.srcSet} sizes="392px" />
                                    ))}
                                    <img
                                      src={cover.src}
                                      sizes="392px"
                                      alt=""
                                      width={cover.width}
                                      height={cover.height}
                                      loading="eager"
                                      fetchPriority="high"
                                      decoding="sync"
                                      draggable={false}
                                      style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                        borderRadius: '36.5px',
                                      }}
                                    />
                                  </picture>
                                );
                              })()}
                            </div>
                            <button
                              type="button"
                              aria-label={`View project: ${
                                PROJECTS.get(card.id)?.title ?? card.id
                              }`}
                              onClick={(event) =>
                                openCard(
                                  card.id,
                                  event.currentTarget,
                                  event.currentTarget.parentElement ??
                                    event.currentTarget,
                                )
                              }
                              className="media-trigger"
                              style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 6,
                                padding: 0,
                                border: 0,
                                borderRadius: '36.5px',
                                background: 'transparent',
                                cursor: 'pointer',
                              }}
                            />
                          </div>
                          <div
                            aria-hidden="true"
                            style={{
                              ...LAYER,
                              border: '1px solid var(--ink)',
                              borderRadius: '36.5px',
                              pointerEvents: 'none',
                              zIndex: 8,
                            }}
                          />
                          {active ? (
                            <svg
                              aria-hidden="true"
                              viewBox={`0 0 ${SPEC.deck.boxW} ${SPEC.deck.boxH}`}
                              width={SPEC.deck.boxW}
                              height={SPEC.deck.boxH}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 9,
                                overflow: 'visible',
                              }}
                            >
                              <rect
                                data-hero-stitch
                                x="1.5"
                                y="1.5"
                                width={SPEC.deck.boxW - 3}
                                height={SPEC.deck.boxH - 3}
                                rx="35.5"
                                fill="none"
                                stroke="var(--ink)"
                                strokeWidth="2"
                              />
                              <g data-hero-needle>
                                <line
                                  x1="0"
                                  y1="0"
                                  x2="16"
                                  y2="-4"
                                  stroke="var(--ink)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <circle cx="0" cy="0" r="2" fill="var(--ink)" />
                              </g>
                            </svg>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 12 mobile: horizontally scrollable snap-aligned deck, card 78vw
              (capped at 520 on tablet/laptop so it stays a deck), tilts kept,
              12% overlap. Shown below the desktop breakpoint. */}
          <div
            role="group"
            aria-label="Featured projects"
            data-cursor="drag"
            className="hero-mobile-deck relative w-full overflow-x-auto min-[1440px]:hidden"
            style={{
              /* Height covers the rotated bbox (391*sin(6.69deg) +
                 250*cos(6.69deg) = 293.4px => 0.7519 x cardW), else the
                 corners clip. */
              height: `calc(min(78vw, 520px) * 0.7519 + 64px)`,
              marginTop: `${SPEC.h1Gap}px`,
              scrollSnapType: 'x mandatory',
            }}
          >
            {/* iOS needs a user gesture before DeviceOrientationEvent works. */}
            {tiltPrompt ? (
              <button
                type="button"
                className="hero-tilt-me"
                onClick={requestTilt}
                aria-label="Enable tilt motion"
              >
                Tilt me
              </button>
            ) : null}
            <div className="flex h-full items-center">
              {SPEC.deck.cards.map((card, i) => (
                <div
                  key={card.id}
                  data-hero-mobile-tilt
                  className="hero-mobile-tilt"
                  style={{
                    flex: 'none',
                    width: 'min(78vw, 520px)',
                    height: `calc(min(78vw, 520px) * ${SPEC.deck.cardH} / ${SPEC.deck.cardW})`,
                    scrollSnapAlign: 'center',
                    marginLeft: i === 0 ? 'calc(0.14 * min(78vw, 520px))' : 'calc(-0.12 * min(78vw, 520px))',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    data-hero-mobile-card={card.id}
                    className="relative"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      border: '1px solid var(--ink)',
                      borderRadius: 'var(--r-card)',
                      transform: `rotate(${card.rot}deg)`,
                      background: CHECKER_BG,
                    }}
                  >
                    {(() => {
                      const cover = coverFor(card.id);
                      if (!cover) return null;
                      return (
                        <img
                          data-diff-ignore
                          src={cover.src}
                          srcSet={cover.sources.find((source) => source.type === 'image/webp')?.srcSet}
                          sizes="(max-width: 767px) 78vw, 392px"
                          alt=""
                          width={cover.width}
                          height={cover.height}
                          loading="eager"
                          fetchPriority="high"
                          decoding="sync"
                          draggable={false}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: 'var(--r-card)',
                          }}
                        />
                      );
                    })()}
                    <button
                      type="button"
                      aria-label={`View project: ${
                        PROJECTS.get(card.id)?.title ?? card.id
                      }`}
                      onClick={(event) =>
                        openCard(card.id, event.currentTarget, event.currentTarget)
                      }
                      className="media-trigger"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 6,
                        padding: 0,
                        border: 0,
                        borderRadius: 'var(--r-card)',
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4.1 Paragraph: three centered lines */}
          <p
            ref={paraRef}
            className="w-full text-center font-outfit text-ink text-[18px] leading-[26px] tracking-[-0.02em] md:max-w-[924px] md:text-[26px] md:leading-[36px]"
            style={{ marginTop: `${SPEC.paraGap}px` }}
          >
            I’m Lois, a brand and visual designer turning good ideas into
            thoughtful identities, useful visuals and brands people remember.
            Strategy brain, design eyes. Very serious about the details.
          </p>

          {/* 4.1 Button at x=643, y=743.9 (centered on the 736 column center) */}
          <div
            ref={buttonRef}
            className="flex w-full justify-center"
            style={{ marginTop: `${SPEC.btnGap}px` }}
          >
            <Button
              label="See what I do"
              arrow="up-right"
              fill={SPEC.btn.fill}
              href="#work"
              className="max-w-[320px] max-md:w-full"
              aria-label="See what I do"
            />
          </div>
        </div>
      </div>

      {openProject ? (
        <Suspense fallback={null}>
          <ProjectOverlay
            project={openProject.project}
            source={openProject.source}
            returnFocus={openProject.trigger}
            onClose={() => setOpenProject(null)}
          />
        </Suspense>
      ) : null}
    </section>
  );
}
