// Organic blob geometry for the custom cursor, MOTION_SPEC 2.2. A closed
// 8-point Catmull-Rom ring, so the path stays smooth while the radius wobbles
// with pointer velocity. `rx` and `ry` morph between the contextual states;
// the cursor component re-renders the path every tick from the current numbers.

export type BlobShape = {
  /** Centre in viewBox units. */
  cx: number;
  cy: number;
  /** Base radii before wobble. */
  rx: number;
  ry: number;
  /** 0 to about 0.2, scales every point independently. */
  wobble?: number;
  /** Phase in radians, advanced by the ticker. */
  phase?: number;
};

const POINTS = 8;
const TAU = Math.PI * 2;
// Golden angle spreads the wobble around the ring without a visible seam.
const GOLDEN = 2.399963;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Returns a closed smooth path. Same point count and command order for every
 * shape, so GSAP could also tween the string if a caller ever needs it.
 */
export function blobPath({
  cx,
  cy,
  rx,
  ry,
  wobble = 0,
  phase = 0,
}: BlobShape): string {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < POINTS; i += 1) {
    const angle = (i / POINTS) * TAU;
    const scale = 1 + wobble * Math.sin(phase + i * GOLDEN);
    points.push([
      cx + Math.cos(angle) * rx * scale,
      cy + Math.sin(angle) * ry * scale,
    ]);
  }

  let path = `M${round(points[0][0])} ${round(points[0][1])}`;
  for (let i = 0; i < POINTS; i += 1) {
    const p0 = points[(i - 1 + POINTS) % POINTS];
    const p1 = points[i];
    const p2 = points[(i + 1) % POINTS];
    const p3 = points[(i + 2) % POINTS];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    path += `C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(p2[0])} ${round(p2[1])}`;
  }
  return `${path}Z`;
}
