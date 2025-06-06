import classNames from "classnames";
import { forwardRef, memo, useLayoutEffect, useReducer, useRef } from "react";
import type React from "react";

import { useFade } from "../../hooks/useFade";
import ClickNavBtn from "../Input/ClickNavBtn";

export interface GameQuestion {
  english?: string;
  toHTML: (correct: boolean) => React.JSX.Element;
}

export interface GameChoice {
  compare: string;
  english?: string;
  japanese?: string;
  toHTML: (options?: {
    side?: boolean;
    correct?: boolean;
    fadeIn?: boolean;
  }) => React.JSX.Element;
}

interface FourChoicesProps {
  question: GameQuestion;
  hint?: string;
  choices: GameChoice[];
  isCorrect: (answered: GameChoice) => boolean;
  gotoPrev: () => void;
  gotoNext: () => void;

  /** True by default: Fade in options? */
  fadeInAnswers?: boolean;
}

interface FourChoicesState {
  showMeaning: boolean;
  incorrect: number[];
  correct: boolean;
}

export function FourChoices(
  props: FourChoicesProps,
  // forParentRef: React.RefObject<HTMLDivElement | null>
  forParentRef: React.ForwardedRef<HTMLDivElement | null>
) {
  if (typeof forParentRef === "function") {
    throw new Error("Expected a forParentRef to be a React.RefObject");
  }

  const [state, dispatch]: [
    FourChoicesState,
    React.Dispatch<Partial<FourChoicesState>>,
  ] = useReducer(
    (state: FourChoicesState, action: Partial<FourChoicesState>) => ({
      ...state,
      ...action,
    }),
    {
      showMeaning: false,
      incorrect: [],
      correct: false,
    }
  );

  const timerStart = useRef(Date.now());
  const timerStop = useRef<number | undefined>(undefined);

  const { gotoNext, gotoPrev } = props;

  useLayoutEffect(() => {
    if (props.fadeInAnswers !== false) {
      timerStart.current = Date.now();
      timerStop.current = undefined;
    }
    dispatch({ showMeaning: false, correct: false, incorrect: [] });
  }, [props.question, props.fadeInAnswers]);

  const checkAnswer = (answered: GameChoice, i: number) => {
    // Already correctly answered
    if (state.correct) return;

    if (props.isCorrect(answered)) {
      // console.log("RIGHT!");
      timerStop.current = Date.now();
      dispatch({ correct: true, showMeaning: true });
    } else if (state.incorrect.length === 2) {
      // console.log("WRONG");
      dispatch({
        incorrect: [...state.incorrect, i],
        correct: true,
        showMeaning: true,
      });
    } else {
      // console.log("WRONG");
      // navigator.vibrate(30)
      dispatch({ incorrect: [...state.incorrect, i] });
    }
  };

  const question = props.question;
  const choices = props.choices;

  let meaning = question.english !== undefined ? "[English]" : "";
  if (props.hint === undefined) {
    if (state.showMeaning && question.english !== undefined) {
      meaning = question.english;
    }
  } else {
    if (state.showMeaning && question.english !== undefined) {
      meaning = question.english;
    } else {
      meaning = props.hint;
    }
  }

  // optional forwardRef by default undefined
  const optionalRef =
    forParentRef?.current === undefined ? undefined : forParentRef;

  return (
    <div ref={optionalRef} className="pick4game main-panel h-100 d-flex">
      <ClickNavBtn direction="previous" action={gotoPrev} />
      <div className="container">
        <div className="row row-cols-1 row-cols-sm-2 h-100">
          <div
            className={classNames({
              "col question d-flex flex-column justify-content-center text-center":
                true,
            })}
          >
            <div>{question.toHTML(state.correct)}</div>
            {meaning !== undefined && (
              <span
                className="clickable"
                onClick={() => {
                  dispatch({
                    showMeaning: !state.showMeaning,
                  });
                }}
              >
                {meaning}
              </span>
            )}
          </div>
          <div className="col choices d-flex justify-content-around flex-wrap">
            {choices.map((c, i) => {
              const isRight = props.isCorrect(choices[i]) && state.correct;
              const isWrong = state.incorrect.includes(i);

              let aChoice;

              const elapsed = Math.abs(
                (timerStop.current ?? Date.now()) - timerStart.current
              );

              if (props.fadeInAnswers === true && state.correct) {
                // Don't check any more answers
                // Don't show remaining options

                if (isRight || isWrong || (i + 1) * 1000 < elapsed) {
                  // Right or wrong or
                  // Choice showed before picking answer
                  aChoice = (
                    <AChoice
                      key={String(timerStart.current) + c.compare}
                      css={!isRight ? "disabled-color" : undefined}
                      fadeIn={false}
                      c={c}
                      i={i}
                      isRight={isRight}
                      isWrong={isWrong}
                    />
                  );
                } else {
                  // Choice showed after picking answer
                  aChoice = (
                    <div key={c.compare} className="invisible w-50 h-50 pt-3">
                      {c.toHTML()}
                    </div>
                  );
                }
              } else {
                aChoice = (
                  <AChoice
                    key={String(timerStart.current) + c.compare}
                    c={c}
                    i={i}
                    isRight={isRight}
                    isWrong={isWrong}
                    checkAnswer={checkAnswer}
                    fadeIn={props.fadeInAnswers}
                    elapsed={elapsed}
                  />
                );
              }

              return aChoice;
            })}
          </div>
        </div>
      </div>
      <ClickNavBtn direction="next" action={gotoNext} />
    </div>
  );
}

interface AChoiceProps {
  css?: string;
  c: GameChoice;
  i: number;
  isRight: boolean;
  isWrong: boolean;
  checkAnswer?: (answered: GameChoice, i: number) => void;
  fadeIn?: boolean;
  elapsed?: number;
}

function AChoice(props: AChoiceProps) {
  const FADE_IN_MS = 1000;
  const { c, i, isRight, isWrong, checkAnswer, fadeIn, elapsed } = props;

  let delay = (i + 1) * FADE_IN_MS;
  if (elapsed !== undefined) {
    // A rerender mid fading will interrupt
    // Skip fade if interrupted
    const interruptFix = (i + 1) * 1000 - elapsed;
    delay = interruptFix < 0 ? 1 : interruptFix;
  }

  const [shown] = useFade(fadeIn === false ? 0 : delay);

  const choiceCSS = classNames({
    "d-flex flex-column justify-content-evenly": true,
    "w-50 h-50 pt-3 text-center clickable": true,
    "text-break": true,

    ...(props.css === undefined ? {} : { [props.css]: true }),

    "correct-color": isRight,
    "incorrect-color": isWrong,
  });

  return (
    <div
      key={`${c.compare ?? ""}${c.english ?? ""}${c.japanese ?? ""}`}
      className={choiceCSS}
      onClick={() => {
        if (typeof checkAnswer === "function") {
          checkAnswer(c, i);
        }
      }}
    >
      <div className="d-flex flex-column">
        <div>{c.toHTML({ fadeIn: shown })}</div>
        {isRight && <div>{c.english}</div>}
      </div>
    </div>
  );
}

export const FourChoicesWRef = memo(forwardRef(FourChoices));

export default memo(FourChoices);
