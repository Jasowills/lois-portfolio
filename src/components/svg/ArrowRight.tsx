// Arrow-right icon, exact vector path from the Figma master (icon / arrow-right,
// 24x24, per DESIGN_SPEC section 3, the nav Contact pill trailing icon; glyph
// 20x10 inside the box). Uses currentColor: white in the dark Contact pill.

import type { SVGProps } from 'react';

const SPEC = { width: 24, height: 24 }; // DESIGN_SPEC sections 2 and 3

export function ArrowRight({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={SPEC.width} height={SPEC.height} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path
        d="M21.7071 12.7071C22.0976 12.3166 22.0976 11.6834 21.7071 11.2929L17.7071 7.29289C17.3166 6.90237 16.6834 6.90237 16.2929 7.29289C15.9024 7.68342 15.9024 8.31658 16.2929 8.70711L18.5858 11L3 11C2.44772 11 2 11.4477 2 12C2 12.5523 2.44772 13 3 13L18.5858 13L16.2929 15.2929C15.9024 15.6834 15.9024 16.3166 16.2929 16.7071C16.6834 17.0976 17.3166 17.0976 17.7071 16.7071L21.7071 12.7071Z"
        fill="currentColor"
      />
    </svg>
  );
}
