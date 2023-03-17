import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useMemo, useRef, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  addFrequencyKanji,
  removeFrequencyKanji,
} from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder } from "../../helper/gameHelper";
import { useFilterTerms } from "../../hooks/kanjiGamesHK";
import { useKanjiStore } from "../../hooks/kanjiHK";
import { NotReady } from "../Form/NotReady";
import {
  ToggleFrequencyTermBtnMemo,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import FourChoices from "./FourChoices";
import { KanjiGridMeta } from "./KanjiGrid";

/**
 * @typedef {import("../../typings/state").AppRootState} AppRootState
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 */

/**
 * @typedef {Object} KanjiGameProps
 * @property {typeof removeFrequencyKanji} removeFrequencyKanji
 * @property {typeof addFrequencyKanji} addFrequencyKanji
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
 * @param {RawKanji} answer
 * @param {RawKanji[]} kanjiList
 */
function createEnglishChoices(answer, kanjiList) {
  const splitToArray = (/** @type {string} */ term) =>
    term.split(",").map((s) => s.trim());
  let choices = [{ ...answer, english: oneFromList(answer.english) }];

  const aArr = splitToArray(answer.english);

  while (choices.length < 4) {
    const i = Math.floor(Math.random() * kanjiList.length);

    const choice = kanjiList[i];
    const cArr = splitToArray(choice.english);

    // should not match the right answer(s)
    // should not match a previous choice
    if (
      cArr.every((cCurr) => aArr.every((a) => a !== cCurr)) &&
      cArr.every((cCurr) => choices.every((cPrev) => cCurr !== cPrev.english))
    ) {
      choices = [
        ...choices,
        { ...choice, english: oneFromList(choice.english) },
      ];
    }
  }

  shuffleArray(choices);

  return choices;
}

/**
 * @param {RawKanji} kanji
 * @param {RawKanji[]} rawKanjis
 */
function prepareGame(kanji, rawKanjis) {
  if (!kanji || rawKanjis.length === 0) return;
  // console.log("prepareGame("+kanji.english+", "+rawKanjis.length+")");

  const { uid, kanji: japanese, on, kun } = kanji;

  const choices = createEnglishChoices(kanji, rawKanjis);

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
    answer: uid,
    choices: choices.map((c) => ({
      compare: c.uid,
      toHTML: () => c.english,
    })),
  };
}

/**
 * @param {KanjiGameProps} props
 */
function KanjiGame(props) {
  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);

  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const rawKanjis = useKanjiStore(dispatch, version);

  const {
    activeTags,
    filter: filterType,
    reinforce,
    repetition,
  } = useSelector((/** @type {AppRootState}*/ { settings }) => settings.kanji);

  const filteredTerms = useFilterTerms(
    repetition,
    rawKanjis,
    reinforce,
    filterType,
    activeTags
  );
  order.current = useMemo(() => randomOrder(filteredTerms), [filteredTerms]);

  const kanji = useMemo(
    () => filteredTerms[order.current[selectedIndex]],
    [filteredTerms, selectedIndex]
  );
  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const game = useMemo(() => prepareGame(kanji, rawKanjis), [kanji, rawKanjis]);

  // console.log("           KanjiGame render " + selectedIndex);

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

  return (
    <>
      <FourChoices
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
          <div className="col text-center"></div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <ToggleFrequencyTermBtnMemo
                addFrequencyTerm={props.addFrequencyKanji}
                removeFrequencyTerm={props.removeFrequencyKanji}
                toggle={term_reinforce}
                term={kanji}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="progress-line flex-shrink-1">
        <LinearProgress
          variant="determinate"
          value={progress}
          color={term_reinforce ? "secondary" : "primary"}
        />
      </div>
    </>
  );
}

KanjiGame.propTypes = {
  addFrequencyKanji: PropTypes.func,
  removeFrequencyKanji: PropTypes.func,
};

export default connect(null, {
  addFrequencyKanji,
  removeFrequencyKanji,
})(KanjiGame);

export { KanjiGameMeta };
