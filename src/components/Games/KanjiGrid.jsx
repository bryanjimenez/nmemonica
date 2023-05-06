import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  getTerm,
  getTermUID,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { setStateFunction } from "../../hooks/helperHK";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import {
  addFrequencyKanji,
  getKanji,
  removeFrequencyKanji,
} from "../../slices/kanjiSlice";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ToggleFrequencyTermBtnMemo,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { KanjiGameMeta, oneFromList } from "./KanjiGame";
import XChoices from "./XChoices";
import { TermFilterBy } from "../../slices/settingHelper";
import { shuffleArray } from "../../helper/arrayHelper";
import { useBlast } from "../../hooks/useBlast";

/**
 * @typedef {import("../../typings/raw").RawKanji} RawKanji
 */

const KanjiGridMeta = {
  location: "/kanji-grid/",
  label: "Kanji Grid Game",
};

/**
 * @param {RawKanji} kanji
 * @param {RawKanji[]} choices
 * @param {boolean} writePractice
 * @param {[string, function]} example current english example and next
 */
function prepareGame(kanji, choices, writePractice, [currExmpl, nextExmpl]) {
  const { english, kanji: japanese, on, kun, uid } = kanji;
  const isShortened = currExmpl !== english;

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
        return (
          <div onClick={isShortened ? nextExmpl : undefined}>
            {currExmpl + (isShortened ? "..." : "")}
          </div>
        );
      }
    },
  };

  return {
    question: q,
    answer: uid,
    choices: choices.map((c) => ({
      compare: c.uid,
      toHTML: (/** @type {boolean} */ side) =>
        side ?? writePractice ? c.english : c.kanji,
    })),
  };
}

/**
 * Returns a list of choices which includes the right answer
 * @param {number} n
 * @param {keyof RawKanji} compareOn
 * @param {RawKanji} answer
 * @param {RawKanji[]} kanjiList
 */
export function useCreateChoices(n, compareOn, answer, kanjiList) {
  const c = useMemo(() => {
    if (!answer) return [];

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
  }, [n, compareOn, answer, kanjiList]);

  return c;
}

export default function KanjiGrid() {
  const dispatch = /** @type {AppDispatch} */ (useDispatch());
  const {
    kanjiList,
    activeTags,
    repetition,

    filterType: filterTypeRef,
    reinforce: reinforceRef,
    choiceN,
  } = useConnectKanji();

  useEffect(() => {
    if (kanjiList.length === 0) {
      dispatch(getKanji());
    }
  }, []);

  const metadata = useRef(repetition);
  metadata.current = repetition;

  const [frequency, setFrequency] = useState(/** @type {string[]}*/ ([]));

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState(
    /** @type {string|undefined}*/ (undefined)
  );

  const prevUidRef = useRef(/** @type {string|undefined} */ (""));
  const [writePractice, setEnglishSide] = useState(false);
  const choices = useRef([]);
  const [currExmpl, setCurrExmpl] = useState(/** @type {string|null} */ (null));

  /** @type {RawKanji[]} */
  const filteredTerms = useMemo(() => {
    if (kanjiList.length === 0) return [];
    if (Object.keys(metadata.current).length === 0 && activeTags.length === 0)
      return kanjiList;

    const allFrequency = Object.keys(metadata.current).reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (metadata.current[cur].rein === true) {
          acc = [...acc, cur];
        }
        return acc;
      },
      []
    );

    let filtered = termFilterByType(
      filterTypeRef.current,
      kanjiList,
      allFrequency,
      filterTypeRef.current === TermFilterBy.TAGS ? activeTags : [],
      () => {} // Don't toggle filter if last freq is removed
    );

    if (reinforceRef.current && filterTypeRef.current === TermFilterBy.TAGS) {
      const filteredList = filtered.map((k) => k.uid);
      const additional = kanjiList.filter(
        (k) => allFrequency.includes(k.uid) && !filteredList.includes(k.uid)
      );

      filtered = [...filtered, ...additional];
    }

    const initialFrequency = filtered.reduce(
      (/** @type {string[]}*/ acc, cur) => {
        if (metadata.current[cur.uid]?.rein === true) {
          return [...acc, cur.uid];
        }
        return acc;
      },
      []
    );

    setFrequency(initialFrequency);

    return filtered;
  }, [kanjiList, activeTags, reinforceRef, filterTypeRef]);

  const order = useMemo(() => randomOrder(filteredTerms), [filteredTerms]);

  const gotoNext = useCallback(() => {
    const l = filteredTerms.length;
    let newSel = (selectedIndex + 1) % l;

    // if (newSel === errorSkipIndex) {
    //   newSel = (l + newSel + 1) % l;
    // }

    // prevLastNext.current = lastNext;
    // setLastNext(Date.now());
    // prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(undefined);
    setCurrExmpl(null);
  }, [filteredTerms, selectedIndex /* lastNext, errorSkipIndex*/]);

  const gotoNextSlide = useCallback(() => {
    play(
      reinforceRef.current,
      filterTypeRef.current,
      frequency,
      filteredTerms,
      metadata.current,
      reinforcedUID,
      (value) => {
        setReinforcedUID(value);
      },
      gotoNext
    );
  }, [
    frequency,
    filteredTerms,
    reinforcedUID,
    gotoNext,
    reinforceRef,
    filterTypeRef,
  ]);

  const gotoPrev = useCallback(() => {
    const l = filteredTerms.length;
    const i = selectedIndex - 1;

    let newSel;
    if (reinforcedUID) {
      newSel = selectedIndex;
    } else {
      newSel = (l + i) % l;
    }

    // if (newSel === errorSkipIndex) {
    //   newSel = (l + newSel - 1) % l;
    // }

    // prevLastNext.current = lastNext;
    // setLastNext(Date.now());
    // prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(undefined);
    setCurrExmpl(null);
  }, [
    filteredTerms,
    selectedIndex,
    reinforcedUID /*lastNext, errorSkipIndex*/,
  ]);

  const fadeTimerRef = useRef(-1);
  const { blastEl, anchorElRef, text, setText } = useBlast();

  const addFrequencyTerm = useCallback(
    (/** @type {string} */ uid) => {
      setFrequency((p) => [...p, uid]);
      dispatch(addFrequencyKanji(uid));
    },
    [dispatch]
  );
  const removeFrequencyTerm = useCallback(
    (/** @type {string} */ uid) => {
      setFrequency((p) => p.filter((pUid) => pUid !== uid));
      dispatch(removeFrequencyKanji(uid));
    },
    [dispatch]
  );

  if (order.length === 0) return <NotReady addlStyle="main-panel" />;

  const uid = reinforcedUID || getTermUID(selectedIndex, order, filteredTerms);
  const kanji = getTerm(uid, kanjiList);

  // console.log(
  //   JSON.stringify({
  //     rein: (reinforcedUID && reinforcedUID.slice(0, 6)) || "",
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     ord: order.length,
  //     rep: Object.keys(metadata.current).length,
  //     fre: frequency.length,
  //     filt: filteredTerms.length,
  //   })
  // );

  let example;
  if (prevUidRef.current !== kanji.uid) {
    prevUidRef.current = kanji.uid;

    choices.current = createChoices(choiceN, "english", kanji, kanjiList);
    example = oneFromList(kanji.english);
  } else {
    // choices.current changes when scrolling back-forth
    example = currExmpl ?? oneFromList(kanji.english);
  }

  const nextExample = getNextExample(kanji, example, setCurrExmpl);

  const game = prepareGame(kanji, choices.current, writePractice, [
    example,
    nextExample,
  ]);

  const isCorrect = buildIsCorrect(
    writePractice,
    game,
    text,
    setText,
    fadeTimerRef,
  );

  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

  return (
    <>
      <div className="tooltip-anchor" ref={anchorElRef}></div>
      {blastEl}
      <XChoices
        question={game.question}
        isCorrect={isCorrect}
        choices={game.choices}
        gotoPrev={gotoPrev}
        gotoNext={gotoNextSlide}
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
                  action={setStateFunction(setEnglishSide, (toggle) => !toggle)}
                />
              </Link>
            </div>
          </div>
          <div className="col text-center">
            <FrequencyTermIcon
              visible={
                term_reinforce &&
                kanji.uid !== filteredTerms[order[selectedIndex]].uid
              }
            />
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <span>{game.question.toHTML(false)}</span>
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
 *
 * @param {RawKanji} kanji
 * @param {string|null} currExmpl
 * @param {React.Dispatch<React.SetStateAction<string|null>>} setCurrExmpl
 */
function getNextExample(kanji, currExmpl, setCurrExmpl) {
  function nextExample() {
    // console.log("hint?");

    if (kanji?.english.includes(",")) {
      let ex = oneFromList(kanji.english);
      while (ex === currExmpl) {
        ex = oneFromList(kanji.english);
      }
      // console.log(engShort+" "+englishShortened)

      setCurrExmpl(ex);
    }
  }

  return nextExample;
}

/**
 * @param {boolean} writePractice
 * @param {unknown} game
 * @param {string} chosenAnswer player's answer
 * @param {React.Dispatch<React.SetStateAction<string>>} setAnswered setter to clear (edit) answer
 * @param {React.MutableRefObject<number>} fadeRef
 */
function buildIsCorrect(
  writePractice,
  game,
  chosenAnswer,
  setAnswered,
  fadeRef,
) {
  /**
   * @param {import("./XChoices").GameChoice} answered
   * @returns {[boolean, number]}
   */
  function isCorrect(answered) {
    const correct = answered.compare === game?.answer;
    const correctIdx =
      game?.choices.findIndex((c) => c.compare === game?.answer) || -1;

    if (!correct) {
      if (fadeRef.current > -1 && chosenAnswer.length > 0) {
        clearTimeout(fadeRef.current);
        setAnswered("");
        setTimeout(() => setAnswered(answered.toHTML(!writePractice)), 100);
      } else {
        setAnswered(answered.toHTML(!writePractice));
        fadeRef.current = window.setTimeout(() => setAnswered(""), 2500);
      }
    }

    return [correct, correctIdx];
  }

  return isCorrect;
}

export { KanjiGridMeta };
