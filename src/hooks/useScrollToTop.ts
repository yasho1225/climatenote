import { useEffect } from 'react';
import { scrollAppToTop } from '../lib/scrollToTop';

/** Scroll to top whenever `dep` changes (tab switch, route, overlay, etc.). */
export function useScrollToTop(dep: unknown) {
  useEffect(() => {
    scrollAppToTop();
  }, [dep]);
}
