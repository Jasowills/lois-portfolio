// Navigation, DESIGN_SPEC section 3 exactly: announcement banner 55px
// (#1a160c, Roboto Mono 400 16/23.2 ls -1.12, bold link to #contact) and the
// 115.1px header (bg #fffef9, bottom border 1px #2b2b2b, padding 0 84px /
// 20 vertical, three columns gap 96: right-aligned pills, centered logo
// 140.3x75.1, left-aligned pills). Pill anatomy per 3.2: height 47, padding
// 12px 20px, 1px black border, radius 24, text Outfit 400 (Services 500)
// 16/23.2 ls -0.32, exact widths from the table, arrow only on Contact.
// Mobile per DESIGN_SPEC 12: banner shrinks to 14px, header becomes logo left
// plus a Menu pill that opens a full-screen sheet of the four pills as large
// tilted stickers plus the purple Let's Talk! button.
//
// MOTION_SPEC section 3 adds typing banner, wobbling pills with hover arrows,
// logo squash and click-to-top, the hide/return header, the active dot and the
// mobile sticker drop. Motion mode pins the banner and header as one fixed
// bar over an in-flow 171px spacer; static mode keeps the original in-flow
// document exactly for scripts/visual-diff.mjs. The fixed-bar reading of
// "header hides on scroll" is logged in OPEN_QUESTIONS.md entry 43.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import { gsap, ScrollTrigger } from '../motion/gsap';
import { EASE, EASE_BEZIER, DURATION } from '../motion/ease';
import { useMotion } from '../motion/useMotion';
import { useStaticMode } from '../motion/useStaticMode';
import type { QualityTier } from '../motion/quality';
import { Logo } from './svg/Logo';
import { ArrowRight } from './svg/ArrowRight';

/* Exact geometry, verbatim from DESIGN_SPEC 1.2 (type), 3.1 (banner), 3.2
   (header and pills), 1.3 (nav pill radius) and MOTION_SPEC 3 (nav motion).
   Sizes are px at 1440. */
const SPEC = {
  banner: {
    height: '55px',
    padX: '16px',
    fontSizeToken: 'var(--fs-banner)', // 16px desktop, 14px below 768 (DESIGN_SPEC 12)
    lineHeight: '23.2px',
    lsEm: '-0.07em', // -1.12px at 16px
    gapPx: '8px',
    leftW: '146px', // 3.1: "146 + 8 + 135 wide"
    emojiSize: '14px', // 3.1: Figma sets the heart at 0.875em (ref ink 15x14, advance 16.3)
  },
  header: {
    height: '115.1px',
    padX: '84px',
    padXFluid: 'clamp(20px, 5.8333vw, 84px)', // 84px at 1440, DESIGN_SPEC 12
    padY: '20px',
    colsGap: '96px',
    groupGap: '28px',
    logoW: '140.3px',
    logoH: '75.1px',
  },
  pill: {
    height: '47px',
    padX: '20px',
    padY: '12px',
    radiusVar: 'var(--r-pill)',
    fontSize: '16px',
    lineHeight: '23.2px',
    lsEm: '-0.02em', // -0.32px at 16px
    groupGap: '28px',
  },
  /* Pill widths from the 3.2 table. Contact already includes icon 24 + gap 4. */
  widths: { services: '97px', work: '78px', about: '83px', contact: '124px' } as const,
  /* Mobile sheet, derived from DESIGN_SPEC 12 (no mobile art exists):
     large stickers reuse the hero card tilts; purple CTA per 3.2 note. */
  sheet: {
    fontSize: '24px',
    lineHeight: '28.8px',
    padX: '28px',
    padY: '16px',
    gap: '24px',
    talkW: '128px', // Let's Talk!, exact from 3.2
    talkH: '58px',
    talkFontSize: '18px', // Outfit 600 18 (DESIGN_SPEC 3.2 note)
  },
  /* The Figma frame is 170.1 tall, the 1x export raster is 171 rows, and the
     bottom border ink covers rows 169 AND 170 (ref: 69 at 169, 40 at 170).
     Reserving the 171st row is what lets the border bar (below) paint it
     without being clipped by the element bounds. */
  section: { height: '171px' },
  /* MOTION_SPEC 3 values. The dot gap, type speed and hide threshold are not
     specified and are recorded in OPEN_QUESTIONS.md entry 43. */
  motion: {
    hoverLift: 3,
    hoverShadow: '4px 4px 0 var(--ink)',
    restShadow: '0px 0px 0 var(--ink)',
    pillWiden: 28,
    arrowNudge: 4,
    arrowSlide: 8,
    wobbleDeg: 0.6,
    wobbleSeconds: 4,
    activeDot: 6,
    activeDotGap: 4,
    activeLine: 0.45,
    hideAfter: 96,
    hideDuration: 0.42,
    typeSpeed: 0.032,
    typeStartDelay: 0.12,
    typeFallback: 5,
    caretBlink: 0.26,
    heartScale: 1.25,
    heartDuration: 0.6,
    heartEvery: 6,
    sparkleSpin: 0.6,
    sparkleOrigin: '73.93 28.6',
  },
} as const;

const PILL_KEYS = ['services', 'work', 'about', 'contact'] as const;
type PillKey = (typeof PILL_KEYS)[number];

type PillData = {
  label: string;
  href: string;
  width: string;
  fill: string;
  weight: 400 | 500;
  arrow?: boolean;
};

const PILLS = {
  services: { label: 'Services', href: '#services', width: SPEC.widths.services, fill: 'var(--blue)', weight: 500 },
  work: { label: 'Work', href: '#work', width: SPEC.widths.work, fill: 'var(--pink)', weight: 400 },
  about: { label: 'About', href: '#about', width: SPEC.widths.about, fill: 'var(--green-pill)', weight: 400 },
  contact: { label: 'Contact', href: '#contact', width: SPEC.widths.contact, fill: 'var(--lav)', weight: 400, arrow: true },
} as const satisfies Record<string, PillData>;

/* Section root -> active nav pill. Hero, Experience and Testimonials have no
   matching pill, so the nav shows its default state there (MOTION_SPEC 3). */
const SECTION_PILL: Record<string, PillKey> = {
  work: 'work',
  services: 'services',
  about: 'about',
  cta: 'contact',
  footer: 'contact',
};

const labelStyle = {
  fontFamily: 'var(--ff-outfit)',
  color: 'var(--ink)',
  whiteSpace: 'nowrap',
} as const;

function Pill({ pill, rotate, big, onClick }: { pill: PillData; rotate?: number; big?: boolean; onClick?: () => void }) {
  const box = {
    width: big ? undefined : pill.width,
    height: big ? undefined : SPEC.pill.height,
    paddingInline: big ? SPEC.sheet.padX : SPEC.pill.padX,
    paddingBlock: big ? SPEC.sheet.padY : SPEC.pill.padY,
    borderRadius: SPEC.pill.radiusVar,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--ink)',
    background: pill.fill,
    gap: '4px',
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
  } as const;
  const text = {
    ...labelStyle,
    fontSize: big ? SPEC.sheet.fontSize : SPEC.pill.fontSize,
    lineHeight: big ? SPEC.sheet.lineHeight : SPEC.pill.lineHeight,
    letterSpacing: SPEC.pill.lsEm,
    fontWeight: pill.weight,
  } as const;
  return (
    <a
      href={pill.href}
      onClick={onClick}
      className="inline-flex items-center justify-center border whitespace-nowrap"
      style={box}
    >
      <span style={text}>{pill.label}</span>
      {/* The Contact arrow renders black like the label (per reference
          01-navigation.png; the white fills seen on some Figma arrow
          instances are hidden hover duplicates). */}
      {pill.arrow ? <ArrowRight /> : null}
    </a>
  );
}

/**
 * Desktop pill with MOTION_SPEC 3 behaviour: a resting sine wobble, a
 * spring-straightened hover/focus state, a hard shadow lift, and a 28px
 * layout widen that reveals the right arrow for Services/Work/About.
 */
function MotionPill({
  pillKey,
  pill,
  active,
  weight,
  quality,
  idle,
  expanded,
  onHoverChange,
  onFocusChange,
  index,
}: {
  pillKey: PillKey;
  pill: PillData;
  active: boolean;
  weight: 400 | 500;
  quality: QualityTier;
  idle: boolean;
  expanded: boolean;
  onHoverChange: (key: PillKey, next: boolean) => void;
  onFocusChange: (key: PillKey, next: boolean) => void;
  index: number;
}) {

  // Resting wobble: one sine value per pill, phase-shifted by index. Motion
  // owns rotate, y and shadow for this element (one owner per property).
  const wobble = useMotionValue(0);
  const straighten = useSpring(0, { stiffness: 200, damping: 15 });
  const rotate = useTransform([wobble, straighten], ([w, s]: number[]) => w * (1 - s));

  useAnimationFrame((time) => {
    if (quality === 'low' || idle) return;
    const phase = index * (Math.PI / 2);
    const turn = (time / (SPEC.motion.wobbleSeconds * 1000)) * Math.PI * 2;
    wobble.set(Math.sin(turn + phase) * SPEC.motion.wobbleDeg);
  });

  useEffect(() => {
    if (idle) wobble.set(0);
  }, [idle, wobble]);

  useEffect(() => {
    straighten.set(expanded ? 1 : 0);
  }, [expanded, straighten]);

  useEffect(() => {
    if (quality === 'low') {
      wobble.set(0);
      straighten.set(0);
    }
  }, [quality, straighten, wobble]);

  const hasHoverArrow = pillKey !== 'contact';
  const width = Number.parseFloat(pill.width) + (hasHoverArrow && expanded ? SPEC.motion.pillWiden : 0);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: DURATION.hover, ease: EASE_BEZIER.glide } }}
      style={{ display: 'flex', flexShrink: 0, width }}
    >
      <motion.a
        href={pill.href}
        aria-current={active ? 'location' : undefined}
        onPointerEnter={() => onHoverChange(pillKey, true)}
        onPointerLeave={() => onHoverChange(pillKey, false)}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible')) onFocusChange(pillKey, true);
        }}
        onBlur={() => onFocusChange(pillKey, false)}
        className="inline-flex items-center justify-center border whitespace-nowrap"
        style={{
          position: 'relative',
          width: '100%',
          height: SPEC.pill.height,
          paddingInline: SPEC.pill.padX,
          paddingBlock: SPEC.pill.padY,
          borderRadius: SPEC.pill.radiusVar,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--ink)',
          background: pill.fill,
          gap: '4px',
          rotate,
        }}
        animate={{
          y: expanded ? -SPEC.motion.hoverLift : 0,
          boxShadow: expanded ? SPEC.motion.hoverShadow : SPEC.motion.restShadow,
        }}
        whileTap={{ scale: 0.96, boxShadow: SPEC.motion.restShadow }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <span
          style={{
            ...labelStyle,
            fontSize: SPEC.pill.fontSize,
            lineHeight: SPEC.pill.lineHeight,
            letterSpacing: SPEC.pill.lsEm,
            fontWeight: weight,
          }}
        >
          {pill.label}
        </span>

        {hasHoverArrow ? (
          <motion.span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: SPEC.pill.padX,
              top: '50%',
              marginTop: `-${24 / 2}px`,
              display: 'flex',
            }}
            initial={false}
            animate={{
              opacity: expanded ? 1 : 0,
              x: expanded ? 0 : -SPEC.motion.arrowSlide,
            }}
            transition={{ duration: DURATION.hover, ease: EASE_BEZIER.glide }}
          >
            <ArrowRight />
          </motion.span>
        ) : (
          <motion.span
            style={{ display: 'inline-flex' }}
            animate={{ x: expanded ? SPEC.motion.arrowNudge : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <ArrowRight />
          </motion.span>
        )}

        <motion.span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: `calc(100% + ${SPEC.motion.activeDotGap}px)`,
            width: SPEC.motion.activeDot,
            height: SPEC.motion.activeDot,
            marginLeft: -SPEC.motion.activeDot / 2,
            borderRadius: '50%',
            background: 'var(--ink)',
            pointerEvents: 'none',
          }}
          initial={false}
          animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0 }}
          transition={{ duration: DURATION.micro, ease: EASE_BEZIER.pop }}
        />
      </motion.a>
    </motion.div>
  );
}

/* Derived mobile sheet (static, DESIGN_SPEC 12). Tilts reuse the hero deck. */
const SHEET_TILTS = { services: -5.54, work: 6.69, about: -3.56, contact: 4.96 } as const;

/**
 * Mobile sheet with the MOTION_SPEC 3 gravity drop. The wrapper drops and
 * unwinds its extra tilt, while the pill inside keeps its designed landing
 * tilt. The purple Let's Talk! sticker pops last.
 */
function MobileMenu({
  open,
  onClose,
  animated,
}: {
  open: boolean;
  onClose: () => void;
  animated: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { quality } = useMotion();

  useLayoutEffect(() => {
    if (!open || !animated || !root.current) return;
    const host = root.current;
    const stickers = Array.from(host.querySelectorAll<HTMLElement>('[data-mobile-sticker]'));
    const talk = host.querySelector<HTMLElement>('[data-mobile-talk]');

    if (quality === 'low') {
      gsap.set([...stickers, ...(talk ? [talk] : [])], { clearProps: 'transform,opacity' });
      return;
    }

    const timeline = gsap.timeline();
    timeline.fromTo(
      stickers,
      {
        y: -window.innerHeight,
        opacity: 0,
        rotate: (_i: number, element: Element) => Number((element as HTMLElement).dataset.tilt ?? 0) + 6,
      },
      {
        y: 0,
        opacity: 1,
        rotate: 0,
        duration: 0.9,
        ease: EASE.swing,
        stagger: DURATION.stagger,
      },
    );
    if (talk) {
      timeline.fromTo(
        talk,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: EASE.pop },
        '+=0.05',
      );
    }

    return () => {
      timeline.kill();
    };
  }, [open, animated, quality]);

  if (!open) return null;
  return (
    <div
      ref={root}
      id="mobile-menu"
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-cream"
      style={{ padding: '20px' }}
    >
      <div className="flex items-center justify-between">
        <a href="/" aria-label="the lois.og, home">
          <Logo variant="nav" />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="inline-flex items-center justify-center border"
          style={{
            height: SPEC.pill.height,
            paddingInline: SPEC.pill.padX,
            paddingBlock: SPEC.pill.padY,
            borderRadius: SPEC.pill.radiusVar,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--ink)',
            background: 'var(--pink-soft)',
          }}
        >
          <span style={{ ...labelStyle, fontSize: SPEC.pill.fontSize, lineHeight: SPEC.pill.lineHeight, letterSpacing: SPEC.pill.lsEm }}>Close</span>
        </button>
      </div>
      <nav aria-label="Mobile" className="mt-16 flex flex-col items-center" style={{ gap: SPEC.sheet.gap }}>
        {PILL_KEYS.map((key) => (
          <div key={key} data-mobile-sticker data-tilt={SHEET_TILTS[key]}>
            <Pill pill={PILLS[key]} big rotate={SHEET_TILTS[key]} onClick={onClose} />
          </div>
        ))}
        {/* Let's Talk!, reserved for the mobile menu CTA (DESIGN_SPEC 3.2) */}
        <a
          data-mobile-talk
          href="#contact"
          onClick={onClose}
          className="mt-10 inline-flex items-center justify-center"
          style={{
            width: SPEC.sheet.talkW,
            height: SPEC.sheet.talkH,
            background: 'var(--purple)',
            borderRadius: SPEC.pill.radiusVar,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ff-outfit)',
              fontWeight: 600,
              fontSize: SPEC.sheet.talkFontSize, // Outfit 600 18 per 3.2
              lineHeight: SPEC.pill.lineHeight,
              color: 'var(--cream)',
            }}
          >
            Let’s Talk!
          </span>
        </a>
      </nav>
    </div>
  );
}

/** Shared home link: hover squash and sparkle spin, click scrolls to top. */
function LogoLink({ animated }: { animated: boolean }) {
  const { scrollTo } = useMotion();
  const anchor = useRef<HTMLAnchorElement>(null);
  const hover = useRef<gsap.core.Timeline | null>(null);

  const playSquash = () => {
    if (!animated || !anchor.current) return;
    const svg = anchor.current.querySelector<SVGSVGElement>('svg');
    if (!svg) return;

    hover.current?.kill();
    hover.current = gsap
      .timeline({ defaults: { transformOrigin: '50% 50%' } })
      .to(svg, { scaleX: 1.08, scaleY: 0.92, duration: 0.16, ease: EASE.squash })
      .to(svg, { scaleX: 0.96, scaleY: 1.06, duration: 0.14, ease: EASE.squash })
      .to(svg, { scaleX: 1, scaleY: 1, duration: 0.22, ease: EASE.squash });
  };

  // The footer's Back to Top dispatches lois:back-to-top when the page lands.
  useEffect(() => {
    const onBackToTop = () => playSquash();
    window.addEventListener('lois:back-to-top', onBackToTop);
    return () => window.removeEventListener('lois:back-to-top', onBackToTop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  useEffect(
    () => () => {
      hover.current?.kill();
    },
    [],
  );

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    scrollTo(0);
  };

  const handleEnter = () => {
    if (!animated || !anchor.current) return;
    playSquash();

    const svg = anchor.current.querySelector<SVGSVGElement>('svg');
    const sparkle = svg?.querySelector<SVGGElement>('[data-logo-sparkle]');
    if (sparkle && svg) {
      gsap.fromTo(
        sparkle,
        { rotate: 0 },
        {
          rotate: 360,
          duration: SPEC.motion.sparkleSpin,
          ease: EASE.glide,
          svgOrigin: SPEC.motion.sparkleOrigin,
        },
      );
    }
  };

  return (
    <a
      ref={anchor}
      href="/"
      aria-label="the lois.og, home"
      className="block"
      onClick={handleClick}
      onPointerEnter={handleEnter}
    >
      <Logo variant="nav" width={SPEC.header.logoW} height={SPEC.header.logoH} data-nav-logo />
    </a>
  );
}

/** 3.1 banner. In motion mode the visible copy types in behind a caret. */
function Banner({ animated, idle }: { animated: boolean; idle: boolean }) {
  const copy = useRef<HTMLParagraphElement>(null);
  const heart = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<gsap.core.Timeline | null>(null);
  const idleRef = useRef(idle);

  useEffect(() => {
    idleRef.current = idle;
  }, [idle]);

  // Pause the heartbeat while the fixed bar is parked off-screen.
  useEffect(() => {
    const pulse = pulseRef.current;
    if (!pulse) return;
    if (idle) pulse.pause();
    else pulse.resume();
  }, [idle]);

  useEffect(() => {
    if (!animated || !copy.current) return;
    const paragraph = copy.current;
    const chars = Array.from(paragraph.querySelectorAll<HTMLElement>('[data-banner-char]'));
    const caret = paragraph.querySelector<HTMLElement>('[data-banner-caret]');
    const heartNode = heart.current;
    let timeline: gsap.core.Timeline | null = null;
    let pulse: gsap.core.Timeline | null = null;
    let timer = 0;
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      window.clearTimeout(timer);

      const box = paragraph.getBoundingClientRect();
      const first = chars[0];
      if (caret && first) {
        gsap.set(caret, { opacity: 1, x: first.getBoundingClientRect().left - box.left });
      }

      const typing = gsap.timeline();
      for (const [index, char] of chars.entries()) {
        typing.to(char, { opacity: 1, duration: 0.001 }, index * SPEC.motion.typeSpeed);
        if (caret) {
          const rect = char.getBoundingClientRect();
          typing.to(caret, { x: rect.right - box.left, duration: 0.001 }, index * SPEC.motion.typeSpeed);
        }
      }

      const typed = chars.length * SPEC.motion.typeSpeed + 0.08;
      if (caret) {
        typing
          .to(caret, { opacity: 0, duration: SPEC.motion.caretBlink }, typed + 0.3)
          .to(caret, { opacity: 1, duration: SPEC.motion.caretBlink })
          .to(caret, { opacity: 0, duration: SPEC.motion.caretBlink })
          .to(caret, { opacity: 1, duration: SPEC.motion.caretBlink })
          .to(caret, { opacity: 0, duration: SPEC.motion.caretBlink });
      }
      timeline = typing;

      if (heartNode) {
        pulse = gsap
          .timeline({
            repeat: -1,
            repeatDelay: SPEC.motion.heartEvery - SPEC.motion.heartDuration,
            delay: typed + 0.3,
            paused: idleRef.current,
          })
          .to(heartNode, {
            scale: SPEC.motion.heartScale,
            duration: SPEC.motion.heartDuration / 2,
            ease: EASE.glide,
          })
          .to(heartNode, {
            scale: 1,
            duration: SPEC.motion.heartDuration / 2,
            ease: EASE.glide,
          });
        pulseRef.current = pulse;
      }
    };

    const loaderRunning = document.documentElement.dataset.loader === 'running';
    const onExit = () => run();
    if (loaderRunning) {
      window.addEventListener('lois:loader-exit', onExit, { once: true });
      timer = window.setTimeout(run, SPEC.motion.typeFallback * 1000);
    } else {
      timer = window.setTimeout(run, SPEC.motion.typeStartDelay * 1000);
    }

    return () => {
      window.removeEventListener('lois:loader-exit', onExit);
      window.clearTimeout(timer);
      timeline?.kill();
      pulse?.kill();
      pulseRef.current = null;
      if (heartNode) gsap.set(heartNode, { clearProps: 'transform' });
      if (caret) gsap.set(caret, { clearProps: 'opacity,transform' });
    };
  }, [animated]);

  const bannerCopy = (
    <>
      <span className="sr-only">Available to work </span>
      <span aria-hidden="true" style={{ width: SPEC.banner.leftW }}>
        {Array.from('Available to work ').map((char, index) => (
          <span key={`left-${index}`} data-banner-char style={{ opacity: 0, whiteSpace: 'pre' }}>
            {char}
          </span>
        ))}
      </span>
      <a href="#contact" aria-label="Get in touch!" style={{ fontWeight: 700, textDecoration: 'none' }}>
        <span aria-hidden="true">
          {Array.from('Get in touch! ').map((char, index) => (
            <span key={`link-${index}`} data-banner-char style={{ opacity: 0, whiteSpace: 'pre' }}>
              {char}
            </span>
          ))}
          <span
            ref={heart}
            data-banner-char
            style={{
              display: 'inline-block',
              position: 'relative',
              // inline-block adds the 23.2px line box's half-leading above
              // the emoji; +2px restores the static inline glyph position.
              top: '2px',
              fontSize: SPEC.banner.emojiSize,
              opacity: 0,
              whiteSpace: 'pre',
            }}
          >
            🩵
          </span>
        </span>
      </a>
      <span
        data-banner-caret
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: '4px',
          width: '1px',
          height: '16px',
          background: 'var(--cream)',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
    </>
  );

  const staticCopy = (
    <>
      <span style={{ width: SPEC.banner.leftW }}>Available to work </span>
      <a href="#contact" style={{ fontWeight: 700, textDecoration: 'none' }}>
        Get in touch!{' '}
        <span style={{ fontSize: SPEC.banner.emojiSize }}>🩵</span>
      </a>
    </>
  );

  return (
    <div
      className="flex items-center justify-center"
      style={{
        height: SPEC.banner.height,
        background: 'var(--ink-warm)',
        paddingInline: SPEC.banner.padX,
      }}
    >
      <p
        ref={copy}
        className="flex items-baseline text-center"
        style={{
          position: 'relative',
          top: '1px', // Chrome centers the 23.2px line 1px above Figma's raster (ref ink rows 20-34)
          gap: SPEC.banner.gapPx,
          fontFamily: 'var(--ff-roboto-mono), "Noto Heart"',
          fontSize: SPEC.banner.fontSizeToken,
          lineHeight: SPEC.banner.lineHeight,
          letterSpacing: SPEC.banner.lsEm,
          color: 'var(--cream)',
        }}
      >
        {animated ? bannerCopy : staticCopy}
      </p>
    </div>
  );
}

/** 3.2 header. Static mode renders the exact in-flow Figma row. */
function DesktopHeader({
  animated,
  active,
  quality,
  idle,
}: {
  animated: boolean;
  active: PillKey | null;
  quality: QualityTier;
  idle: boolean;
}) {
  // Expanded state lives here so every pill re-renders when one of them
  // widens: Motion only animates layout shifts for components whose render
  // sees the new box, and Contact has to slide with About's 28px widen.
  const [hovered, setHovered] = useState<PillKey | null>(null);
  const [focused, setFocused] = useState<PillKey | null>(null);

  const handleHover = (key: PillKey, next: boolean) => {
    setHovered((prev) => (next ? key : prev === key ? null : prev));
  };
  const handleFocus = (key: PillKey, next: boolean) => {
    setFocused((prev) => (next ? key : prev === key ? null : prev));
  };

  const weightFor = (key: PillKey): 400 | 500 => {
    if (active === null) return PILLS[key].weight;
    return active === key ? 500 : 400;
  };

  return (
    <nav aria-label="Primary" className="relative hidden xl:block">
      <div
        className="grid w-full items-center"
        style={{
          height: SPEC.header.height,
          paddingInline: SPEC.header.padX,
          paddingBlock: SPEC.header.padY,
          gridTemplateColumns: '1fr max-content 1fr',
          columnGap: SPEC.header.colsGap,
        }}
      >
        <div className="flex items-center justify-end" style={{ gap: SPEC.header.groupGap }}>
          {(['services', 'work'] as const).map((key, index) =>
            animated ? (
              <MotionPill
                key={key}
                pillKey={key}
                pill={PILLS[key]}
                active={active === key}
                weight={weightFor(key)}
                quality={quality}
                idle={idle}
                expanded={hovered === key || focused === key}
                onHoverChange={handleHover}
                onFocusChange={handleFocus}
                index={index}
              />
            ) : (
              <Pill key={key} pill={PILLS[key]} />
            ),
          )}
        </div>

        <LogoLink animated={animated} />

        <div className="flex items-center justify-start" style={{ gap: SPEC.header.groupGap }}>
          {(['about', 'contact'] as const).map((key, index) =>
            animated ? (
              <MotionPill
                key={key}
                pillKey={key}
                pill={PILLS[key]}
                active={active === key}
                weight={weightFor(key)}
                quality={quality}
                idle={idle}
                expanded={hovered === key || focused === key}
                onHoverChange={handleHover}
                onFocusChange={handleFocus}
                index={index + 2}
              />
            ) : (
              <Pill key={key} pill={PILLS[key]} />
            ),
          )}
        </div>
      </div>
      {/* 3.2 bottom border 1px #2b2b2b. At 1x the Figma export rasterizes it
          across rows 169 (partial) + 170 (full), i.e. centered ~0.55px lower
          than border-box placement inside the 115.1 header, so it is drawn
          here absolutely (2px bar from calc(100% - 1.1px)) to sit on the same
          device rows without touching layout. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0"
        style={{ top: 'calc(100% - 1.1px)', height: '2px', background: 'var(--dark-2)' }}
      />
    </nav>
  );
}

/** Derived mobile header below 1280: logo left, Menu pill right. */
function MobileHeader({ animated, onOpen }: { animated: boolean; onOpen: () => void }) {
  return (
    <nav aria-label="Primary mobile" className="block xl:hidden">
      <div
        className="flex w-full items-center justify-between"
        style={{
          height: SPEC.header.height,
          paddingInline: SPEC.header.padXFluid,
          paddingBlock: SPEC.header.padY,
          borderBottom: '1px solid var(--dark-2)',
        }}
      >
        <LogoLink animated={animated} />
        <button
          type="button"
          onClick={onOpen}
          aria-expanded={false}
          aria-controls="mobile-menu"
          className="inline-flex items-center justify-center border"
          style={{
            height: SPEC.pill.height,
            paddingInline: SPEC.pill.padX,
            paddingBlock: SPEC.pill.padY,
            borderRadius: SPEC.pill.radiusVar,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--ink)',
            background: 'var(--pink-soft)',
          }}
        >
          <span style={{ ...labelStyle, fontSize: SPEC.pill.fontSize, lineHeight: SPEC.pill.lineHeight, letterSpacing: SPEC.pill.lsEm }}>Menu</span>
        </button>
      </div>
    </nav>
  );
}

export function Nav() {
  const staticMode = useStaticMode();
  const { quality } = useMotion();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<PillKey | null>(null);
  const [barHidden, setBarHidden] = useState(false);
  const fixed = useRef<HTMLDivElement>(null);
  const animated = !staticMode;

  // Header hide/return (MOTION_SPEC 3): the whole banner + header bar moves
  // as one unit, stays at the top, and reveals on focus for keyboard users.
  useEffect(() => {
    if (!animated || !fixed.current) return;
    const bar = fixed.current;
    let hidden = false;

    const apply = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      setBarHidden(next);
      gsap.to(bar, {
        yPercent: next ? -100 : 0,
        duration: SPEC.motion.hideDuration,
        ease: EASE.glide,
        overwrite: true,
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const y = self.scroll();
        if (y <= 4) {
          apply(false);
          return;
        }
        if (self.direction === 1 && y > SPEC.motion.hideAfter) apply(true);
        else if (self.direction === -1) apply(false);
      },
    });

    const reveal = () => apply(false);
    bar.addEventListener('focusin', reveal);

    return () => {
      trigger.kill();
      bar.removeEventListener('focusin', reveal);
      gsap.killTweensOf(bar);
    };
  }, [animated]);

  // Active section spy (MOTION_SPEC 3): resolve the section crossing 45% of
  // the viewport. Work, Services, About and CTA/Footer map to pills; the
  // other sections clear the indicator back to the Figma static emphasis.
  useEffect(() => {
    if (!animated) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main [data-section]'));
    if (!sections.length) return;

    let ranges: Array<{ key: PillKey | null; top: number; bottom: number }> = [];

    const measure = () => {
      const scroll = window.scrollY;
      ranges = sections.map((section) => {
        const rect = section.getBoundingClientRect();
        return {
          key: SECTION_PILL[section.dataset.section ?? ''] ?? null,
          top: rect.top + scroll,
          bottom: rect.bottom + scroll,
        };
      });
    };

    const update = (scroll: number) => {
      const line = scroll + window.innerHeight * SPEC.motion.activeLine;
      let next: PillKey | null = null;
      for (const range of ranges) {
        if (line >= range.top && line < range.bottom) {
          next = range.key;
          break;
        }
      }
      setActive((prev) => (prev === next ? prev : next));
    };

    measure();
    update(window.scrollY);

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => update(self.scroll()),
      onRefresh: () => {
        measure();
        update(window.scrollY);
      },
    });

    return () => trigger.kill();
  }, [animated]);

  return (
    <header data-section="nav" className="relative w-full bg-cream" style={{ height: SPEC.section.height }}>
      {animated ? (
        <div
          ref={fixed}
          className="fixed inset-x-0 top-0 z-50 w-full"
          style={{ background: 'var(--cream)', willChange: 'transform' }}
        >
          <Banner animated idle={barHidden} />
          <DesktopHeader animated active={active} quality={quality} idle={barHidden} />
          <MobileHeader animated onOpen={() => setOpen(true)} />
        </div>
      ) : (
        <>
          <Banner animated={false} idle={false} />
          <DesktopHeader animated={false} active={null} quality={quality} idle={false} />
          <MobileHeader animated={false} onOpen={() => setOpen(true)} />
        </>
      )}

      <MobileMenu open={open} onClose={() => setOpen(false)} animated={animated} />
    </header>
  );
}
