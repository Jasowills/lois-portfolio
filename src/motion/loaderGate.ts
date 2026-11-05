// Loader handoff helper, MOTION_SPEC 2.1. Section entrances that should start
// behind the intro cover wait for `lois:loader-exit` instead of guessing a
// duration. Static and repeat visits resolve immediately.

/** Runs `callback` once the intro loader starts its wipe, or immediately. */
export function onLoaderRelease(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  if (document.documentElement.dataset.loader !== 'running') {
    callback();
    return () => {};
  }

  let done = false;
  let timer = 0;

  const cleanup = () => {
    window.removeEventListener('lois:loader-exit', finish);
    if (timer) window.clearTimeout(timer);
  };

  const finish = () => {
    if (done) return;
    done = true;
    cleanup();
    callback();
  };

  // A broken loader must never leave the hero staged forever.
  timer = window.setTimeout(finish, 5000);
  window.addEventListener('lois:loader-exit', finish, { once: true });

  return () => {
    if (done) return;
    done = true;
    cleanup();
  };
}
