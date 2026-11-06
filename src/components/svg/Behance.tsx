// Behance glyph placeholder for the footer social row (DESIGN_SPEC 11.1: until
// the real social list is supplied, the two extra slots are placeholders
// flagged in OPEN_QUESTIONS). Set in the site's own display face so it renders
// crisp at any size; uses currentColor so usage sets the color.

import type { SVGProps } from 'react';

export function Behance({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <text
        x="15"
        y="21"
        textAnchor="middle"
        fontFamily="var(--ff-outfit)"
        fontWeight={700}
        fontSize={19}
        letterSpacing={-0.5}
        fill="currentColor"
      >
        Be
      </text>
    </svg>
  );
}
