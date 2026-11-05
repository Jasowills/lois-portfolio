// Motion boot, MOTION_SPEC sections 0, 1, 2.3 and 13. Static mode (?static=1
// or prefers-reduced-motion) skips Lenis, the ticker and every motion system,
// leaving the exact DESIGN_SPEC render for scripts/visual-diff.mjs.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import type { ScrollToOptions } from 'lenis';
import { gsap, ScrollTrigger } from './gsap';
import { EASE } from './ease';
import {
  MotionContext,
  type MotionContextValue,
  type ScrollTarget,
  type ScrollTo,
} from './useMotion';
import { STATIC_QUERY, StaticModeContext } from './useStaticMode';
import { detectQuality, startQualityGuard, type QualityTier } from './quality';

const SCROLL_LERP = 0.09;
const ANCHOR_DURATION = 1.4;

function readStaticMode(): boolean {
  if (typeof window === 'undefined') return false;
  const forced = new URLSearchParams(window.location.search).get(STATIC_QUERY);
  return forced === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * One provider for the whole page: Lenis wired into the GSAP ticker, GSAP
 * plugins registered on import, the quality guard, anchor scrolling and the
 * motion context consumed by every section and hook.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [staticMode] = useState(readStaticMode);
  const [quality, setQuality] = useState<QualityTier>(() =>
    readStaticMode() ? 'low' : detectQuality(),
  );
  const velocity = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);

  // Static flag plus the resolved quality tier, for CSS and the custom cursor.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.static = staticMode ? '1' : '0';
    return () => {
      delete root.dataset.static;
    };
  }, [staticMode]);

  useEffect(() => {
    document.documentElement.dataset.quality = staticMode ? 'low' : quality;
  }, [quality, staticMode]);

  // Runtime guard: average frame time over 60 frames, step down one tier,
  // never step back up in the same session (MOTION_SPEC 13).
  useEffect(() => {
    if (staticMode || quality === 'low') return;
    return startQualityGuard(quality, (next) => setQuality(next));
  }, [staticMode, quality]);

  // Lenis boot: lerp 0.09 on desktop, native touch scrolling, GSAP ticker
  // drives raf, ScrollTrigger follows every scroll event.
  useEffect(() => {
    if (staticMode) return;

    let cancelled = false;
    const instance = new Lenis({
      lerp: SCROLL_LERP,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: false,
    });
    lenisRef.current = instance;

    const onScroll = (scroll: Lenis) => {
      velocity.current = scroll.velocity;
      ScrollTrigger.update();
    };
    instance.on('scroll', onScroll);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener('resize', refresh);
    refresh();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', refresh);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.off('scroll', onScroll);
      instance.destroy();
      lenisRef.current = null;
      velocity.current = 0;
    };
  }, [staticMode]);

  // Anchor navigation: 1.4s glide, except reduced motion and modified clicks
  // which keep native behavior. The mobile menu still closes through React.
  useEffect(() => {
    if (staticMode) return;

    const onClick = (event: MouseEvent) => {
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
      const source = event.target as Element | null;
      const anchor = source?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor || (anchor.target && anchor.target !== '_self')) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      const current = lenisRef.current;
      if (!target || !current) return;

      event.preventDefault();
      current.scrollTo(target, {
        duration: ANCHOR_DURATION,
        easing: gsap.parseEase(EASE.glide),
      });
      history.pushState(null, '', href);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [staticMode]);

  // Smooth scrolling for overlays, the services tour and back-to-top later.
  const scrollTo = useCallback<ScrollTo>((target: ScrollTarget, options?: ScrollToOptions) => {
    const current = lenisRef.current;
    if (current) {
      current.scrollTo(target, {
        duration: ANCHOR_DURATION,
        easing: gsap.parseEase(EASE.glide),
        ...options,
      });
      return;
    }

    // Static or pre-boot: jump without smoothing, same destination.
    if (typeof target === 'number') {
      window.scrollTo(0, target);
      return;
    }
    const element =
      typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    element?.scrollIntoView({ block: 'start' });
  }, []);

  const value = useMemo<MotionContextValue>(
    () => ({
      quality: staticMode ? 'low' : quality,
      reducedMotion: staticMode,
      velocity,
      lenisRef,
      scrollTo,
    }),
    [quality, staticMode, scrollTo],
  );

  return (
    <StaticModeContext.Provider value={staticMode}>
      <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
    </StaticModeContext.Provider>
  );
}
