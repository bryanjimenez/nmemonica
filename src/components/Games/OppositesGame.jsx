import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LinearProgress } from "@mui/material";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder } from "../../helper/gameHelper";
import { NotReady } from "../Form/NotReady";
import FourChoices from "./FourChoices";
import classNames from "classnames";
import { useOppositesStore } from "../../hooks/oppositesHK";
import { JapaneseText } from "../../helper/JapaneseText";

/**
 * @typedef {{english: string, japanese: string, romaji: string, toHTML: (correct:boolean)=>JSX.Element}} RawOpposite
 *
 * @typedef {import("../../typings/state").AppRootState} AppRootState
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

function OppositesGame() {
  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  /**
   *
   * @param {number} selectedIndex
   * @param {[question:RawOpposite, answer:RawOpposite][]} opposites
   */
  function prepareGame(selectedIndex, opposites) {
    if (opposites.length > 0) {
      // console.log("preparing");

      if (order.current.length === 0) {
        order.current = randomOrder(opposites);
      }

      let [questionObj, answerObj] = opposites[order.current[selectedIndex]];
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
        const max = Math.floor(opposites.length);
        const idx = Math.floor(Math.random() * max);

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
  }

  function gotoNext() {
    const l = rawOpposites.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
  }

  function gotoPrev() {
    const l = rawOpposites.length;
    const i = selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    setSelectedIndex(newSel);
  }

  const dispatch = useDispatch();
  const { qRomaji, aRomaji } = useSelector(
    (/** @type {AppRootState}*/ state) => state.settings.opposites
  );
  const version = useSelector(
    (/** @type {AppRootState}*/ { version }) => version.opposites
  );
  const { value: oppositesArr } = useSelector(
    (/** @type {AppRootState}*/ { opposites }) => opposites
  );
  const rawOpposites = useMemo(() => oppositesArr, [oppositesArr]);
  useOppositesStore(dispatch, version, rawOpposites);

  const game = prepareGame(selectedIndex, rawOpposites);

  // console.log(selectedIndex)
  // console.log("KanjiGame render");

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / rawOpposites.length) * 100;

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
      <div key={1} className="progress-bar flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

export default OppositesGame;

export { OppositesGameMeta };
