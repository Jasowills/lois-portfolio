// Motion context, MOTION_SPEC section 1: one provider exposes the quality
// tier, reduced-motion state, the live scroll velocity and programmatic
// scrolling. Velocity and the Lenis instance live in refs so per-frame
// updates never re-render the React tree.
import { createContext, useContext, type MutableRefObject } from 'react';
import type Lenis from 'lenis';
import type { ScrollToOptions } from 'lenis';
import type { QualityTier } from './quality';

export type ScrollTarget = number | string | HTMLElement;
export type ScrollTo = (target: ScrollTarget, options?: ScrollToOptions) => void;

export type MotionContextValue = {
  /** Resolved quality tier; can step down once per session (section 13). */
  quality: QualityTier;
  /** True when prefers-reduced-motion or ?static=1 is active. */
  reducedMotion: boolean;
  /** Signed Lenis velocity in px per frame-ish, written every tick. */
  velocity: MutableRefObject<number>;
  /** Smooth-scroll instance; null in static mode or before boot. */
  lenisRef: MutableRefObject<Lenis | null>;
  /** Smooth scroll with the spec's 1.4s glide, native fallback in static mode. */
  scrollTo: ScrollTo;
};

// Safe defaults for a hook used outside the provider (tests, stories). The
// fallback is deliberately static: no hidden motion without a provider.
const FALLBACK: MotionContextValue = {
  quality: 'low',
  reducedMotion: true,
  velocity: { current: 0 },
  lenisRef: { current: null },
  scrollTo: () => undefined,
};

export const MotionContext = createContext<MotionContextValue | null>(null);

/** Full motion context: tier, reduced-motion flag, velocity and scrolling. */
export function useMotion(): MotionContextValue {
  return useContext(MotionContext) ?? FALLBACK;
}

/** Quality tier for gating expensive effects (MOTION_SPEC section 13). */
export function useQuality(): QualityTier {
  return useMotion().quality;
}

/** True when the page must render the exact static design. */
export function useReducedMotion(): boolean {
  return useMotion().reducedMotion;
}

/**
 * Live signed scroll velocity. Read `velocity.current` inside a GSAP ticker
 * or ScrollTrigger callback; do not read it during render.
 */
export function useScrollVelocity(): MutableRefObject<number> {
  return useMotion().velocity;
}
