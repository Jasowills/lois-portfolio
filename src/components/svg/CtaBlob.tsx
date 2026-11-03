// CTA blob, verbatim path from DESIGN_SPEC section 2 (the spec embeds this SVG
// as ground truth; node 546:3331 in the Figma file). The path overflows its
// viewBox slightly (negative coordinates), hence overflow visible per the
// spec note. Fill and stroke reference the exact spec values via tokens.

import type { SVGProps } from 'react';

const SPEC = { width: 1315, height: 671, viewBox: '0 0 1315 671' }; // DESIGN_SPEC section 2, CTA blob row

export function CtaBlob({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={SPEC.width}
      height={SPEC.height}
      viewBox={SPEC.viewBox}
      fill="none"
      overflow="visible"
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M414.09 48.0271C313.214 23.102 178.28 -9.96998 73.1197 46.0829C24.604 71.9411 -7.52552 118.502 3.00608 163.208C10.722 195.936 39.0342 223.52 52.4965 255.127C101.919 371.204 -66.336 518.582 48.7129 618.037C167.457 720.688 376.695 600.425 525.809 621.274C591.077 630.401 648.635 662.415 714.478 668.623C844.681 680.892 960.007 590.558 1091.13 593.279C1147.9 594.462 1238.09 621.253 1288.82 580.592C1357.1 525.858 1266.71 439.293 1249.99 388.061C1213.93 277.607 1360.91 138.043 1253.31 43.581C1104.61 -86.9554 754.919 132.252 414.09 48.0271Z"
        fill="var(--cream)"
        stroke="var(--ink)"
        strokeWidth={2}
      />
    </svg>
  );
}
