// Section handoff strips, MOTION_SPEC 2.3. An absolutely positioned 24px strip
// at the top of the incoming section, filled with the previous section colour
// and finished with a 1px ink contour. It starts 1px above the section so it
// also covers the section's own top border (absolute children are positioned
// from the padding box, so top: 0 would leave a straight line above the tear).
// The shape alternates between 24px teeth and wide blob lobes through the page.
// The strip wipes open over 0.9s with glide as the section enters, and it
// renders nothing in static, reduced-motion or low-tier mode, so the visual
// diff sees the original boundary.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EASE } from '../motion/ease';
import { gsap } from '../motion/gsap';
import { edgePaths, EDGE_HEIGHT, type EdgeVariant } from '../motion/scrollFeel';
import { useMotion } from '../motion/useMotion';

const INITIAL_REVEAL = 'inset(0% 0% 100% 0%)';
const FULL_REVEAL = 'inset(0% 0% 0% 0%)';
const WIPE_DURATION = 0.9;

type SectionEdgeProps = {
  variant: EdgeVariant;
  /** Previous section surface, normally a token string. */
  from: string;
};

export function SectionEdge({ variant, from }: SectionEdgeProps) {
  const { quality, reducedMotion } = useMotion();
  const enabled = !reducedMotion && quality !== 'low';
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1440);

  useLayoutEffect(() => {
    if (!enabled) return;
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const next = host.getBoundingClientRect().width;
      if (next > 0) setWidth(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [enabled]);

  const paths = useMemo(() => edgePaths(variant, width), [variant, width]);

  useEffect(() => {
    if (!enabled) return;
    const host = hostRef.current;
    if (!host) return;
    const section = host.closest<HTMLElement>('[data-section]');
    if (!section) return;

    const tween = gsap.fromTo(
      host,
      { clipPath: INITIAL_REVEAL },
      {
        clipPath: FULL_REVEAL,
        duration: WIPE_DURATION,
        ease: EASE.glide,
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          once: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-section-edge={variant}
      style={{
        position: 'absolute',
        top: -1,
        left: 0,
        right: 0,
        height: EDGE_HEIGHT,
        zIndex: 40,
        pointerEvents: 'none',
        clipPath: INITIAL_REVEAL,
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${EDGE_HEIGHT}`}
        preserveAspectRatio="none"
        width="100%"
        height={EDGE_HEIGHT}
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden="true"
      >
        <path d={paths.fill} fill={from} />
        <path
          d={paths.line}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
