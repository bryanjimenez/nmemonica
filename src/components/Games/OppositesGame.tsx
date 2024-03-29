import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

import { FourChoicesWRef, type GameChoice } from "./FourChoices";
import { shuffleArray } from "../../helper/arrayHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { randomOrder } from "../../helper/sortHelper";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import type { AppDispatch, RootState } from "../../slices";
import { getOpposite } from "../../slices/oppositeSlice";
import { NotReady } from "../Form/NotReady";

export interface RawOpposite {
  english: string;
  japanese: string;
  romaji: string;
  toHTML: (correct: boolean) => React.JSX.Element;
}

const OppositesGameMeta = {
  location: "/opposites/",
  label: "Opposites Game",
};

export default function OppositesGame() {
  const dispatch = useDispatch<AppDispatch>();
  const { value: oppositeList } = useSelector(
    ({ opposite }: RootState) => opposite,
    (before, after) => before.version === after.version
  );
  const [qRomaji, aRomaji, fadeInAnswers] = useSelector<RootState, boolean[]>(
    ({ opposite }: RootState) => {
      const { qRomaji, aRomaji, fadeInAnswers } = opposite;

      return [qRomaji, aRomaji, fadeInAnswers];
    },
    shallowEqual
  );

  useEffect(() => {
    if (oppositeList.length === 0) {
      void dispatch(getOpposite());
    }
  }, []);

  const order = useMemo(() => {
    if (oppositeList.length === 0) return [];

    return randomOrder(oppositeList);
  }, [oppositeList]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const gotoNext = useCallback(() => {
    // function gotoNext() {
    const l = oppositeList.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
    // }
  }, [selectedIndex, oppositeList]);

  const gotoPrev = useCallback(() => {
    // function gotoPrev() {
    const l = oppositeList.length;
    const i = selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    setSelectedIndex(newSel);
    // }
  }, [selectedIndex, oppositeList]);

  const swipeHandler = useCallback(
    (direction: string) => {
      switch (direction) {
        case "right":
          gotoPrev();
          break;
        case "left":
          gotoNext();
          break;

        default:
          break;
      }

      return Promise.resolve(/** interrupt, fetch */);
    },
    [gotoPrev, gotoNext]
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(swipeHandler);

  if (order.length === 0) return <NotReady addlStyle="main-panel" />;

  const game = prepareGame(oppositeList, order, selectedIndex);

  const progress = ((selectedIndex + 1) / oppositeList.length) * 100;

  return (
    <>
      <FourChoicesWRef
        ref={HTMLDivElementSwipeRef}
        question={game.question}
        isCorrect={(answered) => {
          const correct = answered.compare === game.answer.compare;
          if (correct) {
            // TODO: update frequency timestamps
          }

          return correct;
        }}
        choices={game.choices}
        qRomaji={qRomaji}
        aRomaji={aRomaji}
        gotoPrev={gotoPrev}
        gotoNext={gotoNext}
        fadeInAnswers={fadeInAnswers}
      />
      <div className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

function prepareGame(
  opposites: [RawOpposite, RawOpposite][],
  order: number[],
  selectedIndex: number
) {
  let [questionObj, answerObj] = opposites[order[selectedIndex]];
  const q = JapaneseText.parse(questionObj);
  const a = JapaneseText.parse(answerObj);

  const choiceCss = "fs-2";

  const question = {
    ...questionObj,
    toHTML: (correct: boolean) => (
      <span
        className={classNames({
          "fs-1": true,
          "correct-color": correct,
        })}
      >
        {q.toHTML()}
      </span>
    ),
  };
  const answer: GameChoice = {
    ...answerObj,
    compare: answerObj.japanese,
    toHTML: () => <span className={choiceCss}>{a.toHTML()}</span>,
  };

  let choices: GameChoice[] = [answer];
  let antiHomophones: string[] = [answerObj.romaji, questionObj.romaji];

  while (choices.length < 4) {
    const idx = Math.floor(Math.random() * opposites.length);

    const [wrongAnswer1, wrongAnswer2] = opposites[idx];

    if (
      !antiHomophones.includes(wrongAnswer1.romaji) &&
      !antiHomophones.includes(wrongAnswer2.romaji)
    ) {
      const headsOrTails = Math.floor(Math.random() * 2);

      if (headsOrTails === 0) {
        const w1 = JapaneseText.parse(wrongAnswer1);
        choices = [
          ...choices,
          {
            ...wrongAnswer1,
            compare: wrongAnswer1.japanese,
            toHTML: () => <span className={choiceCss}>{w1.toHTML()}</span>,
          },
        ];
        antiHomophones = [...antiHomophones, wrongAnswer1.romaji];
      } else {
        const w2 = JapaneseText.parse(wrongAnswer2);
        choices = [
          ...choices,
          {
            ...wrongAnswer2,
            compare: wrongAnswer2.japanese,
            toHTML: () => <span className={choiceCss}>{w2.toHTML()}</span>,
          },
        ];
        antiHomophones = [...antiHomophones, wrongAnswer2.romaji];
      }
    }
  }

  shuffleArray(choices);

  return { question, answer, choices };
}

export { OppositesGameMeta };
