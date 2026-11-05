// Stitched-line draw utility, MOTION_SPEC section 2.3 ("sewing" draw) and
// section 14. The visible path keeps its 8/6 dashed pattern; a white copy in
// an SVG mask draws in to reveal the dashes progressively, so the stitch never
// stretches or slides. Static mode is a no-op: callers own the resting dash
// pattern in CSS.
import { gsap, ScrollTrigger } from './gsap';

const SVG_NS = 'http://www.w3.org/2000/svg';
let uid = 0;

export type StitchOptions = {
  /** ScrollTrigger trigger; defaults to each path. */
  trigger?: Element | string;
  start?: string;
  end?: string;
  /** True for scroll-linked drawing; false for a one-shot draw on enter. */
  scrub?: boolean | number;
  duration?: number;
  ease?: string;
  /** Dash and gap lengths in px (spec: 8 and 6). */
  dash?: number;
  gap?: number;
  /** Reveal stroke width; defaults to the path's computed stroke width. */
  strokeWidth?: number;
  /** Optional SVG needle glyph moved to the drawing head. */
  needle?: SVGGraphicsElement | null;
  /** Rotate the needle to the path tangent (default true). */
  needleRotate?: boolean;
};

function isStatic(): boolean {
  if (typeof window === 'undefined') return true;
  if (document.documentElement.dataset.static === '1') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolvePaths(target: string | SVGPathElement | SVGPathElement[]): SVGPathElement[] {
  if (typeof target !== 'string') {
    return Array.isArray(target) ? target : [target];
  }
  return Array.from(document.querySelectorAll<SVGPathElement>(target));
}

function computedStroke(path: SVGPathElement): number {
  const value = Number.parseFloat(window.getComputedStyle(path).strokeWidth);
  return Number.isFinite(value) && value > 0 ? value : 4;
}

/**
 * Draws the referenced SVG paths like a running stitch. Returns a cleanup
 * function; safe to call in an effect and idempotent in static mode.
 */
export function stitch(
  target: string | SVGPathElement | SVGPathElement[],
  {
    trigger,
    start = 'top 80%',
    end = 'bottom 20%',
    scrub = true,
    duration = 0.9,
    ease = 'none',
    dash = 8,
    gap = 6,
    strokeWidth,
    needle = null,
    needleRotate = true,
  }: StitchOptions = {},
): () => void {
  if (isStatic()) return () => {};

  const paths = resolvePaths(target);
  const cleanups: (() => void)[] = [];

  for (const path of paths) {
    const svg = path.ownerSVGElement;
    if (!svg) continue;

    // One mask per path, holding a solid copy of the line. The copy draws from
    // zero length to full length, revealing the dashed original underneath.
    const maskId = `stitch-mask-${Date.now()}-${uid++}`;
    const defs =
      svg.querySelector<SVGDefsElement>('defs') ??
      svg.insertBefore(document.createElementNS(SVG_NS, 'defs'), svg.firstChild);

    const bbox = path.getBBox();
    const stroke = strokeWidth ?? computedStroke(path);
    const pad = stroke * 2 + 8;
    const mask = document.createElementNS(SVG_NS, 'mask');
    mask.setAttribute('id', maskId);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
    mask.setAttribute('x', String(bbox.x - pad));
    mask.setAttribute('y', String(bbox.y - pad));
    mask.setAttribute('width', String(bbox.width + pad * 2));
    mask.setAttribute('height', String(bbox.height + pad * 2));

    const tracer = path.cloneNode(false) as SVGPathElement;
    tracer.removeAttribute('mask');
    tracer.removeAttribute('clip-path');
    tracer.removeAttribute('id');
    tracer.setAttribute('fill', 'none');
    tracer.setAttribute('stroke', '#fff');
    tracer.setAttribute('stroke-width', String(stroke));
    tracer.setAttribute('stroke-linecap', 'round');
    tracer.setAttribute('stroke-linejoin', 'round');
    mask.appendChild(tracer);
    defs.appendChild(mask);

    const total = path.getTotalLength();
    const previousMask = path.getAttribute('mask');
    const previousDash = path.style.strokeDasharray;
    const previousOffset = path.style.strokeDashoffset;
    path.setAttribute('mask', `url(#${maskId})`);
    path.style.strokeDasharray = `${dash} ${gap}`;
    path.style.strokeDashoffset = '0';

    tracer.style.strokeDasharray = `${total} ${total}`;
    tracer.style.strokeDashoffset = String(total);

    const placeNeedle = (progress: number) => {
      if (!needle) return;
      const point = path.getPointAtLength(total * progress);
      let angle = 0;
      if (needleRotate) {
        const ahead = path.getPointAtLength(Math.min(total, total * progress + 1));
        angle = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;
      }
      needle.setAttribute(
        'transform',
        `translate(${point.x} ${point.y}) rotate(${angle})`,
      );
    };

    const tween = gsap.to(tracer, {
      strokeDashoffset: 0,
      duration,
      ease,
      scrollTrigger: {
        trigger: trigger ?? path,
        start,
        end,
        scrub,
        toggleActions: 'play none none none',
        onUpdate: (self: ScrollTrigger) => placeNeedle(self.progress),
        onRefresh: (self: ScrollTrigger) => placeNeedle(self.progress),
      },
    });

    placeNeedle(scrub ? 0 : 1);

    cleanups.push(() => {
      tween.scrollTrigger?.kill();
      tween.kill();
      mask.remove();
      if (previousMask === null) path.removeAttribute('mask');
      else path.setAttribute('mask', previousMask);
      path.style.strokeDasharray = previousDash;
      path.style.strokeDashoffset = previousOffset;
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
