// Page-wide text system, MOTION_SPEC 2.4. One owner splits every element
// marked [data-split="lines"] (headings, mask-rise) or [data-split="words"]
// (long copy, opacity scrub). The markers live in the section components so
// the static markup is untouched until this component runs. Static mode and
// prefers-reduced-motion never reach the split code, keeping the exact
// DESIGN_SPEC render for the visual diff.
//
// GSAP owns these transforms and opacities; no other system touches split
// lines or words. SplitText's autoSplit handles resize and font loading.
//
// First visit: the intro loader covers the page for about 1.6s. The split is
// staged immediately (hero lines already hidden behind their masks) but the
// reveals wait for the loader's wipe, so the entrance is actually seen. Repeat
// visits have no loader and attach immediately.

import { useLayoutEffect } from 'react';
import { ScrollTrigger } from '../motion/gsap';
import { attachSplit, type SplitMode } from '../motion/useSplit';
import { useMotion } from '../motion/useMotion';

const LINE_START = 'top 85%';
const WORD_START = 'top 70%';
const WORD_END = 'bottom 70%';
const LOADER_EXIT = 'lois:loader-exit';

export function TextSystem() {
  const { quality, reducedMotion } = useMotion();
  const active = !reducedMotion;

  useLayoutEffect(() => {
    if (!active) return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-split]'),
    );
    const cleanups: Array<() => void> = [];

    // The loader sets data-loader before this effect (it mounts first). The
    // promise resolves on the wipe start; cleanup resolves it early so a
    // cancelled page never leaves split text staged forever.
    const loaderRunning =
      document.documentElement.dataset.loader === 'running';
    let release: (() => void) | null = null;
    let onExit: (() => void) | null = null;
    const gate = loaderRunning
      ? new Promise<void>((resolve) => {
          release = resolve;
          onExit = () => resolve();
          window.addEventListener(LOADER_EXIT, onExit, { once: true });
        })
      : undefined;

    for (const element of elements) {
      const mode: SplitMode = element.dataset.split === 'words' ? 'words' : 'lines';
      cleanups.push(
        attachSplit(
          element,
          mode === 'words'
            ? { mode, start: WORD_START, end: WORD_END, refresh: false }
            : { mode, start: LINE_START, refresh: false },
          quality,
          gate,
        ),
      );
    }

    if (gate) {
      gate.then(() => ScrollTrigger.refresh());
    } else {
      ScrollTrigger.refresh();
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
      if (release) {
        if (onExit) window.removeEventListener(LOADER_EXIT, onExit);
        release();
      }
    };
  }, [active, quality]);

  return null;
}
