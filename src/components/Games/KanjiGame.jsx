import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LinearProgress } from "@mui/material";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder, termFilterByType } from "../../helper/gameHelper";
import { NotReady } from "../Form/NotReady";
import FourChoices from "./FourChoices";
import classNames from "classnames";
import { useKanjiStore } from "../../hooks/kanjiHK";
import { TermFilterBy } from "../../actions/settingsAct";
import { Link } from "react-router-dom";
import { TogglePracticeSideBtn } from "../Form/OptionsBar";
import { KanjiGridMeta } from "./KanjiGrid";

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
 * Split comma separated string(list) and select one.
 * Apply ProperCase
 * @param {string} english
 */
export function oneFromList(english) {
  let englishShortened = english;
  const engList = english.split(",");
  if (engList.length > 1) {
    const i = Math.floor(Math.random() * engList.length);
    const e = engList[i].trim();
    englishShortened = e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
  }

  return englishShortened;
}

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
   * @param {RawKanji[]} selectedKanjis
   */
  function prepareGame(selectedIndex, selectedKanjis) {
    if (selectedKanjis.length === 0) return;

    if (order.current.length === 0) {
      order.current = randomOrder(selectedKanjis);
    }

    const kanji = selectedKanjis[order.current[selectedIndex]];
    const { english, kanji: japanese, on, kun } = kanji;

    const choices = createChoices("english", kanji, rawKanjis);

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
                invisible: !correct,
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
      choices: choices.map((c) => ({
        compare: c.english,
        toHTML: () => oneFromList(c.english),
      })),
    };
  }

  function gotoNext() {
    const l = filteredTerms.length;
    const newSel = (selectedIndex + 1) % l;
    setSelectedIndex(newSel);
  }

  function gotoPrev() {
    const l = filteredTerms.length;
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

  const { activeTags } = useSelector(
    (/** @type {AppRootState}*/ { settings }) => settings.kanji
  );
  /** @type {RawKanji[]} */
  const filteredTerms = termFilterByType(
    TermFilterBy.TAGS,
    rawKanjis,
    null,
    activeTags,
    null
  );

  const game = prepareGame(selectedIndex, filteredTerms);

  // console.log(selectedIndex);
  // console.log("KanjiGame render");

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

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
      <div className="options-bar mb-3 flex-shrink-1">
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start">
              <Link to={KanjiGridMeta.location}>
                <TogglePracticeSideBtn toggle={true} action={() => {}} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div key={1} className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

export default KanjiGame;

export { KanjiGameMeta };
