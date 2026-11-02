import { useEffect, useState, type ReactNode } from 'react';
import { STATIC_QUERY, StaticModeContext } from './useStaticMode';

function readStaticMode(): boolean {
  if (typeof window === 'undefined') return false;
  const forced = new URLSearchParams(window.location.search).get(STATIC_QUERY);
  return forced === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Motion provider. Phase 0 ships the static gate only: useStaticMode() is true
 * when ?static=1 is present or prefers-reduced-motion is set. In that mode the
 * page renders the exact static DESIGN_SPEC state with zero motion, no loader,
 * no custom cursor and no WebGL (MOTION_SPEC section 0).
 *
 * Phase 12 extends this provider with the Lenis and GSAP core.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [staticMode] = useState(readStaticMode);

  useEffect(() => {
    document.documentElement.dataset.static = staticMode ? '1' : '0';
    return () => {
      delete document.documentElement.dataset.static;
    };
  }, [staticMode]);

  return <StaticModeContext.Provider value={staticMode}>{children}</StaticModeContext.Provider>;
}
