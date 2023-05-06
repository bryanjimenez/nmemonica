import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { shuffleArray } from "../../helper/arrayHelper";
import {
  getTerm,
  getTermUID,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
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
import FourChoices from "./FourChoices";
import { KanjiGridMeta } from "./KanjiGrid";
import { TermFilterBy } from "../../slices/settingHelper";

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
 * @param {RawKanji[]} kanjiList
 */
function prepareGame(kanji, kanjiList) {
  const { uid, kanji: japanese, on, kun } = kanji;

  const choices = createEnglishChoices(kanji, kanjiList);

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
  const dispatch = /** @type {AppDispatch} */ (useDispatch());
  const {
    kanjiList,
    activeTags,
    repetition,

    filterType: filterTypeRef,
    reinforce: reinforceRef,
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
  }, [
    filteredTerms,
    selectedIndex,
    reinforcedUID /*lastNext, errorSkipIndex*/,
  ]);

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

  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const game = prepareGame(kanji, kanjiList);


  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

  return (
    <>
      <FourChoices
        question={game.question}
        isCorrect={(answered) => answered.compare === game.answer}
        choices={game.choices}
        gotoPrev={gotoPrev}
        gotoNext={gotoNextSlide}
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
                kanji.uid !== filteredTerms[order[selectedIndex]].uid
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
