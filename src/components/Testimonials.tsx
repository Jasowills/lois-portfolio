// Testimonials (DESIGN_SPEC 9, 12, 13): now rendering the old portfolio's
// "My Digital Toolkit" section while retaining the original cream-white
// bordered section frame and motion language.
//
// Motion (MOTION_SPEC 9, DOM version) is layered so each transform has one
// owner:
//   card          entrance y + opposite tilt, settle to 0
//   tilt wrapper  pointer 3D tilt (+/-5deg) via Motion springs
//   inner         resting border/radius/overflow, no transforms
//   title         pop and wobble as its card enters
//   text words    SplitText reveal when the card settles
//   highlight     hand-drawn swipe behind the toolkit label (scaleX 0 to 1)
// The label slaps in like the Work/About stickers and the H2 mask-rises via
// the page-wide TextSystem. Static and reduced motion omit every layer, so
// the replaced section keeps the same static render behaviour.

import { useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import data from '../data/testimonials.json';
import { EASE } from '../motion/ease';
import { gsap, SplitText } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import { useStaticMode } from '../motion/useStaticMode';
import { useTilt } from '../motion/useTilt';
import { SectionEdge } from './SectionEdge';
import { StickerLabel } from './ui/StickerLabel';

const SPEC = {
  sticker: { top: '76px', left: '72px', w: '180px', h: '36px', rotate: 3.96 },
} as const;

/* MOTION_SPEC 9 values. */
const MOTION = {
  sticker: {
    scale: 2,
    rotation: -20,
    rest: 0, // the base wrapper owns the +3.96 rest angle
    shadow: '4px 4px 0 var(--shadow-paper)',
    none: '0px 0px 0 var(--shadow-paper)',
  },
  card: {
    y: 90,
    tilt: 3,
    stagger: 0.12,
    start: 'top 75%',
  },
  words: {
    fromOpacity: 0.18,
    stagger: 0.035,
    duration: 0.3,
  },
  highlight: { duration: 0.5 },
} as const;

type ToolMark = { name: string; slug: string | null };

type CardProps = {
  title: string;
  logos: ToolMark[];
  text: string;
  cardRef: (element: HTMLDivElement | null) => void;
  titleRef: (element: HTMLHeadingElement | null) => void;
  textRef: (element: HTMLParagraphElement | null) => void;
  logosRef: (element: HTMLDivElement | null) => void;
};

/**
 * One toolkit card. The pointer tilt is a Motion spring owned by the tilt
 * wrapper; the GSAP entrance owns the frame's y and rotation, so the two
 * never write the same property. Static and reduced motion keep the rest
 * state without any transform.
 */
function TestimonialCard({ title, logos, text, cardRef, titleRef, textRef, logosRef }: CardProps) {
  // Static and reduced motion get no transform at all: a perspective() the
  // browser never uses still pushes the text onto a compositor layer and
  // shifts the anti-aliasing against the reference raster.
  const { reducedMotion } = useMotion();
  const tilt = useTilt({ max: 5, scale: 1, stiffness: 180, damping: 18 });
  const tiltStyle = reducedMotion
    ? { position: 'absolute' as const, inset: 0 }
    : {
        position: 'absolute' as const,
        inset: 0,
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        scale: tilt.scale,
        transformPerspective: 1200,
      };

  return (
    <div
      ref={cardRef}
      className="tcard"
      style={{ position: 'relative', width: '100%', height: 'auto' }}
    >
      <motion.div
        className="tcard-tilt"
        style={tiltStyle}
        onPointerMove={reducedMotion ? undefined : tilt.onPointerMove}
        onPointerLeave={reducedMotion ? undefined : tilt.onPointerLeave}
      >
        <div
          className="tcard-inner"
          style={{
            position: 'relative',
            background: 'var(--blue)',
            borderRadius: '36.5px',
            overflow: 'hidden',
            padding: '32px 32px 40px',
          }}
        >
          <div
            ref={logosRef}
            className="toolkit-logos"
            role="list"
            aria-label={`Tools for ${title}`}
            style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px' }}
          >
            {logos.map((tool) => (
              <span
                key={tool.name}
                role="listitem"
                className="toolkit-chip"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--cream-white)',
                  border: '1px solid var(--ink)',
                  borderRadius: '999px',
                  padding: '5px 10px 5px 7px',
                  fontFamily: 'var(--ff-outfit)',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '-0.01em',
                  color: 'var(--ink-strong)',
                  whiteSpace: 'nowrap',
                }}
              >
                {tool.slug ? (
                  <img
                    src={`/images/toolkit/${tool.slug}.svg`}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{ width: '16px', height: '16px', display: 'block', flexShrink: 0 }}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      background: 'var(--cream-white)',
                      border: '1px solid var(--ink)',
                      fontSize: '8px',
                      fontWeight: 700,
                      lineHeight: '16px',
                      color: 'var(--ink-strong)',
                      flexShrink: 0,
                    }}
                  >
                    {tool.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {tool.name}
              </span>
            ))}
          </div>

          <h3
            ref={titleRef}
            className="toolkit-title"
            style={{
              position: 'relative',
              marginTop: '20px',
              fontFamily: 'var(--ff-ink)',
              fontWeight: 600,
              fontSize: '28px',
              lineHeight: '32px',
              letterSpacing: '-0.02em',
              color: 'var(--heading)',
            }}
          >
            {title}
          </h3>

          <p
            ref={textRef}
            className="toolkit-desc"
            style={{
              position: 'relative',
              marginTop: '16px',
              fontFamily: 'var(--ff-outfit)',
              fontWeight: 400,
              fontSize: '24px',
              lineHeight: '32px',
              letterSpacing: '-0.02em',
              color: 'var(--body)',
            }}
          >
            {text}
          </p>

          {/* Card stroke overlay (painted over children, no content offset). */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid var(--ink)',
              borderRadius: '36.5px',
              pointerEvents: 'none',
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function Testimonials() {
  const staticMode = useStaticMode();
  const { reducedMotion } = useMotion();
  const active = !staticMode && !reducedMotion;

  const sectionRef = useRef<HTMLElement>(null);
  const stickerWrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const titleRefs = useRef<Array<HTMLHeadingElement | null>>([]);
  const textRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const logosRefs = useRef<Array<HTMLDivElement | null>>([]);

  const cards = data.cards.map((card, i) => ({
    key: i,
    title: card.title,
    logos: card.tools as ToolMark[],
    text: card.text,
  }));

  useLayoutEffect(() => {
    if (!active) return;

    const section = sectionRef.current;
    const stickerWrap = stickerWrapRef.current;
    const sticker = stickerWrap?.querySelector<HTMLElement>('[data-tsticker-slap]') ?? null;
    const cardEls = cardRefs.current;
    const titles = titleRefs.current;
    const texts = textRefs.current;
    const logos = logosRefs.current;
    if (!section) return;

    const tweens: gsap.core.Animation[] = [];
    const timelines: gsap.core.Timeline[] = [];
    const splits: SplitText[] = [];

    // 9 label: the sticker slaps in, same language as the Work/About sticker.
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
      timelines.push(slap);
    }

    // Cards enter from below with opposite tilts that settle to 0, then
    // their text typesets in and the toolkit highlight swipes in.
    const cardsTimeline = gsap.timeline({
      scrollTrigger: { trigger: section, start: MOTION.card.start, once: true },
    });
    timelines.push(cardsTimeline);

    cardEls.forEach((card, index) => {
      const title = titles[index];
      const text = texts[index];
      const logoRow = logos[index];
      if (!card) return;

      const cardTimeline = gsap.timeline();
      cardsTimeline.add(cardTimeline, index * MOTION.card.stagger);
      cardTimeline.fromTo(
        card,
        { y: MOTION.card.y, rotation: index === 0 ? -MOTION.card.tilt : MOTION.card.tilt },
        { y: 0, rotation: 0, duration: 1.0, ease: EASE.glide },
      );

      if (logoRow) {
        cardTimeline.fromTo(
          logoRow,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.5, ease: EASE.pop },
          '-=0.7',
        );
      }

      if (title) {
        cardTimeline.fromTo(
          title,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: EASE.pop },
          '-=0.35',
        );
      }

      if (text) {
        const split = SplitText.create(text, { type: 'words', aria: 'auto' });
        splits.push(split);
        cardTimeline.fromTo(
          split.words,
          { opacity: MOTION.words.fromOpacity },
          { opacity: 1, stagger: MOTION.words.stagger, duration: MOTION.words.duration, ease: 'power1.out' },
          '-=0.45',
        );
      }
    });

    return () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      for (const timeline of timelines) {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      }
      for (const split of splits) {
        split.revert();
        split.kill();
      }
      for (const card of cardEls) if (card) gsap.set(card, { clearProps: 'transform' });
      for (const title of titles) if (title) gsap.set(title, { clearProps: 'transform,opacity' });
      for (const logoRow of logos) if (logoRow) gsap.set(logoRow, { clearProps: 'transform,opacity' });
      if (stickerWrap) gsap.set(stickerWrap, { clearProps: 'transform,opacity' });
      if (sticker) gsap.set(sticker, { clearProps: 'transform,boxShadow' });
    };
  }, [active]);

  return (
    <section
      data-section="testimonials"
      id="testimonials"
      aria-label="My Digital Toolkit"
      ref={sectionRef}
      className="testimonials-section testimonials-toolkit relative w-full bg-cream-white border-y border-ink"
      style={{ height: 'auto' }}
    >
      <SectionEdge variant="tear" from="var(--yellow)" />
      <div className="testimonials-inner" style={{ position: 'relative', padding: '76px 72px 64px', maxWidth: '1440px', marginInline: 'auto' }}>
        <div ref={stickerWrapRef} className="tsticker" data-depth="0.4" style={{ width: SPEC.sticker.w, height: SPEC.sticker.h }}>
          <div className="sticker-base" style={{ transform: `rotate(${SPEC.sticker.rotate}deg)`, transformOrigin: 'center center' }}>
            <div data-tsticker-slap className="tsticker-slap">
              <StickerLabel label={data.label} fill="var(--lime)" />
            </div>
          </div>
        </div>

        <h2
          data-skew
          data-split="lines"
          className="th2"
          style={{
            position: 'static',
            width: '100%',
            maxWidth: '652px',
            marginTop: '34px',
            fontFamily: 'var(--ff-ink)',
            fontWeight: 600,
            fontSize: '45px',
            lineHeight: '50px',
            letterSpacing: '-0.03em',
            color: 'var(--heading)',
          }}
        >
          {data.heading}
        </h2>

        <div className="tcards toolkit-grid" data-skew>
          {cards.map((c, index) => (
            <TestimonialCard
              key={c.key}
              title={c.title}
              logos={c.logos}
              text={c.text}
              cardRef={(element) => {
                cardRefs.current[index] = element;
              }}
              titleRef={(element) => {
                titleRefs.current[index] = element;
              }}
              textRef={(element) => {
                textRefs.current[index] = element;
              }}
              logosRef={(element) => {
                logosRefs.current[index] = element;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
