import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  addFrequencyKanji,
  removeFrequencyKanji,
} from "../../slices/settingSlice";
import { shuffleArray } from "../../helper/arrayHelper";
import { randomOrder } from "../../helper/gameHelper";
import { useFrequency } from "../../hooks/frequencyHK";
import { useFilterTerms } from "../../hooks/kanjiGamesHK";
import { useReinforcePlay } from "../../hooks/reinforcePlayHK";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ToggleFrequencyTermBtnMemo,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import FourChoices from "./FourChoices";
import { KanjiGridMeta } from "./KanjiGrid";
import { useRandomTerm } from "../../hooks/randomTermHK";
import { getKanji } from "../../slices/kanjiSlice";
import { useKanjiGameConnected } from "../../hooks/selectorConnected";

/**
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
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
  // console.warn("prepareGame("+kanji.english+", "+rawKanjis.length+")");

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

export default function KanjiGame() {
  const dispatch = useDispatch();
  const {rawKanjis,
    activeTags,
    filterType,
    reinforce,
    repetitionObj} = useKanjiGameConnected()

  useMemo(() => {
    if (rawKanjis.length === 0) {
      dispatch(getKanji());
    }
  }, []);

  /** @type {React.MutableRefObject<number[]>} */
  const order = useRef([]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const repetition = useMemo(() => repetitionObj, [repetitionObj]);

  const filteredTerms = useFilterTerms(
    repetition,
    rawKanjis,
    reinforce,
    filterType,
    activeTags
  );
  order.current = useMemo(() => randomOrder(filteredTerms), [filteredTerms]);

  const [willReinforce, setWillReinforce] = useState(false);
  const frequencyUids = useFrequency(repetition, filteredTerms);
  const randomTerm = useRandomTerm(willReinforce, frequencyUids, filteredTerms);

  let [kanji, setMove] = useReinforcePlay(
    willReinforce,
    randomTerm,
    filteredTerms.length,
    setSelectedIndex
  );

  kanji = useMemo(
    () => kanji ?? filteredTerms[order.current[selectedIndex]],
    [kanji, filteredTerms, selectedIndex]
  );
  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const game = useMemo(() => prepareGame(kanji, rawKanjis), [kanji, rawKanjis]);

  // console.log("           KanjiGame render " + selectedIndex);

  const addFrequencyTerm=useCallback((uid)=>{dispatch(addFrequencyKanji(uid))},[dispatch]);
  const removeFrequencyTerm=useCallback((uid)=>{dispatch(removeFrequencyKanji(uid))},[dispatch]);

  if (game === undefined) return <NotReady addlStyle="main-panel" />;

  const l = filteredTerms.length;
  const progress = ((selectedIndex + 1) / l) * 100;

  return (
    <>
      <FourChoices
        question={game.question}
        isCorrect={(answered) => answered.compare === game.answer}
        choices={game.choices}
        gotoPrev={() => {
          setWillReinforce(false);
          setMove((v) => v - 1);
        }}
        gotoNext={() => {
          const willReinforce = reinforce && Math.random() < 1 / 3;
          setWillReinforce(willReinforce);
          setMove((v) => v + 1);
        }}
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
          <div className="col text-center">
            <FrequencyTermIcon
              visible={
                term_reinforce &&
                kanji.uid !== filteredTerms[order.current[selectedIndex]].uid
              }
            />
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <ToggleFrequencyTermBtnMemo
                addFrequencyTerm={addFrequencyTerm}
                removeFrequencyTerm={removeFrequencyTerm}
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

export { KanjiGameMeta };
