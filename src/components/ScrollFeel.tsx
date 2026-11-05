// Page-wide scroll feel, MOTION_SPEC 2.3: velocity skew, data-depth parallax
// and the body --bg colour bleed. All three are inert under ?static=1,
// prefers-reduced-motion and the low tier. Skew is high tier only because
// section 13 explicitly removes it from medium.
//
// One owner per property: GSAP writes the scroll transforms and the root CSS
// variables; nothing here is a React state update per frame.

import { useEffect, useState } from 'react';
import { gsap, ScrollTrigger } from '../motion/gsap';
import { useMotion } from '../motion/useMotion';
import {
  DEPTH_TRAVEL,
  SECTION_COLOR_VAR,
  mixColor,
  parseColor,
} from '../motion/scrollFeel';

const SKEW_FACTOR = 0.0012;
const SKEW_MAX = 1.6;
const STRETCH_MAX = 0.004;
const SKEW_SETTLE = 0.14; // seconds, the exponential equivalent of glide
const BLEED_RANGE = 200; // px either side of the viewport centre
const DESKTOP_QUERY = '(min-width: 1024px)';

type Velocity = { current: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return desktop;
}

/** Signed scroll velocity to skewY plus a tiny scaleY stretch. */
function useVelocitySkew(enabled: boolean, velocity: Velocity) {
  useEffect(() => {
    if (!enabled) return;

    const root = document.documentElement;
    root.dataset.scrollFeel = 'on';
    root.style.setProperty('--scroll-skew', '0deg');
    root.style.setProperty('--scroll-stretch', '1');

    const state = { skew: 0, stretch: 1 };
    let paintedSkew = 0;
    let paintedStretch = 1;

    const tick = (_time: number, deltaTime: number) => {
      const target = clamp(velocity.current * SKEW_FACTOR, -SKEW_MAX, SKEW_MAX);
      const stretch =
        1 + (Math.abs(target) / SKEW_MAX) * STRETCH_MAX;

      // Exponential settle: frame-rate independent, lands like glide.
      const step = 1 - Math.exp(-Math.min(deltaTime, 50) / 1000 / SKEW_SETTLE);
      state.skew += (target - state.skew) * step;
      state.stretch += (stretch - state.stretch) * step;
      if (Math.abs(target - state.skew) < 0.002) state.skew = target;
      if (Math.abs(stretch - state.stretch) < 0.00002) state.stretch = stretch;

      if (
        Math.abs(state.skew - paintedSkew) < 0.0005 &&
        Math.abs(state.stretch - paintedStretch) < 0.00002
      ) {
        return;
      }

      paintedSkew = state.skew;
      paintedStretch = state.stretch;
      root.style.setProperty('--scroll-skew', `${state.skew.toFixed(3)}deg`);
      root.style.setProperty('--scroll-stretch', state.stretch.toFixed(5));
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      delete root.dataset.scrollFeel;
      root.style.removeProperty('--scroll-skew');
      root.style.removeProperty('--scroll-stretch');
    };
  }, [enabled, velocity]);
}

/**
 * Parallax layers. Each tagged element starts at its designed position when
 * its section enters (y 0) and drifts by depth * 80px as the section leaves.
 * Rotated stickers and cards keep their rotation: GSAP composes y with the
 * parsed transform, and cleanup only removes the inline transform.
 */
function useDepthLayers(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('main [data-depth]'),
    );
    const tweens: gsap.core.Tween[] = [];

    for (const element of elements) {
      const depth = Number.parseFloat(element.dataset.depth ?? '');
      if (!Number.isFinite(depth) || depth === 0) continue;

      const section = element.closest<HTMLElement>('[data-section]') ?? element;
      const fromTop = section.dataset.section === 'hero';

      tweens.push(
        gsap.fromTo(
          element,
          { y: 0 },
          {
            y: depth * DEPTH_TRAVEL,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: fromTop ? 'top top' : 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        ),
      );
    }

    return () => {
      for (const tween of tweens) {
        tween.scrollTrigger?.kill();
        tween.kill();
      }
      for (const element of elements) {
        gsap.set(element, { clearProps: 'transform' });
      }
    };
  }, [enabled]);
}

/**
 * Body background interpolation. The next section boundary is the one nearest
 * below the viewport centre; over 200px either side the colour lerps from the
 * previous section to the next. GSAP's ScrollTrigger drives the read so Lenis
 * and native scrolling share one source.
 */
function useColorBleed(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-section]'),
    );
    if (sections.length < 2) return;

    const rootStyle = window.getComputedStyle(document.documentElement);
    const palette = sections.map((section) => {
      const token = SECTION_COLOR_VAR[section.dataset.section ?? ''];
      const raw = token ? rootStyle.getPropertyValue(token) : '';
      return parseColor(raw) ?? { r: 255, g: 254, b: 249 };
    });

    const paint = () => {
      const center = window.scrollY + window.innerHeight / 2;
      let nextIndex = -1;
      let boundary = 0;

      for (let i = 1; i < sections.length; i += 1) {
        const top = sections[i].getBoundingClientRect().top + window.scrollY;
        if (center < top) {
          nextIndex = i;
          boundary = top;
          break;
        }
      }

      let color: string;
      if (nextIndex === -1) {
        color = mixColor(palette[palette.length - 1], palette[palette.length - 1], 1);
      } else {
        const progress = clamp(
          (center - (boundary - BLEED_RANGE)) / (BLEED_RANGE * 2),
          0,
          1,
        );
        color = mixColor(palette[nextIndex - 1], palette[nextIndex], progress);
      }

      document.body.style.setProperty('--bg', color);

      // The progress stitch is black by default; over the dark footer it
      // switches to cream so it stays visible (OPEN_QUESTIONS 42).
      const rgb = parseColor(color);
      const luminance = rgb
        ? (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
        : 1;
      document.documentElement.dataset.bgTone = luminance < 0.35 ? 'dark' : 'light';
    };

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: paint,
      onRefresh: paint,
    });
    paint();

    return () => {
      trigger.kill();
      document.body.style.removeProperty('--bg');
      delete document.documentElement.dataset.bgTone;
    };
  }, [enabled]);
}

/**
 * Mount once inside MotionProvider. Renders nothing; the visible handoff
 * strips and progress line are separate components.
 */
export function ScrollFeel() {
  const { quality, reducedMotion, velocity } = useMotion();
  const desktop = useDesktop();
  const depthOn = !reducedMotion && quality !== 'low';
  const skewOn = depthOn && desktop && quality === 'high';

  useVelocitySkew(skewOn, velocity);
  useDepthLayers(depthOn);
  useColorBleed(depthOn);

  return null;
}
