// Button, the shared pill all CTAs are built from (DESIGN_SPEC 1.4):
// padding 16px 28px, 1px solid black border, radius 40, height 58, inner gap 8,
// optional trailing arrow icon 24x24 with gap 4, label Outfit 400 (600 for the
// View Project variant) 18/26.1 ls -0.36 color #1a160c. Fill colors are the
// per-instance values of the 1.4 table and are passed in as token strings.
//
// Motion (MOTION_SPEC 2.5): the root is magnetic on desktop and lifts -3px on
// hover or keyboard focus; a 4px 4px hard shadow fades in, a cream sweep wipes
// across, the arrow launches up-right while a copy arrives from bottom-left,
// and a press scales to 0.96 and collapses the shadow. Reduced motion keeps
// the rest state; the visual pill never changes size or layout.

import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from 'motion/react';
import { ArrowUpRight } from '../svg/ArrowUpRight';
import { ArrowRight } from '../svg/ArrowRight';
import { useMagnetic } from '../../motion/useMagnetic';
import { useMotion } from '../../motion/useMotion';
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
  // Motion geometry from MOTION_SPEC 2.5.
  lift: -3,
  shadow: 4,
  pressScale: 0.96,
  arrowTravel: 20,
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
  /** Custom cursor override for buttons nested inside tagged regions. */
  'data-cursor'?: 'link' | 'view' | 'drag';
};

type ButtonProps = BaseProps &
  (AnchorHTMLAttributes<HTMLAnchorElement> | ButtonHTMLAttributes<HTMLButtonElement>);

const GLIDE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ROOT_VARIANTS: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1 },
  press: {
    scale: SPEC.pressScale,
    transition: { type: 'spring', stiffness: 600, damping: 32 },
  },
};

const SHADOW_VARIANTS: Variants = {
  rest: { opacity: 0, x: SPEC.shadow, y: SPEC.shadow },
  hover: {
    opacity: 1,
    x: SPEC.shadow,
    y: SPEC.shadow,
    transition: { duration: 0.2, ease: GLIDE },
  },
  press: { opacity: 0, x: 0, y: 0, transition: { duration: 0.12, ease: GLIDE } },
};

const SWEEP_VARIANTS: Variants = {
  rest: { clipPath: 'inset(0% 100% 0% 0%)' },
  hover: {
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: { duration: 0.35, ease: GLIDE },
  },
  press: { clipPath: 'inset(0% 0% 0% 0%)' },
};

function arrowVariants(kind: ArrowKind): { out: Variants; in: Variants } {
  const x = SPEC.arrowTravel;
  const y = kind === 'up-right' ? -SPEC.arrowTravel : 0;
  return {
    out: {
      rest: { x: 0, y: 0, opacity: 1 },
      hover: { x, y, opacity: 0, transition: { duration: 0.3, ease: GLIDE } },
      press: { x, y, opacity: 0 },
    },
    in: {
      rest: { x: -x, y: -y, opacity: 0 },
      hover: { x: 0, y: 0, opacity: 1, transition: { duration: 0.3, ease: GLIDE } },
      press: { x: 0, y: 0, opacity: 1 },
    },
  };
}

export function Button({ label, fill, arrow, href, strong, className, ...rest }: ButtonProps) {
  const { reducedMotion } = useMotion();
  const motionOn = !reducedMotion;
  const magnetic = useMagnetic({
    strength: 10,
    radius: 90,
    stiffness: 200,
    damping: 15,
  });

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const active = hovered || focused;

  // Hover/focus lift joins the magnetic spring on one y value, so Motion owns
  // a single transform source for the root.
  const liftTarget = useMotionValue(0);
  const lift = useSpring(liftTarget, { stiffness: 300, damping: 24 });
  const y = useTransform<number, number>(
    [magnetic.y, lift],
    ([magnet, liftValue]) => magnet + liftValue,
  );

  useEffect(() => {
    liftTarget.set(active && motionOn ? SPEC.lift : 0);
  }, [active, liftTarget, motionOn]);

  const onFocus = (event: FocusEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const target = event.currentTarget;
    // :focus-visible can settle one frame after the focus event in Chrome.
    window.requestAnimationFrame(() => {
      if (document.activeElement === target && target.matches(':focus-visible')) {
        setFocused(true);
      }
    });
  };

  const onBlur = () => setFocused(false);

  const onPointerLeave = () => {
    magnetic.onPointerLeave();
    setHovered(false);
  };

  const interaction = motionOn
    ? {
        variants: ROOT_VARIANTS,
        animate: active ? 'hover' : 'rest',
        whileTap: 'press',
        onHoverStart: () => setHovered(true),
        onHoverEnd: () => setHovered(false),
      }
    : {};

  const pillStyle: CSSProperties = {
    height: SPEC.height,
    paddingInline: SPEC.padX,
    paddingBlock: SPEC.padY,
    borderRadius: SPEC.radiusVar,
    background: fill,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--ink)',
    gap: arrow ? SPEC.arrowGap : SPEC.gap,
    flex: '1 1 auto',
  };

  const labelStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    fontSize: SPEC.fontSize,
    lineHeight: SPEC.lineHeight,
    letterSpacing: SPEC.lsEm,
    fontWeight: strong ? 600 : 400,
    color: 'var(--ink-warm)',
    fontFamily: 'var(--ff-outfit)',
    whiteSpace: 'nowrap',
  };

  const icon =
    arrow === 'right' ? <ArrowRight /> : arrow === 'up-right' ? <ArrowUpRight /> : null;
  const arrows = arrow ? arrowVariants(arrow) : null;

  const content = (
    <>
      {/* Hard sticker shadow, hidden at rest. */}
      <motion.span
        aria-hidden="true"
        data-button-shadow
        variants={SHADOW_VARIANTS}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: SPEC.radiusVar,
          background: 'var(--ink)',
          pointerEvents: 'none',
          opacity: 0,
          transform: `translate(${SPEC.shadow}px, ${SPEC.shadow}px)`,
        }}
      />

      <span
        className="relative inline-flex h-full w-full flex-1 items-center justify-center"
        style={pillStyle}
      >
        {/* Lighter sweep, clipped to the pill; sits under label and arrow. */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: SPEC.radiusVar,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <motion.span
            data-button-sweep
            variants={SWEEP_VARIANTS}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              background: 'var(--cream)',
              opacity: 0.45,
              clipPath: 'inset(0% 100% 0% 0%)',
            }}
          />
        </span>

        <span style={labelStyle}>{label}</span>

        {icon && arrows ? (
          <span
            data-button-bob
            className="relative inline-flex shrink-0"
            style={{ width: '24px', height: '24px', zIndex: 1 }}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 inline-flex overflow-hidden"
            >
              <motion.span
                data-button-arrow="out"
                variants={arrows.out}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'inline-flex',
                  opacity: 1,
                  transform: 'translate(0px, 0px)',
                }}
              >
                {icon}
              </motion.span>
              <motion.span
                data-button-arrow="in"
                variants={arrows.in}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'inline-flex',
                  opacity: 0,
                  transform: `translate(-${SPEC.arrowTravel}px, ${
                    arrow === 'up-right' ? SPEC.arrowTravel : 0
                  }px)`,
                }}
              >
                {icon}
              </motion.span>
            </span>
          </span>
        ) : null}
      </span>
    </>
  );

  const shared = {
    className: clsx(
      'relative inline-flex h-[58px] items-center justify-center rounded-[var(--r-button)]',
      className,
    ),
    ...(motionOn ? { style: { x: magnetic.x, y } } : {}),
    ...interaction,
    onFocus,
    onBlur,
    onPointerMove: magnetic.onPointerMove,
    onPointerLeave,
  };

  if (href !== undefined) {
    return (
      <motion.a
        href={href}
        {...shared}
        {...(rest as HTMLMotionProps<'a'>)}
      >
        {content}
      </motion.a>
    );
  }
  return (
    <motion.button
      type="button"
      {...shared}
      {...(rest as HTMLMotionProps<'button'>)}
    >
      {content}
    </motion.button>
  );
}
