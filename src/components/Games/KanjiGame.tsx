import { LinearProgress } from "@mui/material";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import { FourChoicesWRef, type GameQuestion } from "./FourChoices";
import { KanjiGridMeta } from "./KanjiGrid";
import { shuffleArray } from "../../helper/arrayHelper";
import {
  getTerm,
  getTermUID,
  play,
  randomOrder,
  termFilterByType,
} from "../../helper/gameHelper";
import { JapaneseText } from "../../helper/JapaneseText";
import { isKatakana } from "../../helper/kanaHelper";
import { buildAction } from "../../hooks/helperHK";
import { useConnectKanji } from "../../hooks/useConnectKanji";
import { useConnectVocabulary } from "../../hooks/useConnectVocabulary";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import type { AppDispatch } from "../../slices";
import {
  addFrequencyKanji,
  getKanji,
  removeFrequencyKanji,
  setKanjiDifficulty,
} from "../../slices/kanjiSlice";
import { TermFilterBy } from "../../slices/settingHelper";
import { getVocabulary } from "../../slices/vocabularySlice";
import type { RawKanji, RawVocabulary } from "../../typings/raw";
import { DifficultySlider } from "../Form/Difficulty";
import { NotReady } from "../Form/NotReady";
import {
  FrequencyTermIcon,
  ToggleFrequencyTermBtnMemo,
  TogglePracticeSideBtn,
} from "../Form/OptionsBar";

const KanjiGameMeta = {
  location: "/kanji-game/",
  label: "Kanji Game",
};

function properCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Split comma separated string(list) and select one.
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
function createEnglishChoices(
  answer: RawKanji,
  kanjiList: RawKanji[],
  exampleList: RawVocabulary[]
) {
  const TOTAL_CHOICES = 4;
  const splitToArray = (term: string) => term.split(",").map((s) => s.trim());

  const aArr = splitToArray(answer.english);

  const a = { ...answer, english: oneFromList(answer.english) };
  const examples = exampleList.reduce<string[]>((acc, e) => {
    const list = e.english.split(",").map((e) => e.trim());

    return [...acc, ...list];
  }, []);

  const noDuplicateChoices = new Set([a.english, ...examples]);

  let choices: RawKanji[] = [a];
  while (choices.length < TOTAL_CHOICES) {
    const i = Math.floor(Math.random() * kanjiList.length);

    const choice = kanjiList[i];
    const cArr = splitToArray(choice.english);

    // should not match the right answer(s)
    // should not match a previous choice
    if (
      cArr.every((cCurr) => aArr.every((a) => a !== cCurr)) &&
      cArr.every((cCurr) => !noDuplicateChoices.has(cCurr))
    ) {
      const english = oneFromList(choice.english);
      noDuplicateChoices.add(english);
      choices = [...choices, { ...choice, english }];
    }
  }

  shuffleArray(choices);

  return choices;
}

function prepareGame(
  kanji: RawKanji,
  kanjiList: RawKanji[],
  exampleList: RawVocabulary[]
) {
  const { uid, kanji: japanese, on, kun } = kanji;

  const choices = createEnglishChoices(kanji, kanjiList, exampleList);

  /** Number of examples to show */
  const exN = on && kun ? 2 : on || kun ? 3 : 5;

  const q: GameQuestion = {
    // english, not needed, shown as a choice
    toHTML: (correct: boolean) => {
      return (
        <div>
          <div className="position-relative h-0">
            {correct && (
              <table className="w-100 fs-4 text-sm-start">
                <tbody>
                  {on && (
                    <tr
                      key={on}
                      className={classNames({
                        invisible: !correct,
                      })}
                    >
                      <td className="fs-6 ps-2">
                        {JapaneseText.parse({
                          japanese: "おんよみ\n音読み",
                        }).toHTML()}
                      </td>
                      <td className="fs-5 ps-2">{on}</td>
                    </tr>
                  )}
                  {kun && (
                    <tr
                      key={kun}
                      className={classNames({
                        invisible: !correct,
                      })}
                    >
                      <td className="fs-6 ps-2">
                        {JapaneseText.parse({
                          japanese: "くんよみ\n訓読み",
                        }).toHTML()}
                      </td>
                      <td className="fs-5 ps-2">{kun}</td>
                    </tr>
                  )}

                  {exampleList.slice(0, exN).map((example) => (
                    <tr
                      key={example.uid}
                      className={classNames({
                        invisible: !correct,
                      })}
                    >
                      <td className="ps-2">{oneFromList(example.english)}</td>
                      <td className="pt-2 ps-2">
                        {JapaneseText.parse(example).toHTML()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div
            className={classNames({
              "fs-display-huge": true,
              "position-relative": true,
              "opacity-25": true,
              "z-index-n-1": true,
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
      toHTML: () => <>{c.english}</>,
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

    filterType: filterTypeRef,
    reinforce: reinforceRef,
  } = useConnectKanji();

  const { vocabList } = useConnectVocabulary();

  useEffect(() => {
    if (kanjiList.length === 0) {
      dispatch(getKanji());
    }
    if (vocabList.length === 0) {
      dispatch(getVocabulary());
    }
  }, []);

  const metadata = useRef(repetition);
  metadata.current = repetition;

  const [frequency, setFrequency] = useState<string[]>([]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reinforcedUID, setReinforcedUID] = useState<string | undefined>(
    undefined
  );

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

  const { kanji, game } = useMemo(() => {
    if (order.length === 0 || exampleList.length === 0) return {};
    const uid =
      reinforcedUID ?? getTermUID(selectedIndex, filteredTerms, order);
    const kanji = getTerm(uid, kanjiList);

    const examples = exampleList[order[selectedIndex]];
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
    },
    [gotoPrev, gotoNextSlide]
  );

  const { HTMLDivElementSwipeRef } = useSwipeActions(swipeHandler);

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
        isCorrect={(answered) => answered.compare === game.answer}
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
                <TogglePracticeSideBtn toggle={true} action={null} />
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
              <DifficultySlider
                value={metadata.current[kanji.uid]?.difficulty}
                onChange={buildAction(dispatch, (value: number) =>
                  setKanjiDifficulty(kanji.uid, value)
                )}
                manualUpdate={kanji.uid}
              />

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
