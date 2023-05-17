import { useEffect } from "react";

/**
 * Attaches keyboard actions to component
 * @param {function} gameActionHandler
 * @param {function} flipPhrasesPracticeSide
 * @param {function} [timedPlayAnswerHandlerWrapper]
 */
export function useKeyboardActions(
  gameActionHandler,
  flipPhrasesPracticeSide,
  timedPlayAnswerHandlerWrapper
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

/**
 * @param {function} gameActionHandler
 * @param {function} flipVocabularyPracticeSide
 * @param {function} [timedPlayAnswerHandlerWrapper]
 */
function buildArrowKeyPress(
  gameActionHandler,
  flipVocabularyPracticeSide,
  timedPlayAnswerHandlerWrapper
) {
  /**
   * @param {KeyboardEvent} event
   */
  return function arrowKeyPress(event) {
    /**
     * @typedef {[string, function][]} ActionHandlerTuple
     * @type {ActionHandlerTuple}
     */
    const actionHandlers = [
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

            const handlerWrapper = (
              /** @type {string} */ correctedDirection
            ) => {
              if (correctedDirection) {
                gameActionHandler(correctedDirection);
              } else {
                handler();
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
