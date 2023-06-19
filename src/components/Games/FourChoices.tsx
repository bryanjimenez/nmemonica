import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import { forwardRef, useEffect, useReducer } from "react";
import type React from "react";

import { useFade } from "../../hooks/helperHK";
import StackNavButton from "../Form/StackNavButton";

interface GameQuestion {
  english?: string;
  romaji?: string;
  toHTML: (correct: boolean) => React.JSX.Element;
}

interface GameChoice {
  compare: string;
  english?: string;
  japanese?: string;
  romaji?: string;
  toHTML: (correct?: boolean) => React.JSX.Element;
}

interface FourChoicesProps {
  uid: string;
  question: GameQuestion;
  qRomaji?: boolean;
  aRomaji?: boolean;
  hint?: string;
  choices: GameChoice[];
  isCorrect: (answered: GameChoice) => boolean;
  gotoPrev: () => void;
  gotoNext: () => void;

  correctPause?: number;
  incorrectPause?: number;
  fadeInAnswers?: boolean,
}

interface FourChoicesState {
  showMeaning: string;
  incorrect: number[];
  correct: string;
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
      showMeaning: "",
      incorrect: [],
      correct: "",
    }
  );

  const { gotoNext, gotoPrev } = props;

  useEffect(() => {
    dispatch({ showMeaning: "", correct: "", incorrect: [] });
  }, [props.uid]);

  const checkAnswer = (answered: GameChoice, i: number) => {
    if (props.isCorrect(answered)) {
      // console.log("RIGHT!");
      dispatch({ correct: props.uid, showMeaning: props.uid });
    } else if (state.incorrect.length === 2) {
      // console.log("WRONG");
      dispatch({
        incorrect: [...state.incorrect, i],
        correct: props.uid,
        showMeaning: props.uid,
      });
    } else {
      // console.log("WRONG");
      dispatch({ incorrect: [...state.incorrect, i] });
    }
  };

  const question = props.question;
  const choices = props.choices;

  let meaning = question.english !== undefined ? "[English]" : "";
  if (props.hint === undefined) {
    if (state.showMeaning === props.uid && question.english) {
      meaning = question.english;
    }
  } else {
    if (state.showMeaning === props.uid && question.english) {
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
        <StackNavButton ariaLabel="Previous" action={gotoPrev}>
          <ChevronLeftIcon size={16} />
        </StackNavButton>
        <div
          className={classNames({
            "question d-flex flex-column justify-content-center text-center w-50":
              true,
          })}
        >
          <h1>{question.toHTML(state.correct === props.uid)}</h1>
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
                  showMeaning: state.showMeaning === props.uid ? "" : props.uid,
                });
              }}
            >
              {meaning}
            </span>
          )}
        </div>
        <div className="choices d-flex justify-content-around flex-wrap w-50">
          {choices.map((c, i) => {
            const isRight =
              props.isCorrect(choices[i]) && state.correct === props.uid;
            const isWrong = state.incorrect.includes(i);

            return (
              <AChoice
                key={c.compare}
                c={c}
                i={i}
                isRight={isRight}
                isWrong={isWrong}
                checkAnswer={checkAnswer}
                aRomaji={props.aRomaji}
                fade={props.fadeInAnswers}
              />
            );
          })}
        </div>
        <StackNavButton ariaLabel="Next" action={gotoNext}>
          <ChevronRightIcon size={16} />
        </StackNavButton>
      </div>
    </div>
  );
}

interface AChoiceProps {
  c: GameChoice;
  i: number;
  isRight: boolean;
  isWrong: boolean;
  checkAnswer: (answered: GameChoice, i: number) => void;
  aRomaji?: boolean;
  fade?: boolean;
}

function AChoice(props: AChoiceProps) {
  const { c, i, isRight, isWrong, checkAnswer, aRomaji,fade} = props;

  const [invisible] = useFade(fade===false?0:(i + 1) * 1000);

  const choiceCSS = classNames({
    "w-50 h-50 pt-3 d-flex flex-column justify-content-evenly text-center clickable":
      true,
    "notification-fade": !invisible,
    "notification-fade-in": invisible,
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
