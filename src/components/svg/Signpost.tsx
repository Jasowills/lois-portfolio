// Signpost stand, exact Figma export of node 546:3418 minus the sign artwork
// (DESIGN_SPEC section 2 asset table: signpost 236x586, pole, ball, base).
// The five signs are HTML per DESIGN_SPEC section 11.2, so the 10 rects and
// 5 label paths from the export are dropped here on purpose.
// Gradient stops and the stand shadow verbatim from the export
// (shadow: 0 2px 6px rgba(84,84,84,0.44) per DESIGN_SPEC 1.3).

import type { SVGProps } from 'react';

const SPEC = { width: 236, height: 586 }; // DESIGN_SPEC section 2, signpost row

export function Signpost({ ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg width={SPEC.width} height={SPEC.height} viewBox="0 0 236 586" fill="none" aria-hidden="true" {...rest}>
      <defs>
        <linearGradient id="sp-base" x1="122" y1="519.981" x2="118.57" y2="610.281" gradientUnits="userSpaceOnUse">
          <stop offset="0.087" stopColor="var(--card)" />
          <stop offset="1" stopColor="var(--sign-lo)" />
        </linearGradient>
        <linearGradient id="sp-pole" x1="109.5" y1="3" x2="177.5" y2="3" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--card)" />
          <stop offset="0.862" stopColor="var(--sign-lo)" />
        </linearGradient>
        <linearGradient id="sp-ball" x1="100" y1="9" x2="174.5" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--card)" />
          <stop offset="0.709" stopColor="var(--sign-lo)" />
        </linearGradient>
        <linearGradient id="sp-ring" x1="122" y1="17" x2="159" y2="14.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--sign-hi)" />
          <stop offset="1" stopColor="var(--sign-shade)" />
        </linearGradient>
        <filter
          id="sp-shadow"
          width="142"
          height="41"
          x="47"
          y="545"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
          <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="effect1_dropShadow_546_3418" />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="3" />
          <feColorMatrix values="0 0 0 0 0.32965 0 0 0 0 0.32965 0 0 0 0 0.32965 0 0 0 0.44 0" />
          <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_546_3418" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_546_3418" result="shape" />
        </filter>
      </defs>
      <g filter="url(#sp-shadow)">
        <ellipse className="signpost-base" cx="118" cy="563.5" rx="63" ry="12.5" fill="url(#sp-base)" />
      </g>
      <path className="signpost-pole" d="M118.5 3v549" stroke="url(#sp-pole)" strokeWidth={17} />
      <g className="signpost-ball">
        <circle cx="118" cy="24" r="24" fill="url(#sp-ball)" />
        <circle cx="118" cy="24" r="23" stroke="url(#sp-ring)" strokeOpacity={0.4} strokeWidth={2} />
      </g>
    </svg>
  );
}
