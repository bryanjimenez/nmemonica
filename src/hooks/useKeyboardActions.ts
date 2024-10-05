import { useEffect } from "react";

import type { GameActionHandler } from "./useSwipeActions";
import { SwipeDirection } from "../helper/TouchSwipe";

/**
 * Attaches keyboard actions to component
 */
export function useKeyboardActions(
  gameActionHandler: GameActionHandler,
  flipPhrasesPracticeSide: () => void,
  timedPlayAnswerHandlerWrapper?: (
    direction: SwipeDirection,
    handler: GameActionHandler
  ) => GameActionHandler
) {
  useEffect(() => {
    const kHandler = buildArrowKeyPress(
      gameActionHandler,
      flipPhrasesPracticeSide,
      timedPlayAnswerHandlerWrapper
    );
    document.addEventListener("keydown", kHandler, true);

    return () => {
      document.removeEventListener("keydown", kHandler, true);
    };
  }, [
    gameActionHandler,
    flipPhrasesPracticeSide,
    timedPlayAnswerHandlerWrapper,
  ]);
}

function buildArrowKeyPress(
  gameActionHandler: GameActionHandler,
  flipVocabularyPracticeSide: () => void,
  timedPlayAnswerHandlerWrapper?: (
    direction: SwipeDirection,
    handler: GameActionHandler
  ) => GameActionHandler
) {
  return function arrowKeyPress(event: KeyboardEvent) {
    const actionHandlers: [string, Function][] = [
      ["ArrowRight", () => gameActionHandler("left")],
      ["ArrowLeft", () => gameActionHandler("right")],
      ["ArrowUp", () => gameActionHandler("up")],
      ["ArrowDown", () => gameActionHandler("down")],
      // ["MediaPlayPause", () => {}],
      [" ", flipVocabularyPracticeSide],
    ];

    for (const [action, handler] of actionHandlers) {
      if (action === event.key) {
        let keyHandler = handler;

        if (action !== " ") {
          // interrupt loop

          const direction = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
          }[action] as "up" | "down" | "left" | "right" | undefined;
          if (
            typeof timedPlayAnswerHandlerWrapper === "function" &&
            direction !== undefined
          ) {
            const handlerWrapper = (correctedDirection: SwipeDirection) => {
              if (correctedDirection) {
                return gameActionHandler(correctedDirection);
              } else {
                return handler();
              }
            };

            keyHandler = timedPlayAnswerHandlerWrapper(
              direction,
              handlerWrapper
            );
          }
        }

        keyHandler();
        break;
      }
    }
  };
}
