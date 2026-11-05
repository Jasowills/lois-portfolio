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
} as const;

/** CSS equivalents for motion/react and CSS transitions. */
export const EASE_CSS = {
  snap: 'cubic-bezier(0.2, 0.9, 0.2, 1)',
  pop: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  glide: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const DURATION = {
  micro: 0.24,
  hover: 0.35,
  entrance: 1.05,
  section: 1.2,
  stagger: 0.08,
} as const;
