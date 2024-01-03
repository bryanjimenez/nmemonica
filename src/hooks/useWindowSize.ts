import React, { useEffect, useState } from "react";

import { getWindow } from "../helper/browserGlobal";

/**
 * Get initial screen size using Screen orientation API
 * @link [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Orientation_API)
 * @returns
 */
// function initializeFromScreen() {
//   if (screen.availWidth && screen.availHeight) {
//     return { width: screen.availWidth, height: screen.availHeight };
//   }

//   return { width: undefined, height: undefined };
// }

function initializeFromWindow() {
  if (window.innerWidth && window.innerHeight) {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  return { width: undefined, height: undefined };
}

/**
 * https://usehooks.com/useWindowSize/
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width?: number;
    height?: number;
  }>(initializeFromWindow);
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
