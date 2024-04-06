import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import type { RawKanji } from "nmemonica";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import type { GameChoice, GameQuestion } from "./FourChoices";
import { KanjiGameMeta, oneFromList } from "./KanjiGame";
import XChoices from "./XChoices";
import { shuffleArray } from "../../helper/arrayHelper";
import {
  getTerm,
  getTermUID,
  play,
  termFilterByType,
} from "../../helper/gameHelper";
import { randomOrder } from "../../helper/sortHelper";
import { useBlast } from "../../hooks/useBlast";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import type { AppDispatch, RootState } from "../../slices";
import {
  addFrequencyKanji,
  getKanji,
  removeFrequencyKanji,
} from "../../slices/kanjiSlice";
import { TermFilterBy } from "../../slices/settingHelper";
import { NotReady } from "../Form/NotReady";
import {
  ToggleFrequencyTermBtnMemo,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";

interface KanjiGridChoice extends GameChoice {
  toString: () => string;
}

const KanjiGridMeta = {
  location: "/kanji-grid/",
  label: "Kanji Grid Game",
};

/**
 * @param kanji
 * @param choices
 * @param example current english example and next
 */
function prepareGame(
  kanji: RawKanji,
  choices: RawKanji[],
  [currExmpl, nextExmpl]: [string, () => void]
) {
  const { english, uid } = kanji;
  const isShortened = currExmpl !== english;

  const q: GameQuestion = {
    // english, not needed, shown as a choice
    toHTML: () => {
      return (
        <div onClick={isShortened ? nextExmpl : undefined}>
          {currExmpl + (isShortened ? "..." : "")}
        </div>
      );
    },
  };

  return {
    question: q,
    answer: uid,
    choices: choices.map((c) => ({
      compare: c.uid,
      toString: () => c.english,
      toHTML: () => <>{c.kanji}</>,
    })),
  };
}

export default function KanjiGrid() {
  const dispatch = useDispatch<AppDispatch>();
  const { cookies } = useSelector(({ global }: RootState) => global);

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
      void dispatch(getKanji());
    }
  }, []);

  const metadata = useRef(repetition);
  metadata.current = repetition;

  const [frequency, setFrequency] = useState<string[]>([]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);

  const prevUidRef = useRef<string | undefined>("");
  const choices = useRef<RawKanji[]>([]);
  const [currExmpl, setCurrExmpl] = useState<string | null>(null);

  const filteredTerms: RawKanji[] = useMemo(() => {
    if (kanjiList.length === 0) return [];
    if (Object.keys(metadata.current).length === 0 && activeTags.length === 0)
      return kanjiList;

    const allFrequency = Object.keys(metadata.current).reduce<string[]>(
      (acc, cur) => {
        if (metadata.current[cur]?.rein === true) {
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
      () => {
        /** Don't toggle filter if last freq is removed */
      }
    );

    if (reinforceRef.current && filterTypeRef.current === TermFilterBy.TAGS) {
      const filteredList = filtered.map((k) => k.uid);
      const additional = kanjiList.filter(
        (k) => allFrequency.includes(k.uid) && !filteredList.includes(k.uid)
      );

      filtered = [...filtered, ...additional];
    }

    const initialFrequency = filtered.reduce<string[]>((acc, cur) => {
      if (metadata.current[cur.uid]?.rein === true) {
        return [...acc, cur.uid];
      }
      return acc;
    }, []);

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
    setReinforcedUID(null);
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
    setReinforcedUID(null);
    setCurrExmpl(null);
  }, [
    filteredTerms,
    selectedIndex,
    reinforcedUID /*lastNext, errorSkipIndex*/,
  ]);

  const fadeTimerRef = useRef(-1);
  const { blastElRef, anchorElRef, text, setText } = useBlast();

  const addFrequencyTerm = useCallback(
    (uid: string) => {
      setFrequency((p) => [...p, uid]);
      dispatch(addFrequencyKanji(uid));
    },
    [dispatch]
  );
  const removeFrequencyTerm = useCallback(
    (uid: string) => {
      setFrequency((p) => p.filter((pUid) => pUid !== uid));
      dispatch(removeFrequencyKanji(uid));
    },
    [dispatch]
  );

  if (order.length === 0) return <NotReady addlStyle="main-panel" />;

  const uid = reinforcedUID ?? getTermUID(selectedIndex, filteredTerms, order);
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

    choices.current = createChoices(choiceN, kanji, kanjiList);
    example = oneFromList(kanji.english);
  } else {
    // choices.current changes when scrolling back-forth
    example = currExmpl ?? oneFromList(kanji.english);
  }

  const nextExample = getNextExample(kanji, example, setCurrExmpl);

  const game = prepareGame(kanji, choices.current, [example, nextExample]);

  const isCorrect = buildIsCorrect(game, text, setText, fadeTimerRef);

  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

  return (
    <>
      <div className="tooltip-anchor" ref={anchorElRef}></div>
      <div ref={blastElRef}>{text}</div>
      <XChoices
        question={game.question}
        isCorrect={isCorrect}
        choices={game.choices}
        gotoPrev={gotoPrev}
        gotoNext={gotoNextSlide}
      />
      <div
        className={classNames({
          "options-bar mb-3 flex-shrink-1": true,
          "disabled-color": !cookies,
        })}
      >
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start">
              <Link to={KanjiGameMeta.location}>
                <TogglePracticeSideBtn toggle={false} />
              </Link>
            </div>
          </div>
          <div className="col">
            <div className="d-flex justify-content-end pe-2 pe-sm-0">
              <span>{game.question.toHTML(false)}</span>
              <ToggleFrequencyTermBtnMemo
                disabled={!cookies}
                addFrequencyTerm={addFrequencyTerm}
                removeFrequencyTerm={removeFrequencyTerm}
                hasReinforce={term_reinforce}
                term={kanji}
                isReinforced={reinforcedUID !== null}
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
 */
export function createChoices(
  n: number,
  answer: RawKanji,
  kanjiList: RawKanji[]
) {
  const compareOn = "english";
  const splitToArray = (term: string) => term.split(",").map((s) => s.trim());

  let choices = [answer];
  /** Answer array */
  const aArr = splitToArray(answer[compareOn]);
  /** Set of unique choices */
  const noDuplicateChoices = new Set([
    ...aArr, // the answer
  ]);

  const consumed = new Set([answer.uid]);

  while (choices.length < n && kanjiList.length !== consumed.size) {
    const i = Math.floor(Math.random() * kanjiList.length);

    const choice = kanjiList[i];
    /** Choice array */
    const cArr = splitToArray(choice[compareOn]);

    // should not match the right answer(s)
    // should not match a previous choice
    if (
      // cArr.every((cCurr) => aArr.every((a) => a !== cCurr)) &&
      cArr.every((cCurr) => !noDuplicateChoices.has(cCurr))
      // && choices.every((c) => c[compareOn] !== choice[compareOn])
    ) {
      choices = [...choices, choice];
      cArr.forEach((c) => {
        noDuplicateChoices.add(c);
      });
    }

    consumed.add(choice.uid);
  }

  shuffleArray(choices);

  return choices;
}

function getNextExample(
  kanji: RawKanji,
  currExmpl: string | null,
  setCurrExmpl: React.Dispatch<React.SetStateAction<string | null>>
) {
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
 * @param game
 * @param chosenAnswer player's answer
 * @param setAnswered setter to clear (edit) answer
 * @param fadeRef
 */
function buildIsCorrect(
  game: { answer: string; choices: GameChoice[] },
  chosenAnswer: string,
  setAnswered: React.Dispatch<React.SetStateAction<string>>,
  fadeRef: React.MutableRefObject<number>
) {
  function isCorrect(answered: KanjiGridChoice): [boolean, number] {
    const correct = answered.compare === game?.answer;
    const correctIdx =
      game?.choices.findIndex((c) => c.compare === game?.answer) || -1;

    if (!correct) {
      if (fadeRef.current > -1 && chosenAnswer.length > 0) {
        clearTimeout(fadeRef.current);
        setAnswered("");
        setTimeout(() => setAnswered(answered.toString()), 100);
      } else {
        setAnswered(answered.toString());
        fadeRef.current = window.setTimeout(() => setAnswered(""), 2500);
      }
    }

    return [correct, correctIdx];
  }

  return isCorrect;
}

export { KanjiGridMeta };
