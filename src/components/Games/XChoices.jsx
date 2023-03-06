import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useReducer } from "react";
import { useSelector } from "react-redux";
import { DebugLevel } from "../../actions/settingsAct";
import StackNavButton from "../Form/StackNavButton";

/**
 * @typedef {import("../../typings/state").AppRootState} AppRootState
 * @typedef {{english?: string, toHTML: (correct:boolean)=>JSX.Element}} GameQuestion
 * @typedef {{english?: string, toHTML: function, compare: string}} GameChoice
 */

/**
 * @typedef {Object} XChoicesProps
 * @property {GameQuestion} question
 * @property {string} [hint] a hint to be displayed if provided
 * @property {GameChoice[]} choices
 * @property {(answered: GameChoice)=>boolean} isCorrect answer validator
 * @property {function} gotoPrev
 * @property {function} gotoNext
 */

/**
 * @typedef {Object} XChoicesState
 * @property {boolean} showMeaning
 * @property {number[]} incorrect
 * @property {boolean} correct
 */

/**
 * @param {XChoicesProps} props
 */
function XChoices(props) {
  /** @type {[XChoicesState, import("react").Dispatch<Partial<XChoicesState>>]} */
  const [state, dispatch] = useReducer(
    (
      /** @type {XChoicesState} */ state,
      /** @type {Partial<XChoicesState>} */ action
    ) => ({ ...state, ...action }),
    {
      showMeaning: false,
      incorrect: [],
      correct: false,
    }
  );

  const { debug } = useSelector(
    (/** @type {AppRootState}*/ { settings }) => settings.global
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
      }, 2500);
    } else {
      // console.log("WRONG");
      dispatch({ incorrect: [...state.incorrect, i] });
    }
  };

  // const question = props.question;
  const choices = props.choices;

  // console.log(question);
  // console.log(choices);

  /**
   * @param {number} index
   */
  const choiceButton = (index) => {
    const correct = state.correct;
    const choiceN = choices.length;

    const isWrong = state.incorrect.includes(index);
    const isRight = props.isCorrect(choices[index]) && correct;

    const wideMode = true;

    const choiceCSS = classNames({
      clickable: true,
      "text-center": true,
      "d-flex flex-column justify-content-center": true,
      "correct-color": isRight,
      "incorrect-color": isWrong,
    });

    const choiceH2CSS = classNames({
      "mb-0": wideMode,
    });

    const wide = wideMode ? 3 / 4 : 1;

    const width =
      Math.trunc((1 / Math.ceil(Math.sqrt(choiceN))) * wide * 100) + "%";

    return (
      <div
        key={index}
        onClick={() => checkAnswer(choices[index], index)}
        className={choiceCSS}
        style={{ width }}
      >
        <h2 className={choiceH2CSS}>{choices[index].toHTML()}</h2>
      </div>
    );
  };

  const mainPanel = classNames({
    "pickXgame main-panel h-100": true,
    "z-index-1": debug !== DebugLevel.OFF,
  });

  return (
    <div key={0} className={mainPanel}>
      <div className="d-flex justify-content-between h-100">
        <StackNavButton
          ariaLabel="Previous"
          action={
            /** @type {React.MouseEventHandler} */ (
              () => {
                clearAnswers();
                props.gotoPrev();
              }
            )
          }
        >
          <ChevronLeftIcon size={16} />
        </StackNavButton>
        <div className="choices d-flex justify-content-around flex-wrap w-100">
          {choices.map((c, i) => choiceButton(i))}
        </div>
        <StackNavButton
          ariaLabel="Next"
          action={
            /** @type {React.MouseEventHandler} */ (
              () => {
                clearAnswers();
                props.gotoNext();
              }
            )
          }
        >
          <ChevronRightIcon size={16} />
        </StackNavButton>
      </div>
    </div>
  );
}

XChoices.propTypes = {
  question: PropTypes.object,
  isCorrect: PropTypes.func.isRequired,
  choices: PropTypes.array,

  gotoNext: PropTypes.func.isRequired,
  gotoPrev: PropTypes.func.isRequired,
};

export default XChoices;
