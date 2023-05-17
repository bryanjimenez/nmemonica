import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  getSwipeDirection,
  swipeEnd,
  swipeMove,
  swipeStart,
} from "../helper/TouchSwipe";

/**
 * @param {(direction: string)=>void} gameActionHandler a function that takes a direction and does an action
 * @param {function} [timedPlayAnswerHandlerWrapper]
 */
export function useSwipeActions(
  gameActionHandler,
  timedPlayAnswerHandlerWrapper
) {
  const swipeThreshold = useSelector(
    (/** @type {RootState}*/ { global }) => global.swipeThreshold
  );

  const swiping = useRef(
    /** @type {import("../helper/TouchSwipe").Spec} */ ({})
  );

  /** HTMLElement ref */
  const HTMLDivElementSwipeRef = useRef(
    /** @type {HTMLDivElement| null } */ (null)
  );

  useEffect(() => {
    const startMove = buildStartMove(swipeThreshold, swiping);
    const inMove = buildInMove(swiping);

    const endMove = buildEndMove(
      swiping,
      swipeEnd,
      gameActionHandler,
      timedPlayAnswerHandlerWrapper
    );

    if (HTMLDivElementSwipeRef.current) {
      HTMLDivElementSwipeRef.current.addEventListener("touchstart", startMove);
      HTMLDivElementSwipeRef.current.addEventListener("touchmove", inMove);
      HTMLDivElementSwipeRef.current.addEventListener("touchend", endMove);
    }

    const cleanup = HTMLDivElementSwipeRef.current;
    return () => {
      cleanup?.removeEventListener("touchstart", startMove);
      cleanup?.removeEventListener("touchmove", inMove);
      cleanup?.removeEventListener("touchend", endMove);
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
 * @param {number} swipeThreshold
 * @param {React.MutableRefObject<Object>} swiping is mutated
 */
function buildStartMove(swipeThreshold, swiping) {
  /**
   * @type {import("react").TouchEventHandler}
   */
  return function startMove(e) {
    swiping.current = swipeStart(e, {
      verticalSwiping: true,
      touchThreshold: swipeThreshold,
    });
  };
}

/**
 * @param {React.MutableRefObject<import("../helper/TouchSwipe").Spec>} swiping is mutated
 */
function buildInMove(swiping) {
  /**
   * @type {import("react").TouchEventHandler}
   */
  return function inMove(e) {
    if (swiping.current) {
      swiping.current = swipeMove(e, swiping.current);
    }
  };
}

/**
 * @param {React.MutableRefObject<import("../helper/TouchSwipe").Spec>} swiping is not mutated
 * @param {function} swipeEnd
 * @param {function} gameActionHandler
 * @param {function} [timedPlayAnswerHandlerWrapper]
 */
function buildEndMove(
  swiping,
  swipeEnd,
  gameActionHandler,
  timedPlayAnswerHandlerWrapper
) {
  /**
   * @type {import("react").TouchEventHandler}
   */
  return function endMove(e) {
    /** @type {function} */
    let swipeHandler = gameActionHandler;

    const tEl = /** @type {Element} */ (e.target);
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
