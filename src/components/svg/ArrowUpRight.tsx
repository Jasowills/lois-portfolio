// Arrow-up-right icon, exact vector path from the Figma master (icon / arrow-up-right,
// 24x24 box, glyph about 14.7x14.7 per DESIGN_SPEC sections 2 and 5.4). Uses
// currentColor so usage sets the color.

import type { SVGProps } from 'react';

const SPEC = { width: 24, height: 24 }; // DESIGN_SPEC section 2 icon row

export function ArrowUpRight({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={SPEC.width} height={SPEC.height} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path
        d="M12.7068 4.63599C12.1545 4.63599 11.7068 5.0837 11.7068 5.63599C11.7068 6.18827 12.1545 6.63599 12.7068 6.63599H15.9495L4.92864 17.6568C4.53811 18.0473 4.53811 18.6805 4.92864 19.071C5.31916 19.4615 5.95232 19.4615 6.34285 19.071L17.3637 8.0502V11.2928C17.3637 11.8451 17.8114 12.2928 18.3637 12.2928C18.9159 12.2928 19.3637 11.8451 19.3637 11.2928V5.63599C19.3637 5.0837 18.9159 4.63599 18.3637 4.63599H12.7068Z"
        fill="currentColor"
      />
    </svg>
  );
}
