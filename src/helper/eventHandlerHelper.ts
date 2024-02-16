import type {
  ActionCreatorWithOptionalPayload,
  ActionCreatorWithoutPayload,
  PayloadActionCreator,
} from "@reduxjs/toolkit";
import type React from "react";

import type { AppDispatch } from "../slices";

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
  action:
    | ActionCreatorWithoutPayload
    | ActionCreatorWithOptionalPayload<unknown, string>
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
): (childValue?: unknown) => void;

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
