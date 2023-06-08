import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { JapaneseText } from "../../helper/JapaneseText";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder } from "../../helper/gameHelper";
import { getOpposite } from "../../slices/oppositeSlice";
import { NotReady } from "../Form/NotReady";
import FourChoices from "./FourChoices";

/**
 * @typedef {{english: string, japanese: string, romaji: string, toHTML: (correct:boolean)=>JSX.Element}} RawOpposite
 */

/**
 * @typedef {Object} ParticlesGameProps
 * @property {boolean} aRomaji
 */

/**
 * @typedef {Object} ParticlesGameState
 * @property {number} selectedIndex
 */

const OppositesGameMeta = {
  location: "/opposites/",
  label: "Opposites Game",
};

export default function OppositesGame() {
  const dispatch = /** @type {AppDispatch}*/ (useDispatch());
  const { value: oppositeList } = useSelector(
    (/** @type {RootState}*/ { opposite }) => opposite,
    (before, after) => before.version === after.version
  );
  const [qRomaji, aRomaji] = useSelector(
    (/** @type {RootState}*/ { opposite }) => {
      const { qRomaji, aRomaji } = opposite;

      return [qRomaji, aRomaji];
    },
    shallowEqual
  );

  useEffect(() => {
    if (oppositeList.length === 0) {
      dispatch(getOpposite());
    }
  }, []);

  const order = useMemo(() => {
    if (oppositeList.length === 0) return [];

    return randomOrder(oppositeList);
  }, [oppositeList]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  function gotoNext() {
    const l = oppositeList.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
  }

  function gotoPrev() {
    const l = oppositeList.length;
    const i = selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    setSelectedIndex(newSel);
  }

  if (order.length === 0) return <NotReady addlStyle="main-panel" />;

  const game = prepareGame(oppositeList, order, selectedIndex);

  const progress = ((selectedIndex + 1) / oppositeList.length) * 100;

  return (
    <>
      <FourChoices
        key={0}
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
      />
      <div key={1} className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

/**
 * @param {[question:RawOpposite, answer:RawOpposite][]} opposites
 * @param {number[]} order
 * @param {number} selectedIndex
 */
function prepareGame(opposites, order, selectedIndex) {
  let [questionObj, answerObj] = opposites[order[selectedIndex]];
  const q = JapaneseText.parse(questionObj);
  const a = JapaneseText.parse(answerObj);

  const question = {
    ...questionObj,
    toHTML: (/** @type {boolean} */ correct) => (
      <span
        className={classNames({
          "correct-color": correct,
        })}
      >
        {q.toHTML()}
      </span>
    ),
  };
  /** @type {import("./FourChoices").GameChoice} */
  const answer = {
    ...answerObj,
    compare: answerObj.japanese,
    toHTML: () => a.toHTML(),
  };

  /** @type {import("./FourChoices").GameChoice[]} */
  let choices = [answer];
  let antiHomophones = [answer.romaji, question.romaji];

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
            toHTML: () => w1.toHTML(),
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
            toHTML: () => w2.toHTML(),
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
