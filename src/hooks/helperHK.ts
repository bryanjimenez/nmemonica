import type {
  ActionCreatorWithoutPayload,
  PayloadActionCreator,
} from "@reduxjs/toolkit";
import React, { useEffect, useState } from "react";

import { getWindow } from "../helper/browserGlobal";
import type { AppDispatch } from "../slices";

/**
 * For fading/transition
 * @param delay in ms to toggle from false to true
 * @return a tuple [state?:boolean, trigger:function] state and a trigger
 */
export function useFade(delay: number): [boolean | undefined, () => void] {
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined = undefined;
    if (delay > 0) {
      timeout = setTimeout(() => {
        if (fade) {
          setFade(false);
        }
      }, delay);
    }

    return () => {
      if (delay > 0) clearTimeout(timeout);
    };
  });

  if (delay > 0) {
    return [!fade, () => setFade(true)];
  } else {
    return [
      undefined,
      () => {
        /** Not needed, delay:0 */
      },
    ];
  }
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

/**
 * @overload Wrap dispatch around an action
 *
 * Action without payload (a toggle)
 * @param dispatch Redux store's dispatch function
 * @param action Redux Toolkit Action creator
 */
export function buildAction(
  dispatch: AppDispatch,
  action: ActionCreatorWithoutPayload
): () => void;

/**
 * @overload Wrap dispatch around a wrapped action
 *
 * Action without payload (a toggle)
 * @param dispatch Redux store's dispatch function
 * @param action A function containing a Redux Toolkit Action creator
 */
export function buildAction(
  dispatch: AppDispatch,
  action: Function
): (childValue: unknown) => void;

/**
 * @overload Wrap dispatch around an action
 *
 * Action with specified payload
 * @param dispatch Redux store's dispatch function
 * @param action Redux Toolkit Action creator
 * @param value specified payload value
 */
export function buildAction<P>(
  dispatch: AppDispatch,
  act: PayloadActionCreator<P>,
  parentValue: P
): () => void;

/**
 * @overload Wrap dispatch around an action
 *
 * Action with unspecified payload
 * @param dispatch Redux store's dispatch function
 * @param action Redux Toolkit Action creator
 */
export function buildAction<P>(
  dispatch: AppDispatch,
  act: PayloadActionCreator<P>
): (childValue: P) => void;

/**
 * @param dispatch Redux store's dispatch function
 * @param action Redux Toolkit Action creator
 * @param parentValue Action payload value
 */
export function buildAction(
  dispatch: AppDispatch,
  action: Function,
  parentValue?: unknown
) {
  return function eventHandler(childValue: unknown) {
    if (parentValue) {
      // parentValue
      dispatch(action(parentValue));
      return;
    }

    if (childValue instanceof Object && "_reactName" in childValue) {
      dispatch(action(/** Don't dispatch with payload = event */));
      return;
    }

    if (childValue !== undefined) {
      // childValue
      dispatch(action(childValue));
      return;
    }

    // no value
    dispatch(action());
  };
}
