import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import PropTypes from "prop-types";
import React, { useMemo, useRef, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  addFrequencyKanji,
  removeFrequencyKanji,
  TermFilterBy,
} from "../../actions/settingsAct";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder, termFilterByType } from "../../helper/gameHelper";
import { useKanjiStore } from "../../hooks/kanjiHK";
import { NotReady } from "../Form/NotReady";
import {
  ToggleFrequencyTermBtn,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { KanjiGameMeta, oneFromList } from "./KanjiGame";
import XChoices from "./XChoices";

/**
 * @typedef {import("../../typings/state").AppRootState} AppRootState
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 */

/**
 * @typedef {Object} KanjiGridProps
 * @property {typeof removeFrequencyKanji} removeFrequencyKanji
 * @property {typeof addFrequencyKanji} addFrequencyKanji
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

/**
 * @param {number} choiceN
 * @param {RawKanji} kanji
 * @param {RawKanji[]} selectedKanjis
 * @param {RawKanji[]} rawKanjis
 * @param {boolean} writePractice
 */
function prepareGame(choiceN, kanji, selectedKanjis, rawKanjis, writePractice) {
  if (!kanji || selectedKanjis.length === 0 || rawKanjis.length === 0) return;
  // console.log("prepareGame("+kanji.english+", "+selectedKanjis.length+", "+rawKanjis.length+")");

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

/**
 * @param {KanjiGridProps} props
 */
function KanjiGrid(props) {
  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);
  const repetitionRef = useRef({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [writePractice, setEnglishSide] = useState(false);

  const { choiceN } = useSelector(
    (/** @type {AppRootState}*/ { settings }) => settings.kanji
  );

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
  /** @type {RawKanji[]} */
  const rawKanjis = useMemo(() => kanjiArr, [kanjiArr]);
  useKanjiStore(dispatch, version, rawKanjis);

  const {
    activeTags,
    filter: filterType,
    reinforce,
    repetition,
  } = useSelector((/** @type {AppRootState}*/ { settings }) => settings.kanji);
  repetitionRef.current = repetition;

  /** @type {RawKanji[]} */
  const filteredTerms = useMemo(() => {
    // console.log("termFilterByType("+Object.keys(TermFilterBy)[filterType]+", "+rawKanjis.length+", "+activeTags.length+")");

    const allFrequency = Object.keys(repetitionRef.current).reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (repetitionRef.current[cur].rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    let filtered = termFilterByType(
      filterType,
      rawKanjis,
      allFrequency,
      filterType === TermFilterBy.TAGS ? activeTags : [],
      () => {} // Don't toggle filter if last freq is removed
    );

    if (reinforce && filterType === TermFilterBy.TAGS) {
      const filteredList = filtered.map((k) => k.uid);
      const additional = rawKanjis.filter(
        (k) => allFrequency.includes(k.uid) && !filteredList.includes(k.uid)
      );

      filtered = [...filtered, ...additional];
    }

    order.current = randomOrder(filtered);

    return filtered;
  }, [filterType, rawKanjis, activeTags, reinforce]);

  const kanji = useMemo(
    () => filteredTerms[order.current[selectedIndex]],
    [filteredTerms, selectedIndex]
  );
  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const game = useMemo(
    () => prepareGame(choiceN, kanji, filteredTerms, rawKanjis, writePractice),
    [choiceN, kanji, filteredTerms, rawKanjis, writePractice]
  );

  // console.log("KanjiGrid render "+selectedIndex);

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
              <Link
                to={
                  writePractice
                    ? KanjiGridMeta.location
                    : KanjiGameMeta.location
                }
              >
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
              <ToggleFrequencyTermBtn
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

KanjiGrid.propTypes = {
  addFrequencyKanji: PropTypes.func,
  removeFrequencyKanji: PropTypes.func,
};

export default connect(null, {
  addFrequencyKanji,
  removeFrequencyKanji,
})(KanjiGrid);
export { KanjiGridMeta };
