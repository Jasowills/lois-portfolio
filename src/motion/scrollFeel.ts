// Scroll-feel geometry and palette helpers, MOTION_SPEC 2.3. Pure functions
// only: the components in src/components own the GSAP wiring.
//
// Section edges are drawn as 1px-stroked SVG paths so the black border follows
// the tear or blob contour. The viewBox width is the measured section width, so
// the 24px teeth stay 24px at every breakpoint instead of scaling with the page.

/** Height of the boundary strip. MOTION_SPEC 2.3: 24px teeth. */
export const EDGE_HEIGHT = 24;

/** Tear tooth width. MOTION_SPEC 2.3: 24px teeth. */
export const EDGE_TOOTH = 24;

/** Vertical parallax travel in px for data-depth 1. Depth range is -0.2..0.4. */
export const DEPTH_TRAVEL = 80;

export type EdgeVariant = 'tear' | 'blob';

export type EdgePaths = {
  /** Closed shape filled with the previous section colour. */
  fill: string;
  /** Open contour carrying the 1px ink stroke. */
  line: string;
};

type Point = { x: number; y: number };

const round = (value: number) => Math.round(value * 100) / 100;

const toCommand = (point: Point, first: boolean) =>
  `${first ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`;

/**
 * Scissors-cut edge: 24px teeth alternating between the strip top and a 6.5px
 * valley. Returns the filled region and the contour for the stroke.
 */
export function tearEdgePaths(width: number): EdgePaths {
  const safeWidth = Math.max(1, width);
  const count = Math.max(1, Math.round(safeWidth / EDGE_TOOTH));
  const step = safeWidth / count;
  const points: Point[] = [];
  for (let i = 0; i <= count; i += 1) {
    // 0.5px inset keeps the 1px stroke inside the 24px strip.
    points.push({ x: i * step, y: i % 2 === 0 ? EDGE_HEIGHT - 0.5 : 6.5 });
  }

  const line = points.map((point, i) => toCommand(point, i === 0)).join(' ');
  const fill = `${line} L${round(safeWidth)} 0 L0 0 Z`;
  return { fill, line };
}

const BLOB_DEPTHS = [23, 10, 19, 7.5, 22, 12, 18, 8, 23, 11, 20, 9];

/** Catmull-Rom to cubic bezier, the same smoothing as the cursor blob. */
function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  let path = toCommand(points[0], true);
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    path += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2.x)} ${round(p2.y)}`;
  }
  return path;
}

/**
 * Blob edge: wide organic lobes rather than teeth, using the same 8-point
 * control-point language as the CTA blob and cursor (MOTION_SPEC 2.3).
 */
export function blobEdgePaths(width: number): EdgePaths {
  const safeWidth = Math.max(1, width);
  const lobes = Math.max(3, Math.round(safeWidth / 260));
  const points: Point[] = [{ x: 0, y: 6.5 }];
  for (let i = 1; i < lobes; i += 1) {
    points.push({
      x: (safeWidth * i) / lobes,
      y: BLOB_DEPTHS[(i - 1) % BLOB_DEPTHS.length],
    });
  }
  points.push({ x: safeWidth, y: 6.5 });

  const line = smoothPath(points);
  const fill = `${line} L${round(safeWidth)} 0 L0 0 Z`;
  return { fill, line };
}

export function edgePaths(variant: EdgeVariant, width: number): EdgePaths {
  return variant === 'tear' ? tearEdgePaths(width) : blobEdgePaths(width);
}

/**
 * Body background per section (MOTION_SPEC 2.3). Values are token names so the
 * actual colours stay in tokens.css. About uses the right-half cream; the left
 * half is a stripe field and cannot be represented by one flat colour.
 */
export const SECTION_COLOR_VAR: Record<string, string> = {
  nav: '--cream',
  hero: '--cream-hero',
  work: '--lav-work',
  experience: '--lav-exp',
  services: '--cream',
  about: '--cream-white',
  testimonials: '--cream-white',
  cta: '--cta-bg',
  footer: '--ink-warm',
};

export type Rgb = { r: number; g: number; b: number };

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB_RE = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i;

export function parseColor(value: string): Rgb | null {
  const raw = value.trim();
  const hex = HEX_RE.exec(raw);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((digit) => digit + digit)
            .join('')
        : hex[1];
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
    };
  }

  const rgb = RGB_RE.exec(raw);
  if (rgb) {
    return {
      r: Number.parseFloat(rgb[1]),
      g: Number.parseFloat(rgb[2]),
      b: Number.parseFloat(rgb[3]),
    };
  }

  return null;
}

export function mixColor(from: Rgb, to: Rgb, progress: number): string {
  const t = Math.min(1, Math.max(0, progress));
  const channel = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${channel(from.r, to.r)} ${channel(from.g, to.g)} ${channel(from.b, to.b)})`;
}
