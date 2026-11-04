// Button, the shared pill all CTAs are built from (DESIGN_SPEC 1.4):
// padding 16px 28px, 1px solid black border, radius 40, height 58, inner gap 8,
// optional trailing arrow icon 24x24 with gap 4, label Outfit 400 (600 for the
// View Project variant) 18/26.1 ls -0.36 color #1a160c. Fill colors are the
// per-instance values of the 1.4 table and are passed in as token strings.

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight } from '../svg/ArrowUpRight';
import { ArrowRight } from '../svg/ArrowRight';
import clsx from 'clsx';

// Exact geometry from the spec table (DESIGN_SPEC 1.4 + 1.3 radius).
const SPEC = {
  height: '58px',
  padX: '28px',
  padY: '16px',
  radiusVar: 'var(--r-button)',
  gap: '8px',
  arrowGap: '4px',
  fontSize: '18px',
  lineHeight: '26.1px',
  lsEm: '-0.02em', // DESIGN_SPEC 1.4: -0.36px at 18px
} as const;

type ArrowKind = 'up-right' | 'right';

type BaseProps = {
  /** Firm label text (verbatim copy from the section using the button). */
  label: ReactNode;
  /** Button fill as a token string, e.g. var(--orange-hero) (see 1.4 table). */
  fill: string;
  /** Trailing arrow when the section spec includes one. */
  arrow?: ArrowKind;
  /** Anchor behavior; omit for a plain button. */
  href?: string;
  /** View Project variant: label 600 (DESIGN_SPEC 1.4 last row). */
  strong?: boolean;
  className?: string;
};

type ButtonProps = BaseProps &
  (AnchorHTMLAttributes<HTMLAnchorElement> | ButtonHTMLAttributes<HTMLButtonElement>);

export function Button({ label, fill, arrow, href, strong, className, ...rest }: ButtonProps) {
  const style = {
    height: SPEC.height,
    paddingInline: SPEC.padX,
    paddingBlock: SPEC.padY,
    borderRadius: SPEC.radiusVar,
    gap: arrow ? SPEC.arrowGap : SPEC.gap,
    background: fill,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--ink)',
  } as const;

  const labelStyle = {
    fontSize: SPEC.fontSize,
    lineHeight: SPEC.lineHeight,
    letterSpacing: SPEC.lsEm,
    fontWeight: strong ? 600 : 400,
    color: 'var(--ink-warm)',
    fontFamily: 'var(--ff-outfit)',
    whiteSpace: 'nowrap',
  } as const;

  const icon =
    arrow === 'right' ? <ArrowRight /> : arrow === 'up-right' ? <ArrowUpRight /> : null;

  if (href !== undefined) {
    return (
      <a href={href} className={clsx('inline-flex h-[58px] items-center justify-center', className)} style={style} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        <span style={labelStyle}>{label}</span>
        {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      </a>
    );
  }
  return (
    <button type="button" className={clsx('inline-flex h-[58px] items-center justify-center', className)} style={style} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      <span style={labelStyle}>{label}</span>
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
    </button>
  );
}
