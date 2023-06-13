import React, { useReducer } from "react";
import PropTypes from "prop-types";
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

function FourChoices(props: FourChoicesProps) {
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

  const clearAnswers = () => {
    dispatch({ showMeaning: false, correct: false, incorrect: [] });
  };

  const checkAnswer = (answered: GameChoice, i: number) => {
    if (props.isCorrect(answered)) {
      // console.log("RIGHT!");
      dispatch({ correct: true, showMeaning: true });
      setTimeout(() => {
        clearAnswers();
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
        clearAnswers();
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

  return (
    <div key={0} className="pick4game main-panel h-100">
      <div className="d-flex justify-content-between h-100">
        <StackNavButton
          ariaLabel="Previous"
          action={() => {
            clearAnswers();
            props.gotoPrev();
          }}
        >
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
                key={`${c.english ?? "blank"}-${c.compare}`}
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
        <StackNavButton
          ariaLabel="Next"
          action={() => {
            clearAnswers();
            props.gotoNext();
          }}
        >
          <ChevronRightIcon size={16} />
        </StackNavButton>
      </div>
    </div>
  );
}

FourChoices.propTypes = {
  question: PropTypes.object,
  hint: PropTypes.string,
  isCorrect: PropTypes.func.isRequired,
  choices: PropTypes.array,

  gotoNext: PropTypes.func.isRequired,
  gotoPrev: PropTypes.func.isRequired,

  qRomaji: PropTypes.bool,
  aRomaji: PropTypes.bool,
};

export default FourChoices;
