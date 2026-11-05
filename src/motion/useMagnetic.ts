// Magnetic pull, MOTION_SPEC section 2.5: a button translates up to 10px
// toward the cursor inside a 90px halo, with a spring. Motion values are
// returned instead of mutating the DOM, so the button component stays the
// single owner of its transform (Motion owns hover and press there).
import { useCallback, type PointerEventHandler } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'motion/react';
import { useMotion } from './useMotion';

export type MagneticOptions = {
  /** Maximum translation in px (spec: 10). */
  strength?: number;
  /** Distance outside the element that still attracts, in px (spec: 90). */
  radius?: number;
  stiffness?: number;
  damping?: number;
  disabled?: boolean;
};

export type MagneticBinding = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerLeave: () => void;
  reset: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Returns spring-smoothed x/y MotionValues and pointer handlers. Bind them on
 * a motion element: <motion.a style={{ x, y }} onPointerMove={...} />.
 */
export function useMagnetic({
  strength = 10,
  radius = 90,
  stiffness = 200,
  damping = 15,
  disabled = false,
}: MagneticOptions = {}): MagneticBinding {
  const { quality, reducedMotion } = useMotion();
  const finePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  const active = !disabled && !reducedMotion && quality !== 'low' && finePointer;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness, damping });
  const springY = useSpring(y, { stiffness, damping });

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (!active) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const centreX = rect.left + rect.width / 2;
      const centreY = rect.top + rect.height / 2;
      const dx = event.clientX - centreX;
      const dy = event.clientY - centreY;

      const outsideX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const outsideY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const outside = Math.hypot(outsideX, outsideY);
      if (outside > radius) {
        reset();
        return;
      }

      const falloff = 1 - outside / radius;
      const halfWidth = rect.width / 2 || 1;
      const halfHeight = rect.height / 2 || 1;
      x.set(clamp((dx / halfWidth) * strength * falloff, -strength, strength));
      y.set(clamp((dy / halfHeight) * strength * falloff, -strength, strength));
    },
    [active, radius, reset, strength, x, y],
  );

  return {
    x: springX,
    y: springY,
    onPointerMove,
    onPointerLeave: reset,
    reset,
  };
}
