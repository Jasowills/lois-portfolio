// Mail envelope glyph, exact vector path from the Figma footer export (glyph frame
// about 32.9x26.3, DESIGN_SPEC section 10.2). The viewBox crops the (0.6px) dead
// padding at the bottom of the export so the art is the box. Uses currentColor so
// usage sets the color.

import type { SVGProps } from 'react';

const SPEC = { width: 33, height: 26.4, viewBox: '0 0 33 26.4' }; // DESIGN_SPEC 10.2 (cropped export)

export function Mail({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={SPEC.width}
      height={SPEC.height}
      viewBox={SPEC.viewBox}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M29.7 0H3.3C1.485 0 0.0165 1.485 0.0165 3.3L0 23.1C0 24.915 1.485 26.4 3.3 26.4H29.7C31.515 26.4 33 24.915 33 23.1V3.3C33 1.485 31.515 0 29.7 0ZM29.7 6.6L16.5 14.85L3.3 6.6V3.3L16.5 11.55L29.7 3.3V6.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
