// CTA blob, verbatim path from DESIGN_SPEC section 2 (the spec embeds this SVG
// as ground truth; node 546:3331 in the Figma file). The path overflows its
// viewBox slightly (negative coordinates), hence overflow visible per the
// spec note. Fill and stroke reference the exact spec values via tokens.

import type { SVGProps } from 'react';
import { CTA_BLOB_PATH } from './blobPath';

const SPEC = { width: 1315, height: 671, viewBox: '0 0 1315 671' }; // DESIGN_SPEC section 2, CTA blob row

export function CtaBlob({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={SPEC.width}
      height={SPEC.height}
      viewBox={SPEC.viewBox}
      fill="none"
      overflow="visible"
      preserveAspectRatio="none"
      aria-hidden="true"
      {...rest}
    >
      <path
        d={CTA_BLOB_PATH}
        fill="var(--cream)"
        stroke="var(--ink)"
        strokeWidth={2}
      />
    </svg>
  );
}
