import { useEffect, useState } from "react";

/**
 * @typedef {import("react")} React
 */

/**
 * For fading/transition
 * @param {number} delay in ms
 * @returns {[fade: boolean, doFade: function]}
 */
export function useFade(delay) {
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (fade) {
        setFade(false);
      }
    }, delay);

    return () => clearTimeout(timeout);
  });

  return [!fade, () => setFade(true)];
}

/**
 * Force a rerender
 */
export function useForceRender() {
  const [toggle, forceRender] = useState(true);

  return () => forceRender(!toggle);
}

/**
 * https://usehooks.com/useWindowSize/
 */
export function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    /** @type {number|undefined}*/ width: undefined,
    /** @type {number|undefined}*/ height: undefined,
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

/**
 * @template {React.Dispatch<React.SetStateAction<T>>} F, T
 * @param {F} updaterFunction useState updater function
 * @param {F extends React.Dispatch<React.SetStateAction<infer X>> ? (X | ((val: X) => X)): never } stateValue value to set state
 * @returns {React.MouseEventHandler}
 */
export function setStateFunction(updaterFunction, stateValue) {
  return function eventHandler() {
    if (stateValue || typeof stateValue === "function") {
      updaterFunction(stateValue);
      return;
    }
  };
}

/**
 * @type {import("./helperHK.d.ts").buildAction}
 * @param {AppDispatch} dispatch Redux store's dispatch function
 * @param {*} action Redux Toolkit Action creator
 * @param {*} [parentValue] Action payload value
 */
export function buildAction(dispatch, action, parentValue) {
  return function eventHandler(childValue) {
    if (parentValue) {
      // parentValue
      dispatch(action(parentValue));
      return;
    }

    if (childValue instanceof Object && "_reactName" in childValue) {
      dispatch(action(/** Don't dispatch with payload = event */));
      return;
    }

    if (childValue) {
      // childValue
      dispatch(action(childValue));
      return;
    }

    // no value
    dispatch(action());
  };
}

