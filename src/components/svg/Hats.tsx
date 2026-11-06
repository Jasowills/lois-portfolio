// Four tiny outlined hats for the Experience cards (MOTION_SPEC 6). Each
// title's first letter wears one while its card is hovered: cap, top hat,
// beret, bobble. Simple 24x24 line art in the brand palette, drawn with
// currentColor for the outline so the card sets the ink.

import type { SVGProps } from 'react';

type HatProps = SVGProps<SVGSVGElement>;

const shared = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** Baseball cap, brim to the right, yellow crown. */
export function Cap(rest: HatProps) {
  return (
    <svg {...shared} {...rest}>
      <path
        d="M4 15a8 8 0 0 1 16 0v.6H4V15Z"
        fill="var(--yellow)"
      />
      <path
        d="M4.4 15.6h16.9c.9 0 1.6.8 1.2 1.6-.3.8-1 1.2-1.9 1.2H5.3c-.9 0-1.6-.6-1.9-1.3-.2-.7.2-1.5 1-1.5Z"
        fill="var(--yellow)"
      />
      <path d="M12 7.2v8.4M12 6.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" fill="currentColor" />
    </svg>
  );
}

/** Top hat, blue crown with a pink band. */
export function TopHat(rest: HatProps) {
  return (
    <svg {...shared} {...rest}>
      <path d="M7 4.4h10v11.2H7z" fill="var(--blue)" />
      <path d="M7 11.6h10v2.2H7z" fill="var(--pink)" />
      <path d="M4 15.6h16v1.6c0 .6-.5 1-1.1 1H5.1c-.6 0-1.1-.4-1.1-1v-1.6Z" fill="var(--blue)" />
      <path d="M7 4.4h10" />
    </svg>
  );
}

/** Beret, pink, with a little stem. */
export function Beret(rest: HatProps) {
  return (
    <svg {...shared} {...rest}>
      <path
        d="M3.2 13.7c0-3.1 3.9-5.6 8.8-5.6s8.8 2.5 8.8 5.6c0 2.6-3.9 4.3-8.8 4.3s-8.8-1.7-8.8-4.3Z"
        fill="var(--pink)"
      />
      <path d="M3.2 13.7c0 2.2 3.9 4 8.8 4s8.8-1.8 8.8-4" />
      <path d="M12.1 8.2c0-1.5-.5-2.5-1.5-3.1" />
    </svg>
  );
}

/** Bobble hat, lime, with a yellow pom. */
export function Bobble(rest: HatProps) {
  return (
    <svg {...shared} {...rest}>
      <path d="M4.3 15.2a7.7 7.7 0 0 1 15.4 0v1.4H4.3v-1.4Z" fill="var(--lime)" />
      <path d="M3.2 15.4h17.6v2.2c0 .6-.5 1-1.1 1H4.3c-.6 0-1.1-.4-1.1-1v-2.2Z" fill="var(--lime)" />
      <circle cx="12" cy="5.6" r="2.6" fill="var(--yellow)" />
      <path d="M12 8.2v1" />
    </svg>
  );
}
