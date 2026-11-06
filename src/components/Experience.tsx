// Experience (DESIGN_SPEC 6, 12 - experience row, 13): the lavender section
// with the editorial "creative hats" heading, four flat role cards and the
// footnote.
//
// Motion (MOTION_SPEC 6) sits on nested wrappers so every transform has one
// owner: the outer card wrapper carries the scroll fan, the article carries
// the hover lift, the hat's outer span pops in and its inner span sways.
//
// Vertical rhythm: elements are pinned by their spec y values using the
// 28px vertical gap everywhere (84+17.64+28+51.79+28+22.68+28+370+28+20.16
// leaves the 780px section exactly; spec 6 lists absolute y positions that
// already land on this grid).

import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import data from '../data/experience.json';
import { EASE } from '../motion/ease';
import { gsap, SplitText } from '../motion/gsap';
import { useMediaQuery } from '../motion/useMediaQuery';
import { useMotion } from '../motion/useMotion';
import { SectionEdge } from './SectionEdge';
import { Beret, Bobble, Cap, TopHat } from './svg/Hats';
// Exact values from the spec (DESIGN_SPEC 6). Colors live in tokens.
const SPEC = {
  card: {
    radius: '18px', // 6
    padX: '22px', // 6
    padY: '24px', // 6
    innerGap: '12px', // 6: vertical gap inside the card content
    border: '1px solid var(--exp-card-border)', // 6
  },
} as const;

/** 6: one hat per card, in reading order. */
const HATS = [Cap, TopHat, Beret, Bobble] as const;

/* MOTION_SPEC 6 values. */
const MOTION = {
  label: { stagger: 0.022, duration: 0.5 },
  heading: { skew: -6, yPercent: 35, stagger: 0.06, duration: 0.9 },
  fan: {
    rotations: [-9, -3, 3, 9],
    rotateY: 40,
    overlap: 90,
    perspective: 1200,
    origin: '50% 120%',
    start: 'top 80%',
    end: 'top 40%',
    stagger: 0.15,
    duration: 0.95,
  },
  hover: {
    lift: -10,
    popScale: 0.4,
    popRotation: -20,
    sway: 6,
    swayDuration: 0.7, // 1.4s for the full -6 to +6 loop
  },
  footnote: { start: 'top 88%', end: 'top 60%' },
} as const;

/** The first sentence is underlined by the thread, the rest is plain text. */
const footnoteCut = data.footnote.indexOf('. ') + 1;
const footnoteLead =
  footnoteCut > 0 ? data.footnote.slice(0, footnoteCut) : data.footnote;
const footnoteRest =
  footnoteCut > 0 ? data.footnote.slice(footnoteCut + 1) : '';

function cardStyle(fill: string): CSSProperties {
  return {
    ['--exp-fill' as string]: fill,
    borderRadius: SPEC.card.radius,
    border: SPEC.card.border,
    padding: `${SPEC.card.padY} ${SPEC.card.padX}`,
    gap: SPEC.card.innerGap,
  };
}

export function Experience() {
  const { quality, reducedMotion } = useMotion();
  const touch = useMediaQuery('(pointer: coarse)');
  const narrow = useMediaQuery('(max-width: 1199px)');
  const active = !reducedMotion;
  const low = quality === 'low';

  const sectionRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLParagraphElement>(null);
  const footLeadRef = useRef<HTMLSpanElement>(null);
  const footRestRef = useRef<HTMLSpanElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const cardWraps = useRef<Array<HTMLDivElement | null>>([]);
  const articleRefs = useRef<Array<HTMLElement | null>>([]);
  const hatRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const swayRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useLayoutEffect(() => {
    if (!active) return;
    const label = labelRef.current;
    const heading = headingRef.current;
    const row = rowRef.current;
    const foot = footRef.current;
    const lead = footLeadRef.current;
    const rest = footRestRef.current;
    const thread = threadRef.current;
    if (!label || !heading || !row || !foot || !lead || !rest) return;

    const splits: SplitText[] = [];
    const tweens: gsap.core.Animation[] = [];
    const sways: gsap.core.Timeline[] = [];
    const listeners: Array<() => void> = [];
    const articles = articleRefs.current;
    const wrapsAll = cardWraps.current;
    const hats = hatRefs.current;
    const swayEls = swayRefs.current;

    // 6 label: mono-like letter reveal, one char at a time.
    const labelSplit = SplitText.create(label, {
      type: 'chars',
      mask: 'chars',
      autoSplit: false,
      aria: 'auto',
    });
    splits.push(labelSplit);
    tweens.push(
      gsap.from(labelSplit.chars, {
        yPercent: 110,
        opacity: 0,
        duration: MOTION.label.duration,
        stagger: low ? 0.008 : MOTION.label.stagger,
        ease: EASE.glide,
        scrollTrigger: { trigger: label, start: 'top 88%', once: true },
      }),
    );

    // 6 H2: per-word soft italic-skew settle, editorial Fraunces.
    const headingSplit = SplitText.create(heading, {
      type: 'words',
      autoSplit: false,
      aria: 'auto',
    });
    splits.push(headingSplit);
    tweens.push(
      gsap.from(headingSplit.words, {
        yPercent: MOTION.heading.yPercent,
        skewX: MOTION.heading.skew,
        opacity: 0,
        transformOrigin: '0% 100%',
        duration: MOTION.heading.duration,
        stagger: low ? 0.03 : MOTION.heading.stagger,
        ease: EASE.glide,
        scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
      }),
    );

    // 6 cards: a hand of cards that straightens and spreads as the row
    // scrubs. The fan lives on the wrapper, so the article can own hover.
    const media = gsap.matchMedia();
    const buildFan = (anchor: 'center' | 'first') => () => {
      const wraps = wrapsAll.filter(
        (wrap): wrap is HTMLDivElement => wrap !== null,
      );
      if (!wraps.length) return;
      const firstBox = wraps[0].getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      const spacing = firstBox.width - MOTION.fan.overlap;
      const middle = (wraps.length - 1) / 2;
      const anchorX =
        anchor === 'center'
          ? rowBox.left + rowBox.width / 2
          : firstBox.left + firstBox.width / 2;

      const fan = gsap.timeline({
        defaults: { ease: EASE.glide, duration: MOTION.fan.duration },
        scrollTrigger: {
          trigger: row,
          start: MOTION.fan.start,
          end: MOTION.fan.end,
          scrub: true,
        },
      });

      wraps.forEach((wrap, index) => {
        const box = wrap.getBoundingClientRect();
        const finalCenter = box.left + box.width / 2;
        const fanCenter =
          anchorX +
          (anchor === 'center'
            ? (index - middle) * spacing
            : index * spacing);
        fan.fromTo(
          wrap,
          {
            x: fanCenter - finalCenter,
            rotation: MOTION.fan.rotations[index] ?? 0,
            rotationY: MOTION.fan.rotateY,
            transformPerspective: MOTION.fan.perspective,
            transformOrigin: MOTION.fan.origin,
          },
          { x: 0, rotation: 0, rotationY: 0 },
          index * MOTION.fan.stagger,
        );
      });
    };
    media.add('(min-width: 900px)', buildFan('center'));
    media.add('(max-width: 899px)', buildFan('first'));

    // 6 hover: lift, hat pop and sway. The fill deepens in CSS; touch keeps
    // the scroll row and the fan, with no hover state.
    if (!touch) {
      articles.forEach((article, index) => {
        const hat = hats[index];
        const swayEl = swayEls[index];
        if (!article || !hat || !swayEl) return;

        gsap.set(hat, {
          opacity: 0,
          scale: MOTION.hover.popScale,
          rotation: MOTION.hover.popRotation,
          transformOrigin: '50% 100%',
        });
        const sway = gsap.timeline({
          paused: true,
          repeat: -1,
          yoyo: true,
          defaults: { ease: 'sine.inOut' },
        });
        sway.fromTo(
          swayEl,
          { rotation: -MOTION.hover.sway },
          { rotation: MOTION.hover.sway, duration: MOTION.hover.swayDuration },
        );
        sways.push(sway);

        let hovered = false;
        const onEnter = () => {
          if (hovered) return;
          hovered = true;
          gsap.to(article, {
            y: MOTION.hover.lift,
            duration: 0.35,
            ease: EASE.glide,
            overwrite: true,
          });
          gsap.to(hat, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.45,
            ease: EASE.pop,
            overwrite: true,
          });
          sway.pause(0).play();
        };
        const onLeave = () => {
          if (!hovered) return;
          hovered = false;
          sway.pause(0);
          gsap.to(article, {
            y: 0,
            duration: 0.4,
            ease: EASE.glide,
            overwrite: true,
          });
          gsap.to(hat, {
            opacity: 0,
            scale: MOTION.hover.popScale,
            rotation: MOTION.hover.popRotation,
            duration: 0.25,
            ease: 'power2.in',
            overwrite: true,
          });
        };
        article.addEventListener('pointerenter', onEnter);
        article.addEventListener('pointerleave', onLeave);
        listeners.push(() => {
          article.removeEventListener('pointerenter', onEnter);
          article.removeEventListener('pointerleave', onLeave);
        });
      });
    }

    // 6 footnote: word scrub, plus the dashed thread under the first
    // sentence drawing from left to right.
    const leadSplit = SplitText.create(lead, {
      type: 'words',
      autoSplit: false,
      aria: 'auto',
    });
    const restSplit = SplitText.create(rest, {
      type: 'words',
      autoSplit: false,
      aria: 'auto',
    });
    splits.push(leadSplit, restSplit);
    tweens.push(
      gsap.from([...leadSplit.words, ...restSplit.words], {
        opacity: 0.18,
        stagger: 0.03,
        ease: 'none',
        scrollTrigger: {
          trigger: foot,
          start: MOTION.footnote.start,
          end: MOTION.footnote.end,
          scrub: true,
        },
      }),
    );
    if (thread) {
      tweens.push(
        gsap.fromTo(
          thread,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: {
              trigger: foot,
              start: MOTION.footnote.start,
              end: MOTION.footnote.end,
              scrub: true,
            },
          },
        ),
      );
    }

    return () => {
      media.revert();
      for (const cleanup of listeners) cleanup();
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      for (const sway of sways) sway.kill();
      for (const split of splits) {
        split.revert();
        split.kill();
      }
      for (const article of articles) {
        if (article) gsap.set(article, { clearProps: 'transform' });
      }
      for (const wrap of wrapsAll) {
        if (wrap) gsap.set(wrap, { clearProps: 'transform' });
      }
      for (const hat of hats) {
        if (hat) gsap.set(hat, { clearProps: 'opacity,transform' });
      }
      for (const swayEl of swayEls) {
        if (swayEl) gsap.set(swayEl, { clearProps: 'transform' });
      }
      if (thread) gsap.set(thread, { clearProps: 'clipPath' });
    };
  }, [active, low, touch]);

  return (
    <section
      ref={sectionRef}
      data-section="experience"
      id="experience"
      aria-label="Experience"
      className="experience-section relative w-full bg-lav-exp px-5 pb-20 pt-[84px] min-[1440px]:h-[780px] min-[1440px]:px-[120px] min-[1440px]:pb-0"
    >
      <SectionEdge variant="blob" from="var(--lav-work)" />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col">
        <p
          ref={labelRef}
          className="relative top-[3px] font-outfit text-[14px] uppercase leading-[17.64px] text-[var(--ink-label)]"
        >
          {data.label}
        </p>
        <h2
          ref={headingRef}
          data-skew
          className="relative top-[3px] mt-[28px] max-w-full font-fraunces text-[clamp(26px,6.5vw,42px)] leading-[1.2] text-[var(--ink-exp-h2)] min-[1200px]:leading-[51.8px]"
          style={{ fontWeight: 400 }}
        >
          {data.heading}
        </h2>
        <p
          data-split="words"
          className="relative top-[3px] mt-[28px] max-w-[1100px] font-outfit text-[16px] leading-[22px] text-[var(--ink-intro)] min-[1200px]:text-[18px] min-[1200px]:leading-[22.68px]"
        >
          {data.intro}
        </p>

        {/* 6/12: cards row; horizontal scroll-snap below 1440. */}
        <div
          data-cursor={narrow ? 'drag' : undefined}
          className="mt-7 w-full overflow-x-auto min-[1440px]:overflow-visible"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          <div
            ref={rowRef}
            className="flex min-w-[1200px] gap-[18px] min-[1440px]:min-w-0"
            data-skew
          >
            {data.cards.map((card, index) => {
              const Hat = HATS[index % HATS.length];
              const first = card.title.slice(0, 1);
              const rest = card.title.slice(1);
              return (
                <div
                  key={card.title}
                  ref={(element) => {
                    cardWraps.current[index] = element;
                  }}
                  className="exp-card-wrap relative w-[78vw] shrink-0 min-[900px]:w-[282px]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <article
                    ref={(element) => {
                      articleRefs.current[index] = element;
                    }}
                    className="exp-card relative flex h-[330px] w-full flex-col overflow-hidden"
                    style={cardStyle(card.fill)}
                  >
                    <h3
                      className="relative top-[3px] font-fraunces text-[24px] leading-[29.59px] text-[var(--ink-exp-h2)]"
                      style={{ fontWeight: 400 }}
                    >
                      {active && !touch ? (
                        <>
                          <span className="relative inline-block">
                            {first}
                            <span
                              ref={(element) => {
                                hatRefs.current[index] = element;
                              }}
                              aria-hidden="true"
                              data-hat
                              className="pointer-events-none absolute inline-flex"
                              style={{
                                left: 'calc(100% - 10px)',
                                top: '-16px',
                                width: '28px',
                                height: '28px',
                                zIndex: 2,
                                opacity: 0,
                              }}
                            >
                              <span
                                ref={(element) => {
                                  swayRefs.current[index] = element;
                                }}
                                className="inline-flex h-full w-full"
                              >
                                <Hat style={{ width: '100%', height: '100%' }} />
                              </span>
                            </span>
                          </span>
                          {rest}
                        </>
                      ) : (
                        card.title
                      )}
                    </h3>
                    <p className="relative top-[3px] font-outfit text-[14px] leading-[17.64px] text-[var(--ink-role)]">
                      {card.role}
                    </p>
                    <p className="relative top-[3px] font-outfit text-[15px] leading-[18.9px] text-[var(--ink-intro)]">
                      {card.description}
                    </p>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        <p
          ref={footRef}
          className="relative top-[3px] mt-7 font-outfit text-[16px] leading-[20.16px] text-[var(--ink-intro)]"
        >
          <span ref={footLeadRef} className="relative inline-block">
            {footnoteLead}
            {active ? (
              <span
                ref={threadRef}
                aria-hidden="true"
                data-thread
                className="pointer-events-none absolute left-0 right-0 h-px"
                style={{
                  bottom: '-5px',
                  backgroundImage:
                    'repeating-linear-gradient(90deg, var(--ink-intro) 0 4px, transparent 4px 8px)',
                  clipPath: 'inset(0% 100% 0% 0%)',
                }}
              />
            ) : null}
          </span>{' '}
          <span ref={footRestRef}>{footnoteRest}</span>
        </p>
      </div>
    </section>
  );
}
