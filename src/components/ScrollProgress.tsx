// Stitched scroll progress, MOTION_SPEC 2.3. A 4px dashed line fixed to the
// viewport top, drawn in ink as the page scrolls, with a small needle at the
// head. The whole strip is a real button that glides back to the top.
//
// It renders nothing in static, reduced-motion or low-tier mode, so it cannot
// affect the static visual diff. The SVG has no viewBox on purpose: user units
// equal CSS pixels, keeping the stitches exactly 8px / 6px at every width.

import { useEffect, useId, useRef } from 'react';
import { useMotion } from '../motion/useMotion';

const SPEC = {
  height: 10,
  lineY: 5,
  stroke: 4,
  dash: 8,
  gap: 6,
  needleLength: 10,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ScrollProgress() {
  const { quality, reducedMotion, scrollTo } = useMotion();
  const enabled = !reducedMotion && quality !== 'low';
  const clipId = `scroll-progress-${useId().replace(/[:]/g, '')}`;

  const svgRef = useRef<SVGSVGElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const needleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;

    const update = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const width = svg.getBoundingClientRect().width;
      if (width <= 0) return;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;

      rectRef.current?.setAttribute('width', String(width * progress));
      const needleX = Math.min(width - SPEC.needleLength, width * progress);
      needleRef.current?.setAttribute(
        'transform',
        `translate(${needleX.toFixed(2)} ${SPEC.lineY})`,
      );
    };

    const request = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    document.fonts?.ready.then(request).catch(() => {});
    document.addEventListener('visibilitychange', request);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      document.removeEventListener('visibilitychange', request);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <button
      type="button"
      data-scroll-progress
      aria-label="Back to top"
      title="Back to top"
      onClick={() => scrollTo(0)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        display: 'block',
        width: '100%',
        height: SPEC.height,
        margin: 0,
        padding: 0,
        border: 0,
        background: 'transparent',
        appearance: 'none',
        cursor: 'pointer',
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height={SPEC.height}
        aria-hidden="true"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <clipPath id={clipId}>
            <rect ref={rectRef} x="0" y="0" width="0" height={SPEC.height} />
          </clipPath>
        </defs>

        {/* Resting stitch, faint; the black copy beneath is clipped open. */}
        <line
          x1="0"
          y1={SPEC.lineY}
          x2="100%"
          y2={SPEC.lineY}
          stroke="var(--progress-ink, var(--ink))"
          strokeWidth={SPEC.stroke}
          strokeDasharray={`${SPEC.dash} ${SPEC.gap}`}
          opacity={0.16}
        />
        <g clipPath={`url(#${clipId})`}>
          <line
            x1="0"
            y1={SPEC.lineY}
            x2="100%"
            y2={SPEC.lineY}
            stroke="var(--progress-ink, var(--ink))"
            strokeWidth={SPEC.stroke}
            strokeDasharray={`${SPEC.dash} ${SPEC.gap}`}
          />
        </g>

        <g ref={needleRef} transform={`translate(0 ${SPEC.lineY})`}>
          <path
            d={`M0 -2 L${SPEC.needleLength} 0 L0 2 Z`}
            fill="var(--progress-ink, var(--ink))"
          />
          <circle cx="2.2" cy="0" r="0.85" fill="var(--bg, var(--cream))" />
        </g>
      </svg>
    </button>
  );
}
