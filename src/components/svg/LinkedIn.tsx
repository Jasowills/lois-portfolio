// LinkedIn "in" glyph, exact vector path from the Figma footer export (glyph frame
// 31.4x29.6 on a 32x30 canvas, DESIGN_SPEC section 10.2 social squares). Uses
// currentColor so usage sets the color.

import type { SVGProps } from 'react';

const SPEC = { width: 32, height: 30, viewBox: '0 0 32 30' }; // Figma footer glyph export, DESIGN_SPEC 10.2

export function LinkedIn({ ...rest }: SVGProps<SVGSVGElement>) {
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
        d="M6.66625 3.33479C6.66581 4.21879 6.31422 5.06641 5.68883 5.69118C5.06343 6.31595 4.21546 6.6667 3.33146 6.66626C2.44746 6.66581 1.59984 6.31422 0.975072 5.68883C0.350302 5.06343 -0.000441583 4.21546 4.17243e-07 3.33146C0.000442417 2.44746 0.352034 1.59984 0.977429 0.975072C1.60282 0.350302 2.45079 -0.000441583 3.33479 4.17243e-07C4.21879 0.000442417 5.06641 0.352034 5.69118 0.977429C6.31595 1.60282 6.6667 2.45079 6.66625 3.33479ZM6.76625 9.13443H0.0999941V29.9998H6.76625V9.13443ZM17.2989 9.13443H10.666V29.9998H17.2323V19.0505C17.2323 12.9509 25.1818 12.3842 25.1818 19.0505V29.9998H31.7647V16.784C31.7647 6.50126 19.9988 6.88457 17.2323 11.9343L17.2989 9.13443Z"
        fill="currentColor"
      />
    </svg>
  );
}
