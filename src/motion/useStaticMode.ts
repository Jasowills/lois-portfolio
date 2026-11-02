import { createContext, useContext } from 'react';

/** Query param that forces the static design (?static=1). Shared with scripts/visual-diff.mjs. */
export const STATIC_QUERY = 'static';

/** Static mode context: true when the page must render with zero motion. */
export const StaticModeContext = createContext(false);

/** True when the page must render the exact static DESIGN_SPEC state. */
export function useStaticMode(): boolean {
  return useContext(StaticModeContext);
}
