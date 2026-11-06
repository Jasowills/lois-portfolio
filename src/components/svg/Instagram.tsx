// Instagram glyph placeholder for the footer social row (DESIGN_SPEC 11.1:
// until the real social list is supplied, the two extra slots are placeholders
// flagged in OPEN_QUESTIONS). Camera outline, 2px stroke, currentColor.

import type { SVGProps } from 'react';

export function Instagram({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={30}
      height={30}
      viewBox="0 0 30 30"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <rect x="2.4" y="2.4" width="25.2" height="25.2" rx="7.2" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="15" cy="15" r="5.8" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="22.3" cy="7.7" r="1.7" fill="currentColor" />
    </svg>
  );
}
