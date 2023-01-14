import React, { useReducer } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import StackNavButton from "../Form/StackNavButton";

/**
 * @typedef {{english?: string, romaji?: string, toHTML: (correct:boolean)=>JSX.Element}} GameQuestion
 * @typedef {{english?: string, romaji?: string, toHTML: function}} GameChoice
 */

/**
 * @typedef {Object} FourChoicesProps
 * @property {GameQuestion} question
 * @property {boolean} [qRomaji]
 * @property {string} [hint] a hint to be displayed if provided
 * @property {boolean} [aRomaji]
 * @property {GameChoice[]} choices
 * @property {(answered: GameChoice)=>boolean} isCorrect answer validator
 * @property {function} gotoPrev
 * @property {function} gotoNext
 */

/**
 * @typedef {Object} FourChoicesState
 * @property {boolean} showMeaning
 * @property {number[]} incorrect
 * @property {boolean} correct
 */

/**
 * @param {FourChoicesProps} props
 */
function FourChoices(props) {
  /** @type {[FourChoicesState, import("react").Dispatch<Partial<FourChoicesState>>]} */
  const [state, dispatch] = useReducer(
    (
      /** @type {FourChoicesState} */ state,
      /** @type {Partial<FourChoicesState>} */ action
    ) => ({ ...state, ...action }),
    {
      showMeaning: false,
      incorrect: [],
      correct: false,
    }
  );

  const clearAnswers = () => {
    dispatch({ showMeaning: false, correct: false, incorrect: [] });
  };

  /**
   * @param {GameChoice} answered
   * @param {number} i
   */
  const checkAnswer = (answered, i) => {
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
          color={"--green"}
          action={/** @type {React.MouseEventHandler} */ (props.gotoPrev)}
        >
          <ChevronLeftIcon size={16} />
        </StackNavButton>
        <div
          className={classNames({
            "question pt-3 pb-3 d-flex flex-column justify-content-center text-center w-50": true,
          })}
        >
          <h1>{question.toHTML(state.correct)}</h1>
          <span
            className={classNames({
              "transparent-color": !props.qRomaji,
            })}
          >
            {question.romaji}
          </span>
          <span
            className="clickable"
            onClick={() => {
              if (question.english !== undefined || props.hint !== undefined) {
                dispatch({ showMeaning: !state.showMeaning });
              }
            }}
          >
            {meaning}
          </span>
        </div>
        <div className="choices pt-3 d-flex justify-content-around flex-wrap w-50">
          {choices.map((c, i) => {
            const isRight = props.isCorrect(choices[i]) && state.correct;
            const isWrong = state.incorrect.includes(i);

            const choiceCSS = classNames({
              "w-50 pt-3 d-flex flex-column justify-content-evenly text-center clickable": true,
              "correct-color": isRight,
              "incorrect-color": isWrong,
            });

            return (
              <div
                key={i}
                className={choiceCSS}
                onClick={() => {
                  checkAnswer(c, i);
                }}
              >
                <div>
                  <h4>{c.toHTML()}</h4>
                  <span
                    className={classNames({
                      "transparent-color": !props.aRomaji,
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
          color={"--green"}
          ariaLabel="Next"
          action={/** @type {React.MouseEventHandler} */ (props.gotoNext)}
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
