// Quality tiers and the runtime frame guard, MOTION_SPEC section 13.
// Detection runs once at boot; the guard can only step down in a session.
import { gsap } from './gsap';

export type QualityTier = 'high' | 'medium' | 'low';

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** Tier detection per MOTION_SPEC 13. Safe in non-browser environments. */
export function detectQuality(): QualityTier {
  if (typeof window === 'undefined') return 'medium';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';

  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return 'low';

  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  if (coarse && (memory < 4 || cores < 4)) return 'low';
  if (memory >= 8 || cores >= 8) return 'high';
  return 'medium';
}

const TIER_ORDER: QualityTier[] = ['high', 'medium', 'low'];

/**
 * Rolling 60-frame average of gsap.ticker delta. Above 24ms mean frame time
 * the page steps down one tier. Returns a cleanup function.
 */
export function startQualityGuard(
  current: QualityTier,
  onChange: (tier: QualityTier) => void,
): () => void {
  if (current === 'low') return () => {};

  let tier: QualityTier = current;
  let frames = 0;
  let total = 0;

  const tick = (_time: number, deltaTime: number) => {
    frames += 1;
    total += deltaTime;
    if (frames < 60) return;

    const average = total / frames;
    frames = 0;
    total = 0;
    if (average <= 24) return;

    const index = TIER_ORDER.indexOf(tier);
    tier = TIER_ORDER[Math.min(TIER_ORDER.length - 1, index + 1)];
    onChange(tier);
    if (tier === 'low') gsap.ticker.remove(tick);
  };

  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
