// Sticker label (DESIGN_SPEC 5.2 and 1.2 typography table): padding 8px 12px,
// border 0.5px solid #e9e9e9, radius 4, bg per usage, text Outfit 400 16/20.16
// ls -0.16 centered (rotation varies per section: +2.81 here, -2.00 services,
// -5.40 about, +3.96 testimonials, text black).

import type { CSSProperties, HTMLAttributes } from 'react';
import clsx from 'clsx';

// Exact geometry from DESIGN_SPEC 5.2 (label anatomy).
const SPEC = {
  padX: '12px',
  padY: '8px',
  radiusVar: 'var(--r-label)',
  fontSize: '16px',
  lineHeight: '20.16px',
  lsEm: '-0.01em', // -0.16px at 16px
} as const;

export type StickerLabelProps = {
  label: string;
  /** Fill as a token string, e.g. var(--yellow) (see 5.2, 7, 8, 9). */
  fill: string;
  /** Rotation in degrees, verbatim from the releavant section table. */
  rotate?: number;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'style'>;

export function StickerLabel({ label, fill, rotate = 0, className, ...rest }: StickerLabelProps) {
  const style: CSSProperties = {
    transform: rotate ? `rotate(${rotate}deg)` : undefined,
    transformOrigin: 'center center',
    background: fill,
    paddingInline: SPEC.padX,
    paddingBlock: SPEC.padY,
    borderRadius: SPEC.radiusVar,
    fontSize: SPEC.fontSize,
    lineHeight: SPEC.lineHeight,
    letterSpacing: SPEC.lsEm,
    color: 'var(--ink)',
    fontFamily: 'var(--ff-outfit)',
  };
  return (
    <span
      className={clsx('inline-block whitespace-nowrap border', className)}
      style={{ borderWidth: '0.5px', borderStyle: 'solid', borderColor: 'var(--sticker-border)', ...style }}
      {...rest}
    >
      <span className="inline-block">{label}</span>
    </span>
  );
}
