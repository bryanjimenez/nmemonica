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
import { getTerm, getTermUID, termFilterByType } from "../../helper/gameHelper";
import { randomOrder } from "../../helper/sortHelper";
import { useBlast } from "../../hooks/useBlast";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import type { AppDispatch, RootState } from "../../slices";
import { getKanji } from "../../slices/kanjiSlice";
import { TermFilterBy } from "../../slices/settingHelper";
import { TogglePracticeSideBtn } from "../Form/OptionsBar";
import { NotReady } from "../Pages/NotReady";

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
  const isShortened = currExmpl.toLowerCase() !== english.toLowerCase();

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
    choiceN,
  } = useConnectKanji();

  const populateDataSetsRef = useRef(() => {
    if (kanjiList.length === 0) {
      void dispatch(getKanji());
    }
  });

  useEffect(() => {
    const { current: populateDataSets } = populateDataSetsRef;
    populateDataSets();
  }, []);

  const metadata = useRef(repetition);
  metadata.current = repetition;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);

  const prevUidRef = useRef<string | undefined>("");
  const choices = useRef<RawKanji[]>([]);
  const [currExmpl, setCurrExmpl] = useState<string | null>(null);

  const filteredTerms: RawKanji[] = useMemo(() => {
    if (kanjiList.length === 0) return [];
    if (Object.keys(metadata.current).length === 0 && activeTags.length === 0)
      return kanjiList;

    let filtered = termFilterByType(
      filterTypeRef.current,
      kanjiList,
      filterTypeRef.current === TermFilterBy.TAGS ? activeTags : []
    );

    if (filterTypeRef.current === TermFilterBy.TAGS) {
      const filteredList = filtered.map((k) => k.uid);
      const additional = kanjiList.filter((k) => !filteredList.includes(k.uid));

      filtered = [...filtered, ...additional];
    }

    return filtered;
  }, [kanjiList, activeTags, filterTypeRef]);

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

  const gotoPrev = useCallback(() => {
    const l = filteredTerms.length;
    const i = selectedIndex - 1;

    let newSel;
    if (reinforcedUID !== null) {
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
  const { blastElRef, text, setText } = useBlast();

  if (order.length === 0) return <NotReady addlStyle="main-panel" />;

  const uid = reinforcedUID ?? getTermUID(selectedIndex, filteredTerms, order);
  const kanji = getTerm(uid, kanjiList);

  // console.log(
  //   JSON.stringify({
  //     idx: selectedIndex,
  //     uid: (uid && uid.slice(0, 6)) || "",
  //     ord: order.length,
  //     rep: Object.keys(metadata.current).length,
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

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

  return (
    <>
      <div ref={blastElRef} className="text-wrap fs-display-6 fw-bolder">
        {text}
      </div>
      <XChoices
        question={game.question}
        isCorrect={isCorrect}
        choices={game.choices}
        gotoPrev={gotoPrev}
        gotoNext={gotoNext}
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
  fadeRef: React.RefObject<number>
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
