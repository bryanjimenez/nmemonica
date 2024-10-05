import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import {
  getSwipeDirection,
  swipeEnd,
  swipeMove,
  swipeStart,
} from "../helper/TouchSwipe";
import type { Spec } from "../helper/TouchSwipe";
import type { RootState } from "../slices";

export type GameActionHandler = (
  direction: string,
  ab?: AbortController
) => Promise<unknown>;
/**
 * @param gameActionHandler a function that takes a direction and does an action
 * @param timedPlayAnswerHandlerWrapper
 */
export function useSwipeActions(
  gameActionHandler: GameActionHandler,
  timedPlayAnswerHandlerWrapper?: (
    direction: string,
    handler: GameActionHandler
  ) => GameActionHandler
) {
  const swipeThreshold = useSelector(
    ({ global }: RootState) => global.swipeThreshold
  );

  // @ts-expect-error swipe Spec ref init
  const swiping = useRef<Spec>({});

  /** HTMLElement ref */
  const HTMLDivElementSwipeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const startMove = buildStartMove(swipeThreshold, swiping);
    const inMove = buildInMove(swiping);

    const endMove = buildEndMove(
      swiping,
      swipeEnd,
      gameActionHandler,
      timedPlayAnswerHandlerWrapper
    );

    if (HTMLDivElementSwipeRef.current && swipeThreshold > 0) {
      HTMLDivElementSwipeRef.current.addEventListener("touchstart", startMove);
      HTMLDivElementSwipeRef.current.addEventListener("touchmove", inMove);
      HTMLDivElementSwipeRef.current.addEventListener("touchend", endMove);
    }

    const cleanup = HTMLDivElementSwipeRef.current;
    return () => {
      if (swipeThreshold > 0) {
        cleanup?.removeEventListener("touchstart", startMove);
        cleanup?.removeEventListener("touchmove", inMove);
        cleanup?.removeEventListener("touchend", endMove);
      }
    };
  }, [
    swiping,
    swipeThreshold,
    gameActionHandler,
    timedPlayAnswerHandlerWrapper,
  ]);

  return { HTMLDivElementSwipeRef };
}

/**
 * @param swipeThreshold
 * @param swiping is mutated
 */
function buildStartMove(
  swipeThreshold: number,
  swiping: React.MutableRefObject<Spec>
) {
  return function startMove(e: TouchEvent) {
    swiping.current = swipeStart(e, {
      verticalSwiping: true,
      touchThreshold: swipeThreshold,
    });
  };
}

/**
 * @param swiping is mutated
 */
function buildInMove(swiping: React.MutableRefObject<Spec>) {
  return function inMove(e: TouchEvent) {
    if (swiping.current) {
      swiping.current = swipeMove(e, swiping.current);
    }
  };
}

/**
 * @param swiping is not mutated
 * @param swipeEnd
 * @param gameActionHandler
 * @param timedPlayAnswerHandlerWrapper
 */
function buildEndMove(
  swiping: React.MutableRefObject<Spec>,
  swipeEnd: (e: TouchEvent, spec: Spec) => void,
  gameActionHandler: GameActionHandler,
  timedPlayAnswerHandlerWrapper?: (
    direction: string,
    handler: GameActionHandler
  ) => GameActionHandler
) {
  return function endMove(e: TouchEvent) {
    let swipeHandler = gameActionHandler;

    const tEl = e.target as Element;
    const targetIsStopBtn = Array.from(
      document.getElementsByClassName("loop-stop-btn")
    ).some((el) => el.contains(tEl));
    const targetIsClickAllowed = Array.from(
      document.getElementsByClassName("loop-no-interrupt")
    ).some((el) => el.contains(tEl));
    const eventIsNotSwipe =
      swiping.current.touchObject?.swipeLength === undefined ||
      swiping.current.touchObject.swipeLength < swiping.current.touchThreshold;

    if (targetIsStopBtn) {
      // stop button should be outside of div containing useSwipeActions
      return;
    } else if (targetIsClickAllowed && eventIsNotSwipe) {
      // elements with this tag do not interrupt loop
      return;
    } else {
      const direction = getSwipeDirection(swiping.current.touchObject, true);

      if (typeof timedPlayAnswerHandlerWrapper === "function") {
        swipeHandler = timedPlayAnswerHandlerWrapper(
          direction,
          gameActionHandler
        );
      }

      swipeEnd(e, { ...swiping.current, onSwipe: swipeHandler });
    }
  };
}
