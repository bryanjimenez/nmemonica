import classNames from "classnames";
import React, { useCallback, useReducer } from "react";

import type { GameChoice, GameQuestion } from "./FourChoices";
import ClickNavBtn from "../Form/ClickNavBtn";

interface XChoicesProps {
  question: GameQuestion;
  hint?: string; // a hint to be displayed if provided
  choices: GameChoice[];
  isCorrect: (answered: GameChoice) => [boolean, number]; //Answer validator, returns if correct and correct answer index
  gotoPrev: () => void;
  gotoNext: () => void;
}

interface XChoicesState {
  showMeaning: boolean;
  incorrect: number[];
  correct: number;
}

export default function XChoices(props: XChoicesProps) {
  const [state, dispatch]: [
    XChoicesState,
    React.Dispatch<Partial<XChoicesState>>,
  ] = useReducer(
    (state: XChoicesState, action: Partial<XChoicesState>) => ({
      ...state,
      ...action,
    }),
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

  const checkAnswer = (answered: GameChoice, i: number) => {
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

  const choiceButton = (index: number) => {
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
      "fs-2": true,
      "mb-0": wideMode,
    });

    const wide = wideMode ? 3 / 4 : 1;

    const width = `${Math.trunc(
      (1 / Math.ceil(Math.sqrt(choiceN))) * wide * 100
    )}%`;

    return (
      <div
        key={index}
        onClick={() => checkAnswer(choices[index], index)}
        className={choiceCSS}
        style={{ width }}
      >
        <span className={choiceH2CSS}>{choices[index].toHTML()}</span>
      </div>
    );
  };

  const gotoPrevLogic = useCallback(() => {
    clearAnswers();
    gotoPrev();
  }, [clearAnswers, gotoPrev]);

  const gotoNextLogic = useCallback(() => {
    clearAnswers();
    gotoNext();
  }, [clearAnswers, gotoNext]);
  const mainPanel = classNames({
    "pickXgame main-panel h-100": true,
  });

  return (
    <div className={mainPanel}>
      <div className="d-flex justify-content-between h-100">
        <ClickNavBtn direction="previous" action={gotoPrevLogic} />
        <div className="choices d-flex justify-content-around flex-wrap w-100">
          {choices.map((c, i) => choiceButton(i))}
        </div>
        <ClickNavBtn direction="next" action={gotoNextLogic} />
      </div>
    </div>
  );
}
