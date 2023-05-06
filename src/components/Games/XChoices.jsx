import { ChevronLeftIcon, ChevronRightIcon } from "@primer/octicons-react";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useCallback, useReducer } from "react";
import StackNavButton from "../Form/StackNavButton";

/**
 * @typedef {{english?: string, toHTML: (correct:boolean)=>JSX.Element}} GameQuestion
 * @typedef {{english?: string, toHTML: function, compare: string}} GameChoice
 */

/**
 * @typedef {Object} XChoicesProps
 * @property {GameQuestion} question
 * @property {string} [hint] a hint to be displayed if provided
 * @property {GameChoice[]} choices
 * @property {(answered: GameChoice)=>[boolean, number]} isCorrect Answer validator, returns if correct and correct answer index
 * @property {function} gotoPrev
 * @property {function} gotoNext
 */

/**
 * @typedef {Object} XChoicesState
 * @property {boolean} showMeaning
 * @property {number[]} incorrect
 * @property {number} correct
 */

/**
 * @param {XChoicesProps} props
 */
export default function XChoices(props) {
  /** @type {[XChoicesState, import("react").Dispatch<Partial<XChoicesState>>]} */
  const [state, dispatch] = useReducer(
    (
      /** @type {XChoicesState} */ state,
      /** @type {Partial<XChoicesState>} */ action
    ) => ({ ...state, ...action }),
    {
      showMeaning: false,
      incorrect: [],
      correct: -1,
    }
  );

  const clearAnswers = useCallback(() => {
    dispatch({ showMeaning: false, correct: -1, incorrect: [] });
  }, [dispatch]);

  const { isCorrect, choices, gotoNext, gotoPrev } = props;

  /**
   * @param {GameChoice} answered
   * @param {number} i
   */
  const checkAnswer = (answered, i) => {
    const [wasCorrect, correctIdx] = isCorrect(answered);

    if (wasCorrect) {
      // console.log("RIGHT!");
      dispatch({ correct: i, showMeaning: true });
      setTimeout(() => {
        clearAnswers();
        gotoNext();
      }, 1000);
    } else if (state.incorrect.length === 2) {
      // console.log("WRONG");
      dispatch({
        incorrect: [...state.incorrect, i],
        correct: correctIdx,
        showMeaning: true,
      });
      setTimeout(() => {
        clearAnswers();
        gotoNext();
      }, 2500);
    } else {
      // console.log("WRONG");
      dispatch({ incorrect: [...state.incorrect, i] });
    }
  };

  /**
   * @param {number} index
   */
  const choiceButton = (index) => {
    const choiceN = choices.length;

    const isWrong = state.incorrect.includes(index);
    const isRight = state.correct === index;
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

  const gotoPrevLogic = useCallback(
    /** @type {React.MouseEventHandler} */ (
      () => {
        clearAnswers();
        gotoPrev();
      }
    ),
    [clearAnswers, gotoPrev]
  );

  const gotoNextLogic = useCallback(
    /** @type {React.MouseEventHandler} */ (
      () => {
        clearAnswers();
        gotoNext();
      }
    ),
    [clearAnswers, gotoNext]
  );
  const mainPanel = classNames({
    "pickXgame main-panel h-100": true,
  });

  return (
    <div key={0} className={mainPanel}>
      <div className="d-flex justify-content-between h-100">
        <StackNavButton ariaLabel="Previous" action={gotoPrevLogic}>
          <ChevronLeftIcon size={16} />
        </StackNavButton>
        <div className="choices d-flex justify-content-around flex-wrap w-100">
          {choices.map((c, i) => choiceButton(i))}
        </div>
        <StackNavButton ariaLabel="Next" action={gotoNextLogic}>
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

