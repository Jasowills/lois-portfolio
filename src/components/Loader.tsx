// Intro loader, MOTION_SPEC section 2.1. First visit per session only:
// cream cover, yellow cloud logo at 2.2x inflating with squash and stretch,
// sparkle twinkle, then a GSAP Flip flight into the real nav logo while the
// cover is punched out by the CTA blob path, scaled from the logo centre.
// Static mode and prefers-reduced-motion render nothing at all.
import { useId, useLayoutEffect, useRef, useState } from 'react';import { Flip, gsap } from '../motion/gsap';
import { EASE } from '../motion/ease';
import { useStaticMode } from '../motion/useStaticMode';
import { Logo } from './svg/Logo';

const LOADER_KEY = 'lois:loader-seen';

// Exact geometry and timings from MOTION_SPEC 2.1. The blob numbers are the
// DESIGN_SPEC section 2 CTA blob viewBox, used only as a mask here.
const SPEC = {
  logo: { width: 141, height: 76, scale: 2.2 },
  blob: { width: 1315, height: 671, scale: 2.4 },
  // Sparkle above the "i", copied verbatim from the nav logo artwork.
  sparkle: { x: 73.93, y: 25.08 },
  timing: {
    squash: 0.18,
    settle: 0.6,
    sparkle: 0.2,
    minIntro: 0.8,
    flip: 0.72,
    wipeDelay: 0.08,
    wipe: 0.82,
    fade: 0.16,
    fontTimeout: 2.5,
  },
} as const;

const BLOB_PATH =
  'M414.09 48.0271C313.214 23.102 178.28 -9.96998 73.1197 46.0829C24.604 71.9411 -7.52552 118.502 3.00608 163.208C10.722 195.936 39.0342 223.52 52.4965 255.127C101.919 371.204 -66.336 518.582 48.7129 618.037C167.457 720.688 376.695 600.425 525.809 621.274C591.077 630.401 648.635 662.415 714.478 668.623C844.681 680.892 960.007 590.558 1091.13 593.279C1147.9 594.462 1238.09 621.253 1288.82 580.592C1357.1 525.858 1266.71 439.293 1249.99 388.061C1213.93 277.607 1360.91 138.043 1253.31 43.581C1104.61 -86.9554 754.919 132.252 414.09 48.0271Z';

const SPARKLE_PATH =
  'M73.93 27.848a.49.49 0 0 1-.478-.38l-.144-.619a2.2 2.2 0 0 0-.934-1.343l-.146-.096a.49.49 0 0 1-.22-.42.49.49 0 0 1 .238-.41c.53-.32.905-.85 1.027-1.459l.095-.47a.485.485 0 0 1 .473-.394h.008c.23 0 .425.154.477.38l.144.619a2.2 2.2 0 0 0 .934 1.343l.147.096a.49.49 0 0 1 .22.419.48.48 0 0 1-.238.41 2.2 2.2 0 0 0-1.028 1.459l-.094.47a.486.486 0 0 1-.474.394h-.007z';

function shouldRunLoader(): boolean {
  if (typeof window === 'undefined') return false;
  const forced = new URLSearchParams(window.location.search).get('static');
  if (forced === '1') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    return sessionStorage.getItem(LOADER_KEY) !== '1';
  } catch {
    return true;
  }
}

export function Loader() {
  const staticMode = useStaticMode();
  const [visible, setVisible] = useState(() => !staticMode && shouldRunLoader());
  const stage = useRef<HTMLDivElement>(null);
  const sparkle = useRef<SVGPathElement>(null);
  const blobPosition = useRef<SVGGElement>(null);
  const blobScale = useRef<SVGGElement>(null);
  const rawId = useId();
  const maskId = `loader-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useLayoutEffect(() => {
    if (!visible) return;

    try {
      sessionStorage.setItem(LOADER_KEY, '1');
    } catch {
      // Private mode: the loader simply runs on every visit there.
    }

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const animations: gsap.core.Animation[] = [];
    let fontTimer = 0;
    let exitTimer = 0;
    let cancelled = false;
    let navTarget: SVGElement | null = null;
    let navOpacity = '';

    const centreX = window.innerWidth / 2;
    const centreY = window.innerHeight / 2;
    if (blobPosition.current) {
      blobPosition.current.setAttribute('transform', `translate(${centreX} ${centreY})`);
    }

    const intro = gsap.timeline();
    intro
      .fromTo(
        stage.current,
        { scaleX: 0, scaleY: 0 },
        {
          scaleX: 0.86,
          scaleY: 1.18,
          duration: SPEC.timing.squash,
          ease: 'power2.out',
        },
      )
      .to(stage.current, {
        scaleX: 1,
        scaleY: 1,
        duration: SPEC.timing.settle,
        ease: EASE.pop,
      });
    animations.push(intro);

    if (sparkle.current) {
      gsap.set(sparkle.current, {
        svgOrigin: `${SPEC.sparkle.x} ${SPEC.sparkle.y}`,
      });
      // A 45 degree twinkle that settles back into the exact static artwork,
      // so the crossfade to the nav logo has no orientation snap.
      const sparkleTween = gsap
        .timeline({ delay: 0.16 })
        .fromTo(
          sparkle.current,
          { scale: 0, rotate: -45 },
          {
            scale: 1.2,
            rotate: -22.5,
            duration: SPEC.timing.sparkle,
            ease: 'power2.out',
          },
        )
        .to(sparkle.current, {
          scale: 1,
          rotate: 0,
          duration: SPEC.timing.sparkle,
          ease: 'power2.inOut',
        });
      animations.push(sparkleTween);
    }

    const exit = () => {
      if (cancelled) return;

      const target = Array.from(
        document.querySelectorAll<SVGElement>('[data-nav-logo]'),
      ).find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (target && stage.current) {
        // Hide the real logo before the hole opens. The flying logo is the
        // shared element and hands back to the nav logo as it lands.
        navTarget = target;
        navOpacity = target.style.opacity;
        gsap.set(target, { opacity: 0 });

        const flip = Flip.fit(stage.current, target, {
          scale: true,
          duration: SPEC.timing.flip,
          ease: EASE.glide,
        }) as gsap.core.Tween | null;
        if (flip) animations.push(flip);
        animations.push(
          gsap.to(target, {
            opacity: 1,
            duration: SPEC.timing.fade,
            delay: SPEC.timing.flip - SPEC.timing.fade,
          }),
        );
        animations.push(
          gsap.to(stage.current, {
            opacity: 0,
            duration: SPEC.timing.fade,
            delay: SPEC.timing.flip - SPEC.timing.fade,
          }),
        );
      } else {
        animations.push(
          gsap.to(stage.current, {
            opacity: 0,
            duration: SPEC.timing.fade,
          }),
        );
      }

      if (blobScale.current) {
        const wipe = gsap.fromTo(
          blobScale.current,
          { scale: 0, svgOrigin: '0 0' },
          {
            scale: SPEC.blob.scale,
            svgOrigin: '0 0',
            duration: SPEC.timing.wipe,
            delay: SPEC.timing.wipeDelay,
            ease: EASE.glide,
            onComplete: () => {
              if (!cancelled) setVisible(false);
            },
          },
        );
        animations.push(wipe);
      } else {
        setVisible(false);
      }
    };

    const started = performance.now();
    const timeout = new Promise<void>((resolve) => {
      fontTimer = window.setTimeout(resolve, SPEC.timing.fontTimeout * 1000);
    });
    const fonts = document.fonts
      ? document.fonts.ready.then(() => undefined)
      : Promise.resolve();

    Promise.race([fonts, timeout]).then(() => {
      if (cancelled) return;
      const elapsed = (performance.now() - started) / 1000;
      const wait = Math.max(0, SPEC.timing.minIntro - elapsed);
      exitTimer = window.setTimeout(exit, wait * 1000);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fontTimer);
      window.clearTimeout(exitTimer);
      for (const animation of animations) animation.kill();
      if (navTarget) navTarget.style.opacity = navOpacity;
      root.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* The cream cover is an SVG rect punched by a black blob inside a
          white mask. Scaling the black blob opens a cloud-shaped hole. */}
      <svg
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <rect width="100%" height="100%" fill="white" />
            <g ref={blobPosition}>
              <g ref={blobScale} transform="scale(0)">
                <path
                  d={BLOB_PATH}
                  fill="black"
                  transform={`translate(${-SPEC.blob.width / 2} ${-SPEC.blob.height / 2})`}
                />
              </g>
            </g>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="var(--cream)" mask={`url(#${maskId})`} />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div
          ref={stage}
          style={{
            width: `${SPEC.logo.width * SPEC.logo.scale}px`,
            height: `${SPEC.logo.height * SPEC.logo.scale}px`,
            position: 'relative',
            transform: 'scale(0)',
            willChange: 'transform, opacity',
          }}
        >
          <Logo variant="nav" width="100%" height="100%" />
          {/* Separate sparkle overlay so it can twinkle independently of the
              single-piece logo artwork. It lands back on the static sparkle. */}
          <svg
            viewBox={`0 0 ${SPEC.logo.width} ${SPEC.logo.height}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path ref={sparkle} d={SPARKLE_PATH} fill="var(--ink-warm)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
