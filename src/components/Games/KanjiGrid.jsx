import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { TermFilterBy } from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder, termFilterByType } from "../../helper/gameHelper";
import { useKanjiStore } from "../../hooks/kanjiHK";
import { NotReady } from "../Form/NotReady";
import { TogglePracticeSideBtn } from "../Form/OptionsBar";
import { KanjiGameMeta, oneFromList } from "./KanjiGame";
import XChoices from "./XChoices";

/**
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 *
 * @typedef {import("../../typings/state").AppRootState} AppRootState
 */

const KanjiGridMeta = {
  location: "/kanji-grid/",
  label: "Kanji Grid Game",
};

/**
 * Returns a list of choices which includes the right answer
 * @param {number} n
 * @param {keyof RawKanji} compareOn
 * @param {RawKanji} answer
 * @param {RawKanji[]} kanjiList
 */
function createChoices(n, compareOn, answer, kanjiList) {
  let choices = [answer];
  while (choices.length < n) {
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

function KanjiGrid() {
  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [writePractice, setEnglishSide] = useState(false);

  const { choiceN } = useSelector(
    (/** @type {AppRootState}*/ { settings }) => settings.kanji
  );

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
    const { english, kanji: japanese, on, kun, uid } = kanji;

    const choices = createChoices(choiceN, "english", kanji, rawKanjis);

    let englishShortened = oneFromList(english);

    /** @type {import("./XChoices").GameQuestion} */
    const q = {
      // english, not needed, shown as a choice
      toHTML: (correct) => {
        if (writePractice) {
          return (
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
          );
        } else {
          return <>{englishShortened}</>;
        }
      },
    };

    return {
      question: q,
      answer: uid,
      choices: choices.map((c) => ({
        compare: c.uid,
        toHTML: () => (writePractice ? c.english : c.kanji),
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
      <XChoices
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
              <Link to={writePractice ? KanjiGridMeta.location : KanjiGameMeta.location}>
                <TogglePracticeSideBtn
                  toggle={writePractice}
                  action={() => setEnglishSide((prevSide) => !prevSide)}
                />
              </Link>
            </div>
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <span>{game.question.toHTML(false)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="progress-line flex-shrink-1">
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </>
  );
}

export default KanjiGrid;

export { KanjiGridMeta };
