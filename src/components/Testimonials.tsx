// Testimonials (DESIGN_SPEC 9, 12, 13): the cream-white bordered section with
// the "Kind words" sticker, the Blauer Nue H2 and the two quote cards.
//
// Static geometry is unchanged. Motion (MOTION_SPEC 9, DOM version) is layered
// so each transform has one owner:
//   card          absolute frame, entrance y + opposite tilt, settle to 0
//   tilt wrapper  pointer 3D tilt (+/-5deg) via Motion springs
//   inner         resting border/radius/overflow, no transforms
//   avatar        pop and wobble as its card enters
//   quote words   SplitText reveal when the card settles
//   highlight     hand-drawn swipe behind the attribution (scaleX 0 to 1)
// The label slaps in like the Work/About stickers and the H2 mask-rises via
// the page-wide TextSystem. Static and reduced motion omit every layer, so
// the DESIGN_SPEC render stays exact.
//
// Section (1440 x 819.4): bg #fffefe (bg-cream-white), 1px black border top and
// bottom (framed in App), padding 76px 72px 64px, content 1296 wide at x=72,
// left aligned. Sticker at (72, 76) rot +3.96, H2 box (72, 153.4) 652x100, two
// cards at y=313.4, each 618x442 at x=72 and x=750, bg #deedfa (var --blue),
// border 1px black, radius 36, padding 40px 32px.

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

const CHECKER_BG =
  'conic-gradient(var(--card-check-b) 0% 25%, var(--card-check-a) 25% 50%, var(--card-check-b) 50% 75%, var(--card-check-a) 75%) 0.5px 0.5px / 48px 48px';

// Exact Figma text for both cards (DESIGN_SPEC 9.3: build-as version, placeholder
// until real testimonials exist). Static mode renders this for the visual diff.
const FIGMA_QUOTE = "When I’m not designing, I’m probably sewing something cute, blasting K-pop or neo-soul (Olivia Dean supremacy 😭), or mentally redesigning every poster I walk past.";
const FIGMA_ATTRIBUTION = '-Alyssa, @femfounderstudio';

const SPEC = {
  sticker: { top: '76px', left: '72px', w: '137px', h: '36px', rotate: 3.96 },
  h2: { top: '153.4px', left: '72px', w: '652px', h: '100px' },
  card: { top: '312.9px', left: ['71.5px', '749.5px'], w: '619px', h: '443px' }, // center-stroked, see entry 30
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
  avatar: {
    fromScale: 0.55,
    wobble: [-5, 4, -2, 0] as const,
  },
  words: {
    fromOpacity: 0.18,
    stagger: 0.035,
    duration: 0.3,
  },
  highlight: { duration: 0.5 },
} as const;

type CardProps = {
  index: number;
  quote: string;
  attribution: string;
  cardRef: (element: HTMLDivElement | null) => void;
  avatarRef: (element: HTMLDivElement | null) => void;
  quoteRef: (element: HTMLParagraphElement | null) => void;
  highlightRef: (element: HTMLSpanElement | null) => void;
};

/**
 * One quote card. The pointer tilt is a Motion spring owned by the tilt
 * wrapper; the GSAP entrance owns the frame's y and rotation, so the two never
 * write the same property. Static and reduced motion keep the rest state.
 */
function TestimonialCard({ index, quote, attribution, cardRef, avatarRef, quoteRef, highlightRef }: CardProps) {
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
      style={{
        position: 'absolute',
        top: SPEC.card.top,
        left: SPEC.card.left[index],
        width: SPEC.card.w,
        height: SPEC.card.h,
      }}
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
            position: 'absolute',
            inset: 0,
            background: 'var(--blue)',
            borderRadius: '36.5px',
            overflow: 'hidden',
          }}
        >
          {/* Avatar: 144x129, radius 24, 1px stroke, centered (x offset 205). */}
          <div
            ref={avatarRef}
            className="tavatar"
            style={{
              position: 'absolute',
              top: '40px',
              left: '237px',
              width: '144px',
              height: '129px',
              borderRadius: '24px',
              border: '1px solid var(--ink)',
              background: CHECKER_BG,
            }}
          />
          {/* Quote: 554x128, Outfit 400 24/32 ls -0.48. */}
          <div className="tquote" style={{ position: 'absolute', top: '206.5px', left: '32px', width: '554px', height: '128px', textAlign: 'center' }}>
            <p
              ref={quoteRef}
              style={{
                fontFamily: 'var(--ff-outfit)',
                fontWeight: 400,
                fontSize: '24px',
                lineHeight: '32px',
                letterSpacing: '-0.02em',
                color: 'var(--body)',
              }}
            >
              {quote}
            </p>
          </div>
          {/* Attribution: Outfit 500 28/44.6 ls -0.54, with a hand-drawn
              highlighter swipe behind the line. */}
          <div className="tattr" style={{ position: 'absolute', top: '360.5px', left: '32px', width: '554px', height: '44.6px', textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--ff-outfit)',
                fontWeight: 500,
                fontSize: '28px',
                lineHeight: '44.6px',
                letterSpacing: '-0.0193em',
                color: 'var(--heading)',
              }}
            >
              <span className="tattr-wrap">
                <span ref={highlightRef} className="tattr-hl" aria-hidden="true" />
                <span className="tattr-text">{attribution}</span>
              </span>
            </p>
          </div>

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
  const avatarRefs = useRef<Array<HTMLDivElement | null>>([]);
  const quoteRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const highlightRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const cards = data.cards.map((card, i) => ({
    key: i,
    quote: staticMode || card.todoContent ? FIGMA_QUOTE : card.quote,
    attribution: staticMode || card.todoContent ? FIGMA_ATTRIBUTION : card.attribution,
  }));

  useLayoutEffect(() => {
    if (!active) return;

    const section = sectionRef.current;
    const stickerWrap = stickerWrapRef.current;
    const sticker = stickerWrap?.querySelector<HTMLElement>('[data-tsticker-slap]') ?? null;
    const cardEls = cardRefs.current;
    const avatars = avatarRefs.current;
    const quotes = quoteRefs.current;
    const highlights = highlightRefs.current;
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

    // 9 cards: enter from below with opposite tilts that settle to 0, avatar
    // pops and wobbles, quote words typeset in as the card settles, then the
    // attribution highlight swipes in. One timeline, staggered by index.
    const cardsTimeline = gsap.timeline({
      scrollTrigger: { trigger: section, start: MOTION.card.start, once: true },
    });
    timelines.push(cardsTimeline);

    cardEls.forEach((card, index) => {
      const avatar = avatars[index];
      const quote = quotes[index];
      const highlight = highlights[index];
      if (!card) return;

      const cardTimeline = gsap.timeline();
      cardsTimeline.add(cardTimeline, index * MOTION.card.stagger);
      cardTimeline.fromTo(
        card,
        { y: MOTION.card.y, rotation: index === 0 ? -MOTION.card.tilt : MOTION.card.tilt },
        { y: 0, rotation: 0, duration: 1.0, ease: EASE.glide },
      );

      if (avatar) {
        cardTimeline.fromTo(
          avatar,
          { scale: MOTION.avatar.fromScale, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: EASE.pop },
          '-=0.35',
        );
        // Wobble, then rest on 0.
        MOTION.avatar.wobble.forEach((angle, wobbleIndex) => {
          cardTimeline.to(
            avatar,
            {
              rotation: angle,
              duration: wobbleIndex === MOTION.avatar.wobble.length - 1 ? 0.2 : 0.13,
              ease: angle === 0 ? EASE.glide : 'power2.out',
            },
            '>',
          );
        });
      }

      if (quote) {
        const split = SplitText.create(quote, { type: 'words', aria: 'auto' });
        splits.push(split);
        cardTimeline.fromTo(
          split.words,
          { opacity: MOTION.words.fromOpacity },
          { opacity: 1, stagger: MOTION.words.stagger, duration: MOTION.words.duration, ease: 'power1.out' },
          '-=0.45',
        );
      }

      if (highlight) {
        cardTimeline.fromTo(
          highlight,
          { scaleX: 0 },
          { scaleX: 1, duration: MOTION.highlight.duration, ease: EASE.glide },
          '-=0.2',
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
      for (const avatar of avatars) if (avatar) gsap.set(avatar, { clearProps: 'transform,opacity' });
      for (const highlight of highlights) if (highlight) gsap.set(highlight, { clearProps: 'transform' });
      if (stickerWrap) gsap.set(stickerWrap, { clearProps: 'transform,opacity' });
      if (sticker) gsap.set(sticker, { clearProps: 'transform,boxShadow' });
    };
  }, [active]);

  return (
    <section
      data-section="testimonials"
      id="testimonials"
      aria-label="Testimonials"
      ref={sectionRef}
      className="testimonials-section relative w-full bg-cream-white border-y border-ink"
      style={{ height: '821px' }}
    >
      <SectionEdge variant="tear" from="var(--yellow)" />
      {/* content context (inset to the framed area; children use section-absolute coords) */}
      <div className="testimonials-inner" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* Sticker, left aligned at x=72, y=76, rot +3.96. */}
        <div ref={stickerWrapRef} className="tsticker" data-depth="0.4" style={{ position: 'absolute', top: '76px', left: '72px', width: '137px', height: '36px' }}>
          <div className="sticker-base" style={{ transform: `rotate(${SPEC.sticker.rotate}deg)`, transformOrigin: 'center center' }}>
            <div data-tsticker-slap className="tsticker-slap">
              <StickerLabel label="Kind words" fill="var(--lime)" />
            </div>
          </div>
        </div>

        {/* H2, box 652x100 at (72, 153.4), two lines, Blauer Nue 600 45/50 ls -1.35. */}
        <h2
          data-skew
          data-split="lines"
          className="th2"
          style={{
            position: 'absolute',
            top: '153.4px',
            left: '72px',
            width: '652px',
            height: '100px',
            fontFamily: 'var(--ff-ink)',
            fontWeight: 600,
            fontSize: '45px',
            lineHeight: '50px',
            letterSpacing: '-0.03em',
            color: 'var(--heading)',
          }}
        >
          Trusted by amazing people and teams across the globe.
        </h2>

        <div className="tcards" data-skew>
          {cards.map((c, index) => (
            <TestimonialCard
              key={c.key}
              index={index}
              quote={c.quote}
              attribution={c.attribution}
              cardRef={(element) => {
                cardRefs.current[index] = element;
              }}
              avatarRef={(element) => {
                avatarRefs.current[index] = element;
              }}
              quoteRef={(element) => {
                quoteRefs.current[index] = element;
              }}
              highlightRef={(element) => {
                highlightRefs.current[index] = element;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
