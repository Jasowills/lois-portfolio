// Selected work (DESIGN_SPEC 5.1-5.6, 12, 13): plaid section with the six
// verbatim project cards in two columns of 644px, then the orange archive
// button. Card covers are ordinary DOM images from the old portfolio when a
// cover has shipped (OPEN_QUESTIONS 19); placeholders stay flat until more
// covers are supplied, matching the Reference export where needed.
//
// Motion (MOTION_SPEC 5.1-5.3, 5.5) lives in nested wrappers so every
// transform has one owner:
//   reveal   scroll scrub: scale, rotateX, rotateY, y, opacity
//   tilt     hover pointer tilt (rotationX / rotationY)
//   lift     hover y lift
//   image    scroll parallax scale and yPercent
//   zoom     hover image scale
//   clip     zigzag mask reveal
// The static render is untouched: all wrappers are transparent boxes, the
// image slot still shows its fallback, and static/reduced mode never
// runs any of the effects.
//
// Stroke geometry note (same as Hero, OPEN_QUESTIONS 30): Figma strokes are
// centered on the outline, and a parent element's border paints BELOW its
// children, so the card's 1px black stroke is a transparent child painted on
// top of everything via absolute positioning instead of a `border` on the
// article itself.
//
// Card interaction (MOTION_SPEC 4.4, 5.3): the title button owns a stretched
// pseudo over the whole card, so a card click opens the shared project
// overlay. The "View Project" pill is a second, visible trigger for the same
// action; it peels in on hover, focus or (touch) when the card crosses the
// middle of the viewport.

import {
  lazy,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import projectsJson from '../data/projects.json';
import { Button } from './ui/Button';
import { StickerLabel } from './ui/StickerLabel';
import { SectionEdge } from './SectionEdge';
import { Verified } from './svg/Verified';
import type { Project } from './Overlay';
import { EASE } from '../motion/ease';
import { gsap, ScrollTrigger, SplitText } from '../motion/gsap';
import { useMediaQuery } from '../motion/useMediaQuery';
import { useMotion } from '../motion/useMotion';

// MOTION_SPEC 13 asks for the overlay to stay out of the initial bundle.
const ProjectOverlay = lazy(() =>
  import('./Overlay').then((module) => ({ default: module.ProjectOverlay })),
);

const SPEC = {
  padTop: '76px', // 5.2: sticker label at y=76
  padBottom: '64px',
  gapLabelToH2: '37.9px', // 5.2: H2 top y=149.9 minus label bottom y=112
  cardGap: '24px', // 5.3 grid gap; card-internal vertical gap
  imgAspect: '644 / 356' as const, // 5.4 (12 mobile keeps the ratio)
  radius: 'var(--r-card)',
} as const;

/* MOTION_SPEC 5.1-5.3, 5.5 values. */
const MOTION = {
  sticker: {
    scale: 2,
    rotation: -20,
    rest: 2.81,
    shadow: `4px 4px 0 var(--shadow-paper)`,
    none: '0px 0px 0 var(--shadow-paper)',
  },
  reveal: {
    scale: 0.86,
    rotateX: 14,
    rotateY: 6,
    y: 120,
    yTouch: 60,
    perspective: 1200,
    start: 'top 95%',
    end: 'top 45%',
    staggerOffset: 45, // px later start for the right card in each row
  },
  mask: { duration: 0.9, teeth: 12, tooth: 1.6 },
  image: { scale: 1.35, fromY: -8, toY: 8 },
  hover: {
    lift: -8,
    tilt: 4,
    perspective: 900,
    glare: 0.12,
    imageScale: 1.06,
    wave: 3,
    waveStagger: 0.04,
  },
  tags: { scale: 0.6, stagger: 0.07 },
  year: { from: 2020, duration: 0.6 },
  archive: { drop: 80, bob: 3, cycle: 2.5 },
} as const;

/* Title type per 5.5 (verbatim table). */
function titleStyle(font: string): CSSProperties {
  if (font === 'Blauer Nue 700') return { fontFamily: 'var(--ff-ink)', fontWeight: 700 };
  if (font === 'Blauer Nue 600') return { fontFamily: 'var(--ff-ink)', fontWeight: 600 };
  return { fontFamily: 'var(--ff-outfit)', fontWeight: 400 }; // Outfit 400
}

const imageWidth = (url: string) => {
  const match = /-(\d+)\.(?:avif|webp)$/.exec(url);
  return Number(match?.[1] ?? 1024);
};

const buildSrcSet = (urls: string[]) =>
  urls.map((url) => `${url} ${imageWidth(url)}w`).join(', ');

const coverFor = (image: Project['images'][number]) => {
  if ('placeholder' in image && image.placeholder === true) return null;
  return {
    sources: [
      { type: 'image/avif', srcSet: buildSrcSet(image.avif) },
      { type: 'image/webp', srcSet: buildSrcSet(image.webp) },
    ],
    src: image.webp[image.webp.length - 1] ?? '',
    alt: image.alt,
    width: image.width,
    height: image.height,
  };
};

// Per-card heights, verbatim from DESIGN_SPEC 5.5 (they include ~2px of
// hand-set breathing room on D and E); applied only at 900px and wider.
const CARD_MIN_H = ['674px', '642px', '674px', '676px', '644px', '642px'] as const; // A-F

/** A polygon that reveals the image from the bottom up with a zigzag cut. */
function cutClip(progress: number): string {
  const base = 100 - progress * 100;
  const points = ['0% 100%', `0% ${base}%`];
  for (let i = 1; i < MOTION.mask.teeth; i += 1) {
    const x = (i / MOTION.mask.teeth) * 100;
    const y = base + (i % 2 === 0 ? 0 : MOTION.mask.tooth);
    points.push(`${x}% ${y}%`);
  }
  points.push(`100% ${base}%`, '100% 100%');
  return `polygon(${points.join(', ')})`;
}

function WorkCard({
  project,
  cardMinH,
  index,
  onOpen,
}: {
  project: Project;
  cardMinH: string;
  index: number;
  onOpen: (project: Project, source: HTMLElement, trigger: HTMLElement) => void;
}) {
  const { quality, reducedMotion } = useMotion();
  const touch = useMediaQuery('(pointer: coarse)');
  const active = !reducedMotion;
  const elaborate = active && quality !== 'low';

  const revealRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const liftRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const imageSlotRef = useRef<HTMLDivElement>(null);
  const imageClipRef = useRef<HTMLDivElement>(null);
  const imageScrollRef = useRef<HTMLDivElement>(null);
  const imageZoomRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const stitchRef = useRef<SVGRectElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const tagsRef = useRef<HTMLUListElement>(null);

  const open = (trigger: HTMLElement) => {
    if (!imageSlotRef.current) return;
    onOpen(project, imageSlotRef.current, trigger);
  };

  useLayoutEffect(() => {
    if (!active) return;
    const reveal = revealRef.current;
    const tilt = tiltRef.current;
    const lift = liftRef.current;
    const article = articleRef.current;
    const clip = imageClipRef.current;
    const image = imageScrollRef.current;
    const zoom = imageZoomRef.current;
    const glare = glareRef.current;
    const stitch = stitchRef.current;
    const title = titleRef.current;
    const year = yearRef.current;
    const desc = descRef.current;
    const tags = tagsRef.current;
    if (!reveal || !tilt || !lift || !article || !clip || !image || !zoom) return;

    const tweens: gsap.core.Animation[] = [];
    const triggers: ScrollTrigger[] = [];
    const splits: SplitText[] = [];
    const listeners: Array<() => void> = [];

    // 5.2 card unfold. Mirrored tilt + a small stagger between columns.
    const mirror = index % 2 === 0 ? -1 : 1;
    const start =
      index % 2 === 0
        ? touch
          ? 'top 90%'
          : MOTION.reveal.start
        : `top ${touch ? 90 : 95}%+=${MOTION.reveal.staggerOffset}`;
    tweens.push(
      gsap.fromTo(
        reveal,
        {
          scale: elaborate ? MOTION.reveal.scale : 0.96,
          rotationX: elaborate ? MOTION.reveal.rotateX : 0,
          rotationY: elaborate ? MOTION.reveal.rotateY * mirror : 0,
          y: touch ? MOTION.reveal.yTouch : MOTION.reveal.y,
          opacity: 0,
          transformPerspective: MOTION.reveal.perspective,
          transformOrigin: '50% 100%',
        },
        {
          scale: 1,
          rotationX: 0,
          rotationY: 0,
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: reveal,
            start,
            end: touch ? 'top 55%' : MOTION.reveal.end,
            scrub: true,
          },
        },
      ),
    );

    // 5.2 image window: deeper than its frame while the card traverses.
    tweens.push(
      gsap.fromTo(
        image,
        { scale: MOTION.image.scale, yPercent: MOTION.image.fromY },
        {
          scale: 1,
          yPercent: MOTION.image.toY,
          ease: 'none',
          scrollTrigger: {
            trigger: reveal,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      ),
    );

    // 5.2 zigzag mask; one shot, 0.9s.
    const cut = { progress: 0 };
    const applyCut = () => {
      clip.style.clipPath = cutClip(cut.progress);
    };
    applyCut();
    const maskTween = gsap.to(cut, {
      progress: 1,
      duration: MOTION.mask.duration,
      ease: EASE.glide,
      paused: true,
      onUpdate: applyCut,
      onComplete: () => {
        clip.style.clipPath = 'none';
      },
    });
    const maskTrigger = ScrollTrigger.create({
      trigger: reveal,
      start: 'top 82%',
      once: true,
      onEnter: () => maskTween.play(),
    });
    tweens.push(maskTween);
    triggers.push(maskTrigger);

    // 5.2 title, year, description and tags in sequence.
    let titleSplit: SplitText | null = null;
    let descSplit: SplitText | null = null;
    if (title) {
      titleSplit = SplitText.create(title, {
        type: 'lines',
        mask: 'lines',
        autoSplit: false,
        aria: 'auto',
      });
      splits.push(titleSplit);
    }
    if (desc) {
      descSplit = SplitText.create(desc, {
        type: 'lines',
        mask: 'lines',
        autoSplit: false,
        aria: 'auto',
      });
      splits.push(descSplit);
    }

    const tagItems = tags
      ? Array.from(tags.querySelectorAll<HTMLElement>('[data-work-tag]'))
      : [];
    const checks = tags
      ? Array.from(tags.querySelectorAll<SVGElement>('[data-work-check]'))
      : [];
    const yearText = year?.textContent ?? String(project.year);
    const counter = { value: MOTION.year.from };
    const sequence = gsap.timeline({
      paused: true,
      defaults: { ease: EASE.glide },
    });
    if (titleSplit?.lines.length) {
      sequence.from(
        titleSplit.lines,
        { yPercent: 110, rotation: 4, duration: 0.7, stagger: 0.06 },
        0,
      );
    }
    if (year) {
      sequence.from(year, { opacity: 0, y: 8, duration: 0.4 }, 0.1);
      sequence.to(
        counter,
        {
          value: project.year,
          duration: MOTION.year.duration,
          snap: { value: 1 },
          ease: 'power1.out',
          onUpdate: () => {
            year.textContent = String(Math.round(counter.value));
          },
          onComplete: () => {
            year.textContent = yearText;
          },
        },
        0.1,
      );
    }
    if (descSplit?.lines.length) {
      sequence.from(
        descSplit.lines,
        { yPercent: 110, opacity: 0, duration: 0.6, stagger: 0.05 },
        0.18,
      );
    }
    if (tagItems.length) {
      sequence.from(
        tagItems,
        {
          scale: MOTION.tags.scale,
          opacity: 0,
          duration: 0.45,
          stagger: MOTION.tags.stagger,
          ease: EASE.pop,
        },
        0.3,
      );
    }
    if (checks.length) {
      sequence.from(
        checks,
        {
          scale: 0.4,
          rotation: -80,
          opacity: 0,
          duration: 0.35,
          stagger: MOTION.tags.stagger,
          ease: EASE.pop,
        },
        0.32,
      );
    }
    const sequenceTrigger = ScrollTrigger.create({
      trigger: reveal,
      start: 'top 72%',
      once: true,
      onEnter: () => sequence.play(),
    });
    triggers.push(sequenceTrigger);

    // 5.3 hover. Only fine pointers; touch gets the in-view state below.
    let hovered = false;
    let tiltX: ((value: number) => void) | null = null;
    let tiltY: ((value: number) => void) | null = null;
    const drawStitch = () => {
      if (!stitch) return;
      gsap.killTweensOf(stitch);
      gsap.set(stitch, { opacity: 1 });
      gsap.to(stitch, {
        strokeDashoffset: 0,
        duration: 0.7,
        ease: EASE.glide,
        overwrite: true,
      });
    };
    const hideStitch = () => {
      if (!stitch) return;
      const length = stitch.getTotalLength();
      gsap.killTweensOf(stitch);
      gsap.to(stitch, {
        strokeDashoffset: length,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        overwrite: true,
      });
    };
    const waveTags = () => {
      if (!tagItems.length) return;
      gsap.fromTo(
        tagItems,
        { y: -MOTION.hover.wave },
        {
          y: 0,
          duration: 0.35,
          stagger: MOTION.hover.waveStagger,
          ease: EASE.glide,
          overwrite: true,
        },
      );
    };
    const enterHover = () => {
      if (touch || hovered) return;
      hovered = true;
      gsap.to(lift, {
        y: MOTION.hover.lift,
        duration: 0.35,
        ease: EASE.glide,
        overwrite: true,
      });
      const shadow = lift.querySelector<HTMLElement>('[data-work-shadow]');
      if (shadow) {
        gsap.to(shadow, { opacity: 1, duration: 0.3, overwrite: true });
      }
      gsap.to(glare, { opacity: MOTION.hover.glare, duration: 0.3, overwrite: true });
      gsap.to(zoom, {
        scale: MOTION.hover.imageScale,
        duration: 1.1,
        ease: 'power2.out',
        overwrite: true,
      });
      drawStitch();
      waveTags();
    };
    const leaveHover = () => {
      if (!hovered) return;
      hovered = false;
      tiltX?.(0);
      tiltY?.(0);
      gsap.to(lift, {
        y: 0,
        duration: 0.4,
        ease: EASE.glide,
        overwrite: true,
      });
      const shadow = lift.querySelector<HTMLElement>('[data-work-shadow]');
      if (shadow) {
        gsap.to(shadow, { opacity: 0, duration: 0.3, overwrite: true });
      }
      gsap.to(glare, { opacity: 0, duration: 0.3, overwrite: true });
      gsap.to(zoom, { scale: 1, duration: 0.6, overwrite: true });
      hideStitch();
    };

    if (!touch) {
      gsap.set(tilt, { transformPerspective: MOTION.hover.perspective });
      tiltX = gsap.quickTo(tilt, 'rotationX', {
        duration: 0.5,
        ease: EASE.glide,
      });
      tiltY = gsap.quickTo(tilt, 'rotationY', {
        duration: 0.5,
        ease: EASE.glide,
      });
      const onMove = (event: PointerEvent) => {
        const rect = lift.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        // Low tier keeps the lift, outline and zoom but skips the 3D tilt.
        if (elaborate) {
          tiltY?.(nx * MOTION.hover.tilt);
          tiltX?.(ny * -MOTION.hover.tilt);
        }
        if (glare) {
          glare.style.backgroundPosition = `${50 + nx * 28}% ${50 + ny * 28}%`;
        }
      };
      const onEnter = () => enterHover();
      const onLeave = () => leaveHover();
      tilt.addEventListener('pointerenter', onEnter);
      tilt.addEventListener('pointerleave', onLeave);
      tilt.addEventListener('pointermove', onMove);
      listeners.push(() => {
        tilt.removeEventListener('pointerenter', onEnter);
        tilt.removeEventListener('pointerleave', onLeave);
        tilt.removeEventListener('pointermove', onMove);
      });
    }

    // 12 touch: hover states fire while the card is in the middle 40%.
    if (touch) {
      const inView = ScrollTrigger.create({
        trigger: article,
        start: 'top 70%',
        end: 'bottom 30%',
        onToggle: (self) => {
          article.dataset.inview = self.isActive ? 'true' : 'false';
          if (self.isActive) {
            drawStitch();
            gsap.to(zoom, { scale: MOTION.hover.imageScale, duration: 0.8, overwrite: true });
          } else {
            hideStitch();
            gsap.to(zoom, { scale: 1, duration: 0.5, overwrite: true });
          }
        },
      });
      triggers.push(inView);
    }

    if (stitch) {
      const length = stitch.getTotalLength();
      stitch.style.strokeDasharray = '1.55 1.24';
      stitch.style.strokeDashoffset = String(length);
      gsap.set(stitch, { opacity: 0 });
    }

    // A deep link or restored scroll can mount a card already past its
    // reveal triggers. Play those one-shot states instead of leaving the
    // image clipped or the copy staged.
    const settle = window.requestAnimationFrame(() => {
      const top = reveal.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.82) maskTween.play();
      if (top < window.innerHeight * 0.72) sequence.play();
    });

    return () => {
      window.cancelAnimationFrame(settle);
      for (const cleanup of listeners) cleanup();
      for (const trigger of triggers) trigger.kill();
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      sequence.scrollTrigger?.kill();
      sequence.kill();
      gsap.killTweensOf(lift);
      gsap.killTweensOf(zoom);
      gsap.killTweensOf(glare);
      for (const split of splits) {
        split.revert();
        split.kill();
      }
      if (year) year.textContent = yearText;
      if (stitch) gsap.killTweensOf(stitch);
      gsap.set(reveal, {
        clearProps: 'transform,opacity',
      });
      gsap.set(tilt, { clearProps: 'transform' });
      gsap.set(lift, { clearProps: 'transform' });
      gsap.set(zoom, { clearProps: 'transform' });
      if (clip) clip.style.clipPath = '';
      if (article) article.dataset.inview = 'false';
      if (stitch) gsap.set(stitch, { clearProps: 'opacity,strokeDashoffset' });
    };
  }, [active, elaborate, index, project.year, touch]);

  return (
    <div ref={revealRef} data-work-reveal className="relative">
      <div ref={tiltRef} className="relative">
        <div ref={liftRef} className="relative">
          <div
            aria-hidden="true"
            data-work-shadow
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'var(--ink)',
              borderRadius: SPEC.radius,
              opacity: 0,
              transform: 'translate(8px, 8px)',
            }}
          />
          <article
            ref={articleRef}
            data-accent={project.accent}
            data-work-card
            data-cursor="view"
            aria-label={project.title}
            className="group relative flex w-full flex-col items-stretch overflow-hidden min-[900px]:min-h-[var(--card-min-h)]"
            style={{
              background: 'var(--card)',
              borderRadius: SPEC.radius,
              rowGap: '48px', // 5.4: gap between image and body
              ['--card-min-h' as string]: cardMinH,
            }}
          >
            {/* Image slot: the gray placeholder sits behind the reveal clip. */}
            <div
              ref={imageSlotRef}
              className="relative w-full shrink-0 overflow-hidden"
              style={{
                aspectRatio: SPEC.imgAspect,
                background: 'var(--card)',
                borderRadius: '0 0 var(--r-card) var(--r-card)',
              }}
            >
              <div
                ref={imageClipRef}
                data-work-clip
                className="absolute inset-0"
                style={{
                  background: 'var(--image-placeholder)',
                  borderRadius: '0 0 var(--r-card) var(--r-card)',
                }}
              >
                <div ref={imageScrollRef} className="absolute inset-0 overflow-hidden">
                  <div
                    ref={imageZoomRef}
                    className="absolute inset-0"
                    style={{ background: 'var(--image-placeholder)' }}
                  >
                    {(() => {
                      const cover = coverFor(project.images[0]);
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
                            <source
                              key={source.type}
                              type={source.type}
                              srcSet={source.srcSet}
                              sizes="(max-width: 899px) 100vw, (min-width: 1440px) 644px, 446px"
                            />
                          ))}
                          <img
                            src={cover.src}
                            sizes="(max-width: 899px) 100vw, (min-width: 1440px) 644px, 446px"
                            alt={cover.alt}
                            width={cover.width}
                            height={cover.height}
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
                              borderRadius: '0 0 var(--r-card) var(--r-card)',
                            }}
                          />
                        </picture>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Peeling CTA: hidden at rest, revealed on hover, focus or in
                  view, always over the image so the card height never moves. */}
              <div
                data-work-cta
                className="absolute bottom-6 left-6 z-10 -translate-x-5 -rotate-[8deg] opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:rotate-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:rotate-0 group-focus-within:opacity-100 group-data-[inview=true]:translate-x-0 group-data-[inview=true]:rotate-0 group-data-[inview=true]:opacity-100 motion-reduce:transition-none"
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <Button
                  label="View Project"
                  arrow="up-right"
                  strong
                  fill="var(--orange-cta)"
                  onClick={(event: ReactMouseEvent<HTMLButtonElement>) =>
                    open(event.currentTarget)
                  }
                  data-cursor="link"
                  aria-label={`View project: ${project.title}`}
                />
              </div>
            </div>

            {/* Body */}
            <div
              className="flex flex-col px-5 pb-6 min-[900px]:px-10 min-[900px]:pb-10"
              style={{ gap: SPEC.cardGap }}
            >
              {/* Title row: title 502 wide at (0,0), year right-aligned at x=526 on xl */}
              <div className="relative top-[2px] flex h-[38px] items-center justify-between gap-4">
                <h3
                  className="w-full font-ink text-ink text-[26px] min-[900px]:text-[32px]"
                  style={{ ...titleStyle(project.titleFont), lineHeight: '38px', letterSpacing: '-0.03em' }}
                >
                  <button
                    ref={titleRef}
                    type="button"
                    aria-label={project.title}
                    onClick={(event) => open(event.currentTarget)}
                    className="block w-full text-left after:absolute after:inset-0 after:content-['']"
                  >
                    {project.title}
                  </button>
                </h3>
                <span
                  ref={yearRef}
                  data-work-year
                  className="font-outfit text-[16px] leading-[20px] text-muted xl:absolute xl:left-[526px] xl:top-[9.5px] xl:w-[38px] xl:text-right"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {project.year}
                </span>
              </div>

              {/* Description */}
              <p
                ref={descRef}
                className="relative top-[2px] font-outfit text-[18px] leading-[26px] text-[var(--ink-soft)] min-[900px]:text-[22px] min-[900px]:leading-[32px]"
                style={{ letterSpacing: '-0.01em' }}
              >
                {project.description}
              </p>

              {/* Tags */}
              <ul ref={tagsRef} aria-label="Tags" className="flex flex-wrap gap-4 min-[1440px]:flex-nowrap">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    data-work-tag
                    className="flex h-[48px] shrink-0 items-center gap-[6px] whitespace-nowrap rounded-[32px] bg-tag-pink px-3 font-outfit text-[16px] leading-5 text-sub"
                    style={{ letterSpacing: '0.01em' }}
                  >
                    <Verified data-work-check />
                    <span>{tag}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 5.3 glare, shallow diagonal white sheen at 12% opacity. */}
            <div
              ref={glareRef}
              aria-hidden="true"
              data-work-glare
              className="pointer-events-none absolute inset-0"
              style={{
                zIndex: 1,
                opacity: 0,
                borderRadius: SPEC.radius,
                background:
                  'linear-gradient(115deg, transparent 20%, var(--glare) 50%, transparent 80%)',
                backgroundSize: '200% 200%',
                backgroundPosition: '50% 50%',
              }}
            />

            {/* Border overlay: 1px stroke inside the box, painted over children */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ border: '1px solid var(--ink)', borderRadius: SPEC.radius, zIndex: 2 }}
            />

            {/* 5.3 stitched outline, drawn on hover or in view. */}
            {active ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
                style={{ zIndex: 3, overflow: 'visible' }}
              >
                <rect
                  ref={stitchRef}
                  x="0.5"
                  y="0.5"
                  width="99"
                  height="99"
                  rx="5.5"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="0.3"
                />
              </svg>
            ) : null}
          </article>
        </div>
      </div>
    </div>
  );
}

export function Work() {
  const projects = projectsJson.projects;
  const { reducedMotion } = useMotion();
  const active = !reducedMotion;
  const [openProject, setOpenProject] = useState<{
    project: Project;
    source: HTMLElement;
    trigger: HTMLElement;
  } | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const bloomARef = useRef<HTMLDivElement>(null);
  const bloomBRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!active) return;
    const section = sectionRef.current;
    const stickerWrap = stickerRef.current;
    const grid = gridRef.current;
    if (!section || !stickerWrap || !grid) return;

    const sticker = stickerWrap.firstElementChild as HTMLElement | null;
    const blooms = [bloomARef.current, bloomBRef.current].filter(
      (layer): layer is HTMLDivElement => layer !== null,
    );
    const triggers: ScrollTrigger[] = [];
    const tweens: gsap.core.Animation[] = [];
    let front = 0;

    const setBloom = (color: string) => {
      if (blooms.length < 2) return;
      const next = front ^ 1;
      const layer = blooms[next];
      const previous = blooms[front];
      layer.style.backgroundImage = `radial-gradient(circle at 50% 40%, ${color} 0%, transparent 62%)`;
      tweens.push(
        gsap.to(layer, { opacity: 0.35, duration: 0.6, overwrite: true }),
        gsap.to(previous, { opacity: 0, duration: 0.6, overwrite: true }),
      );
      front = next;
    };

    // 5.1 sticker slap.
    if (sticker) {
      const slap = gsap.timeline({
        scrollTrigger: {
          trigger: stickerWrap,
          start: 'top 80%',
          once: true,
        },
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
          {
            rotation: MOTION.sticker.rotation,
            boxShadow: MOTION.sticker.shadow,
          },
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

    const cards = Array.from(
      grid.querySelectorAll<HTMLElement>('[data-work-card]'),
    );
    const rowTriggers: ScrollTrigger[] = [];
    [0, 2, 4].forEach((index) => {
      const card = cards[index];
      if (!card) return;
      const color = card.dataset.accent;
      if (!color) return;
      rowTriggers.push(
        ScrollTrigger.create({
          trigger: card,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => setBloom(color),
          onEnterBack: () => setBloom(color),
        }),
      );
    });
    triggers.push(...rowTriggers);

    const gridLeave = ScrollTrigger.create({
      trigger: grid,
      start: 'top center',
      end: 'bottom center',
      onLeave: () => {
        for (const layer of blooms) {
          gsap.to(layer, { opacity: 0, duration: 0.5, overwrite: true });
        }
      },
      onLeaveBack: () => {
        for (const layer of blooms) {
          gsap.to(layer, { opacity: 0, duration: 0.5, overwrite: true });
        }
      },
    });
    triggers.push(gridLeave);

    return () => {
      for (const trigger of triggers) trigger.kill();
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      if (sticker) gsap.set(sticker, { clearProps: 'transform,boxShadow' });
      if (stickerWrap) gsap.set(stickerWrap, { clearProps: 'transform,opacity' });
      for (const layer of blooms) {
        gsap.killTweensOf(layer);
        gsap.set(layer, { clearProps: 'opacity,backgroundImage' });
      }
    };
  }, [active]);

  return (
    <section
      ref={sectionRef}
      id="work"
      data-section="work"
      aria-label="Selected work"
      className="work-section relative w-full border-y border-ink px-5 pb-16 pt-[76px] min-[900px]:px-16 min-[1440px]:h-[2572px]"
      style={{
        backgroundColor: 'var(--lav-work)',
        backgroundImage:
          'repeating-linear-gradient(0deg, var(--work-plaid) 0px, var(--work-plaid) 96px, transparent 96px, transparent 174px),' +
          'repeating-linear-gradient(90deg, var(--work-plaid) 0px, var(--work-plaid) 90px, transparent 90px, transparent 165px)',
      }}
    >
      {/* 5.2 soft accent bloom, two layers crossfading behind the plaid cards. */}
      <div
        ref={bloomARef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 0, opacity: 0 }}
      />
      <div
        ref={bloomBRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 0, opacity: 0 }}
      />
      <SectionEdge variant="tear" from="var(--cream-hero)" />
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col items-center">
        <div ref={stickerRef} className="flex h-9 items-center">
          <StickerLabel
            label="Selected work"
            fill="var(--yellow)"
            rotate={2.81}
            className="flex h-9 items-center"
            data-depth="0.4"
          />
        </div>
        <h2
          data-skew
          data-split="lines"
          className="work-h2 relative top-[2px] mt-[34px] w-full max-w-[1055px] text-center font-ink font-semibold text-[28px] leading-[34px] text-[var(--ink-strong)] min-[900px]:text-[45px] min-[900px]:leading-[50px]"
          style={{ letterSpacing: '-0.03em' }}
        >
          A little bit of everything. Very much on purpose.
        </h2>
        <p
          data-split="words"
          className="work-subtitle relative top-[2px] mt-7 w-full max-w-[1003px] text-center font-outfit text-[18px] leading-[28px] text-sub min-[900px]:text-[24px] min-[900px]:leading-[30.24px]"
          style={{ letterSpacing: '-0.01em' }}
        >
          A selection of brand worlds, campaigns and digital work I've helped bring to life. Different briefs, different hats, same love for a good idea.
        </p>

        <div
          ref={gridRef}
          data-skew
          className="mt-[60px] grid w-full max-w-[1312px] grid-cols-1 items-start gap-6 min-[900px]:grid-cols-2"
        >
          {projects.map((project, index) => (
            <WorkCard
              key={project.id}
              project={project}
              cardMinH={CARD_MIN_H[index]}
              index={index}
              onOpen={(next, source, trigger) =>
                setOpenProject({ project: next, source, trigger })
              }
            />
          ))}
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
