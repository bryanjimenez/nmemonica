import { forwardRef, useCallback, useEffect, useReducer } from "react";
import type React from "react";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import StackNavButton from "../Form/StackNavButton";

interface GameQuestion {
  english?: string;
  romaji?: string;
  toHTML: (correct: boolean) => React.JSX.Element;
}

interface GameChoice {
  compare: string;
  english?: string;
  romaji?: string;
  toHTML: Function;
}

interface FourChoicesProps {
  uid: string;
  question: GameQuestion;
  qRomaji?: boolean;
  aRomaji?: boolean;
  hint?: string;
  choices: GameChoice[];
  isCorrect: (answered: GameChoice) => boolean;
  gotoPrev: Function;
  gotoNext: Function;
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

  const next = useCallback(
    (event: React.MouseEvent) => {
      props.gotoNext();
    },
    [props.gotoNext]
  );
  const prev = useCallback(
    (event: React.MouseEvent) => {
      props.gotoPrev();
    },
    [props.gotoPrev]
  );

  useEffect(() => {
    dispatch({ showMeaning: false, correct: false, incorrect: [] });
  }, [props.uid]);

  const checkAnswer = (answered: GameChoice, i: number) => {
    if (props.isCorrect(answered)) {
      // console.log("RIGHT!");
      dispatch({ correct: true, showMeaning: true });
      setTimeout(() => {
        props.gotoNext();
      }, 1000);
    } else if (state.incorrect.length === 2) {
      // console.log("WRONG");
      dispatch({
        incorrect: [...state.incorrect, i],
        correct: true,
        showMeaning: true,
      });
      setTimeout(() => {
        props.gotoNext();
      }, 1000);
    } else {
      // console.log("WRONG");
      dispatch({ incorrect: [...state.incorrect, i] });
    }
  };

  const question = props.question;
  const choices = props.choices;

  // console.log(question);
  // console.log(choices);

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
    <div ref={optionalRef} className="pick4game main-panel h-100">
      <div className="d-flex justify-content-between h-100">
        <StackNavButton ariaLabel="Previous" action={prev}>
          <ChevronLeftIcon size={16} />
        </StackNavButton>
        <div
          className={classNames({
            "question d-flex flex-column justify-content-center text-center w-50":
              true,
          })}
        >
          <h1>{question.toHTML(state.correct)}</h1>
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
                dispatch({ showMeaning: !state.showMeaning });
              }}
            >
              {meaning}
            </span>
          )}
        </div>
        <div className="choices d-flex justify-content-around flex-wrap w-50">
          {choices.map((c, i) => {
            const isRight = props.isCorrect(choices[i]) && state.correct;
            const isWrong = state.incorrect.includes(i);

            const choiceCSS = classNames({
              "w-50 h-50 pt-3 d-flex flex-column justify-content-evenly text-center clickable":
                true,
              "correct-color": isRight,
              "incorrect-color": isWrong,
            });
            return (
              <div
                key={`${c.compare ?? ""}${c.english ?? ""}${c.japanese ?? ""}`}
                className={choiceCSS}
                onClick={() => {
                  checkAnswer(c, i);
                }}
              >
                <div>
                  <h4>{c.toHTML()}</h4>
                  {isRight && <div>{c.english}</div>}
                  <span
                    className={classNames({
                      invisible: !props.aRomaji,
                    })}
                  >
                    {c.romaji}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <StackNavButton ariaLabel="Next" action={next}>
          <ChevronRightIcon size={16} />
        </StackNavButton>
      </div>
    </div>
  );
}

export const FourChoicesWRef = forwardRef(FourChoices);

export default FourChoices;
