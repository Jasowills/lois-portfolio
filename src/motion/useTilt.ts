// Pointer tilt for cards, using the same spring language as the magnetic
// buttons. Returns MotionValues so the card owns one transform source.
import { useCallback, type PointerEventHandler } from 'react';
import { useMotionValue, useSpring, type MotionValue } from 'motion/react';
import { useMotion } from './useMotion';

export type TiltOptions = {
  /** Maximum rotation in degrees on each axis. */
  max?: number;
  /** Hover scale; keep at 1 when the design must not move. */
  scale?: number;
  stiffness?: number;
  damping?: number;
  disabled?: boolean;
};

export type TiltBinding = {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  scale: MotionValue<number>;
  onPointerMove: PointerEventHandler<HTMLElement>;
  onPointerLeave: () => void;
  reset: () => void;
};

/** Cards tilt at most `max` degrees toward the pointer, then spring back. */
export function useTilt({
  max = 6,
  scale = 1.01,
  stiffness = 150,
  damping = 18,
  disabled = false,
}: TiltOptions = {}): TiltBinding {
  const { quality, reducedMotion } = useMotion();
  const finePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  const active = !disabled && !reducedMotion && quality !== 'low' && finePointer;

  const rotateXValue = useMotionValue(0);
  const rotateYValue = useMotionValue(0);
  const scaleValue = useMotionValue(1);
  const rotateX = useSpring(rotateXValue, { stiffness, damping });
  const rotateY = useSpring(rotateYValue, { stiffness, damping });
  const scaleSpring = useSpring(scaleValue, { stiffness, damping });

  const reset = useCallback(() => {
    rotateXValue.set(0);
    rotateYValue.set(0);
    scaleValue.set(1);
  }, [rotateXValue, rotateYValue, scaleValue]);

  const onPointerMove = useCallback<PointerEventHandler<HTMLElement>>(
    (event) => {
      if (!active) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      rotateYValue.set(nx * max * 2);
      rotateXValue.set(-ny * max * 2);
      scaleValue.set(scale);
    },
    [active, max, rotateXValue, rotateYValue, scale, scaleValue],
  );

  return {
    rotateX,
    rotateY,
    scale: scaleSpring,
    onPointerMove,
    onPointerLeave: reset,
    reset,
  };
}
