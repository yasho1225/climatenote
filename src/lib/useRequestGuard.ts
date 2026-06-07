import { useRef, useCallback } from 'react';

/** Returns a function that marks whether this request generation is still current. */
export function useRequestGuard() {
  const generationRef = useRef(0);

  const nextGeneration = useCallback(() => {
    generationRef.current += 1;
    return generationRef.current;
  }, []);

  const isCurrent = useCallback((generation: number) => {
    return generationRef.current === generation;
  }, []);

  return { nextGeneration, isCurrent };
}
