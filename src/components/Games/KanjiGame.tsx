import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import orderBy from "lodash/orderBy";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import { FourChoicesWRef, type GameQuestion } from "./FourChoices";
import { KanjiGridMeta } from "./KanjiGrid";
import { shuffleArray } from "../../helper/arrayHelper";
import { spaceRepLog } from "../../helper/consoleHelper";
import { buildAction } from "../../helper/eventHandlerHelper";
import {
  getTerm,
  getTermUID,
  minimumTimeForSpaceRepUpdate,
  play,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { isKatakana } from "../../helper/kanaHelper";
import {
  dateViewOrder,
  difficultyOrder,
  difficultySubFilter,
  randomOrder,
} from "../../helper/sortHelper";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useKeyboardActions } from "../../hooks/useKeyboardActions";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import type { AppDispatch } from "../../slices";
import { logger } from "../../slices/globalSlice";
import {
  addFrequencyKanji,
  getKanji,
  removeFrequencyKanji,
  setKanjiDifficulty,
  updateSpaceRepKanji,
} from "../../slices/kanjiSlice";
import { TermFilterBy, TermSortBy } from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import type { RawKanji, RawVocabulary } from "../../typings/raw";
import { DifficultySlider } from "../Form/DifficultySlider";
import { NotReady } from "../Form/NotReady";
import {
  ToggleFrequencyTermBtnMemo,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";
import { Tooltip } from "../Form/Tooltip";

const KanjiGameMeta = {
  location: "/kanji-game/",
  label: "Kanji Game",
};

function prepareGame(
  kanji: RawKanji,
  kanjiList: RawKanji[],
  exampleList: RawVocabulary[]
) {
  const { uid, kanji: japanese, on, kun } = kanji;

  const choices = createEnglishChoices(kanji, kanjiList, exampleList);

  /** Max number of examples to show */
  const exMax = on && kun ? 2 : on || kun ? 3 : 5;
  /** Examples sorted and limited */
  const displayEx = orderBy(
    exampleList,
    (ex) => JapaneseText.parse(ex).getSpelling().length
  ).slice(0, exMax);

  const q: GameQuestion = {
    // english, not needed, shown as a choice
    toHTML: (correct: boolean) => {
      return (
        <div className="d-flex align-items-center position-relative">
          <div className="position-absolute w-100">
            {correct && (
              <div className="d-flex flex-column fs-4">
                {on && (
                  <div
                    key={on}
                    className={classNames({
                      "d-flex justify-content-between": true,
                      invisible: !correct,
                    })}
                  >
                    <div className="fs-6">
                      {JapaneseText.parse({
                        japanese: "おんよみ\n音読み",
                      }).toHTML()}
                    </div>
                    <div className="fs-5">{on}</div>
                  </div>
                )}
                {kun && (
                  <div
                    key={kun}
                    className={classNames({
                      "d-flex justify-content-between": true,
                      invisible: !correct,
                    })}
                  >
                    <div className="fs-6">
                      {JapaneseText.parse({
                        japanese: "くんよみ\n訓読み",
                      }).toHTML()}
                    </div>
                    <div className="fs-5">{kun}</div>
                  </div>
                )}

                {displayEx.map((example) => (
                  <div
                    key={example.uid}
                    className={classNames({
                      "d-flex justify-content-between": true,
                      invisible: !correct,
                    })}
                  >
                    <div className="fs-5 mw-50 text-break text-start">
                      {oneFromList(example.english)}
                    </div>
                    <div>{JapaneseText.parse(example).toHTML()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className={classNames({
              "fs-kanji-huge": true,
              "position-absolute w-100": true,
              "opacity-25": true,
              "correct-color": correct,
            })}
          >
            <span>{japanese}</span>
          </div>
        </div>
      );
    },
  };

  return {
    question: q,
    answer: uid,
    choices: choices.map((c) => ({
      compare: c.uid,
      toHTML: choiceToHtml(c),
    })),
  };
}

export default function KanjiGame() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    kanjiList,
    activeTags,
    repetition,
    fadeInAnswers,
    memoThreshold,

    filterType: filterTypeRef,
    orderType: orderTypeREF,
    reinforce: reinforceRef,
  } = useConnectKanji();

  const memoThresholdRef = useRef(memoThreshold);
  memoThresholdRef.current = memoThreshold;

  const { vocabList } = useConnectVocabulary();

  const metadata = useRef(repetition);
  metadata.current = repetition;

  const frequency = useRef<string[]>([]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState<string | null>(null);

  useEffect(() => {
    if (kanjiList.length === 0) {
      void dispatch(getKanji());
    }
    if (vocabList.length === 0) {
      void dispatch(getVocabulary());
    }
  }, []);

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
      undefined // Don't toggle filter if last freq is removed
    );

    if (reinforceRef.current && filterTypeRef.current === TermFilterBy.TAGS) {
      const filteredList = filtered.map((k) => k.uid);
      const additional = kanjiList.filter(
        (k) => allFrequency.includes(k.uid) && !filteredList.includes(k.uid)
      );

      filtered = [...filtered, ...additional];
    }

    switch (orderTypeREF.current) {
      case TermSortBy.DIFFICULTY: {
        // exclude vocab with difficulty beyond memoThreshold

        const subFilter = difficultySubFilter(
          memoThresholdRef.current,
          filtered,
          metadata.current
        );

        if (subFilter.length > 0) {
          filtered = subFilter;
        } else {
          console.warn(
            "Excluded all terms. Discarding memorized subfiltering."
          );
        }
        break;
      }
    }

    const initialFrequency = filtered.reduce<string[]>((acc, cur) => {
      if (metadata.current[cur.uid]?.rein === true) {
        return [...acc, cur.uid];
      }
      return acc;
    }, []);

    frequency.current = initialFrequency;

    return filtered;
  }, [kanjiList, activeTags, reinforceRef, filterTypeRef]);

  const order = useMemo(() => {
    const repetition = metadata.current;
    if (filteredTerms.length === 0) return [];

    let newOrder;
    switch (orderTypeREF.current) {
      case TermSortBy.VIEW_DATE:
        newOrder = dateViewOrder(filteredTerms, repetition);
        break;
      case TermSortBy.DIFFICULTY:
        // exclude filteredTerms with difficulty beyond memoThreshold
        newOrder = difficultyOrder(filteredTerms, metadata.current);
        break;
      default:
        /** TermSortBy.RANDOM */ newOrder = randomOrder(filteredTerms);
    }

    return newOrder;
  }, [filteredTerms]);

  const prevReinforcedUID = useRef<string | null>(null);
  const prevSelectedIndex = useRef(0);
  const [lastNext, setLastNext] = useState(Date.now()); // timestamp of last swipe
  const prevLastNext = useRef<number>(Date.now());

  useLayoutEffect(() => {
    const prevState = {
      selectedIndex: prevSelectedIndex.current,
      reinforcedUID: prevReinforcedUID.current,
      lastNext: prevLastNext.current,
    };

    if (
      reinforcedUID !== prevState.reinforcedUID ||
      selectedIndex !== prevState.selectedIndex
    ) {
      const prevUid =
        prevState.reinforcedUID ??
        getTermUID(prevState.selectedIndex, filteredTerms, order);

      // prevent updates when quick scrolling
      if (minimumTimeForSpaceRepUpdate(prevState.lastNext)) {
        const prevTerm = getTerm(prevUid, filteredTerms);

        // don't increment reinforced terms
        const shouldIncrement = prevUid !== prevState.reinforcedUID;
        const frequency = prevState.reinforcedUID !== null;

        void dispatch(updateSpaceRepKanji({ uid: prevUid, shouldIncrement }))
          .unwrap()
          .then((payload) => {
            const { value, prevVal } = payload;

            const prevDate = prevVal.lastView ?? value.lastView;
            const repStats = { [prevUid]: { ...value, lastView: prevDate } };
            const messageLog = (m: string, l: number) => dispatch(logger(m, l));

            spaceRepLog(messageLog, prevTerm, repStats, { frequency });
          });
      }

      prevSelectedIndex.current = selectedIndex;
      prevReinforcedUID.current = reinforcedUID;
    }
  }, [dispatch, reinforcedUID, selectedIndex, filteredTerms, order]);

  // TODO: can be cashed as uid table
  const exampleList = useMemo(
    () => {
      if (filteredTerms.length === 0 || vocabList.length === 0) return [];

      return filteredTerms.map((kanji) => {
        const examples = vocabList.reduce<RawVocabulary[]>((acc, v) => {
          const hasEnglish = v.english.includes(kanji.english);
          const hasKanji = v.japanese.includes(kanji.kanji);

          // radicals only
          // example cannot be all katakana
          if (kanji.radical && hasKanji && isKatakana(kanji.kanji)) {
            return acc;
          }

          // Radical has an example Kanji
          if (kanji.radical && kanji.radical?.example.length > 0) {
            // console.log()
            const match = kanji.radical?.example.filter((k) =>
              v.japanese.includes(k)
            );
            if (match.length > 0) {
              return [...acc, v];
            }

            // no matching vocab
            return acc;
          }

          // non radicals
          if (hasKanji && hasEnglish) {
            acc = [v, ...acc];
          } else if (hasKanji) {
            acc = [...acc, v];
          }

          return acc;
        }, []); // exampleList

        return examples;
      });
    }, //filteredTerms

    [filteredTerms, vocabList]
  );

  const gotoNext = useCallback(() => {
    const l = filteredTerms.length;
    let newSel = (selectedIndex + 1) % l;

    // if (newSel === errorSkipIndex) {
    //   newSel = (l + newSel + 1) % l;
    // }

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(null);
  }, [filteredTerms, selectedIndex, lastNext /*, errorSkipIndex*/]);

  const gotoNextSlide = useCallback(() => {
    play(
      reinforceRef.current,
      filterTypeRef.current,
      frequency.current,
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

    prevLastNext.current = lastNext;
    setLastNext(Date.now());
    prevSelectedIndex.current = selectedIndex;
    setSelectedIndex(newSel);
    setReinforcedUID(null);
  }, [
    filteredTerms,
    selectedIndex,
    reinforcedUID,
    lastNext /*, errorSkipIndex*/,
  ]);

  const addFrequencyTerm = useCallback(
    (uid: string) => {
      frequency.current = [...frequency.current, uid];
      dispatch(addFrequencyKanji(uid));
    },
    [dispatch]
  );
  const removeFrequencyTerm = useCallback(
    (uid: string) => {
      frequency.current = frequency.current.filter((pUid) => pUid !== uid);
      dispatch(removeFrequencyKanji(uid));
    },
    [dispatch]
  );

  const { kanji, game } = useMemo(() => {
    if (order.length === 0 || exampleList.length === 0) return {};
    const uid =
      reinforcedUID ?? getTermUID(selectedIndex, filteredTerms, order);
    const kanji = getTerm(uid, kanjiList);

    let examples: RawVocabulary[];
    if (reinforcedUID !== null) {
      const reinforcedIdx = filteredTerms.findIndex(
        (k) => k.uid === reinforcedUID
      );

      if (reinforcedIdx === -1) {
        examples = [];
      } else {
        examples = exampleList[reinforcedIdx];
      }
    } else {
      examples = exampleList[order[selectedIndex]];
    }

    const game = prepareGame(kanji, kanjiList, examples);

    return { kanji, game };
  }, [
    reinforcedUID,
    kanjiList,
    filteredTerms,
    order,
    selectedIndex,
    exampleList,
  ]);

  const swipeHandler = useCallback(
    (direction: string) => {
      switch (direction) {
        case "right":
          gotoPrev();
          break;
        case "left":
          gotoNextSlide();
          break;

        default:
          break;
      }

      return Promise.resolve(/** interrupt, fetch */);
    },
    [gotoPrev, gotoNextSlide]
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(swipeHandler);

  useKeyboardActions(swipeHandler, () => {
    // TODO: flip practice side
    // navigate to
    // <Link to={KanjiGridMeta.location}>
  });

  const checkAnswer = useCallback(
    (answered: { compare: string }) => answered.compare === game?.answer,
    [game]
  );

  if (!game) return <NotReady addlStyle="main-panel" />;

  // console.log(
  //   JSON.stringify({
  //     rein: (reinforcedUID && reinforcedUID.slice(0, 6)) ?? "",
  //     idx: selectedIndex,
  //     uid: (kanji.uid && kanji.uid.slice(0, 6)) ?? "",
  //     ord: order.length,
  //     rep: Object.keys(metadata.current).length,
  //     fre: frequency.length,
  //     filt: filteredTerms.length,
  //   })
  // );

  const term_reinforce = kanji && repetition[kanji.uid]?.rein === true;

  const progress = ((selectedIndex + 1) / filteredTerms.length) * 100;

  return (
    <>
      <FourChoicesWRef
        ref={HTMLDivElementSwipeRef}
        question={game.question}
        isCorrect={checkAnswer}
        choices={game.choices}
        gotoPrev={gotoPrev}
        gotoNext={gotoNextSlide}
        fadeInAnswers={fadeInAnswers}
      />
      <div className="options-bar mb-3 flex-shrink-1">
        <div className="row opts-max-h">
          <div className="col">
            <div className="d-flex justify-content-start">
              <Link to={KanjiGridMeta.location}>
                <TogglePracticeSideBtn toggle={true} />
              </Link>
            </div>
          </div>
          <div className="col">
            <div className="d-flex justify-content-end">
              <Tooltip idKey={kanji.uid}>
                <DifficultySlider
                  difficulty={metadata.current[kanji.uid]?.difficultyP}
                  onChange={buildAction(dispatch, (value: number) =>
                    setKanjiDifficulty(kanji.uid, value)
                  )}
                  resetOn={kanji.uid}
                />
              </Tooltip>
              <ToggleFrequencyTermBtnMemo
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

export function properCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Split comma separated string(list) and select one.
 *
 * Apply ProperCase
 */
export function oneFromList(english: string) {
  let englishShortened = english;
  const engList = english.split(",");
  if (engList.length > 1) {
    const i = Math.floor(Math.random() * engList.length);
    const e = engList[i].trim();
    englishShortened = properCase(e);
  } else {
    englishShortened = properCase(english);
  }

  return englishShortened;
}

/**
 * Returns a list of choices which includes the right answer
 */
export function createEnglishChoices<T extends { english: string }>(
  answer: RawKanji,
  kanjiList: RawKanji[],
  exampleList: T[]
) {
  const TOTAL_CHOICES = 4;
  const splitToArray = (term: string) => term.split(",").map((s) => s.trim());

  const aArr = splitToArray(answer.english);

  const a = { ...answer, english: oneFromList(answer.english) };
  const examples = exampleList.reduce<string[]>((acc, e) => {
    const list = e.english.split(",").map((e) => e.trim());

    return [...acc, ...list];
  }, []);

  const { firstLetter: ansFirstLetter } = choiceFadePrefix(a.english);
  const noDuplicateChoices = new Set([
    ...aArr, // all posible answers
    // a.english, // the answer
    ...(ansFirstLetter ? [ansFirstLetter] : []), // the answer's first letter
    ...examples,
  ]);

  let choices: RawKanji[] = [a];
  const consumed = new Set([answer.uid]);

  while (choices.length < TOTAL_CHOICES && kanjiList.length !== consumed.size) {
    const i = Math.floor(Math.random() * kanjiList.length);

    const choice = kanjiList[i];
    const cArr = splitToArray(choice.english);

    /** firstLetters of choices */
    const flArr = cArr.reduce<string[]>((acc, c) => {
      const { firstLetter } = choiceFadePrefix(c);

      if (firstLetter) {
        acc = [...acc, firstLetter];
      }

      return acc;
    }, []);

    // should not match the right answer(s)
    // should not match a previous choice
    // should not match a previous firstLetter fade hint
    if (
      // cArr.every((cCurr) => aArr.every((a) => a !== cCurr)) &&
      cArr.every((cCurr) => !noDuplicateChoices.has(cCurr)) &&
      (flArr.length === 0 ||
        flArr.every((firstLetter) => !noDuplicateChoices.has(firstLetter)))
    ) {
      const english = oneFromList(choice.english);
      noDuplicateChoices.add(english);
      const { firstLetter } = choiceFadePrefix(english);
      if (firstLetter) {
        noDuplicateChoices.add(firstLetter);
      }
      choices = [...choices, { ...choice, english }];
    }

    consumed.add(choice.uid);
  }

  shuffleArray(choices);

  return choices;
}

function choiceFadePrefix(english: string) {
  let firstLetter;
  let restLetters;
  let nonAlpha;
  let toDo;

  if (new RegExp(/^[^a-zA-Z]/).test(english)) {
    // non alpha start
    const nonAlphaOrSpcRegEx = new RegExp(/[^a-zA-Z\s]/);
    const symbolChars = english
      .split("")
      .filter((char) => nonAlphaOrSpcRegEx.test(char));

    if (symbolChars.length === 1) {
      // just one non alpha
      nonAlpha = english.slice(0, 1);
      firstLetter = english.slice(1, 2);
      restLetters = english.slice(2);
    } else {
      // many?
      // no hint
      // don't renturn splits
    }
  } else if (english.startsWith("To ")) {
    // verbs
    toDo = english.slice(0, 3);
    firstLetter = english.slice(3, 4);
    restLetters = english.slice(4);
  } else {
    // non verbs
    firstLetter = english.slice(0, 1);
    restLetters = english.slice(1);
  }

  return { firstLetter, restLetters, nonAlpha, toDo };
}

export function choiceToHtml<T extends { english: string }>(c: T) {
  return function toHtml(options: { fadeIn?: boolean } = {}) {
    const { fadeIn } = options;
    const fadeCss = {
      "notification-fade": fadeIn !== undefined ? !fadeIn : undefined,
      "notification-fade-in": fadeIn,
    };

    const { firstLetter, restLetters, nonAlpha, toDo } = choiceFadePrefix(
      c.english
    );

    const element = !firstLetter ? (
      <>
        <span className={classNames(fadeCss)}>{c.english}</span>
      </>
    ) : (
      <>
        {nonAlpha && <span className={classNames(fadeCss)}>{nonAlpha}</span>}
        {toDo && <span className={classNames(fadeCss)}>{toDo}</span>}
        {firstLetter && <span className="fw-bold">{firstLetter}</span>}
        {restLetters && (
          <span className={classNames(fadeCss)}>{restLetters}</span>
        )}
      </>
    );

    return element;
  };
}

export { KanjiGameMeta };
