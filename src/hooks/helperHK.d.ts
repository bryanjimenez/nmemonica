import {
  ActionCreatorWithoutPayload,
  PayloadActionCreator,
} from "@reduxjs/toolkit";
import React from "react";

/**
 * Force a rerender
 */
export function useForceRender() : ()=>void 
/**
 * https://usehooks.com/useWindowSize/
 */
export function useWindowSize() : {width?: number, height?:number}

/**
 * State setter from event
 * @param updaterFunction useState updater function
 * @param stateValue value to set state
 */
export function setStateFunction<S>(
  updaterFunction: React.Dispatch<React.SetStateAction<S>>,
  stateValue: S | ((prevState: S) => S)
): () => void;

/**
 * Wrap dispatch around an action
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
 * Wrap dispatch around a wrapped action
 *
 * Action without payload (a toggle)
 * @param dispatch Redux store's dispatch function
 * @param action A function containing a Redux Toolkit Action creator
 */
export function buildAction(
  dispatch: AppDispatch,
  action: function
): (...childValue) => void;

/**
 * Wrap dispatch around an action
 *
 * Action with specified payload
 * @param dispatch Redux store's dispatch function
 * @param action Redux Toolkit Action creator
 * @param value specified payload value
 */
export function buildAction<P>(
  dispatch: AppDispatch,
  act: PayloadActionCreator<P, string, void>,
  parentValue: P
): () => void;

/**
 * Wrap dispatch around an action
 *
 * Action with unspecified payload
 * @param dispatch Redux store's dispatch function
 * @param action Redux Toolkit Action creator
 */
export function buildAction<P>(
  dispatch: AppDispatch,
  act: PayloadActionCreator<P, string, void>
): (childValue: P) => void;
