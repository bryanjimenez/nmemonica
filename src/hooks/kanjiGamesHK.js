import { useMemo, useRef } from "react";
import { TermFilterBy } from "../actions/settingsAct";
import { shuffleArray } from "../helper/arrayHelper";
import { termFilterByType } from "../helper/gameHelper";

/**
 * @typedef {import("../components/Pages/Kanji").RawKanji} RawKanji
 * @typedef {import("../typings/raw").SpaceRepetitionMap} SpaceRepetitionMap
 */

/**
 * Filter terms {rawKanjis} based on filterType, activeTags, and reinforced
 * @param {SpaceRepetitionMap} repetition not reactive
 * @param {RawKanji[]} rawKanjis
 * @param {boolean} reinforced
 * @param {number} filterType
 * @param {string[]} activeTags
 */
export function useFilterTerms(
  repetition,
  rawKanjis,
  reinforced,
  filterType,
  activeTags
) {
  const repetitionRef = useRef(repetition);

  /** @type {RawKanji[]} */
  const filteredTerms = useMemo(() => {
    // console.warn("termFilterByType("+Object.keys(TermFilterBy)[filterType]+", "+rawKanjis.length+", "+activeTags.length+")");

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

    if (reinforced && filterType === TermFilterBy.TAGS) {
      const filteredList = filtered.map((k) => k.uid);
      const additional = rawKanjis.filter(
        (k) => allFrequency.includes(k.uid) && !filteredList.includes(k.uid)
      );

      filtered = [...filtered, ...additional];
    }

    return filtered;
  }, [rawKanjis, reinforced, filterType, activeTags]);

  repetitionRef.current = repetition;

  return filteredTerms;
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
