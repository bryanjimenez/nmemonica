import React, { useEffect, useState } from "react";

import { getWindow } from "../helper/browserGlobal";

/**
 * https://usehooks.com/useWindowSize/
 */
export function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<{
    width?: number;
    height?: number;
  }>({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    const w = getWindow();
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: w.innerWidth,
        height: w.innerHeight,
      });
    }
    // Add event listener
    w.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => w.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

/**
 * State setter from event
 * @param updaterFunction useState updater function
 * @param stateValue value to set state
 */
export function setStateFunction<T>(
  updaterFunction: React.Dispatch<React.SetStateAction<T>>,
  stateValue: T | ((prevState: T) => T)
): () => void {
  return function eventHandler() {
    if (stateValue || typeof stateValue === "function") {
      updaterFunction(stateValue);
      return;
    }
  };
}
