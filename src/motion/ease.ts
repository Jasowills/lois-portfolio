// Named easings, MOTION_SPEC section 0. Every GSAP timeline imports these
// names instead of inventing local curves. CSS strings mirror the same curves
// for Motion and CSS transitions.
import { CustomEase } from './gsap';

CustomEase.create('snap', 'M0,0 C0.2,0.9 0.2,1 1,1');
CustomEase.create('pop', 'M0,0 C0.34,1.56 0.64,1 1,1');
CustomEase.create('glide', 'M0,0 C0.16,1 0.3,1 1,1');
CustomEase.create(
  'swing',
  'M0,0 C.2,0 .1,1.4 .45,1.1 .7,.92 .85,1.03 1,1',
);
// Squash and stretch for the logo. The spec names the pair but not the curve,
// so this is the damped settle used for scaleX/scaleY (MOTION_SPEC 0).
CustomEase.create('squash', 'M0,0 C.3,0 .2,1.3 .5,1.15 .75,1 .9,.97 1,1');

export const EASE = {
  snap: 'snap',
  pop: 'pop',
  glide: 'glide',
  swing: 'swing',
  squash: 'squash',
  // MOTION_SPEC 4.1 names back.out(1.5) for the card-deal rotation.
  deal: 'back.out(1.5)',
} as const;

type Bezier = [number, number, number, number];

const SNAP: Bezier = [0.2, 0.9, 0.2, 1];
const POP: Bezier = [0.34, 1.56, 0.64, 1];
const GLIDE: Bezier = [0.16, 1, 0.3, 1];

/** Cubic-bezier tuples for motion/react, which rejects CSS strings. */
export const EASE_BEZIER = { snap: SNAP, pop: POP, glide: GLIDE };

/** CSS equivalents for motion/react and CSS transitions. */
export const EASE_CSS = {
  snap: `cubic-bezier(${SNAP.join(', ')})`,
  pop: `cubic-bezier(${POP.join(', ')})`,
  glide: `cubic-bezier(${GLIDE.join(', ')})`,
} as const;

export const DURATION = {
  micro: 0.24,
  hover: 0.35,
  entrance: 1.05,
  section: 1.2,
  stagger: 0.08,
} as const;
