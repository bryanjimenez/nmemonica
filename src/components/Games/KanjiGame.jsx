import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LinearProgress } from "@mui/material";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder } from "../../helper/gameHelper";
import { NotReady } from "../Form/NotReady";
import FourChoices from "./FourChoices";
import classNames from "classnames";
import { useKanjiStore } from "../../hooks/kanjiHK";

/**
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 *
 * @typedef {import("../../typings/state").AppRootState} AppRootState
 */

const KanjiGameMeta = {
  location: "/kanji-game/",
  label: "Kanji Game",
};

/**
 * Returns a list of choices which includes the right answer
 * @param {keyof RawKanji} compareOn
 * @param {RawKanji} answer
 * @param {RawKanji[]} kanjiList
 */
function createChoices(compareOn, answer, kanjiList) {
  let choices = [answer];
  while (choices.length < 4) {
    const i = Math.floor(Math.random() * kanjiList.length);

    const choice = kanjiList[i];

    // should not be same choices or the right answer
    if (choices.every((c) => c[compareOn] !== choice[compareOn])) {
      choices = [...choices, choice];
    }
  }

  shuffleArray(choices);

  return choices;
}

function KanjiGame() {
  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  /**
   * @param {number} selectedIndex
   * @param {RawKanji[]} rawKanjis
   */
  function prepareGame(selectedIndex, rawKanjis) {
    if (rawKanjis.length === 0) return;

    if (order.current.length === 0) {
      order.current = randomOrder(rawKanjis);
    }

    const kanji = rawKanjis[order.current[selectedIndex]];
    const { eng: english, kanji: japanese, on, kun } = kanji;

    // TODO: rename attr eng->english
    const choices = createChoices("eng", kanji, rawKanjis);

    /** @type {import("./FourChoices").GameQuestion} */
    const q = {
      // english, not needed, shown as a choice
      toHTML: (correct) => (
        <div>
          <div
            className={classNames({
              "correct-color": correct,
            })}
          >
            <span>{japanese}</span>
          </div>
          {(on !== undefined || kun !== undefined) && (
            <div
              className={classNames({
                "d-flex flex-column mt-3 h4": true,
                "transparent-color": !correct,
                "correct-color": correct,
              })}
            >
              <span>{on}</span>
              <span>{kun}</span>
            </div>
          )}
        </div>
      ),
    };

    return {
      question: q,
      answer: english,
      choices: choices.map((c) => ({ compare: c.eng, toHTML: () => c.eng })),
    };
  }

  function gotoNext() {
    const l = rawKanjis.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
  }

  function gotoPrev() {
    const l = rawKanjis.length;
    const i = selectedIndex - 1;
    const newSel = i < 0 ? (l + i) % l : i % l;
    setSelectedIndex(newSel);
  }

  const dispatch = useDispatch();

  const version = useSelector(
    (/** @type {AppRootState}*/ { version }) => version.kanji
  );
  const { value: kanjiArr } = useSelector(
    (/** @type {AppRootState}*/ { kanji }) => kanji
  );
  const rawKanjis = useMemo(() => kanjiArr, [kanjiArr]);
  useKanjiStore(dispatch, version, rawKanjis);

  const game = prepareGame(selectedIndex, rawKanjis);

  // console.log(selectedIndex)
  // console.log("KanjiGame render");

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / rawKanjis.length) * 100;

  return (
    <>
      <FourChoices
        key={0}
        question={game.question}
        isCorrect={(answered) => answered.compare === game.answer}
        choices={game.choices}
        gotoPrev={gotoPrev}
        gotoNext={gotoNext}
      />
      <div key={1} className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

export default KanjiGame;

export { KanjiGameMeta };
