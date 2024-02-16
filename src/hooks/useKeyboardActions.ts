import { useEffect } from "react";

import type { GameActionHandler } from "./useSwipeActions";

/**
 * Attaches keyboard actions to component
 */
export function useKeyboardActions(
  gameActionHandler: GameActionHandler,
  flipPhrasesPracticeSide: () => void,
  timedPlayAnswerHandlerWrapper?: (
    direction: string,
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
    direction: string,
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

          if (typeof timedPlayAnswerHandlerWrapper === "function") {
            const direction =
              {
                ArrowUp: "up",
                ArrowDown: "down",
                ArrowLeft: "left",
                ArrowRight: "right",
              }[action] || "";

            const handlerWrapper = (correctedDirection: string) => {
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
