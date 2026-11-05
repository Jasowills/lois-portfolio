// SplitText helper, MOTION_SPEC section 2.4. Headings rise line by line from
// behind a mask; long copy scrubs word opacity. Splitting happens in
// useLayoutEffect only, so the static render and reduced-motion users keep the
// untouched markup. SplitText's aria:"auto" keeps the text readable to screen
// readers after the split.
import { useLayoutEffect, type RefObject } from 'react';
import { gsap, SplitText, ScrollTrigger } from './gsap';
import { EASE } from './ease';
import { useMotion } from './useMotion';

export type SplitMode = 'lines' | 'words';

export type SplitOptions = {
  /** lines: mask-rise headings; words: opacity scrub for body copy. */
  mode?: SplitMode;
  /** ScrollTrigger start for both modes. */
  start?: string;
  /** ScrollTrigger end; only used by the word scrub. */
  end?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
  /** Line rotation in degrees (MOTION_SPEC 2.4: 4). */
  rotate?: number;
  yPercent?: number;
  fromOpacity?: number;
  disabled?: boolean;
};

/**
 * Splits the referenced element into lines or words and attaches the text
 * reveal. Returns nothing: cleanup kills the tween, reverts the split and
 * removes the autoSplit listeners.
 */
export function useSplit(
  ref: RefObject<HTMLElement>,
  {
    mode = 'lines',
    start,
    end,
    stagger = 0.08,
    duration = 1.05,
    delay = 0,
    rotate = 4,
    yPercent = 110,
    fromOpacity = 0.18,
    disabled = false,
  }: SplitOptions = {},
): void {
  const { quality, reducedMotion } = useMotion();
  const active = !disabled && !reducedMotion;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || !element) return;

    let split: SplitText | null = null;
    let tween: gsap.core.Tween | null = null;
    let cancelled = false;

    const animate = (instance: SplitText) => {
      tween?.scrollTrigger?.kill();
      tween?.kill();
      tween = null;
      if (cancelled) return;

      // Low tier keeps the reveal but drops rotation and most stagger.
      const low = quality === 'low';

      if (mode === 'words') {
        tween = gsap.fromTo(instance.words, { opacity: fromOpacity }, {
          opacity: 1,
          ease: 'none',
          stagger: low ? 0 : 0.04,
          scrollTrigger: {
            trigger: element,
            start: start ?? 'top 70%',
            end: end ?? 'bottom 70%',
            scrub: true,
          },
        });
        return;
      }

      tween = gsap.from(instance.lines, {
        yPercent,
        rotate: low ? 0 : rotate,
        duration: low ? 0.6 : duration,
        delay,
        ease: EASE.glide,
        stagger: low ? 0 : stagger,
        scrollTrigger: {
          trigger: element,
          start: start ?? 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    };

    split = SplitText.create(element, {
      type: mode,
      ...(mode === 'lines' ? { mask: 'lines' as const } : {}),
      autoSplit: true,
      aria: 'auto',
      onSplit: animate,
    });

    ScrollTrigger.refresh();

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
      split?.kill();
    };
  }, [active, delay, duration, end, fromOpacity, mode, quality, ref, rotate, stagger, start, yPercent]);
}
