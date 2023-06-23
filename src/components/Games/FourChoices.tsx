import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import { forwardRef, useLayoutEffect, useReducer, useRef } from "react";
import type React from "react";

import { useFade } from "../../hooks/helperHK";
import StackNavButton from "../Form/StackNavButton";

export interface GameQuestion {
  english?: string;
  romaji?: string;
  toHTML: (correct: boolean) => React.JSX.Element;
}

export interface GameChoice {
  compare: string;
  english?: string;
  japanese?: string;
  romaji?: string;
  toHTML: (correct?: boolean) => React.JSX.Element;
}

interface FourChoicesProps {
  question: GameQuestion;
  qRomaji?: boolean;
  aRomaji?: boolean;
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
  forParentRef: React.MutableRefObject<HTMLDivElement | null>
) {
  const [state, dispatch]: [
    FourChoicesState,
    React.Dispatch<Partial<FourChoicesState>>
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
    if (state.showMeaning && question.english) {
      meaning = question.english;
    }
  } else {
    if (state.showMeaning && question.english) {
      meaning = question.english;
    } else {
      meaning = props.hint;
    }
  }

  // optional forwardRef by default undefined
  const optionalRef =
    forParentRef.current === undefined ? undefined : forParentRef;

  return (
    <div ref={optionalRef} className="pick4game main-panel h-100 d-flex">
        <StackNavButton ariaLabel="Previous" action={gotoPrev}>
          <ChevronLeftIcon size={16} />
        </StackNavButton>
        <div className="container">
        <div className="row row-cols-1 row-cols-sm-2 h-100">
        <div
          className={classNames({
            "col question d-flex flex-column justify-content-center text-center":
              true,
          })}
        >
          <div>{question.toHTML(state.correct)}</div>
          <span
            className={classNames({
              invisible: !props.qRomaji,
            })}
          >
            {question.romaji}
          </span>
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

            if (props.fadeInAnswers && state.correct) {
              // Don't check any more answers
              // Don't show remaining options

              const elapsed = Math.abs(
                (timerStop.current ?? Date.now()) - timerStart.current
              );

              if ((i + 1) * 1000 > elapsed) {
                // Choice showed after picking answer
                aChoice = (
                  <div key={c.compare} className="invisible w-50 h-50">
                    {c.english}
                  </div>
                );
              } else {
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
                    aRomaji={props.aRomaji}
                  />
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
                  aRomaji={props.aRomaji}
                  fadeIn={props.fadeInAnswers}
                />
              );
            }

            return aChoice;
          })}
        </div>
        </div>

      </div>
      <StackNavButton ariaLabel="Next" action={gotoNext}>
          <ChevronRightIcon size={16} />
        </StackNavButton>
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
  aRomaji?: boolean;
  fadeIn?: boolean;
}

function AChoice(props: AChoiceProps) {
  const FADE_IN_MS = 1000;
  const { c, i, isRight, isWrong, checkAnswer, aRomaji, fadeIn } = props;

  const [shown] = useFade(fadeIn === false ? 0 : (i + 1) * FADE_IN_MS);
  const fadeCss = {
    "notification-fade": !shown,
    "notification-fade-in": shown,
  };

  const choiceCSS = classNames({
    "d-flex flex-column justify-content-evenly": true,
    "w-50 h-50 pt-3 text-center clickable": true,

    ...(!props.css ? {} : { [props.css]: true }),
    ...(fadeIn === false ? {} : fadeCss),

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
      <div>
        <h4>{c.toHTML()}</h4>
        {isRight && <div>{c.english}</div>}
        <span
          className={classNames({
            invisible: !aRomaji,
          })}
        >
          {c.romaji}
        </span>
      </div>
    </div>
  );
}

export const FourChoicesWRef = forwardRef(FourChoices);

export default FourChoices;
