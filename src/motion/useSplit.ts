// SplitText helper, MOTION_SPEC section 2.4. Headings rise line by line from
// behind a mask; long copy scrubs word opacity. Splitting happens in
// useLayoutEffect only, so the static render and reduced-motion users keep the
// untouched markup. SplitText's aria:"auto" keeps the text readable to screen
// readers after the split.
import { useLayoutEffect, type RefObject } from 'react';
import { gsap, SplitText, ScrollTrigger } from './gsap';
import { EASE } from './ease';
import { useMotion } from './useMotion';
import type { QualityTier } from './quality';

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
  /** Refresh ScrollTrigger after creating the split (default true). */
  refresh?: boolean;
};

/**
 * Split one element and attach its reveal. Returns a cleanup that kills the
 * tween, reverts the split and removes the autoSplit listeners. Exported for
 * the page-wide TextSystem, which owns every [data-split] element.
 */
export function attachSplit(
  element: HTMLElement,
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
    refresh = true,
  }: SplitOptions,
  quality: QualityTier,
  /** When provided, the split is staged but its reveal waits for resolution. */
  hold?: Promise<void>,
): () => void {
  let split: SplitText | null = null;
  let tween: gsap.core.Tween | null = null;
  let held = Boolean(hold);
  let awaiting: SplitText | null = null;
  let cancelled = false;

  const animate = (instance: SplitText) => {
    tween?.scrollTrigger?.kill();
    tween?.kill();
    tween = null;
    if (cancelled) return;

    // Low tier keeps the reveal but drops rotation and most stagger.
    const low = quality === 'low';

    // While the intro loader covers the page, stage the start state so the
    // hero is already hidden when the wipe opens. The reveal is created on
    // release, exactly as the cover starts clearing.
    if (held) {
      awaiting = instance;
      if (mode === 'words') {
        gsap.set(instance.words, { opacity: fromOpacity });
      } else {
        gsap.set(instance.lines, {
          yPercent,
          rotate: low ? 0 : rotate,
        });
      }
      return;
    }

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

    // fromTo, not from: when the intro loader is running the lines are already
    // staged at the start values, and a from tween would read that staged
    // transform as its destination (110% to 110%).
    tween = gsap.fromTo(
      instance.lines,
      { yPercent, rotate: low ? 0 : rotate },
      {
        yPercent: 0,
        rotate: 0,
        duration: low ? 0.6 : duration,
        delay,
        ease: EASE.glide,
        stagger: low ? 0 : stagger,
        scrollTrigger: {
          trigger: element,
          start: start ?? 'top 85%',
          toggleActions: 'play none none none',
        },
      },
    );
  };

  split = SplitText.create(element, {
    type: mode,
    ...(mode === 'lines' ? { mask: 'lines' as const } : {}),
    autoSplit: true,
    aria: 'auto',
    onSplit: animate,
  });

  if (refresh) ScrollTrigger.refresh();

  if (hold) {
    hold.then(() => {
      if (cancelled) return;
      held = false;
      const instance = awaiting ?? split;
      awaiting = null;
      if (instance) animate(instance);
    });
  }

  return () => {
    cancelled = true;
    tween?.scrollTrigger?.kill();
    tween?.kill();
    split?.revert();
    split?.kill();
  };
}

/**
 * Split the referenced element and attach its reveal. The hook form is kept
 * for components that own their heading; the page-wide TextSystem uses
 * attachSplit directly so every [data-split] element shares one owner.
 */
export function useSplit(
  ref: RefObject<HTMLElement | null>,
  options: SplitOptions = {},
): void {
  const { quality, reducedMotion } = useMotion();
  const active = !options.disabled && !reducedMotion;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    return attachSplit(element, options, quality);
    // Options are read once per activation; individual primitive deps avoid
    // re-splitting when the caller passes a fresh object literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    quality,
    ref,
    options.mode,
    options.start,
    options.end,
    options.stagger,
    options.duration,
    options.delay,
    options.rotate,
    options.yPercent,
    options.fromOpacity,
    options.disabled,
    options.refresh,
  ]);
}
